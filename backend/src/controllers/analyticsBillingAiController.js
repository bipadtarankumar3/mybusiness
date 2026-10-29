'use strict';

const { Op } = require('sequelize');
const { z } = require('zod');
const models = require('../models');
const { sendSuccess } = require('../utils/response');
const { currentPeriodStart, getMetricUsed, getMetricCost } = require('../services/usageService');
const {
  getAiStatus,
  generateReplySuggestions,
  summarizeConversation,
  generateCampaignCopy,
} = require('../services/aiService');

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

module.exports = {
  aiConversationSchema,
  aiCampaignCopySchema,
  getAnalyticsOverview,
  getAnalyticsConversations,
  getAnalyticsCampaigns,
  getSubscription,
  getUsage,
  getAiStatusHandler,
  postAiReplySuggestions,
  postAiSummarize,
  postAiCampaignCopy,
};
