const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  variant: { type: Number, required: true, min: 1 },
  imageKey: { type: String, required: true },
  thumbKey: { type: String, required: true }
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  category: { type: String, required: true },
  styleTags: { type: [String], default: [] },
  colorHint: { type: String, default: '' }
}, { _id: false });

const designSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roomType: { type: String, required: true },
  style: { type: String, required: true },
  budgetRange: { type: String, required: true },
  colors: { type: [String], default: [] },
  numVariants: { type: Number, required: true, min: 1, max: 4 },
  seed: { type: Number, default: null },
  originalImageKey: { type: String, required: true },
  requestFingerprint: { type: String, required: true },
  idempotencyKey: { type: String, required: true },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued', required: true },
  creditState: { type: String, enum: ['reserved', 'charged', 'released'], default: 'reserved', required: true },
  attempts: { type: Number, default: 0, min: 0, required: true },
  leaseUntil: { type: Date, default: null },
  workerToken: { type: String, default: null },
  results: { type: [resultSchema], default: [] },
  palette: { type: [String], default: [] },
  recommendations: { type: [recommendationSchema], default: [] },
  furnitureIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Catalog' }],
  roomAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
  modelVersion: { type: String, default: null },
  durationMs: { type: Number, default: null },
  isMock: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  errorCode: { type: String, default: null },
  errorMessage: { type: String, default: null }
}, { timestamps: true, versionKey: false });

designSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true });
designSchema.index({ ownerId: 1, createdAt: -1 });
designSchema.index({ status: 1, leaseUntil: 1, createdAt: 1 });

module.exports = mongoose.model('Design', designSchema);
