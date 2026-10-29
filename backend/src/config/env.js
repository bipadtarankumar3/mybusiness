'use strict';

/**
 * Centralised, validated environment configuration.
 *
 * - production: AUTH_SECRET (>= 32 chars), PASSWORD_RESET_SECRET and DB_* are required.
 * - development/test: missing secrets are replaced by a random per-process value and a
 *   loud warning is printed (sessions will not survive restarts).
 */
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { z } = require('zod');

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5050),
  FRONTEND_URL: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),

  DB_DIALECT: z.enum(['mysql', 'sqlite']).default('mysql'),
  DB_STORAGE: optionalString,
  DB_HOST: optionalString,
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: optionalString,
  DB_USER: optionalString,
  DB_PASSWORD: z.string().optional(),

  AUTH_SECRET: optionalString,
  PASSWORD_RESET_SECRET: optionalString,
  CREDENTIALS_ENCRYPTION_KEY: optionalString,

  WHATSAPP_ACCESS_TOKEN: optionalString,
  WHATSAPP_PHONE_NUMBER_ID: optionalString,
  WHATSAPP_BUSINESS_ACCOUNT_ID: optionalString,
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: optionalString,
  WHATSAPP_APP_SECRET: optionalString,
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  WA_MARKETING_RATE_INR: z.coerce.number().nonnegative().default(0.88),
  WA_UTILITY_RATE_INR: z.coerce.number().nonnegative().default(0.13),

  REDIS_URL: optionalString,

  EMAIL_HOST: optionalString,
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_USER: optionalString,
  EMAIL_PASSWORD: optionalString,
  EMAIL_FROM: optionalString,

  AI_PROVIDER: optionalString,
  AI_API_KEY: optionalString,
  AI_BASE_URL: optionalString,
  AI_MODEL: optionalString,

  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GOOGLE_CALLBACK_URL: optionalString,

  FACEBOOK_APP_ID: optionalString,
  FACEBOOK_APP_SECRET: optionalString,
  FACEBOOK_CALLBACK_URL: optionalString,

  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,

  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});

function loadEnv(source = process.env) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = parsed.data;
  const isProd = env.NODE_ENV === 'production';
  const problems = [];

  if (isProd) {
    if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) problems.push('AUTH_SECRET must be set and at least 32 characters');
    if (!env.PASSWORD_RESET_SECRET) problems.push('PASSWORD_RESET_SECRET is required');
    if (env.DB_DIALECT !== 'mysql') problems.push('DB_DIALECT must be mysql in production');
    for (const k of ['DB_HOST', 'DB_NAME', 'DB_USER']) if (!env[k]) problems.push(`${k} is required`);
    if (source.DB_PASSWORD === undefined) problems.push('DB_PASSWORD is required');
    if (problems.length) throw new Error(`Invalid production environment: ${problems.join('; ')}`);
  } else {
    const missing = [];
    for (const k of ['AUTH_SECRET', 'PASSWORD_RESET_SECRET', 'CREDENTIALS_ENCRYPTION_KEY']) {
      if (!env[k]) {
        env[k] = crypto.randomBytes(48).toString('hex');
        missing.push(k);
      }
    }
    if (env.AUTH_SECRET.length < 32) {
      missing.push('AUTH_SECRET (too short)');
      env.AUTH_SECRET = crypto.randomBytes(48).toString('hex');
    }
    if (missing.length && env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn(
        `\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n` +
          `  WARNING: ${missing.join(', ')} not configured.\n` +
          `  Using RANDOM per-process fallback values. Sessions, reset links and stored\n` +
          `  integration credentials will NOT survive a restart. Never do this in production.\n` +
          `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`
      );
    }
  }

  env.isProduction = isProd;
  env.isDevelopment = env.NODE_ENV === 'development';
  env.isTest = env.NODE_ENV === 'test';
  env.whatsappConfigured = Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
  env.aiConfigured = Boolean(env.AI_PROVIDER && env.AI_API_KEY);
  env.emailConfigured = Boolean(env.EMAIL_HOST && env.EMAIL_FROM);
  env.googleConfigured = Boolean(env.GOOGLE_CLIENT_ID);
  env.facebookConfigured = Boolean(env.FACEBOOK_APP_ID);
  env.razorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  env.frontendOrigins = env.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
  return env;
}

let cached;
function getEnv() {
  if (!cached) cached = loadEnv();
  return cached;
}

/** Test helper: override values at runtime (e.g. WhatsApp creds). */
function setEnvOverrides(overrides) {
  const env = getEnv();
  Object.assign(env, overrides);
  env.whatsappConfigured = Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
  env.aiConfigured = Boolean(env.AI_PROVIDER && env.AI_API_KEY);
  return env;
}

module.exports = { getEnv, loadEnv, setEnvOverrides };
