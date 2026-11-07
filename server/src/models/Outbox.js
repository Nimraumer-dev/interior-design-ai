const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema({
  kind: { type: String, enum: ['delete-objects'], required: true },
  objectKeys: { type: [String], required: true },
  attempts: { type: Number, default: 0, required: true },
  leaseUntil: { type: Date, default: null },
  lastError: { type: String, default: null }
}, { timestamps: true, versionKey: false });

outboxSchema.index({ leaseUntil: 1, createdAt: 1 });

module.exports = mongoose.model('Outbox', outboxSchema);
