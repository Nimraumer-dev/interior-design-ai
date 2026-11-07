const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, enum: ['sofa', 'bed', 'table', 'chair', 'wardrobe', 'lamp', 'rug', 'decor'] },
  styles: { type: [String], default: [] },
  pricePaisa: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER },
  currency: { type: String, enum: ['PKR'], default: 'PKR', required: true },
  dimensionsCm: {
    w: { type: Number, min: 0 },
    h: { type: Number, min: 0 },
    d: { type: Number, min: 0 }
  },
  colors: { type: [String], default: [] },
  modelKey: { type: String, default: null },
  thumbKey: { type: String, default: null },
  isActive: { type: Boolean, default: true, required: true }
}, { timestamps: true, versionKey: false });

catalogSchema.index({ category: 1, isActive: 1 });
catalogSchema.index({ sku: 1 }, { unique: true });

module.exports = mongoose.model('Catalog', catalogSchema);
