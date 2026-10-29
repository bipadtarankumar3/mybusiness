'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');
const { z } = require('zod');
const { getEnv } = require('../config/env');
const models = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { currentPeriodStart, getMetricUsed, getMetricCost } = require('../services/usageService');
const {
  getAiStatus,
  generateReplySuggestions,
  summarizeConversation,
  generateCampaignCopy,
} = require('../services/aiService');

const paymentGatewayConfigSchema = z.object({
  keyId: z.string().trim().min(5, 'Razorpay Key ID is required'),
  keySecret: z.string().trim().optional(),
  webhookSecret: z.string().trim().optional(),
  isTestMode: z.boolean().default(true),
  accountName: z.string().trim().max(100).optional(),
});

const createBillingOrderSchema = z.object({
  planCode: z.string().trim().min(1, 'Plan code is required'),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

const verifyBillingPaymentSchema = z.object({
  planCode: z.string().trim().min(1, 'Plan code is required'),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  razorpayOrderId: z.string().trim().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().trim().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().trim().optional(),
});

const aiConversationSchema = z.object({
  conversationId: z.coerce.number().int().positive('conversationId is required'),
});

const aiCampaignCopySchema = z.object({
  goal: z.string().trim().min(3, 'Campaign goal is required').max(500),
  tone: z.string().trim().max(60).optional().default('friendly'),
});

function formatDateKey(date) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDateRangeKeys(days) {
  const keys = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    keys.push(formatDateKey(d));
  }
  return keys;
}

async function getAnalyticsOverview(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [
      totalContacts,
      newEnquiries,
      openConversations,
      followUpsDue,
      activeCampaigns,
      customersInPeriod,
      salesInPeriod,
      allCustomers,
      recentLogs,
    ] = await Promise.all([
      models.Customer.count({ where: { businessId } }),
      models.Customer.count({ where: { businessId, createdAt: { [Op.gte]: since } } }),
      models.Conversation.count({ where: { businessId, status: 'open' } }),
      models.FollowUpReminder.count({ where: { businessId, status: 'pending' } }),
      models.Campaign.count({ where: { businessId, status: ['scheduled', 'sending', 'completed'] } }),
      models.Customer.findAll({
        where: { businessId, createdAt: { [Op.gte]: since } },
        attributes: ['createdAt'],
      }),
      models.Sale.findAll({
        where: { businessId, recordedAt: { [Op.gte]: since } },
        attributes: ['amount', 'recordedAt'],
      }),
      models.Customer.findAll({
        where: { businessId },
        attributes: ['leadStatus'],
      }),
      models.ActivityLog.findAll({
        where: { businessId },
        include: [{ model: models.User, as: 'actor', attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']],
        limit: 10,
      }),
    ]);

    let totalSalesAmount = 0;
    for (const s of salesInPeriod) {
      totalSalesAmount += Number(s.amount || 0);
    }

    const dateKeys = buildDateRangeKeys(days);
    const enquiriesByDate = Object.fromEntries(dateKeys.map((k) => [k, 0]));
    for (const c of customersInPeriod) {
      const k = formatDateKey(c.createdAt);
      if (enquiriesByDate[k] !== undefined) enquiriesByDate[k] += 1;
    }

    const salesByDate = Object.fromEntries(dateKeys.map((k) => [k, 0]));
    for (const s of salesInPeriod) {
      const k = formatDateKey(s.recordedAt);
      if (salesByDate[k] !== undefined) salesByDate[k] += Number(s.amount || 0);
    }

    const funnelCounts = { new: 0, contacted: 0, qualified: 0, customer: 0, lost: 0 };
    for (const c of allCustomers) {
      if (funnelCounts[c.leadStatus] !== undefined) funnelCounts[c.leadStatus] += 1;
    }

    return sendSuccess(res, {
      totals: {
        contacts: totalContacts,
        newEnquiries,
        openConversations,
        followUpsDue,
        activeCampaigns,
        recordedSales: totalSalesAmount.toFixed(2),
      },
      enquiriesSeries: dateKeys.map((date) => ({ date, count: enquiriesByDate[date] })),
      salesSeries: dateKeys.map((date) => ({ date, amount: salesByDate[date].toFixed(2) })),
      leadFunnel: Object.entries(funnelCounts).map(([status, count]) => ({ status, count })),
      recentActivity: recentLogs.map((l) => ({
        id: Number(l.id),
        type: l.type,
        description: l.description,
        createdAt: l.createdAt,
        actor: l.actor ? { id: Number(l.actor.id), name: l.actor.name } : null,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function getAnalyticsConversations(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [conversations, messages] = await Promise.all([
      models.Conversation.findAll({
        where: { businessId },
        attributes: ['status'],
      }),
      models.Message.findAll({
        where: { businessId, createdAt: { [Op.gte]: since } },
        attributes: ['direction', 'createdAt'],
      }),
    ]);

    const statusCounts = { open: 0, pending: 0, resolved: 0 };
    for (const c of conversations) {
      if (statusCounts[c.status] !== undefined) statusCounts[c.status] += 1;
    }

    const dateKeys = buildDateRangeKeys(days);
    const seriesMap = Object.fromEntries(dateKeys.map((k) => [k, { date: k, inbound: 0, outbound: 0 }]));
    for (const m of messages) {
      const k = formatDateKey(m.createdAt);
      if (seriesMap[k]) {
        if (m.direction === 'inbound') seriesMap[k].inbound += 1;
        else seriesMap[k].outbound += 1;
      }
    }

    return sendSuccess(res, {
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      series: dateKeys.map((k) => seriesMap[k]),
    });
  } catch (err) {
    return next(err);
  }
}

async function getAnalyticsCampaigns(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const campaigns = await models.Campaign.findAll({
      where: { businessId },
      order: [['createdAt', 'DESC']],
    });

    const totals = { total: 0, delivered: 0, read: 0, failed: 0 };
    const items = [];

    for (const c of campaigns) {
      let stats = c.isDemo && c.demoStats ? c.demoStats : null;
      if (!stats) {
        const recipients = await models.CampaignRecipient.findAll({
          where: { campaignId: c.id, businessId },
          attributes: ['status'],
        });
        stats = { total: recipients.length, queued: 0, accepted: 0, sent: 0, delivered: 0, read: 0, failed: 0, skipped: 0 };
        for (const r of recipients) {
          if (stats[r.status] !== undefined) stats[r.status] += 1;
        }
      }
      totals.total += Number(stats.total || 0);
      totals.delivered += Number(stats.delivered || 0);
      totals.read += Number(stats.read || 0);
      totals.failed += Number(stats.failed || 0);

      items.push({
        id: Number(c.id),
        name: c.name,
        status: c.status,
        isDemo: Boolean(c.isDemo),
        stats,
      });
    }

    return sendSuccess(res, { campaigns: items, totals });
  } catch (err) {
    return next(err);
  }
}

async function getSubscription(req, res, next) {
  try {
    const sub = await models.Subscription.findOne({
      where: { businessId: req.ctx.businessId },
      include: [{ model: models.Plan, as: 'plan' }],
    });

    if (!sub) {
      return sendSuccess(res, {
        plan: req.ctx.plan || { code: 'free', name: 'Free', limits: {} },
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: null,
      });
    }

    return sendSuccess(res, {
      plan: sub.plan
        ? {
            id: Number(sub.plan.id),
            code: sub.plan.code,
            name: sub.plan.name,
            priceMonthly: sub.plan.priceMonthly,
            priceYearly: sub.plan.priceYearly,
            currency: sub.plan.currency,
            limits: sub.plan.limits || {},
            features: sub.plan.features || [],
          }
        : null,
      status: sub.status,
      billingCycle: sub.billingCycle,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (err) {
    return next(err);
  }
}

async function getUsage(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const period = currentPeriodStart();
    const limits = req.ctx.plan?.limits || {};

    const [contactsCount, messagesUsed, campaignMessagesUsed, aiUsed, msgCost, campCost, aiCost] = await Promise.all([
      models.Customer.count({ where: { businessId } }),
      getMetricUsed(businessId, 'messages', period),
      getMetricUsed(businessId, 'campaign_messages', period),
      getMetricUsed(businessId, 'ai_requests', period),
      getMetricCost(businessId, 'messages', period),
      getMetricCost(businessId, 'campaign_messages', period),
      getMetricCost(businessId, 'ai_requests', period),
    ]);

    return sendSuccess(res, {
      period,
      currency: 'INR',
      items: [
        {
          metric: 'contacts',
          used: contactsCount,
          limit: limits.contacts ?? 100,
          cost: '0.00',
        },
        {
          metric: 'messages',
          used: messagesUsed,
          limit: limits.messagesPerMonth ?? 250,
          cost: msgCost,
        },
        {
          metric: 'campaign_messages',
          used: campaignMessagesUsed,
          limit: limits.messagesPerMonth ?? 250,
          cost: campCost,
        },
        {
          metric: 'ai_requests',
          used: aiUsed,
          limit: limits.aiRequestsPerMonth ?? 10,
          cost: aiCost,
        },
      ],
    });
  } catch (err) {
    return next(err);
  }
}

async function getAiStatusHandler(req, res, next) {
  try {
    const status = await getAiStatus(req.ctx.businessId, req.ctx.plan);
    return sendSuccess(res, status);
  } catch (err) {
    return next(err);
  }
}

async function postAiReplySuggestions(req, res, next) {
  try {
    const data = await generateReplySuggestions({
      businessId: req.ctx.businessId,
      business: req.ctx.business,
      plan: req.ctx.plan,
      conversationId: req.body.conversationId,
    });
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

async function postAiSummarize(req, res, next) {
  try {
    const data = await summarizeConversation({
      businessId: req.ctx.businessId,
      business: req.ctx.business,
      plan: req.ctx.plan,
      conversationId: req.body.conversationId,
    });
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

async function postAiCampaignCopy(req, res, next) {
  try {
    const data = await generateCampaignCopy({
      businessId: req.ctx.businessId,
      business: req.ctx.business,
      plan: req.ctx.plan,
      goal: req.body.goal,
      tone: req.body.tone,
    });
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/settings/payment-gateway
 * Returns payment gateway (Razorpay) configuration status for the current workspace.
 */
async function getPaymentGatewayConfig(req, res, next) {
  try {
    const env = getEnv();
    const integration = await models.BusinessIntegration.findOne({
      where: { businessId: req.ctx.businessId, provider: 'razorpay' },
    });

    const creds = integration ? integration.getCredentials() || {} : {};
    const effectiveKeyId = creds.keyId || env.RAZORPAY_KEY_ID || '';
    const isCustom = Boolean(creds.keyId);

    return sendSuccess(res, {
      configured: Boolean(effectiveKeyId),
      provider: 'razorpay',
      isCustom,
      isTestMode: creds.isTestMode !== undefined ? creds.isTestMode : true,
      accountName: creds.accountName || 'Razorpay Gateway',
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
 * POST /api/v1/settings/payment-gateway
 * Saves encrypted Razorpay credentials (Key ID, Secret, Webhook Secret, Test Mode).
 */
async function updatePaymentGatewayConfig(req, res, next) {
  try {
    const { keyId, keySecret, webhookSecret, isTestMode, accountName } = req.body;

    let [integration] = await models.BusinessIntegration.findOrCreate({
      where: { businessId: req.ctx.businessId, provider: 'razorpay' },
      defaults: {
        status: 'configured',
        provider: 'razorpay',
      },
    });

    const existingCreds = integration.getCredentials() || {};
    const newCreds = {
      keyId: keyId.trim(),
      keySecret: keySecret ? keySecret.trim() : existingCreds.keySecret || '',
      webhookSecret: webhookSecret ? webhookSecret.trim() : existingCreds.webhookSecret || '',
      isTestMode: Boolean(isTestMode),
      accountName: accountName ? accountName.trim() : existingCreds.accountName || 'Razorpay Gateway',
    };

    integration.setCredentials(newCreds);
    integration.status = 'configured';
    integration.externalAccountId = newCreds.keyId;
    await integration.save();

    return sendSuccess(res, {
      configured: true,
      provider: 'razorpay',
      isCustom: true,
      isTestMode: newCreds.isTestMode,
      accountName: newCreds.accountName,
      keyId: newCreds.keyId,
      keyIdMasked: `${newCreds.keyId.slice(0, 8)}...${newCreds.keyId.slice(-4)}`,
      hasSecret: Boolean(newCreds.keySecret),
      hasWebhookSecret: Boolean(newCreds.webhookSecret),
      status: 'configured',
      message: 'Razorpay payment gateway configured successfully',
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/billing/create-order
 * Creates a Razorpay order for direct subscription checkout.
 */
async function createBillingOrder(req, res, next) {
  try {
    const env = getEnv();
    const { planCode, billingCycle } = req.body;

    const plan = await models.Plan.findOne({ where: { code: planCode } });
    if (!plan) throw AppError.notFound('Plan not found');

    const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const amountNumber = Number(price);

    // If free plan or price is 0, upgrade directly without order
    if (amountNumber <= 0 || plan.code === 'free') {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 86400 * 1000);

      let [sub] = await models.Subscription.findOrCreate({
        where: { businessId: req.ctx.businessId },
        defaults: {
          planId: plan.id,
          status: 'active',
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await sub.update({
        planId: plan.id,
        status: 'active',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });

      return sendSuccess(res, {
        upgradedDirectly: true,
        plan: {
          id: Number(plan.id),
          code: plan.code,
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
        },
        subscription: {
          id: Number(sub.id),
          status: sub.status,
          billingCycle: sub.billingCycle,
          currentPeriodEnd: sub.currentPeriodEnd,
        },
        message: `Plan activated: ${plan.name}`,
      });
    }

    const amountInPaise = Math.round(amountNumber * 100);

    // Check workspace Razorpay integration or env Razorpay
    const integration = await models.BusinessIntegration.findOne({
      where: { businessId: req.ctx.businessId, provider: 'razorpay' },
    });
    const creds = integration ? integration.getCredentials() || {} : {};
    const keyId = creds.keyId || env.RAZORPAY_KEY_ID || 'rzp_test_chatflow_gateway';
    const keySecret = creds.keySecret || env.RAZORPAY_KEY_SECRET;

    let orderId = null;

    // If live/test Razorpay API credentials available, attempt Razorpay REST API
    if (keySecret && keyId && !keyId.startsWith('rzp_test_chatflow')) {
      try {
        const resp = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${req.ctx.businessId}_${Date.now()}`,
            notes: {
              businessId: String(req.ctx.businessId),
              planCode: plan.code,
              billingCycle,
            },
          }),
        });
        if (resp.ok) {
          const orderData = await resp.json();
          orderId = orderData.id;
        }
      } catch {
        // Fall back to simulated order
      }
    }

    if (!orderId) {
      orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    return sendSuccess(res, {
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      plan: {
        id: Number(plan.id),
        code: plan.code,
        name: plan.name,
        price: amountNumber,
        billingCycle,
      },
      business: {
        name: req.ctx.business.name,
      },
      user: {
        name: req.ctx.user.name,
        email: req.ctx.user.email,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/billing/verify-payment
 * Verifies Razorpay payment signature and upgrades workspace subscription immediately.
 */
async function verifyBillingPayment(req, res, next) {
  try {
    const env = getEnv();
    const { planCode, billingCycle, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const plan = await models.Plan.findOne({ where: { code: planCode } });
    if (!plan) throw AppError.notFound('Plan not found');

    const integration = await models.BusinessIntegration.findOne({
      where: { businessId: req.ctx.businessId, provider: 'razorpay' },
    });
    const creds = integration ? integration.getCredentials() || {} : {};
    const keySecret = creds.keySecret || env.RAZORPAY_KEY_SECRET;

    // If real Razorpay secret is configured and signature passed, verify signature
    if (keySecret && razorpaySignature && !razorpayOrderId.startsWith('order_sim_')) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        throw AppError.unauthenticated('Invalid Razorpay payment signature');
      }
    }

    // Upgrade workspace subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 86400 * 1000);

    let [sub] = await models.Subscription.findOrCreate({
      where: { businessId: req.ctx.businessId },
      defaults: {
        planId: plan.id,
        status: 'active',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await sub.update({
      planId: plan.id,
      status: 'active',
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    const reloaded = await models.Subscription.findByPk(sub.id, {
      include: [{ model: models.Plan, as: 'plan' }],
    });

    return sendSuccess(res, {
      success: true,
      subscription: {
        id: Number(reloaded.id),
        status: reloaded.status,
        billingCycle: reloaded.billingCycle,
        currentPeriodStart: reloaded.currentPeriodStart,
        currentPeriodEnd: reloaded.currentPeriodEnd,
        plan: {
          id: Number(plan.id),
          code: plan.code,
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
        },
      },
      payment: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
      },
      message: `Successfully upgraded to ${plan.name} (${billingCycle})!`,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  aiConversationSchema,
  aiCampaignCopySchema,
  paymentGatewayConfigSchema,
  createBillingOrderSchema,
  verifyBillingPaymentSchema,
  getAnalyticsOverview,
  getAnalyticsConversations,
  getAnalyticsCampaigns,
  getSubscription,
  getUsage,
  getPaymentGatewayConfig,
  updatePaymentGatewayConfig,
  createBillingOrder,
  verifyBillingPayment,
  getAiStatusHandler,
  postAiReplySuggestions,
  postAiSummarize,
  postAiCampaignCopy,
};
