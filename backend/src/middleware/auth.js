'use strict';

const jwt = require('jsonwebtoken');
const { getEnv } = require('../config/env');
const models = require('../models');
const AppError = require('../utils/AppError');

const COOKIE_NAME = 'cf_session';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function signSessionToken({ userId, businessId, impersonatedByUserId }) {
  const env = getEnv();
  const payload = { sub: Number(userId), bid: Number(businessId) };
  if (impersonatedByUserId) {
    payload.imp = Number(impersonatedByUserId);
  }
  return jwt.sign(payload, env.AUTH_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

function verifySessionToken(token) {
  const env = getEnv();
  return jwt.verify(token, env.AUTH_SECRET, { algorithms: ['HS256'] });
}

function setSessionCookie(res, token) {
  const env = getEnv();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });
}

function clearSessionCookie(res) {
  const env = getEnv();
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
  });
}

async function requireAuth(req, _res, next) {
  try {
    let token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }
    if (!token) {
      throw AppError.unauthenticated('Authentication required');
    }

    let payload;
    try {
      payload = verifySessionToken(token);
    } catch (_err) {
      throw AppError.unauthenticated('Invalid or expired session');
    }

    const user = await models.User.findByPk(payload.sub);
    if (!user || !user.isActive) {
      throw AppError.unauthenticated('Account is inactive or no longer exists');
    }

    const memberWhere = { userId: user.id, status: 'active' };
    if (payload.bid) {
      memberWhere.businessId = payload.bid;
    }

    let member = await models.BusinessMember.findOne({
      where: memberWhere,
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

    if (!member) {
      member = await models.BusinessMember.findOne({
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
    }

    // Super Admin can visit any workspace even if not a direct BusinessMember row
    let virtualSuperAdminMember = null;
    if ((!member || (payload.bid && Number(member.businessId) !== Number(payload.bid))) && user.isSuperAdmin && payload.bid) {
      const targetBiz = await models.Business.findByPk(payload.bid, {
        include: [
          {
            model: models.Subscription,
            as: 'subscription',
            include: [{ model: models.Plan, as: 'plan' }],
          },
        ],
      });
      if (targetBiz) {
        virtualSuperAdminMember = {
          id: 0,
          userId: user.id,
          businessId: targetBiz.id,
          role: 'owner',
          status: 'active',
          business: targetBiz,
        };
        member = virtualSuperAdminMember;
      }
    }

    if (!member || !member.business) {
      throw AppError.forbidden('No active business membership found');
    }

    const plan = member.business.subscription?.plan || null;

    // Check if this session is impersonated by a Super Admin
    let impersonatedBy = null;
    if (payload.imp) {
      const adminUser = await models.User.findByPk(payload.imp);
      if (adminUser && adminUser.isSuperAdmin && adminUser.isActive) {
        impersonatedBy = {
          id: Number(adminUser.id),
          name: adminUser.name,
          email: adminUser.email,
        };
      }
    }

    req.ctx = {
      userId: user.id,
      user,
      isSuperAdmin: Boolean(user.isSuperAdmin || impersonatedBy),
      impersonatedBy,
      businessId: member.business.id,
      business: member.business,
      member,
      role: member.role,
      plan,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (req.ctx?.isSuperAdmin) return next();
    if (!req.ctx || !allowedRoles.includes(req.ctx.role)) {
      return next(AppError.forbidden('Insufficient role permissions for this action'));
    }
    return next();
  };
}

function requireSuperAdmin(req, _res, next) {
  if (!req.ctx || (!req.ctx.user?.isSuperAdmin && !req.ctx.impersonatedBy)) {
    return next(AppError.forbidden('Super Admin privileges required'));
  }
  return next();
}

module.exports = {
  COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  requireRole,
  requireSuperAdmin,
};
