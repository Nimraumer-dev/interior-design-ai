const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  catalogItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalog', required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  rotation: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  scale: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  }
}, { _id: false });

const sceneSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  designId: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', default: null },
  roomTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room3D', required: true },
  placements: { type: [placementSchema], default: [] }
}, { timestamps: true, versionKey: false });

sceneSchema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.model('Scene', sceneSchema);
