'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { z } = require('zod');
const models = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { signSessionToken, setSessionCookie } = require('../middleware/auth');

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

const createAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(191),
  password: z.string().min(8).max(128).optional(),
  businessName: z.string().trim().min(2).max(150).optional(),
  industry: z.string().trim().max(100).optional(),
  planCode: z.string().trim().optional(),
  role: z.enum(['owner', 'admin', 'agent']).optional(),
  isSuperAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const updateAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(191).optional(),
  password: z.string().min(8).max(128).optional(),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
  role: z.enum(['owner', 'admin', 'agent']).optional(),
  businessName: z.string().trim().min(2).max(150).optional(),
  industry: z.string().trim().max(100).optional(),
  planCode: z.string().trim().optional(),
  subscriptionStatus: z.enum(['active', 'trialing', 'past_due', 'cancelled']).optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
});

const createPlanSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, 'Plan code must be lowercase letters, numbers, hyphens or underscores'),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(255).optional().nullable(),
  priceMonthly: z.number().nonnegative().nullable().optional(),
  priceYearly: z.number().nonnegative().nullable().optional(),
  currency: z.string().trim().length(3).default('INR'),
  limits: z
    .object({
      contacts: z.number().int().optional(),
      teamMembers: z.number().int().optional(),
      messagesPerMonth: z.number().int().optional(),
      aiRequestsPerMonth: z.number().int().optional(),
      workflows: z.number().int().optional(),
    })
    .passthrough()
    .default({}),
  features: z.array(z.string().trim()).default([]),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const updatePlanSchema = createPlanSchema.partial();

const updateSubscriptionSchema = z.object({
  planId: z.number().int().positive().optional(),
  planCode: z.string().trim().optional(),
  status: z.enum(['active', 'trialing', 'past_due', 'cancelled']).optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
});

const adminPaymentGatewaySchema = z.object({
  keyId: z.string().trim().min(5, 'Razorpay Key ID is required'),
  keySecret: z.string().trim().optional(),
  webhookSecret: z.string().trim().optional(),
  isTestMode: z.boolean().default(true),
  accountName: z.string().trim().max(100).optional(),
});

/**
 * GET /api/v1/admin/overview
 * Global platform metrics across all tenants, users, subscriptions, and plans.
 */
