process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';
process.env.JWT_ISSUER = 'interior-design-api';
process.env.JWT_AUDIENCE = 'interior-design-app';
process.env.STARTING_CREDITS = '1';
process.env.AI_MOCK = 'true';
process.env.STORAGE_DRIVER = 'local';
process.env.LOCAL_STORAGE_DIR = 'uploads-test';
process.env.PUBLIC_BASE_URL = 'http://127.0.0.1:5000';
process.env.AI_SERVICE_URL = '';
process.env.AI_SERVICE_TOKEN = '';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const sharp = require('sharp');

let replSet;
let app;
let models;
let generation;

test.before(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [{ launchTimeout: 120000 }]
  });
  process.env.MONGODB_URI = replSet.getUri();
  models = require('../src/models');
  generation = require('../src/services/generation');
  app = require('../src/app').createApp();
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(Object.values(models).map((Model) => Model.init()));
});

test.afterEach(async () => {
  await Promise.all(Object.values(models).map((Model) => Model.deleteMany({})));
  await fs.rm(path.resolve(__dirname, '..', 'uploads-test'), { recursive: true, force: true });
});

test.after(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

async function register(email) {
  const response = await request(app).post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'correct horse battery staple' });
  assert.equal(response.status, 201);
  return response.body;
}

async function imageBuffer() {
  return sharp({
    create: { width: 64, height: 48, channels: 3, background: '#cbb89d' }
  }).png().toBuffer();
}

function createDesignRequest(token, key, buffer) {
  return request(app).post('/api/designs')
    .set('Authorization', `Bearer ${token}`)
    .set('Idempotency-Key', key)
    .field('roomType', 'living_room')
    .field('style', 'scandinavian')
    .field('budgetRange', 'medium')
    .attach('image', buffer, { filename: 'room.png', contentType: 'image/png' });
}

