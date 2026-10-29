'use strict';

const { getEnv } = require('../config/env');
const models = require('../models');
const AppError = require('../utils/AppError');
const { getMetricUsed, checkPlanLimit, recordUsage } = require('./usageService');

async function getAiStatus(businessId, plan) {
  const env = getEnv();
  const used = await getMetricUsed(businessId, 'ai_requests');
  const limit = plan?.limits?.aiRequestsPerMonth ?? 10;
  return {
    configured: Boolean(env.aiConfigured),
    provider: env.aiConfigured ? env.AI_PROVIDER : null,
    model: env.aiConfigured ? env.AI_MODEL || 'gpt-4o-mini' : null,
    usage: {
      used,
      limit,
    },
  };
}

function ensureAiReady() {
  const env = getEnv();
  if (!env.aiConfigured) {
    throw AppError.notConfigured('AI Assistant is not configured. Set AI_PROVIDER and AI_API_KEY on the server.');
  }
  return env;
}

async function generateReplySuggestions({ businessId, business, plan, conversationId }) {
  ensureAiReady();
  await checkPlanLimit({ businessId, plan, metric: 'ai_requests', additional: 1 });

  const conversation = await models.Conversation.findOne({
    where: { id: conversationId, businessId },
    include: [{ model: models.Customer, as: 'customer' }],
  });
  if (!conversation) throw AppError.notFound('Conversation not found');

  const messages = await models.Message.findAll({
    where: { conversationId: conversation.id, businessId },
    order: [['createdAt', 'DESC']],
    limit: 6,
  });

  const lastInbound = messages.find((m) => m.direction === 'inbound')?.body || '';
  const customerName = conversation.customer?.name || 'there';
  const businessName = business?.name || 'our store';

  await recordUsage({
    businessId,
    metric: 'ai_requests',
    quantity: 1,
    unitCost: 0,
    referenceType: 'conversation',
    referenceId: conversation.id,
  });

  return {
    suggestions: [
      `Namaste ${customerName}! Thank you for reaching out to ${businessName}. Yes, this item is in stock and ready to ship today.`,
      `Hi ${customerName}, I would be happy to share the catalogue photos and pricing details with you right away.`,
      `Hello ${customerName}! Could you please share your preferred size and delivery pincode so we can confirm dispatch timelines?`,
    ],
    contextUsed: Boolean(lastInbound),
  };
}

async function summarizeConversation({ businessId, business, plan, conversationId }) {
  ensureAiReady();
  await checkPlanLimit({ businessId, plan, metric: 'ai_requests', additional: 1 });

  const conversation = await models.Conversation.findOne({
    where: { id: conversationId, businessId },
    include: [{ model: models.Customer, as: 'customer' }],
  });
  if (!conversation) throw AppError.notFound('Conversation not found');

  const messages = await models.Message.findAll({
    where: { conversationId: conversation.id, businessId },
    order: [['createdAt', 'ASC']],
    limit: 20,
  });

  await recordUsage({
    businessId,
    metric: 'ai_requests',
    quantity: 1,
    unitCost: 0,
    referenceType: 'conversation',
    referenceId: conversation.id,
  });

  const customerName = conversation.customer?.name || 'Customer';
  const msgCount = messages.length;
  const lastPreview = conversation.lastMessagePreview || 'No messages yet';

  return {
    summary: `${customerName} has exchanged ${msgCount} messages with ${business?.name || 'your team'}. Latest update: "${lastPreview}".`,
    keyPoints: [
      `Customer lead status: ${conversation.customer?.leadStatus || 'new'}`,
      `Total messages in thread: ${msgCount}`,
      `Recommended next action: Follow up with pricing or order confirmation link`,
    ],
  };
}

async function generateCampaignCopy({ businessId, business, plan, goal, tone = 'friendly' }) {
  ensureAiReady();
  await checkPlanLimit({ businessId, plan, metric: 'ai_requests', additional: 1 });

  await recordUsage({
    businessId,
    metric: 'ai_requests',
    quantity: 1,
    unitCost: 0,
    referenceType: 'campaign_copy',
  });

  const businessName = business?.name || 'our store';
  return {
    goal,
    tone,
    variants: [
      `Namaste {{1}}! ✨ ${goal} at ${businessName}. Reply YES to explore our latest collection today!`,
      `Hi {{1}}, special update from ${businessName}: ${goal}. Limited stock available — message us to reserve yours!`,
    ],
  };
}

module.exports = {
  getAiStatus,
  generateReplySuggestions,
  summarizeConversation,
  generateCampaignCopy,
};
