require('dotenv').config();

function getConfig() {
  const config = {
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtIssuer: process.env.JWT_ISSUER || 'interior-design-api',
    jwtAudience: process.env.JWT_AUDIENCE || 'interior-design-app',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    startingCredits: Number(process.env.STARTING_CREDITS || 5),
    corsOrigins: (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),
    aiMock: process.env.AI_MOCK !== 'false',
    aiServiceUrl: (process.env.AI_SERVICE_URL || '').replace(/\/$/, ''),
    aiServiceToken: process.env.AI_SERVICE_TOKEN || '',
    aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 120000),
    storageDriver: process.env.STORAGE_DRIVER || 'local',
    localStorageDir: process.env.LOCAL_STORAGE_DIR || 'uploads',
    storageEndpoint: process.env.STORAGE_ENDPOINT || '',
    storageRegion: process.env.STORAGE_REGION || '',
    storageBucket: process.env.STORAGE_BUCKET || '',
    storageAccessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
    storageSecretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
    storageForcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== 'false'
  };

  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  if (!Number.isInteger(config.startingCredits) || config.startingCredits < 0) {
    throw new Error('STARTING_CREDITS must be a non-negative integer.');
  }
  if (!Number.isInteger(config.aiTimeoutMs) || config.aiTimeoutMs < 1 || config.aiTimeoutMs > 120000) {
    throw new Error('AI_TIMEOUT_MS must be an integer between 1 and 120000.');
  }
  if (!config.mongoUri) throw new Error('MONGODB_URI is required.');
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  if (!config.aiMock && (!config.aiServiceUrl || !config.aiServiceToken)) {
    throw new Error('AI_SERVICE_URL and AI_SERVICE_TOKEN are required when AI_MOCK=false.');
  }
  if (!['local', 's3'].includes(config.storageDriver)) {
    throw new Error('STORAGE_DRIVER must be either local or s3.');
  }
  if (config.storageDriver === 's3' &&
      (!config.storageBucket || !config.storageRegion || !config.storageAccessKeyId || !config.storageSecretAccessKey)) {
    throw new Error('S3 storage requires STORAGE_BUCKET, STORAGE_REGION and server-side credentials.');
  }
  return config;
}

module.exports = { getConfig };
