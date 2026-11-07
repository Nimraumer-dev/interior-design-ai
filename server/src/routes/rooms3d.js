const express = require('express');
const { Room3D } = require('../models');
const { authenticate } = require('../middleware/auth');
const { getReadUrl } = require('../services/storage');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const rooms = await Room3D.find({ isActive: true }).sort({ name: 1 });
  const templates = await Promise.all(rooms.map(async (room) => ({
    id: room.id,
    name: room.name,
    supportedRoomTypes: room.supportedRoomTypes,
    modelUrl: await getReadUrl(room.templateKey),
    thumbnailUrl: room.thumbnailKey ? await getReadUrl(room.thumbnailKey) : null
  })));
  res.json({ templates });
});

module.exports = router;
