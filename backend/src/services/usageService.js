'use strict';

const models = require('../models');
const AppError = require('../utils/AppError');

function currentPeriodStart(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

async function recordUsage({ businessId, metric, quantity = 1, unitCost = 0, referenceType = null, referenceId = null, transaction }) {
  return models.UsageRecord.create(
    {
      businessId,
      metric,
      quantity,
      unitCost: Number(unitCost || 0).toFixed(4),
      periodStart: currentPeriodStart(),
      referenceType,
      referenceId,
    },
    transaction ? { transaction } : undefined
  );
}

async function getMetricUsed(businessId, metric, periodStart = currentPeriodStart()) {
  const sum = await models.UsageRecord.sum('quantity', {
    where: { businessId, metric, periodStart },
  });
  return Number(sum || 0);
}

async function getMetricCost(businessId, metric, periodStart = currentPeriodStart()) {
  const rows = await models.UsageRecord.findAll({
    where: { businessId, metric, periodStart },
  });
  let total = 0;
  for (const r of rows) {
    total += Number(r.quantity || 0) * Number(r.unitCost || 0);
  }
  return total.toFixed(2);
}

async function checkPlanLimit({ businessId, plan, metric, additional = 1 }) {
  if (!plan || !plan.limits) return;
  const limits = plan.limits;

  if (metric === 'contacts') {
    const limit = limits.contacts;
    if (typeof limit === 'number' && limit >= 0) {
      const current = await models.Customer.count({ where: { businessId } });
      if (current + additional > limit) {
        throw AppError.planLimit(`Your ${plan.name} plan allows up to ${limit} contacts. Please upgrade to add more.`);
      }
    }
    return;
  }

  if (metric === 'workflows') {
    const limit = limits.workflows;
    if (typeof limit === 'number' && limit >= 0) {
      const current = await models.Workflow.count({ where: { businessId } });
      if (current + additional > limit) {
        throw AppError.planLimit(`Your ${plan.name} plan allows up to ${limit} workflows. Please upgrade to create more.`);
      }
    }
    return;
  }

  if (metric === 'ai_requests') {
    const limit = limits.aiRequestsPerMonth;
    if (typeof limit === 'number' && limit >= 0) {
      const used = await getMetricUsed(businessId, 'ai_requests');
      if (used + additional > limit) {
        throw AppError.planLimit(`Monthly AI request limit (${limit}) reached for your ${plan.name} plan.`);
      }
    }
    return;
  }

  if (metric === 'messages') {
    const limit = limits.messagesPerMonth;
    if (typeof limit === 'number' && limit >= 0) {
      const used = (await getMetricUsed(businessId, 'messages')) + (await getMetricUsed(businessId, 'campaign_messages'));
      if (used + additional > limit) {
        throw AppError.planLimit(`Monthly message limit (${limit}) reached for your ${plan.name} plan.`);
      }
    }
  }
}

module.exports = {
  currentPeriodStart,
  recordUsage,
  getMetricUsed,
  getMetricCost,
  checkPlanLimit,
};