test('auth, ownership, image validation and one-time generation charging', async () => {
  const { designFields } = require('../src/utils/validation');
  assert.equal(designFields.safeParse({
    roomType: 'living_room',
    style: 'scandinavian',
    budgetRange: 'ultra',
    colors: [],
    numVariants: 1
  }).success, true);
  assert.deepEqual((await request(app).get('/health')).body, { status: 'ok' });
  const first = await register('first@example.test');
  const second = await register('second@example.test');
  assert.equal(first.user.role, 'user');
  assert.equal(first.user.credits, 1);
  assert.equal('passwordHash' in first.user, false);

  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).post('/api/auth/login')
    .send({ email: 'first@example.test', password: 'incorrect' })).status, 401);
  const login = await request(app).post('/api/auth/login')
    .send({ email: 'first@example.test', password: 'correct horse battery staple' });
  assert.equal(login.status, 200);
  assert.ok(login.body.accessToken);
  assert.equal((await request(app).get('/api/auth/me')
    .set('Authorization', `Bearer ${login.body.accessToken}`)).body.user.email, 'first@example.test');
  assert.equal((await request(app).get('/api/auth/me')
    .set('Authorization', `Bearer ${first.accessToken}`)).body.user.availableCredits, 1);
  assert.equal((await request(app).post('/api/admin/catalog')
    .set('Authorization', `Bearer ${first.accessToken}`).send({})).status, 403);

  const buffer = await imageBuffer();
  const invalid = await createDesignRequest(first.accessToken, 'invalid-image-001', Buffer.from('not an image'));
  assert.equal(invalid.status, 415);

  const created = await createDesignRequest(first.accessToken, 'generation-key-001', buffer);
  assert.equal(created.status, 202);
  assert.equal(created.body.status, 'queued');
  const duplicate = await createDesignRequest(first.accessToken, 'generation-key-001', buffer);
  assert.equal(duplicate.status, 202);
  assert.equal(duplicate.body.designId, created.body.designId);
  assert.equal(await generation.processOneDesign(), true);

  const result = await request(app).get(`/api/designs/${created.body.designId}`)
    .set('Authorization', `Bearer ${first.accessToken}`);
  assert.equal(result.status, 200);
  assert.equal(result.body.design.status, 'completed');
  assert.equal(result.body.design.isMock, true);
  assert.equal(result.body.design.results.length, 2);
  assert.ok(result.body.design.originalImageUrl);
  const saved = await request(app).patch(`/api/designs/${created.body.designId}/favorite`)
    .set('Authorization', `Bearer ${first.accessToken}`)
    .send({ saved: true });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.design.isFavorite, true);
  const history = await request(app).get('/api/designs')
    .set('Authorization', `Bearer ${first.accessToken}`);
  assert.equal(history.body.designs[0].isFavorite, true);
  assert.equal((await request(app).patch(`/api/designs/${created.body.designId}/favorite`)
    .set('Authorization', `Bearer ${second.accessToken}`)
    .send({ saved: true })).status, 404);
  const profile = await request(app).get('/api/auth/me')
    .set('Authorization', `Bearer ${first.accessToken}`);
  assert.equal(profile.body.user.credits, 0);
  assert.equal(profile.body.user.reservedCredits, 0);

  assert.equal((await request(app).get(`/api/designs/${created.body.designId}`)
    .set('Authorization', `Bearer ${second.accessToken}`)).status, 404);
  assert.equal((await request(app).get(`/api/designs/${created.body.designId}`)).status, 401);
  const localLink = new URL(result.body.design.results[0].url);
  const storage = require('../src/services/storage');
  const key = new URLSearchParams(localLink.search).get('key');
  const expires = Number(new URLSearchParams(localLink.search).get('expires'));
  const signature = new URLSearchParams(localLink.search).get('signature');
  assert.equal(storage.verifyLocalSignature(key, expires, signature), true);
  assert.equal(storage.verifyLocalSignature(key, expires, '0'.repeat(64)), false);
  const originalLink = new URL(result.body.design.originalImageUrl);
  const originalKey = new URLSearchParams(originalLink.search).get('key');
  const originalExpires = Number(new URLSearchParams(originalLink.search).get('expires'));
  const originalSignature = new URLSearchParams(originalLink.search).get('signature');
  assert.equal(storage.verifyLocalSignature(originalKey, originalExpires, originalSignature), true);
  const fileResponse = await request(app).get('/api/files').query({ key, expires, signature });
  assert.equal(fileResponse.status, 200);
  assert.equal(fileResponse.headers['cross-origin-resource-policy'], 'cross-origin');
  assert.equal((await request(app).get('/api/files').query({ key, expires, signature: '0'.repeat(64) })).status, 403);
  const file = await storage.readObject(key);
  assert.equal(file.contentType, 'image/jpeg');
});

test('upload size and idempotency payload conflicts are rejected', async () => {
  const account = await register('upload@example.test');
  const oversized = Buffer.alloc(10 * 1024 * 1024 + 1);
  const response = await createDesignRequest(account.accessToken, 'oversize-key-01', oversized);
  assert.equal(response.status, 413);
  const buffer = await imageBuffer();
  assert.equal((await createDesignRequest(account.accessToken, 'same-request-key', buffer)).status, 202);
  const changedBuffer = await sharp({
    create: { width: 64, height: 48, channels: 3, background: '#ffffff' }
  }).png().toBuffer();
  const changed = await createDesignRequest(account.accessToken, 'same-request-key', changedBuffer);
  assert.equal(changed.status, 409);
});

