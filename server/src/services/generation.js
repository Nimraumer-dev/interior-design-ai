const crypto = require('node:crypto');
const { Design, User, Outbox } = require('../models');
const { getConfig } = require('../config');
const { makeMockImage, normalizeAiResult, MAX_RESULT_BYTES } = require('./images');
const { putObject, getReadUrl } = require('./storage');
const { selectRecommendations } = require('./recommendations');
const { categories, styles } = require('../utils/validation');
const { AppError } = require('../utils/errors');

const config = getConfig();
const MAX_ATTEMPTS = 2;
const LEASE_MS = 270000;
const MAX_AI_RESPONSE_BYTES = 36 * 1024 * 1024;
const HEX_COLOR = /^#[a-f\d]{6}$/i;

async function readJsonLimited(response) {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_AI_RESPONSE_BYTES) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI response exceeds the configured size limit.');
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body || []) {
    total += chunk.length;
    if (total > MAX_AI_RESPONSE_BYTES) {
      throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI response exceeds the configured size limit.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned a non-JSON response.');
  }
}

function validateAiResponse(payload, numVariants) {
  if (!payload || payload.status !== 'ok' || !Array.isArray(payload.results) ||
      payload.results.length < 1 || payload.results.length > numVariants) {
    const code = payload && payload.status === 'error'
      ? ['BAD_INPUT', 'UNSAFE_IMAGE', 'MODEL_BUSY', 'INTERNAL'].includes(payload.code) ? payload.code : 'AI_FAILED'
      : 'INVALID_AI_RESPONSE';
    throw new AppError(502, code, 'AI did not return a usable design.');
  }
  const recommendations = payload.recommendations === undefined ? [] : payload.recommendations;
  if (!Array.isArray(recommendations) || recommendations.length > 32 ||
      recommendations.some((item) => !item || !categories.includes(item.category) ||
        !Array.isArray(item.styleTags) || item.styleTags.length > 10 ||
        item.styleTags.some((tag) => !styles.includes(tag)) ||
        typeof (item.colorHint || '') !== 'string' || (item.colorHint || '').length > 40)) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned invalid furniture recommendations.');
  }
  const palette = payload.palette === undefined ? [] : payload.palette;
  if (!Array.isArray(palette) || palette.length > 16 || palette.some((color) => typeof color !== 'string' || !HEX_COLOR.test(color))) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned an invalid color palette.');
  }
  const results = payload.results.map((result, index) => {
    const variant = result && result.variant === undefined ? index + 1 : result && result.variant;
    if (!Number.isInteger(variant) || variant < 1 || variant > numVariants ||
        typeof (result && result.imageBase64) !== 'string' ||
        result.imageBase64.length > Math.ceil(MAX_RESULT_BYTES * 4 / 3) + 32) {
      throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned an invalid result variant.');
    }
    return { variant, imageBase64: result.imageBase64 };
  });
  if (new Set(results.map((result) => result.variant)).size !== results.length) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned duplicate result variants.');
  }
  if (payload.roomAnalysis !== undefined &&
      (!payload.roomAnalysis || typeof payload.roomAnalysis !== 'object' ||
       Array.isArray(payload.roomAnalysis) || JSON.stringify(payload.roomAnalysis).length > 5000)) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned invalid room analysis.');
  }
  if (payload.modelVersion !== undefined &&
      (typeof payload.modelVersion !== 'string' || payload.modelVersion.length > 100)) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned invalid model metadata.');
  }
  return {
    results,
    palette,
    recommendations: recommendations.map(({ category, styleTags, colorHint }) => ({
      category,
      styleTags,
      colorHint: colorHint || ''
    })),
    roomAnalysis: payload.roomAnalysis || null,
    modelVersion: payload.modelVersion || null,
    durationMs: Number.isInteger(payload.durationMs) && payload.durationMs >= 0
      ? Math.min(payload.durationMs, 86400000)
      : null
  };
}

function attemptObjectKeys(design, attempts = design.attempts) {
  const keys = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    for (let variant = 1; variant <= design.numVariants; variant += 1) {
      const prefix = `users/${design.ownerId}/designs/${design._id}/attempt-${attempt}/variant-${variant}`;
      keys.push(`${prefix}.jpg`, `${prefix}-thumb.jpg`);
    }
  }
  return keys;
}

