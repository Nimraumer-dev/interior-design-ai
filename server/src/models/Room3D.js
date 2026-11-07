const mongoose = require('mongoose');

const room3dSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  templateKey: { type: String, required: true },
  thumbnailKey: { type: String, default: null },
  supportedRoomTypes: { type: [String], required: true, default: [] },
  isActive: { type: Boolean, default: true, required: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Room3D', room3dSchema);