test('concurrent generations cannot reserve more credits than available', async () => {
  const account = await register('concurrent@example.test');
  const buffer = await imageBuffer();
  const responses = await Promise.all([
    createDesignRequest(account.accessToken, 'concurrent-job-001', buffer),
    createDesignRequest(account.accessToken, 'concurrent-job-002', buffer)
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [202, 402]);
  const user = await models.User.findById(account.user.id);
  assert.equal(user.reservedCredits, 1);
  assert.equal(await models.Design.countDocuments({ ownerId: user._id }), 1);
});

test('worker recovery, failed-job release, scene ownership and catalogue cost use stored prices', async () => {
  const owner = await register('owner@example.test');
  const other = await register('other@example.test');
  const user = await models.User.findById(owner.user.id);
  user.credits = 2;
  user.reservedCredits = 1;
  await user.save();
  const recovering = await models.Design.create({
    ownerId: user._id,
    roomType: 'living_room',
    style: 'modern',
    budgetRange: 'medium',
    numVariants: 1,
    originalImageKey: `users/${user.id}/designs/recovery/original.jpg`,
    requestFingerprint: 'recovery',
    idempotencyKey: 'recovery-job-001',
    status: 'processing',
    creditState: 'reserved',
    attempts: 1,
    leaseUntil: new Date(Date.now() - 1000),
    workerToken: 'stale-worker-token'
  });
  assert.equal(await generation.processOneDesign(), true);
  const recovered = await models.Design.findById(recovering._id);
  assert.equal(recovered.status, 'completed');
  assert.equal(recovered.creditState, 'charged');
  assert.equal(await models.Outbox.countDocuments({ kind: 'delete-objects' }), 1);
  assert.equal(await generation.processOneOutboxItem(), true);
  assert.equal(await models.Outbox.countDocuments({ kind: 'delete-objects' }), 0);
  assert.equal(await generation.finalizeDesign(recovering, {
    objectKeys: [],
    results: [],
    palette: [],
    recommendations: [],
    furnitureIds: []
  }), false);

  const updatedUser = await models.User.findById(user._id);
  updatedUser.credits = 2;
  updatedUser.reservedCredits = 1;
  await updatedUser.save();
  const failing = await models.Design.create({
    ownerId: user._id,
    roomType: 'bedroom',
    style: 'modern',
    budgetRange: 'low',
    numVariants: 1,
    originalImageKey: `users/${user.id}/designs/failure/original.jpg`,
    requestFingerprint: 'failure',
    idempotencyKey: 'failed-job-0001',
    status: 'processing',
    creditState: 'reserved',
    attempts: 1,
    leaseUntil: new Date(Date.now() + 60000),
    workerToken: 'worker-token'
  });
  assert.equal(await generation.failDesign(failing, { code: 'TEST_FAILURE', message: 'Test failure.' }), true);
  const failed = await models.Design.findById(failing._id);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.creditState, 'released');
  const afterFailure = await models.User.findById(user._id);
  assert.equal(afterFailure.credits, 2);
  assert.equal(afterFailure.reservedCredits, 0);

  const item = await models.Catalog.create({
    sku: 'test-chair',
    name: 'Test chair',
    category: 'chair',
    styles: ['modern'],
    pricePaisa: 250000,
    currency: 'PKR',
    isActive: true
  });
  const estimate = await request(app).post('/api/cost/estimate')
    .set('Authorization', `Bearer ${owner.accessToken}`)
    .send({ items: [{ itemId: String(item._id), qty: 3 }] });
  assert.equal(estimate.status, 200);
  assert.equal(estimate.body.totalPaisa, 750000);
  assert.equal(estimate.body.items[0].unitPricePaisa, 250000);

  const room = await models.Room3D.create({
    name: 'Test room',
    templateKey: 'templates/test.glb',
    supportedRoomTypes: ['living_room'],
    isActive: true
  });
  const sceneResponse = await request(app).post('/api/scenes')
    .set('Authorization', `Bearer ${owner.accessToken}`)
    .send({
      name: 'My scene',
      roomTemplateId: String(room._id),
      placements: [{
        catalogItemId: String(item._id),
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }]
    });
  assert.equal(sceneResponse.status, 201);
  assert.equal((await request(app).get(`/api/scenes/${sceneResponse.body.scene.id}`)
    .set('Authorization', `Bearer ${other.accessToken}`)).status, 404);
  assert.equal((await request(app).post('/api/cost/estimate')
    .set('Authorization', `Bearer ${owner.accessToken}`)
    .send({ items: [{ itemId: String(item._id), qty: 101 }] })).status, 400);
});
