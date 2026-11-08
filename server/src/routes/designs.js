const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { z } = require('zod');
const { Design, User, Scene, Outbox } = require('../models');
const { authenticate } = require('../middleware/auth');
const { designFields, parseOrThrow, objectIdPattern, budgetRanges, styles } = require('../utils/validation');
const { AppError } = require('../utils/errors');
const { normalizeUpload, UPLOAD_MAX_BYTES } = require('../services/images');
const { putObject, getReadUrl, deleteObject } = require('../services/storage');
const { selectRecommendations, serializeCatalogItem } = require('../services/recommendations');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES, files: 1, fields: 7, fieldSize: 4096 },
  fileFilter(req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new AppError(415, 'UNSUPPORTED_IMAGE', 'Upload a JPEG, PNG or WebP image.'));
    }
    return callback(null, true);
  }
});

function pagination(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError(400, 'INVALID_PAGINATION', 'page must be positive and limit must be between 1 and 100.');
  }
  return { page, limit };
}

function requestInputs(body) {
  const parsedBody = { ...body };
  if (typeof parsedBody.colors === 'string') {
    try {
      parsedBody.colors = JSON.parse(parsedBody.colors);
    } catch {
      throw new AppError(400, 'INVALID_INPUT', 'colors must be a JSON array.');
    }
  }
  return parseOrThrow(designFields, parsedBody);
}

async function serializeDesign(design, includeRecommendations = true) {
  const results = await Promise.all(design.results.map(async (result) => ({
    variant: result.variant,
    url: await getReadUrl(result.imageKey),
    thumbUrl: await getReadUrl(result.thumbKey)
  })));
  const recommendedFurniture = includeRecommendations
    ? await Promise.all((await selectRecommendations(design.recommendations, design.budgetRange))
      .map(serializeCatalogItem))
    : [];
  return {
    id: design.id,
    roomType: design.roomType,
    style: design.style,
    budgetRange: design.budgetRange,
    originalImageUrl: await getReadUrl(design.originalImageKey),
    colors: design.colors,
    status: design.status,
    creditState: design.creditState,
    attempts: design.attempts,
    isMock: design.isMock,
    isFavorite: design.isFavorite,
    results,
    palette: design.palette,
    recommendations: design.recommendations,
    recommendedFurniture,
    roomAnalysis: design.roomAnalysis,
    modelVersion: design.modelVersion,
    durationMs: design.durationMs,
    errorCode: design.errorCode,
    errorMessage: design.errorMessage,
    createdAt: design.createdAt,
    updatedAt: design.updatedAt
  };
}

