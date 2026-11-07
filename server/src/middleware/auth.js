const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getConfig } = require('../config');
const { AppError } = require('../utils/errors');

const config = getConfig();

async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  if (!match) return next(new AppError(401, 'UNAUTHENTICATED', 'A valid bearer token is required.'));
  let payload;
  try {
    payload = jwt.verify(match[1], config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience
    });
  } catch (error) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Token is invalid or expired.'));
  }
  if (typeof payload.sub !== 'string' || !/^[a-f\d]{24}$/i.test(payload.sub)) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Token is invalid or expired.'));
  }
  try {
    const user = await User.findById(payload.sub).select('_id role');
    if (!user) return next(new AppError(401, 'UNAUTHENTICATED', 'Account is unavailable.'));
    req.user = { id: user.id, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}

async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'admin') {
      return next(new AppError(403, 'ADMIN_REQUIRED', 'Administrator access is required.'));
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticate, requireAdmin };
