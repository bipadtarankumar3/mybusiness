'use strict';

const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

function createLimiter({ windowMs, max, keyGenerator, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip || 'unknown'),
    handler: (_req, _res, next) => {
      next(AppError.rateLimited(message || 'Too many requests, please try again later.'));
    },
  });
}

const loginRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip || 'ip'}:${String(req.body?.email || '').trim().toLowerCase()}`,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
});

const forgotPasswordRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `${req.ip || 'ip'}:${String(req.body?.email || '').trim().toLowerCase()}`,
  message: 'Too many password reset requests. Please try again later.',
});

const contactRequestRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many contact requests from this IP. Please try again later.',
});

module.exports = {
  createLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
  contactRequestRateLimiter,
};
