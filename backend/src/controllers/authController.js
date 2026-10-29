'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { getEnv } = require('../config/env');
const models = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { signSessionToken, setSessionCookie, clearSessionCookie } = require('../middleware/auth');
const { seedPlans } = require('../seeders/runSeed');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().email('Valid email is required').max(191),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  businessName: z.string().trim().min(2, 'Business name is required').max(150),
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(16, 'Invalid reset token'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const googleLoginSchema = z.object({
  idToken: z.string().trim().optional(),
  accessToken: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  googleId: z.string().trim().optional(),
  picture: z.string().trim().optional(),
  businessName: z.string().trim().max(150).optional(),
});

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function hashResetToken(rawToken) {
  const env = getEnv();
  return crypto.createHmac('sha256', env.PASSWORD_RESET_SECRET).update(String(rawToken)).digest('hex');
}

function formatSessionResponse({ user, business, role, plan }) {
  return {
    user: {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
    },
    business: {
      id: Number(business.id),
      name: business.name,
      slug: business.slug,
      isDemo: Boolean(business.isDemo),
      industry: business.industry,
      timezone: business.timezone,
      phone: business.phone,
      website: business.website,
      businessHours: business.businessHours,
      aiKnowledge: business.aiKnowledge,
    },
    role,
    plan: plan
      ? {
          id: Number(plan.id),
          code: plan.code,
          name: plan.name,
          limits: plan.limits,
        }
      : { code: 'free', name: 'Free' },
  };
}

async function register(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const existing = await models.User.findOne({ where: { email } });
    if (existing) {
      throw AppError.conflict('An account with this email already exists', [
        { field: 'email', message: 'Email is already registered' },
      ]);
    }

    let freePlan = await models.Plan.findOne({ where: { code: 'free' } });
    if (!freePlan) {
      await seedPlans(models);
      freePlan = await models.Plan.findOne({ where: { code: 'free' } });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const baseSlug = slugify(req.body.businessName) || 'workspace';
    const uniqueSlug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

    const result = await models.sequelize.transaction(async (transaction) => {
      const user = await models.User.create(
        {
          name: req.body.name.trim(),
          email,
          passwordHash,
          isActive: true,
          lastLoginAt: new Date(),
        },
        { transaction }
      );

      const business = await models.Business.create(
        {
          name: req.body.businessName.trim(),
          slug: uniqueSlug,
          timezone: 'Asia/Kolkata',
          isDemo: false,
        },
        { transaction }
      );

      await models.BusinessMember.create(
        {
          businessId: business.id,
          userId: user.id,
          role: 'owner',
          status: 'active',
        },
        { transaction }
      );

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      await models.Subscription.create(
        {
          businessId: business.id,
          planId: freePlan.id,
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        { transaction }
      );

      await models.BusinessIntegration.create(
        {
          businessId: business.id,
          provider: 'whatsapp_cloud',
          status: 'not_configured',
        },
        { transaction }
      );

      return { user, business };
    });

    const token = signSessionToken({ userId: result.user.id, businessId: result.business.id });
    setSessionCookie(res, token);

    return sendSuccess(
      res,
      formatSessionResponse({
        user: result.user,
        business: result.business,
        role: 'owner',
        plan: freePlan,
      }),
      201
    );
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await models.User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw AppError.unauthenticated('Invalid email or password');
    }

    const ok = user.passwordHash ? await bcrypt.compare(req.body.password, user.passwordHash) : false;
    if (!ok) {
      throw AppError.unauthenticated('Invalid email or password');
    }

    const member = await models.BusinessMember.findOne({
      where: { userId: user.id, status: 'active' },
      include: [
        {
          model: models.Business,
          as: 'business',
          include: [
            {
              model: models.Subscription,
              as: 'subscription',
              include: [{ model: models.Plan, as: 'plan' }],
            },
          ],
        },
      ],
    });

    if (!member || !member.business) {
      throw AppError.forbidden('No active workspace found for this user');
    }

    await user.update({ lastLoginAt: new Date() });

    const token = signSessionToken({ userId: user.id, businessId: member.business.id });
    setSessionCookie(res, token);

    const plan = member.business.subscription?.plan || null;
    return sendSuccess(
      res,
      formatSessionResponse({
        user,
        business: member.business,
        role: member.role,
        plan,
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function logout(_req, res) {
  clearSessionCookie(res);
  return sendSuccess(res, { loggedOut: true });
}

async function forgotPassword(req, res, next) {
  try {
    const env = getEnv();
    const email = req.body.email.trim().toLowerCase();
    const user = await models.User.findOne({ where: { email } });

    let devResetUrl;
    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await models.PasswordResetToken.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      if (!env.isProduction && !env.emailConfigured) {
        const base = env.frontendOrigins[0] || 'http://localhost:3000';
        devResetUrl = `${base}/reset-password?token=${rawToken}`;
      }
    }

    const payload = {
      message: 'If an account with that email exists, we have sent a password reset link.',
    };
    if (devResetUrl) {
      payload.devResetUrl = devResetUrl;
    }

    return sendSuccess(res, payload);
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const tokenHash = hashResetToken(req.body.token);
    const resetRecord = await models.PasswordResetToken.findOne({
      where: { tokenHash },
      include: [{ model: models.User, as: 'user' }],
    });

    if (!resetRecord || resetRecord.usedAt || new Date(resetRecord.expiresAt) < new Date()) {
      throw AppError.validation('Password reset link is invalid or has expired.', [
        { field: 'token', message: 'Invalid or expired reset token' },
      ]);
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);

    await models.sequelize.transaction(async (transaction) => {
      await resetRecord.user.update({ passwordHash }, { transaction });
      await resetRecord.update({ usedAt: new Date() }, { transaction });
    });

    return sendSuccess(res, { message: 'Password has been reset successfully. You can now sign in.' });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return sendSuccess(
    res,
    formatSessionResponse({
      user: req.ctx.user,
      business: req.ctx.business,
      role: req.ctx.role,
      plan: req.ctx.plan,
    })
  );
}

/**
 * Helper: Find an existing user by googleId or email, or create a new user + workspace
 * if the user does not exist yet.
 */
async function findOrCreateGoogleUser({ googleId, email, name, avatarUrl, businessName }) {
  const normalizedEmail = String(email).trim().toLowerCase();

  let freePlan = await models.Plan.findOne({ where: { code: 'free' } });
  if (!freePlan) {
    await seedPlans(models);
    freePlan = await models.Plan.findOne({ where: { code: 'free' } });
  }

  let user = null;
  if (googleId) {
    user = await models.User.findOne({ where: { googleId: String(googleId) } });
  }
  if (!user) {
    user = await models.User.findOne({ where: { email: normalizedEmail } });
  }

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const displayName = (name && String(name).trim()) || normalizedEmail.split('@')[0];
    const wsName =
      (businessName && String(businessName).trim()) || `${displayName}'s Business`;
    const baseSlug = slugify(wsName) || 'workspace';
    const uniqueSlug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
    const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

    await models.sequelize.transaction(async (transaction) => {
      user = await models.User.create(
        {
          name: displayName.slice(0, 120),
          email: normalizedEmail,
          passwordHash: randomPasswordHash,
          googleId: googleId ? String(googleId) : null,
          avatarUrl: avatarUrl || null,
          isActive: true,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
        { transaction }
      );

      const business = await models.Business.create(
        {
          name: wsName.slice(0, 150),
          slug: uniqueSlug,
          timezone: 'Asia/Kolkata',
          isDemo: false,
        },
        { transaction }
      );

      await models.BusinessMember.create(
        {
          businessId: business.id,
          userId: user.id,
          role: 'owner',
          status: 'active',
        },
        { transaction }
      );

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      await models.Subscription.create(
        {
          businessId: business.id,
          planId: freePlan.id,
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        { transaction }
      );

      await models.BusinessIntegration.create(
        {
          businessId: business.id,
          provider: 'whatsapp_cloud',
          status: 'not_configured',
        },
        { transaction }
      );
    });
  } else {
    if (!user.isActive) {
      throw AppError.forbidden('This user account has been deactivated');
    }
    const updates = { lastLoginAt: new Date() };
    if (googleId && !user.googleId) updates.googleId = String(googleId);
    if (avatarUrl && !user.avatarUrl) updates.avatarUrl = avatarUrl;
    if (!user.emailVerifiedAt) updates.emailVerifiedAt = new Date();
    await user.update(updates);
  }

  // Ensure user has an active workspace membership (create one if missing)
  let member = await models.BusinessMember.findOne({
    where: { userId: user.id, status: 'active' },
    include: [
      {
        model: models.Business,
        as: 'business',
        include: [
          {
            model: models.Subscription,
            as: 'subscription',
            include: [{ model: models.Plan, as: 'plan' }],
          },
        ],
      },
    ],
  });

  if (!member || !member.business) {
    const wsName = `${user.name}'s Business`;
    const uniqueSlug = `${slugify(wsName) || 'workspace'}-${crypto.randomBytes(3).toString('hex')}`;
    const business = await models.Business.create({
      name: wsName,
      slug: uniqueSlug,
      timezone: 'Asia/Kolkata',
      isDemo: false,
    });
    member = await models.BusinessMember.create({
      businessId: business.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
    });
    const now = new Date();
    await models.Subscription.create({
      businessId: business.id,
      planId: freePlan.id,
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
    });
    member.business = business;
  }

  const plan = member.business.subscription?.plan || freePlan;
  return { user, business: member.business, role: member.role, plan, isNewUser };
}

/**
 * Verify Google token via Google's official tokeninfo/userinfo endpoints, or
 * support development/demo mode when GOOGLE_CLIENT_ID is not yet set in production.
 */
async function resolveGoogleProfile({ idToken, accessToken, email, name, googleId, picture }) {
  const env = getEnv();

  if (idToken) {
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!resp.ok) {
      throw AppError.unauthenticated('Invalid Google ID token');
    }
    const payload = await resp.json();
    if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw AppError.unauthenticated('Google token audience mismatch');
    }
    if (!payload.email) {
      throw AppError.validation('Google account did not return an email address');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      avatarUrl: payload.picture || null,
    };
  }

  if (accessToken) {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      throw AppError.unauthenticated('Invalid Google access token');
    }
    const payload = await resp.json();
    if (!payload.email) {
      throw AppError.validation('Google account did not return an email address');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      avatarUrl: payload.picture || null,
    };
  }

  // In development/test mode when Google OAuth credentials are not configured yet,
  // allow simulated Google Sign-In with email & name so developers can test the flow immediately.
  if (!env.isProduction && email) {
    return {
      googleId: googleId || `google-dev-${email.trim().toLowerCase()}`,
      email: email.trim().toLowerCase(),
      name: name || email.split('@')[0],
      avatarUrl: picture || null,
    };
  }

  throw AppError.validation('Google idToken or accessToken is required');
}

/**
 * POST /api/v1/auth/google
 * Signs in with Google, automatically creating a new User + Business workspace if not existing.
 */
async function googleLogin(req, res, next) {
  try {
    const profile = await resolveGoogleProfile(req.body);
    const { user, business, role, plan, isNewUser } = await findOrCreateGoogleUser({
      ...profile,
      businessName: req.body.businessName,
    });

    const token = signSessionToken({ userId: user.id, businessId: business.id });
    setSessionCookie(res, token);

    return sendSuccess(
      res,
      {
        ...formatSessionResponse({ user, business, role, plan }),
        isNewUser,
      },
      isNewUser ? 201 : 200
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/auth/google
 * Redirects to Google OAuth 2.0 consent screen if GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET are configured.
 */
function googleRedirect(req, res) {
  const env = getEnv();
  const frontendBase = env.frontendOrigins[0] || 'http://localhost:3000';
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${frontendBase}/login?google=dev`);
  }
  const callbackUrl =
    env.GOOGLE_CALLBACK_URL || `http://localhost:${env.PORT}/api/v1/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

/**
 * GET /api/v1/auth/google/callback
 * Exchanges OAuth code for tokens, finds or creates the user, sets session cookie, and redirects to /dashboard.
 */
async function googleCallback(req, res) {
  const env = getEnv();
  const frontendBase = env.frontendOrigins[0] || 'http://localhost:3000';
  try {
    const code = req.query.code;
    if (!code || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendBase}/login?error=google_oauth_failed`);
    }
    const callbackUrl =
      env.GOOGLE_CALLBACK_URL || `http://localhost:${env.PORT}/api/v1/auth/google/callback`;
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResp.ok) {
      return res.redirect(`${frontendBase}/login?error=google_token_exchange_failed`);
    }
    const tokens = await tokenResp.json();
    const profile = await resolveGoogleProfile({
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
    });
    const { user, business } = await findOrCreateGoogleUser(profile);
    const sessionToken = signSessionToken({ userId: user.id, businessId: business.id });
    setSessionCookie(res, sessionToken);
    return res.redirect(`${frontendBase}/dashboard`);
  } catch {
    return res.redirect(`${frontendBase}/login?error=google_login_failed`);
  }
}

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
  hashResetToken,
  register,
  login,
  googleLogin,
  googleRedirect,
  googleCallback,
  logout,
  forgotPassword,
  resetPassword,
  me,
};
