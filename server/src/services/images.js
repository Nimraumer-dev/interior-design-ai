const sharp = require('sharp');
const { AppError } = require('../utils/errors');

const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_RESULT_PIXELS = 20_000_000;
const MAX_RESULT_BYTES = 8 * 1024 * 1024;

async function normalizeUpload(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > UPLOAD_MAX_BYTES) {
    throw new AppError(413, 'UPLOAD_TOO_LARGE', 'Image must be non-empty and no larger than 10 MB.');
  }
  try {
    const image = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) ||
        !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_INPUT_PIXELS) {
      throw new AppError(415, 'UNSUPPORTED_IMAGE', 'Upload a valid JPEG, PNG or WebP image.');
    }
    const normalized = await image.rotate().resize({
      width: 1536,
      height: 1536,
      fit: 'inside',
      withoutEnlargement: true
    }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    return { buffer: normalized, metadata: { width: metadata.width, height: metadata.height } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(415, 'UNSUPPORTED_IMAGE', 'Upload is not a decodable image.');
  }
}

async function normalizeAiResult(imageBase64) {
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0 ||
      imageBase64.length > Math.ceil(MAX_RESULT_BYTES * 4 / 3) + 32) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI result image is missing or too large.');
  }
  const encoded = imageBase64.replace(/^data:image\/(?:jpeg|png|webp);base64,/i, '');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned an invalid image encoding.');
  }
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length || buffer.length > MAX_RESULT_BYTES) {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI result image exceeds the size limit.');
  }
  try {
    const image = sharp(buffer, { limitInputPixels: MAX_RESULT_PIXELS, failOn: 'error' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) ||
        !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_RESULT_PIXELS) {
      throw new Error('Unsupported or oversized image');
    }
    const full = await image.rotate().resize({
      width: 1536,
      height: 1536,
      fit: 'inside',
      withoutEnlargement: true
    }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    const thumb = await sharp(full).resize({ width: 320, height: 320, fit: 'inside' })
      .jpeg({ quality: 78 }).toBuffer();
    return { full, thumb };
  } catch {
    throw new AppError(502, 'INVALID_AI_RESPONSE', 'AI returned a malformed or unsupported image.');
  }
}

function makeMockImage(label) {
  const safeLabel = String(label).replace(/[<>&"']/g, '');
  const svg = Buffer.from(`<svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#f6f1e8"/><stop offset="1" stop-color="#d9c8ac"/></linearGradient></defs><rect width="1024" height="768" fill="url(#g)"/><rect x="70" y="80" width="360" height="250" rx="8" fill="#b9d8db"/><path d="M70 205h360M250 80v250" stroke="#fff" stroke-width="14"/><rect x="530" y="390" width="370" height="150" rx="24" fill="#8d715e"/><rect x="570" y="365" width="290" height="100" rx="32" fill="#aa8e78"/><rect x="600" y="540" width="18" height="100" fill="#5b493d"/><rect x="820" y="540" width="18" height="100" fill="#5b493d"/><rect x="90" y="600" width="820" height="22" fill="#987b61"/><text x="512" y="710" text-anchor="middle" font-family="Arial" font-size="32" fill="#40372e">MOCK DESIGN ${safeLabel}</text></svg>`);
  return sharp(svg).jpeg({ quality: 85 }).toBuffer();
}

module.exports = {
  normalizeUpload,
  normalizeAiResult,
  makeMockImage,
  UPLOAD_MAX_BYTES,
  MAX_RESULT_BYTES,
  MAX_RESULT_PIXELS
};