async function getAdminOverview(_req, res, next) {
  try {
    const [
      totalUsers,
      activeUsers,
      superAdmins,
      totalBusinesses,
      totalContacts,
      totalConversations,
      totalCampaigns,
      totalWorkflows,
      plans,
      subscriptions,
    ] = await Promise.all([
      models.User.count(),
      models.User.count({ where: { isActive: true } }),
      models.User.count({ where: { isSuperAdmin: true } }),
      models.Business.count(),
      models.Customer.count(),
      models.Conversation.count(),
      models.Campaign.count(),
      models.Workflow.count(),
      models.Plan.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
      models.Subscription.findAll({
        include: [{ model: models.Plan, as: 'plan' }],
      }),
    ]);

    const subsByPlan = {};
    let mrrInr = 0;
    for (const s of subscriptions) {
      const code = s.plan?.code || 'free';
      subsByPlan[code] = (subsByPlan[code] || 0) + 1;
      if (s.status === 'active' && s.plan?.priceMonthly) {
        const monthlyPrice = Number(s.plan.priceMonthly) || 0;
        mrrInr += s.billingCycle === 'yearly' ? (Number(s.plan.priceYearly || monthlyPrice * 10) / 12) : monthlyPrice;
      }
    }

    return sendSuccess(res, {
      counts: {
        totalUsers,
        activeUsers,
        inactiveUsers: Math.max(0, totalUsers - activeUsers),
        superAdmins,
        totalBusinesses,
        totalContacts,
        totalConversations,
        totalCampaigns,
        totalWorkflows,
        activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
        estimatedMrrInr: mrrInr.toFixed(2),
      },
      planDistribution: plans.map((p) => ({
        id: Number(p.id),
        code: p.code,
        name: p.name,
        priceMonthly: p.priceMonthly,
        subscriberCount: subsByPlan[p.code] || 0,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/users
 * Lists all users with their business memberships, active plan, per-workspace counts, and filters.
 */
async function listAdminUsers(req, res, next) {
  try {
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim(); // active | inactive
    const roleFilter = (req.query.role || '').trim(); // superadmin | owner | admin | agent
    const planFilter = (req.query.plan || '').trim(); // free | starter | growth | pro | business

    const where = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (roleFilter === 'superadmin') where.isSuperAdmin = true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await models.User.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: models.BusinessMember,
          as: 'memberships',
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
        },
      ],
    });

    // Aggregate per-business counts for contacts, conversations, campaigns, workflows
    const allBusinesses = await models.Business.findAll({ attributes: ['id'] });
    const bizIds = allBusinesses.map((b) => Number(b.id));
    const bizStats = {};
    for (const id of bizIds) {
      bizStats[id] = { contacts: 0, conversations: 0, campaigns: 0, workflows: 0 };
    }

    const [customers, conversations, campaigns, workflows] = await Promise.all([
      models.Customer.findAll({ attributes: ['businessId'] }),
      models.Conversation.findAll({ attributes: ['businessId'] }),
      models.Campaign.findAll({ attributes: ['businessId'] }),
      models.Workflow.findAll({ attributes: ['businessId'] }),
    ]);

    for (const c of customers) if (bizStats[c.businessId]) bizStats[c.businessId].contacts += 1;
    for (const c of conversations) if (bizStats[c.businessId]) bizStats[c.businessId].conversations += 1;
    for (const c of campaigns) if (bizStats[c.businessId]) bizStats[c.businessId].campaigns += 1;
    for (const w of workflows) if (bizStats[w.businessId]) bizStats[w.businessId].workflows += 1;

    let formatted = users.map((u) => {
      const primaryMembership = u.memberships?.[0] || null;
      const biz = primaryMembership?.business || null;
      const sub = biz?.subscription || null;
      const plan = sub?.plan || null;
      const stats = biz ? bizStats[Number(biz.id)] || { contacts: 0, conversations: 0, campaigns: 0, workflows: 0 } : { contacts: 0, conversations: 0, campaigns: 0, workflows: 0 };

      return {
        id: Number(u.id),
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl || null,
        isSuperAdmin: Boolean(u.isSuperAdmin),
        isActive: Boolean(u.isActive),
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        role: primaryMembership?.role || 'owner',
        business: biz
          ? {
              id: Number(biz.id),
              name: biz.name,
              slug: biz.slug,
              industry: biz.industry || 'General SMB',
              isDemo: Boolean(biz.isDemo),
              phone: biz.phone,
              timezone: biz.timezone,
            }
          : null,
        subscription: sub
          ? {
              id: Number(sub.id),
              status: sub.status,
              billingCycle: sub.billingCycle,
              currentPeriodEnd: sub.currentPeriodEnd,
              plan: plan
                ? {
                    id: Number(plan.id),
                    code: plan.code,
                    name: plan.name,
                    priceMonthly: plan.priceMonthly,
                  }
                : { code: 'free', name: 'Free', priceMonthly: '0.00' },
            }
          : null,
        counts: stats,
      };
    });

    if (roleFilter && roleFilter !== 'superadmin') {
      formatted = formatted.filter((u) => u.role === roleFilter);
    }
    if (planFilter) {
      formatted = formatted.filter((u) => (u.subscription?.plan?.code || 'free') === planFilter);
    }

    // Summary filter counts across all users
    const allUsersRaw = await models.User.findAll();
    const filterCounts = {
      all: allUsersRaw.length,
      active: allUsersRaw.filter((u) => u.isActive).length,
      inactive: allUsersRaw.filter((u) => !u.isActive).length,
      superAdmins: allUsersRaw.filter((u) => u.isSuperAdmin).length,
    };

    return sendSuccess(res, formatted, 200, { counts: filterCounts, total: formatted.length });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/admin/users
 * Super Admin creates a new user + business workspace + subscription.
 */
async function createAdminUser(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const existing = await models.User.findOne({ where: { email } });
    if (existing) {
      throw AppError.conflict('A user with this email already exists', [
        { field: 'email', message: 'Email already registered' },
      ]);
    }

    const planCode = req.body.planCode || 'free';
    const plan =
      (await models.Plan.findOne({ where: { code: planCode } })) ||
      (await models.Plan.findOne({ where: { code: 'free' } }));

    const rawPassword = req.body.password || 'Welcome@123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const businessName = (req.body.businessName || `${req.body.name}'s Business`).trim();
    const uniqueSlug = `${slugify(businessName) || 'workspace'}-${crypto.randomBytes(3).toString('hex')}`;

    const created = await models.sequelize.transaction(async (transaction) => {
      const user = await models.User.create(
        {
          name: req.body.name.trim(),
          email,
          passwordHash,
          isSuperAdmin: Boolean(req.body.isSuperAdmin),
          isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
          emailVerifiedAt: new Date(),
        },
        { transaction }
      );

      const business = await models.Business.create(
        {
          name: businessName,
          slug: uniqueSlug,
          industry: req.body.industry || 'Retail & SMB',
          timezone: 'Asia/Kolkata',
          isDemo: false,
        },
        { transaction }
      );

      await models.BusinessMember.create(
        {
          businessId: business.id,
          userId: user.id,
          role: req.body.role || 'owner',
          status: 'active',
        },
        { transaction }
      );

      const now = new Date();
      await models.Subscription.create(
        {
          businessId: business.id,
          planId: plan.id,
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
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

    return sendSuccess(
      res,
      {
        id: Number(created.user.id),
        name: created.user.name,
        email: created.user.email,
        isSuperAdmin: Boolean(created.user.isSuperAdmin),
        isActive: Boolean(created.user.isActive),
        business: {
          id: Number(created.business.id),
          name: created.business.name,
        },
      },
      201
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/admin/users/:id
 * Update user profile, status, super-admin flag, role, business settings, or assigned subscription plan.
 */
async function updateAdminUser(req, res, next) {
  try {
    const user = await models.User.findByPk(req.params.id, {
      include: [
        {
          model: models.BusinessMember,
          as: 'memberships',
          include: [
            {
              model: models.Business,
              as: 'business',
              include: [{ model: models.Subscription, as: 'subscription' }],
            },
          ],
        },
      ],
    });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.email !== undefined) updates.email = req.body.email.trim().toLowerCase();
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    if (req.body.isSuperAdmin !== undefined) updates.isSuperAdmin = Boolean(req.body.isSuperAdmin);
    if (req.body.password) {
      updates.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    await user.update(updates);

    const primaryMembership = user.memberships?.[0];
    if (primaryMembership) {
      if (req.body.role) {
        await primaryMembership.update({ role: req.body.role });
      }
      if (primaryMembership.business) {
        const bizUpdates = {};
        if (req.body.businessName) bizUpdates.name = req.body.businessName.trim();
        if (req.body.industry !== undefined) bizUpdates.industry = req.body.industry;
        if (Object.keys(bizUpdates).length) {
          await primaryMembership.business.update(bizUpdates);
        }

        if (req.body.planCode || req.body.subscriptionStatus || req.body.billingCycle) {
          let sub = primaryMembership.business.subscription;
          let targetPlan = null;
          if (req.body.planCode) {
            targetPlan = await models.Plan.findOne({ where: { code: req.body.planCode } });
          }
          if (sub) {
            const subUpdates = {};
            if (targetPlan) subUpdates.planId = targetPlan.id;
            if (req.body.subscriptionStatus) subUpdates.status = req.body.subscriptionStatus;
            if (req.body.billingCycle) subUpdates.billingCycle = req.body.billingCycle;
            await sub.update(subUpdates);
          } else if (targetPlan) {
            const now = new Date();
            await models.Subscription.create({
              businessId: primaryMembership.business.id,
              planId: targetPlan.id,
              status: req.body.subscriptionStatus || 'active',
              billingCycle: req.body.billingCycle || 'monthly',
              currentPeriodStart: now,
              currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
            });
          }
        }
      }
    }

    return sendSuccess(res, {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      isActive: Boolean(user.isActive),
      isSuperAdmin: Boolean(user.isSuperAdmin),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/admin/impersonate
 * Allows a Super Admin to visit any user's or business's dashboard immediately.
 * Body: { userId?: number, businessId?: number }
 */
async function impersonateWorkspace(req, res, next) {
  try {
    const adminUserId = req.ctx.impersonatedBy ? req.ctx.impersonatedBy.id : req.ctx.user.id;
    let targetUser = null;
    let targetBusiness = null;
    let targetRole = 'owner';

    if (req.body.userId) {
      targetUser = await models.User.findByPk(req.body.userId);
      if (!targetUser) throw AppError.notFound('Target user not found');

      const member = await models.BusinessMember.findOne({
        where: { userId: targetUser.id, status: 'active' },
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
        throw AppError.notFound('Target user has no active business workspace');
      }
      targetBusiness = member.business;
      targetRole = member.role;
    } else if (req.body.businessId) {
      targetBusiness = await models.Business.findByPk(req.body.businessId, {
        include: [
          {
            model: models.Subscription,
            as: 'subscription',
            include: [{ model: models.Plan, as: 'plan' }],
          },
        ],
      });
      if (!targetBusiness) throw AppError.notFound('Target business workspace not found');

      const ownerMember = await models.BusinessMember.findOne({
        where: { businessId: targetBusiness.id, status: 'active' },
        include: [{ model: models.User, as: 'user' }],
        order: [['id', 'ASC']],
      });
      targetUser = ownerMember?.user || req.ctx.user;
      targetRole = ownerMember?.role || 'owner';
    } else {
      throw AppError.validation('Either userId or businessId is required to visit a dashboard');
    }

    const token = signSessionToken({
      userId: targetUser.id,
      businessId: targetBusiness.id,
      impersonatedByUserId: adminUserId,
    });
    setSessionCookie(res, token);

    const plan = targetBusiness.subscription?.plan || { code: 'free', name: 'Free' };
    return sendSuccess(res, {
      message: `Now viewing ${targetBusiness.name} dashboard as ${targetUser.name}`,
      user: {
        id: Number(targetUser.id),
        name: targetUser.name,
        email: targetUser.email,
        isSuperAdmin: true,
      },
      impersonatedBy: {
        id: Number(adminUserId),
        name: req.ctx.impersonatedBy?.name || req.ctx.user.name,
        email: req.ctx.impersonatedBy?.email || req.ctx.user.email,
      },
      business: {
        id: Number(targetBusiness.id),
        name: targetBusiness.name,
        slug: targetBusiness.slug,
        isDemo: Boolean(targetBusiness.isDemo),
        industry: targetBusiness.industry,
        timezone: targetBusiness.timezone,
      },
      role: targetRole,
      plan: {
        code: plan.code,
        name: plan.name,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/admin/stop-impersonation
 * Restores the Super Admin's own primary workspace session.
 */
async function stopImpersonation(req, res, next) {
  try {
    const adminUserId = req.ctx.impersonatedBy ? req.ctx.impersonatedBy.id : req.ctx.user.id;
    const adminUser = await models.User.findByPk(adminUserId);
    if (!adminUser) throw AppError.unauthenticated('Admin account not found');

    const member = await models.BusinessMember.findOne({
      where: { userId: adminUser.id, status: 'active' },
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

    const businessId = member?.business?.id || req.ctx.businessId;
    const token = signSessionToken({ userId: adminUser.id, businessId });
    setSessionCookie(res, token);

    return sendSuccess(res, {
      restored: true,
      impersonatedBy: null,
      user: {
        id: Number(adminUser.id),
        name: adminUser.name,
        email: adminUser.email,
        isSuperAdmin: true,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/plans
 * Lists all plans (both public and private) with subscriber counts.
 */
async function listAdminPlans(_req, res, next) {
  try {
    const [plans, subscriptions] = await Promise.all([
      models.Plan.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
      models.Subscription.findAll(),
    ]);

    const subCountByPlanId = {};
    for (const s of subscriptions) {
      subCountByPlanId[s.planId] = (subCountByPlanId[s.planId] || 0) + 1;
    }

    return sendSuccess(
      res,
      plans.map((p) => ({
        id: Number(p.id),
        code: p.code,
        name: p.name,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        currency: p.currency,
        limits: p.limits || {},
        features: Array.isArray(p.features) ? p.features : [],
        isPublic: Boolean(p.isPublic),
        sortOrder: p.sortOrder,
        subscriberCount: subCountByPlanId[p.id] || 0,
      }))
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/admin/plans
 * Creates a new subscription plan tier.
 */
async function createAdminPlan(req, res, next) {
  try {
    const code = req.body.code.trim().toLowerCase();
    const existing = await models.Plan.findOne({ where: { code } });
    if (existing) {
      throw AppError.conflict(`A plan with code "${code}" already exists`, [
        { field: 'code', message: 'Plan code must be unique' },
      ]);
    }

    const plan = await models.Plan.create({
      code,
      name: req.body.name.trim(),
      description: req.body.description || null,
      priceMonthly: req.body.priceMonthly !== undefined && req.body.priceMonthly !== null ? req.body.priceMonthly : null,
      priceYearly: req.body.priceYearly !== undefined && req.body.priceYearly !== null ? req.body.priceYearly : null,
      currency: req.body.currency || 'INR',
      limits: req.body.limits || {},
      features: req.body.features || [],
      isPublic: req.body.isPublic !== undefined ? Boolean(req.body.isPublic) : true,
      sortOrder: req.body.sortOrder ?? 10,
    });

    return sendSuccess(res, plan, 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/admin/plans/:id
 * Updates an existing subscription plan's pricing, limits, features, or visibility.
 */
async function updateAdminPlan(req, res, next) {
  try {
    const plan = await models.Plan.findByPk(req.params.id);
    if (!plan) throw AppError.notFound('Plan not found');

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.priceMonthly !== undefined) updates.priceMonthly = req.body.priceMonthly;
    if (req.body.priceYearly !== undefined) updates.priceYearly = req.body.priceYearly;
    if (req.body.limits !== undefined) updates.limits = req.body.limits;
    if (req.body.features !== undefined) updates.features = req.body.features;
    if (req.body.isPublic !== undefined) updates.isPublic = Boolean(req.body.isPublic);
    if (req.body.sortOrder !== undefined) updates.sortOrder = Number(req.body.sortOrder);

    await plan.update(updates);
    return sendSuccess(res, plan);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/admin/plans/:id
 * Deletes a custom plan if no active subscriptions depend on it.
 */
async function deleteAdminPlan(req, res, next) {
  try {
    const plan = await models.Plan.findByPk(req.params.id);
    if (!plan) throw AppError.notFound('Plan not found');

    const subCount = await models.Subscription.count({ where: { planId: plan.id } });
    if (subCount > 0) {
      throw AppError.conflict(
        `Cannot delete "${plan.name}" while ${subCount} workspace subscription(s) are assigned to it.`
      );
    }

    await plan.destroy();
    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/subscriptions
 * Lists all business subscriptions with plan details, owner details, and usage stats.
 */
async function listAdminSubscriptions(req, res, next) {
  try {
    const statusFilter = (req.query.status || '').trim();
    const planFilter = (req.query.plan || '').trim();

    const where = {};
    if (statusFilter) where.status = statusFilter;

    const subscriptions = await models.Subscription.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      include: [
        { model: models.Plan, as: 'plan' },
        {
          model: models.Business,
          as: 'business',
          include: [
            {
              model: models.BusinessMember,
              as: 'members',
              include: [{ model: models.User, as: 'user' }],
            },
          ],
        },
      ],
    });

    let items = subscriptions.map((s) => {
      const ownerMember =
        s.business?.members?.find((m) => m.role === 'owner') || s.business?.members?.[0] || null;
      return {
        id: Number(s.id),
        businessId: Number(s.businessId),
        businessName: s.business?.name || `Workspace #${s.businessId}`,
        industry: s.business?.industry || 'SMB',
        isDemo: Boolean(s.business?.isDemo),
        ownerName: ownerMember?.user?.name || '—',
        ownerEmail: ownerMember?.user?.email || '—',
        ownerUserId: ownerMember?.user ? Number(ownerMember.user.id) : null,
        status: s.status,
        billingCycle: s.billingCycle,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        plan: s.plan
          ? {
              id: Number(s.plan.id),
              code: s.plan.code,
              name: s.plan.name,
              priceMonthly: s.plan.priceMonthly,
              priceYearly: s.plan.priceYearly,
            }
          : null,
      };
    });

    if (planFilter) {
      items = items.filter((i) => i.plan?.code === planFilter);
    }

    return sendSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/admin/subscriptions/:id
 * Changes a business subscription's plan, billingCycle, or status.
 */
async function updateAdminSubscription(req, res, next) {
  try {
    const sub = await models.Subscription.findByPk(req.params.id);
    if (!sub) throw AppError.notFound('Subscription not found');

    const updates = {};
    if (req.body.planId) {
      const p = await models.Plan.findByPk(req.body.planId);
      if (!p) throw AppError.notFound('Target plan not found');
      updates.planId = p.id;
    } else if (req.body.planCode) {
      const p = await models.Plan.findOne({ where: { code: req.body.planCode } });
      if (!p) throw AppError.notFound('Target plan not found');
      updates.planId = p.id;
    }
    if (req.body.status) updates.status = req.body.status;
    if (req.body.billingCycle) updates.billingCycle = req.body.billingCycle;

    await sub.update(updates);
    const reloaded = await models.Subscription.findByPk(sub.id, {
      include: [{ model: models.Plan, as: 'plan' }],
    });
    return sendSuccess(res, reloaded);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/settings/payment-gateway
 * Retrieves platform-wide Razorpay payment gateway credentials for Super Admin.
 */
async function getAdminPaymentGateway(req, res, next) {
  try {
    const { getEnv } = require('../config/env');
    const env = getEnv();

    let integration = await models.BusinessIntegration.findOne({
      where: { provider: 'platform_razorpay' },
    });
    if (!integration) {
      integration = await models.BusinessIntegration.findOne({
        where: { provider: 'razorpay' },
      });
    }

    const creds = integration ? integration.getCredentials() || {} : {};
    const effectiveKeyId = creds.keyId || env.RAZORPAY_KEY_ID || '';

    return sendSuccess(res, {
      configured: Boolean(effectiveKeyId),
      provider: 'razorpay',
      isTestMode: creds.isTestMode !== undefined ? creds.isTestMode : true,
      accountName: creds.accountName || 'ChatFlow Platform Razorpay Gateway',
      keyId: effectiveKeyId,
      keyIdMasked: effectiveKeyId
        ? `${effectiveKeyId.slice(0, 8)}...${effectiveKeyId.slice(-4)}`
        : null,
      hasSecret: Boolean(creds.keySecret || env.RAZORPAY_KEY_SECRET),
      hasWebhookSecret: Boolean(creds.webhookSecret || env.RAZORPAY_WEBHOOK_SECRET),
      status: integration?.status || (effectiveKeyId ? 'configured' : 'not_configured'),
      updatedAt: integration?.updatedAt || null,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/admin/settings/payment-gateway
 * Saves platform-wide Razorpay credentials for Super Admin.
 */
async function updateAdminPaymentGateway(req, res, next) {
  try {
    const { keyId, keySecret, webhookSecret, isTestMode, accountName } = req.body;

    const firstBiz = await models.Business.findOne({ order: [['id', 'ASC']] });
    const targetBusinessId = req.ctx.businessId || (firstBiz ? firstBiz.id : 1);

    let [integration] = await models.BusinessIntegration.findOrCreate({
      where: { provider: 'platform_razorpay' },
      defaults: {
        businessId: targetBusinessId,
        provider: 'platform_razorpay',
        status: 'configured',
      },
    });

    const existingCreds = integration.getCredentials() || {};
    const newCreds = {
      keyId: keyId.trim(),
      keySecret: keySecret ? keySecret.trim() : existingCreds.keySecret || '',
      webhookSecret: webhookSecret ? webhookSecret.trim() : existingCreds.webhookSecret || '',
      isTestMode: Boolean(isTestMode),
      accountName:
        accountName ? accountName.trim() : existingCreds.accountName || 'ChatFlow Platform Razorpay Gateway',
    };

    integration.setCredentials(newCreds);
    integration.status = 'configured';
    integration.externalAccountId = newCreds.keyId;
    await integration.save();

    return sendSuccess(res, {
      configured: true,
      provider: 'razorpay',
      isTestMode: newCreds.isTestMode,
      accountName: newCreds.accountName,
      keyId: newCreds.keyId,
      keyIdMasked: `${newCreds.keyId.slice(0, 8)}...${newCreds.keyId.slice(-4)}`,
      hasSecret: Boolean(newCreds.keySecret),
      hasWebhookSecret: Boolean(newCreds.webhookSecret),
      status: 'configured',
      message: 'Platform Razorpay payment gateway credentials updated successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createAdminUserSchema,
  updateAdminUserSchema,
  createPlanSchema,
  updatePlanSchema,
  updateSubscriptionSchema,
  adminPaymentGatewaySchema,
  getAdminOverview,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  impersonateWorkspace,
  stopImpersonation,
  listAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  listAdminSubscriptions,
  updateAdminSubscription,
  getAdminPaymentGateway,
  updateAdminPaymentGateway,
};
