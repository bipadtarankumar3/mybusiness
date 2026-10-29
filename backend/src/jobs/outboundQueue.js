'use strict';

const { getEnv } = require('../config/env');
const models = require('../models');
const { getWhatsAppProvider } = require('../integrations/whatsapp');
const { recordUsage } = require('../services/usageService');
const { emitToBusiness } = require('../utils/realtime');

const pendingPromises = new Set();

function trackPromise(p) {
  pendingPromises.add(p);
  p.finally(() => pendingPromises.delete(p));
  return p;
}

async function processOutboundMessageJob({ messageId, campaignRecipientId = null }) {
  const message = await models.Message.findByPk(messageId, {
    include: [
      {
        model: models.Conversation,
        as: 'conversation',
        include: [{ model: models.Customer, as: 'customer' }],
      },
      { model: models.MessageTemplate, as: 'template' },
    ],
  });
  if (!message) return;

  const businessId = message.businessId;
  const customer = message.conversation?.customer;
  if (!customer) return;

  const provider = await getWhatsAppProvider(businessId);
  const env = getEnv();

  let result;
  if (message.type === 'template' && message.template) {
    result = await provider.sendTemplate({
      to: customer.phone,
      templateName: message.template.name,
      language: message.template.language || 'en',
      parameters: [customer.name || 'Customer'],
    });
  } else {
    result = await provider.sendText({
      to: customer.phone,
      body: message.body,
    });
  }

  const now = new Date();
  if (result.simulated) {
    await message.update({
      status: 'simulated',
      statusUpdatedAt: now,
    });
  } else if (result.accepted) {
    await message.update({
      status: 'accepted',
      providerMessageId: result.providerMessageId,
      statusUpdatedAt: now,
      errorMessage: null,
    });
    const isCampaign = Boolean(campaignRecipientId);
    const rate =
      message.template?.category === 'utility' ? env.WA_UTILITY_RATE_INR : isCampaign ? env.WA_MARKETING_RATE_INR : env.WA_UTILITY_RATE_INR;
    await recordUsage({
      businessId,
      metric: isCampaign ? 'campaign_messages' : 'messages',
      quantity: 1,
      unitCost: rate,
      referenceType: 'message',
      referenceId: message.id,
    });
  } else {
    await message.update({
      status: 'failed',
      errorMessage: result.errorMessage || 'Provider rejected message',
      statusUpdatedAt: now,
    });
  }

  if (campaignRecipientId) {
    const recipient = await models.CampaignRecipient.findByPk(campaignRecipientId);
    if (recipient) {
      await recipient.update({
        messageId: message.id,
        status: result.accepted ? 'accepted' : 'failed',
        errorMessage: result.accepted ? null : result.errorMessage || 'Failed to send',
      });
      await checkAndFinalizeCampaign(recipient.campaignId);
    }
  }

  emitToBusiness(businessId, 'message:status', {
    messageId: message.id,
    conversationId: message.conversationId,
    status: message.status,
    providerMessageId: message.providerMessageId,
    errorMessage: message.errorMessage,
  });
}

async function checkAndFinalizeCampaign(campaignId) {
  const remaining = await models.CampaignRecipient.count({
    where: { campaignId, status: 'queued' },
  });
  if (remaining === 0) {
    const campaign = await models.Campaign.findByPk(campaignId);
    if (campaign && campaign.status === 'sending') {
      const acceptedCount = await models.CampaignRecipient.count({
        where: { campaignId, status: ['accepted', 'sent', 'delivered', 'read'] },
      });
      await campaign.update({
        status: acceptedCount > 0 ? 'completed' : 'failed',
        completedAt: new Date(),
      });
    }
  }
}

function enqueueOutboundMessage(jobData) {
  const p = Promise.resolve().then(() => processOutboundMessageJob(jobData)).catch((err) => {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.error('[OutboundQueueError]', err);
    }
  });
  return trackPromise(p);
}

async function flushOutboundQueue() {
  while (pendingPromises.size > 0) {
    await Promise.allSettled(Array.from(pendingPromises));
  }
}

module.exports = {
  enqueueOutboundMessage,
  processOutboundMessageJob,
  flushOutboundQueue,
};
