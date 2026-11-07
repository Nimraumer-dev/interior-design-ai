const express = require('express');
const { Catalog, Room3D } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { catalogWrite, room3dWrite, objectIdPattern, parseOrThrow } = require('../utils/validation');
const { AppError } = require('../utils/errors');

const router = express.Router();
const catalogPatch = catalogWrite.partial();
const roomPatch = room3dWrite.partial();
router.use(authenticate, requireAdmin);

router.post('/catalog', async (req, res) => {
  const input = parseOrThrow(catalogWrite, req.body);
  const item = await Catalog.create(input);
  res.status(201).json({ item: { id: item.id, ...item.toObject({ versionKey: false }) } });
});

router.patch('/catalog/:id', async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Catalogue item id is invalid.');
  const input = parseOrThrow(catalogPatch, req.body);
  if (!Object.keys(input).length) throw new AppError(400, 'INVALID_INPUT', 'Provide at least one catalogue field.');
  const item = await Catalog.findByIdAndUpdate(req.params.id, { $set: input }, { returnDocument: 'after', runValidators: true });
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Catalogue item not found.');
  res.json({ item: { id: item.id, ...item.toObject({ versionKey: false }) } });
});

router.delete('/catalog/:id', async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Catalogue item id is invalid.');
  const item = await Catalog.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { returnDocument: 'after' });
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Catalogue item not found.');
  res.status(204).end();
});

router.post('/rooms3d', async (req, res) => {
  const input = parseOrThrow(room3dWrite, req.body);
  const room = await Room3D.create(input);
  res.status(201).json({ template: { id: room.id, name: room.name, isActive: room.isActive } });
});

router.patch('/rooms3d/:id', async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Template id is invalid.');
  const input = parseOrThrow(roomPatch, req.body);
  if (!Object.keys(input).length) throw new AppError(400, 'INVALID_INPUT', 'Provide at least one template field.');
  const room = await Room3D.findByIdAndUpdate(req.params.id, { $set: input }, { returnDocument: 'after', runValidators: true });
  if (!room) throw new AppError(404, 'NOT_FOUND', 'Template not found.');
  res.json({ template: { id: room.id, name: room.name, isActive: room.isActive } });
});

router.delete('/rooms3d/:id', async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Template id is invalid.');
  const room = await Room3D.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { returnDocument: 'after' });
  if (!room) throw new AppError(404, 'NOT_FOUND', 'Template not found.');
  res.status(204).end();
});

module.exports = router;
