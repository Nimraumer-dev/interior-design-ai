const express = require('express');
const { Scene, Design, Room3D, Catalog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { sceneWrite, objectIdPattern, parseOrThrow } = require('../utils/validation');
const { AppError } = require('../utils/errors');
const { getReadUrl } = require('../services/storage');

const router = express.Router();
const patchSchema = sceneWrite.partial();

async function validateReferences(ownerId, input) {
  if (input.designId) {
    const design = await Design.exists({ _id: input.designId, ownerId });
    if (!design) throw new AppError(404, 'NOT_FOUND', 'Linked design not found.');
  }
  if (input.roomTemplateId) {
    const template = await Room3D.exists({ _id: input.roomTemplateId, isActive: true });
    if (!template) throw new AppError(400, 'INVALID_TEMPLATE', 'Room template must be active.');
  }
  if (input.placements && input.placements.length) {
    const ids = [...new Set(input.placements.map((placement) => placement.catalogItemId))];
    const count = await Catalog.countDocuments({ _id: { $in: ids }, isActive: true });
    if (count !== ids.length) throw new AppError(400, 'INVALID_CATALOG_ITEM', 'All placed furniture must be active catalogue items.');
  }
}

async function serializeScene(scene) {
  const placements = await Promise.all(scene.placements.map(async (placement) => {
    const item = await Catalog.findById(placement.catalogItemId).lean();
    return {
      catalogItemId: String(placement.catalogItemId),
      position: placement.position,
      rotation: placement.rotation,
      scale: placement.scale,
      item: item ? {
        id: String(item._id),
        name: item.name,
        category: item.category,
        pricePaisa: item.pricePaisa,
        modelUrl: item.modelKey ? await getReadUrl(item.modelKey) : null,
        thumbUrl: item.thumbKey ? await getReadUrl(item.thumbKey) : null
      } : null
    };
  }));
  const template = await Room3D.findById(scene.roomTemplateId);
  return {
    id: scene.id,
    name: scene.name,
    designId: scene.designId ? String(scene.designId) : null,
    roomTemplateId: String(scene.roomTemplateId),
    template: template && template.isActive ? {
      id: template.id,
      name: template.name,
      modelUrl: await getReadUrl(template.templateKey),
      thumbnailUrl: template.thumbnailKey ? await getReadUrl(template.thumbnailKey) : null
    } : null,
    placements,
    createdAt: scene.createdAt,
    updatedAt: scene.updatedAt
  };
}

router.get('/', authenticate, async (req, res) => {
  const scenes = await Scene.find({ ownerId: req.user.id }).sort({ updatedAt: -1 }).limit(100);
  res.json({ scenes: await Promise.all(scenes.map(serializeScene)) });
});

router.post('/', authenticate, async (req, res) => {
  const input = parseOrThrow(sceneWrite, req.body);
  await validateReferences(req.user.id, input);
  const scene = await Scene.create({ ownerId: req.user.id, ...input });
  res.status(201).json({ scene: await serializeScene(scene) });
});

router.get('/:id', authenticate, async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Scene id is invalid.');
  const scene = await Scene.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!scene) throw new AppError(404, 'NOT_FOUND', 'Scene not found.');
  res.json({ scene: await serializeScene(scene) });
});

router.patch('/:id', authenticate, async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Scene id is invalid.');
  const input = parseOrThrow(patchSchema, req.body);
  if (!Object.keys(input).length) throw new AppError(400, 'INVALID_INPUT', 'Provide at least one editable scene field.');
  await validateReferences(req.user.id, input);
  const scene = await Scene.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id },
    { $set: input },
    { returnDocument: 'after', runValidators: true }
  );
  if (!scene) throw new AppError(404, 'NOT_FOUND', 'Scene not found.');
  res.json({ scene: await serializeScene(scene) });
});

router.delete('/:id', authenticate, async (req, res) => {
  if (!objectIdPattern.test(req.params.id)) throw new AppError(400, 'INVALID_ID', 'Scene id is invalid.');
  const scene = await Scene.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
  if (!scene) throw new AppError(404, 'NOT_FOUND', 'Scene not found.');
  res.status(204).end();
});

module.exports = router;