router.post('/', authenticate, (req, res, next) => {
  upload.single('image')(req, res, (error) => error ? next(error) : next());
}, async (req, res) => {
  if (!req.file) throw new AppError(400, 'IMAGE_REQUIRED', 'Provide exactly one image in the image field.');
  const idempotencyKey = req.get('Idempotency-Key');
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128 ||
      /[\r\n]/.test(idempotencyKey)) {
    throw new AppError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Provide an Idempotency-Key between 8 and 128 characters.');
  }
  const input = requestInputs(req.body);
  const normalized = await normalizeUpload(req.file.buffer);
  const inputHash = crypto.createHash('sha256').update(normalized.buffer).digest('hex');
  const fingerprint = crypto.createHash('sha256')
    .update(JSON.stringify({ ...input, imageHash: inputHash }))
    .digest('hex');
  const existing = await Design.findOne({ ownerId: req.user.id, idempotencyKey });
  if (existing) {
    if (existing.requestFingerprint !== fingerprint) {
      throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'This Idempotency-Key was already used with different request data.');
    }
    return res.status(202).json({ designId: existing.id, status: existing.status });
  }

  const designId = new mongoose.Types.ObjectId();
  const imageKey = `users/${req.user.id}/designs/${designId}/original.jpg`;
  await putObject(imageKey, normalized.buffer, 'image/jpeg');
  const session = await mongoose.startSession();
  let design;
  try {
    await session.withTransaction(async () => {
      const user = await User.findOneAndUpdate(
        {
          _id: req.user.id,
          $expr: { $gt: [{ $subtract: ['$credits', '$reservedCredits'] }, 0] }
        },
        { $inc: { reservedCredits: 1 } },
        { returnDocument: 'after', session }
      );
      if (!user) throw new AppError(402, 'NO_CREDITS', 'No generation credits are currently available.');
      design = new Design({
        _id: designId,
        ownerId: req.user.id,
        ...input,
        originalImageKey: imageKey,
        requestFingerprint: fingerprint,
        idempotencyKey,
        status: 'queued',
        creditState: 'reserved'
      });
      await design.save({ session });
    });
  } catch (error) {
    await deleteObject(imageKey).catch((cleanupError) => {
      console.error('Failed to remove an unclaimed design upload', cleanupError);
    });
    if (error.code === 11000) {
      const duplicate = await Design.findOne({ ownerId: req.user.id, idempotencyKey });
      if (duplicate && duplicate.requestFingerprint === fingerprint) {
        return res.status(202).json({ designId: duplicate.id, status: duplicate.status });
      }
      if (duplicate) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'This Idempotency-Key was already used with different request data.');
    }
    throw error;
  } finally {
    await session.endSession();
  }
  res.status(202).json({ designId: design.id, status: design.status });
});

router.get('/', authenticate, async (req, res) => {
  const { page, limit } = pagination(req.query);
  const filter = { ownerId: req.user.id };
  if (req.query.status !== undefined) {
    if (!['queued', 'processing', 'completed', 'failed'].includes(req.query.status)) {
      throw new AppError(400, 'INVALID_FILTER', 'status filter is invalid.');
    }
    filter.status = req.query.status;
  }
  if (req.query.style !== undefined) {
    if (!styles.includes(req.query.style)) throw new AppError(400, 'INVALID_FILTER', 'style filter is invalid.');
    filter.style = req.query.style;
  }
  const [designs, total] = await Promise.all([
    Design.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Design.countDocuments(filter)
  ]);
  res.json({
    designs: await Promise.all(designs.map((design) => serializeDesign(design, false))),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

router.patch('/:id/favorite', authenticate, async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Design id is invalid.');
  const { saved } = parseOrThrow(z.object({ saved: z.boolean() }).strict(), req.body);
  const design = await Design.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id },
    { $set: { isFavorite: saved } },
    { returnDocument: 'after', runValidators: true }
  );
  if (!design) throw new AppError(404, 'NOT_FOUND', 'Design not found.');
  res.json({ design: await serializeDesign(design) });
});

router.get('/:id', authenticate, async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Design id is invalid.');
  const design = await Design.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!design) throw new AppError(404, 'NOT_FOUND', 'Design not found.');
  res.json({ design: await serializeDesign(design) });
});

router.delete('/:id', authenticate, async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Design id is invalid.');
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const design = await Design.findOne({ _id: req.params.id, ownerId: req.user.id }).session(session);
      if (!design) throw new AppError(404, 'NOT_FOUND', 'Design not found.');
      if (['queued', 'processing'].includes(design.status)) {
        throw new AppError(409, 'DESIGN_IN_PROGRESS', 'Queued or processing designs cannot be deleted.');
      }
      if (await Scene.exists({ ownerId: req.user.id, designId: design._id }).session(session)) {
        throw new AppError(409, 'SCENE_REFERENCES_DESIGN', 'Delete saved scenes linked to this design first.');
      }
      const objectKeys = [design.originalImageKey, ...design.results.flatMap((result) => [result.imageKey, result.thumbKey])];
      await Design.deleteOne({ _id: design._id }, { session });
      await Outbox.create([{ kind: 'delete-objects', objectKeys }], { session });
    });
  } finally {
    await session.endSession();
  }
  res.status(204).end();
});

module.exports = { router, serializeDesign, pagination };
