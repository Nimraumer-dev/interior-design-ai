const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { register, login, parseOrThrow } = require('../utils/validation');
const { AppError } = require('../utils/errors');
const { getConfig } = require('../config');

const router = express.Router();
const config = getConfig();

function issueToken(userId) {
  return jwt.sign({}, config.jwtSecret, {
    algorithm: 'HS256',
    subject: userId,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    expiresIn: config.jwtExpiresIn
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits,
    reservedCredits: user.reservedCredits,
    availableCredits: user.credits - user.reservedCredits
  };
}

router.post('/register', async (req, res) => {
  const input = parseOrThrow(register, req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  let user;
  try {
    user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      credits: config.startingCredits
    });
  } catch (error) {
    if (error.code === 11000) throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists.');
    throw error;
  }
  res.status(201).json({ user: publicUser(user), accessToken: issueToken(user.id) });
});

router.post('/login', async (req, res) => {
  const input = parseOrThrow(login, req.body);
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  res.json({ user: publicUser(user), accessToken: issueToken(user.id) });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Account not found.');
  res.json({ user: publicUser(user) });
});

router.patch('/me', authenticate, async (req, res) => {
  const input = parseOrThrow(
    z.object({ name: z.string().trim().min(1).max(80) }).strict(),
    req.body
  );
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { name: input.name } },
    { returnDocument: 'after' }
  );
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Account not found.');
  res.json({ user: publicUser(user) });
});

module.exports = { router, issueToken, publicUser };