async function callAi(design) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const url = await getReadUrl(design.originalImageKey, 900);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.aiTimeoutMs);
    try {
      const response = await fetch(`${config.aiServiceUrl}/redesign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.aiServiceToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': String(design._id)
        },
        body: JSON.stringify({
          designId: String(design._id),
          imageUrl: url,
          roomType: design.roomType,
          style: design.style,
          budgetRange: design.budgetRange === 'ultra' ? 'high' : design.budgetRange,
          colors: design.colors,
          numVariants: design.numVariants,
          seed: design.seed
        }),
        signal: controller.signal,
        redirect: 'error'
      });
      if (response.status === 503 && attempt === 0) {
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new AppError(502, `AI_HTTP_${response.status}`, 'AI service request failed.');
      }
      return validateAiResponse(await readJsonLimited(response), design.numVariants);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (controller.signal.aborted || error.name === 'TimeoutError' || error.name === 'AbortError') {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }
        throw new AppError(502, 'AI_TIMEOUT', 'AI request timed out.');
      }
      throw new AppError(502, 'AI_UNAVAILABLE', 'AI service is unavailable.');
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new AppError(502, 'AI_UNAVAILABLE', 'AI service is unavailable.');
}

async function buildMockPayload(design) {
  const results = [];
  for (let variant = 1; variant <= design.numVariants; variant += 1) {
    const buffer = await makeMockImage(`MOCK ${variant}`);
    const imageBase64 = buffer.toString('base64');
    results.push({ variant, imageBase64 });
  }
  return validateAiResponse({
    status: 'ok',
    modelVersion: 'mock-v1',
    durationMs: 0,
    results,
    palette: ['#E8E2D6', '#B08968', '#9CA3AF'],
    roomAnalysis: { description: 'Mock result; no room analysis was performed.' },
    recommendations: [
      { category: 'sofa', styleTags: [design.style], colorHint: 'light wood' },
      { category: 'lamp', styleTags: [design.style], colorHint: 'beige' },
      { category: 'rug', styleTags: [design.style], colorHint: 'beige' }
    ]
  }, design.numVariants);
}

async function generateAndStore(design) {
  const payload = config.aiMock ? await buildMockPayload(design) : await callAi(design);
  const attemptPrefix = `users/${design.ownerId}/designs/${design._id}/attempt-${design.attempts}`;
  const results = [];
  const objectKeys = [];
  for (const result of payload.results) {
    const normalized = await normalizeAiResult(result.imageBase64);
    const imageKey = `${attemptPrefix}/variant-${result.variant}.jpg`;
    const thumbKey = `${attemptPrefix}/variant-${result.variant}-thumb.jpg`;
    await Promise.all([
      putObject(imageKey, normalized.full, 'image/jpeg'),
      putObject(thumbKey, normalized.thumb, 'image/jpeg')
    ]);
    objectKeys.push(imageKey, thumbKey);
    results.push({ variant: result.variant, imageKey, thumbKey });
  }
  const products = await selectRecommendations(payload.recommendations, design.budgetRange);
  return {
    isMock: config.aiMock,
    results,
    objectKeys,
    palette: payload.palette,
    recommendations: payload.recommendations,
    furnitureIds: products.map((product) => product._id),
    roomAnalysis: payload.roomAnalysis,
    modelVersion: payload.modelVersion,
    durationMs: payload.durationMs
  };
}

async function claimDesign() {
  const now = new Date();
  return Design.findOneAndUpdate({
    creditState: 'reserved',
    attempts: { $lt: MAX_ATTEMPTS },
    $or: [
      { status: 'queued' },
      { status: 'processing', leaseUntil: { $lte: now } }
    ]
  }, {
    $set: { status: 'processing', workerToken: crypto.randomUUID(), leaseUntil: new Date(now.getTime() + LEASE_MS) },
    $inc: { attempts: 1 }
  }, { returnDocument: 'after', sort: { createdAt: 1 } });
}

async function finalizeDesign(design, output) {
  const session = await Design.startSession();
  let finalized = false;
  const { objectKeys, ...persistedOutput } = output;
  try {
    await session.withTransaction(async () => {
      const updated = await Design.findOneAndUpdate({
        _id: design._id,
        status: 'processing',
        creditState: 'reserved',
        workerToken: design.workerToken
      }, {
        $set: {
          status: 'completed',
          creditState: 'charged',
          ...persistedOutput,
          leaseUntil: null,
          workerToken: null,
          errorCode: null,
          errorMessage: null
        }
      }, { returnDocument: 'after', session });
      if (!updated) return;
      const user = await User.updateOne({
        _id: design.ownerId,
        reservedCredits: { $gte: 1 },
        credits: { $gte: 1 }
      }, { $inc: { reservedCredits: -1, credits: -1 } }, { session });
      if (user.modifiedCount !== 1) throw new Error('Credit reservation invariant failed while finalizing design.');
      const staleAttemptKeys = attemptObjectKeys(design, design.attempts - 1);
      if (staleAttemptKeys.length) {
        await Outbox.create([{ kind: 'delete-objects', objectKeys: staleAttemptKeys }], { session });
      }
      finalized = true;
    });
  } finally {
    await session.endSession();
  }
  return finalized;
}

async function failDesign(design, error, objectKeys = []) {
  const session = await Design.startSession();
  let failed = false;
  try {
    await session.withTransaction(async () => {
      const updated = await Design.findOneAndUpdate({
        _id: design._id,
        status: 'processing',
        creditState: 'reserved',
        workerToken: design.workerToken
      }, {
        $set: {
          status: 'failed',
          creditState: 'released',
          leaseUntil: null,
          workerToken: null,
          errorCode: error.code || 'GENERATION_FAILED',
          errorMessage: error.message || 'Design generation failed.'
        }
      }, { returnDocument: 'after', session });
      if (!updated) return;
      const user = await User.updateOne({
        _id: design.ownerId,
        reservedCredits: { $gte: 1 }
      }, { $inc: { reservedCredits: -1 } }, { session });
      if (user.modifiedCount !== 1) throw new Error('Credit reservation invariant failed while releasing design.');
      if (objectKeys.length) {
        await Outbox.create([{ kind: 'delete-objects', objectKeys }], { session });
      }
      failed = true;
    });
  } finally {
    await session.endSession();
  }
  if (!failed && objectKeys.length) {
    await Outbox.create([{ kind: 'delete-objects', objectKeys }]);
  }
  return failed;
}

async function releaseExhaustedJobs() {
  const expired = await Design.find({
    status: 'processing',
    creditState: 'reserved',
    attempts: { $gte: MAX_ATTEMPTS },
    leaseUntil: { $lte: new Date() }
  }).limit(50);
  for (const design of expired) {
    await failDesign(
      design,
      { code: 'WORKER_TIMEOUT', message: 'Generation worker stopped before completing the job.' },
      attemptObjectKeys(design)
    );
  }
}

async function processOneDesign() {
  const design = await claimDesign();
  if (!design) return false;
  let output;
  try {
    output = await generateAndStore(design);
    const finalized = await finalizeDesign(design, output);
    if (!finalized) {
      console.warn('Stale worker could not finalize design', { designId: String(design._id) });
      await Outbox.create([{ kind: 'delete-objects', objectKeys: output.objectKeys }]);
    }
  } catch (error) {
    console.error('Design generation failed', {
      designId: String(design._id),
      code: error.code || 'GENERATION_FAILED',
      message: error.message
    });
    await failDesign(design, {
      code: error.code || 'GENERATION_FAILED',
      message: error instanceof AppError ? error.message : 'Design generation could not be completed.'
    }, output ? output.objectKeys : attemptObjectKeys(design, design.attempts));
  }
  return true;
}

async function processOneOutboxItem() {
  const now = new Date();
  const item = await Outbox.findOneAndUpdate({
    $or: [{ leaseUntil: null }, { leaseUntil: { $lte: now } }]
  }, {
    $set: { leaseUntil: new Date(now.getTime() + 60000) },
    $inc: { attempts: 1 }
  }, { returnDocument: 'after', sort: { createdAt: 1 } });
  if (!item) return false;
  try {
    for (const key of item.objectKeys) await require('./storage').deleteObject(key);
    await Outbox.deleteOne({ _id: item._id, leaseUntil: item.leaseUntil });
  } catch (error) {
    await Outbox.updateOne({ _id: item._id, leaseUntil: item.leaseUntil }, {
      $set: {
        leaseUntil: new Date(Date.now() + Math.min(300000, 1000 * (2 ** item.attempts))),
        lastError: String(error.message).slice(0, 300)
      }
    });
    console.error('Object cleanup will be retried', { outboxId: String(item._id), error });
  }
  return true;
}

module.exports = {
  MAX_ATTEMPTS,
  LEASE_MS,
  validateAiResponse,
  readJsonLimited,
  callAi,
  claimDesign,
  attemptObjectKeys,
  finalizeDesign,
  failDesign,
  releaseExhaustedJobs,
  processOneDesign,
  processOneOutboxItem
};
