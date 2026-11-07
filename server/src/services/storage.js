const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getConfig } = require('../config');

const config = getConfig();
const root = path.resolve(__dirname, '..', '..', config.localStorageDir);
const s3 = config.storageDriver === 's3'
  ? new S3Client({
    region: config.storageRegion,
    endpoint: config.storageEndpoint || undefined,
    forcePathStyle: config.storageForcePathStyle,
    credentials: {
      accessKeyId: config.storageAccessKeyId,
      secretAccessKey: config.storageSecretAccessKey
    }
  })
  : null;

function assertKey(key) {
  if (typeof key !== 'string' || key.length > 700 ||
      key.split('/').some((part) => !part || part === '.' || part === '..') ||
      !/^[a-zA-Z0-9/_\-.]+$/.test(key)) {
    throw new Error('Invalid object key.');
  }
}

function localPath(key) {
  assertKey(key);
  const resolved = path.resolve(root, key);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error('Invalid object key.');
  return resolved;
}

async function putObject(key, body, contentType = 'application/octet-stream') {
  assertKey(key);
  if (config.storageDriver === 's3') {
    await s3.send(new PutObjectCommand({
      Bucket: config.storageBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256'
    }));
    return;
  }
  const target = localPath(key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, { flag: 'w' });
}

async function deleteObject(key) {
  assertKey(key);
  if (config.storageDriver === 's3') {
    await s3.send(new DeleteObjectCommand({ Bucket: config.storageBucket, Key: key }));
    return;
  }
  try {
    await fs.unlink(localPath(key));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function localSignature(key, expires) {
  return crypto.createHmac('sha256', config.jwtSecret).update(`${expires}:${key}`).digest('hex');
}

async function getReadUrl(key, expiresSeconds = 900) {
  assertKey(key);
  if (config.storageDriver === 's3') {
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: config.storageBucket, Key: key }),
      { expiresIn: expiresSeconds }
    );
  }
  const expires = Math.floor(Date.now() / 1000) + expiresSeconds;
  const query = new URLSearchParams({
    key,
    expires: String(expires),
    signature: localSignature(key, expires)
  });
  return `${config.publicBaseUrl}/api/files?${query.toString()}`;
}

function verifyLocalSignature(key, expires, signature) {
  if (!Number.isSafeInteger(expires) || expires < Math.floor(Date.now() / 1000) ||
      typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(localSignature(key, expires), 'hex');
  const supplied = Buffer.from(signature, 'hex');
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

async function readObject(key) {
  assertKey(key);
  if (config.storageDriver === 's3') {
    const response = await s3.send(new GetObjectCommand({ Bucket: config.storageBucket, Key: key }));
    return {
      body: response.Body,
      contentType: response.ContentType || 'application/octet-stream'
    };
  }
  const body = await fs.readFile(localPath(key));
  const extension = path.extname(key).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
  };
  const contentType = contentTypes[extension] || 'application/octet-stream';
  return { body, contentType };
}

module.exports = {
  putObject,
  deleteObject,
  getReadUrl,
  verifyLocalSignature,
  readObject,
  assertKey,
  isLocal: config.storageDriver === 'local'
};
