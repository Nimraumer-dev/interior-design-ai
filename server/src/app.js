const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { getConfig } = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');
const { router: authRoutes } = require('./routes/auth');
const { router: designRoutes } = require('./routes/designs');
const catalogRoutes = require('./routes/catalog');
const { router: costRoutes } = require('./routes/cost');
const rooms3dRoutes = require('./routes/rooms3d');
const scenesRoutes = require('./routes/scenes');
const adminRoutes = require('./routes/admin');
const { isLocal, verifyLocalSignature, readObject } = require('./services/storage');
const { AppError } = require('./utils/errors');

function createApp() {
  const config = getConfig();
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'Browser origin is not allowed.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
    maxAge: 600
  }));
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api/designs', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  if (isLocal) {
    app.get('/api/files', async (req, res) => {
      const { key, expires, signature } = req.query;
      const expiry = Number(expires);
      if (typeof key !== 'string' || !verifyLocalSignature(key, expiry, signature)) {
        throw new AppError(403, 'INVALID_FILE_LINK', 'File link is invalid or expired.');
      }
      try {
        const file = await readObject(key);
        res.set('Cache-Control', 'private, max-age=60');
        res.set('Content-Type', file.contentType);
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('X-Content-Type-Options', 'nosniff');
        res.send(file.body);
      } catch (error) {
        if (error.code === 'ENOENT') throw new AppError(404, 'NOT_FOUND', 'File not found.');
        throw error;
      }
    });
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/designs', designRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/cost', costRoutes);
  app.use('/api/rooms3d', rooms3dRoutes);
  app.use('/api/scenes', scenesRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
