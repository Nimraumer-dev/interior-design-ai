const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  credits: { type: Number, min: 0, default: 0, required: true },
  reservedCredits: { type: Number, min: 0, default: 0, required: true }
}, { timestamps: true, versionKey: false });

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
