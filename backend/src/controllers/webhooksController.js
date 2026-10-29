'use strict';

const { getEnv } = require('../config/env');
const models = require('../models');
const AppError = require('../utils/AppError');
const { normalizePhone } = require('../utils/phone');
const { WhatsAppCloudProvider } = require('../integrations/whatsapp');
const { runWorkflowsForEvent } = require('../services/workflowEngine');
const { emitToBusiness } = require('../utils/realtime');

async function verifyWhatsappWebhook(req, res) {
  const env = getEnv();
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).type('text/plain').send(String(challenge || ''));
  }
  return res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'Webhook verification token mismatch',
    },
  });
}

async function resolveBusinessForWebhook(phoneNumberId) {
  if (phoneNumberId) {
    const integration = await models.BusinessIntegration.findOne({
      where: { provider: 'whatsapp_cloud', externalAccountId: String(phoneNumberId) },
    });
    if (integration) {
      return models.Business.findByPk(integration.businessId);
    }
  }
  return models.Business.findOne({ order: [['id', 'ASC']] });
}

async function tryRecordWebhookEvent({ businessId, provider, eventId, eventType }) {
  try {
    await models.WebhookEvent.create({
      businessId: businessId || null,
      provider,
      eventId: String(eventId),
      eventType,
      processedAt: new Date(),
    });
    return true;
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return false;
    }
    throw err;
  }
}

const VALID_PROVIDER_STATUSES = ['sent', 'delivered', 'read', 'failed'];

async function receiveWhatsappWebhook(req, res, next) {
  try {
    const env = getEnv();
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = req.rawBody;

    if (!env.WHATSAPP_APP_SECRET || !WhatsAppCloudProvider.verifySignature(rawBody, signature, env.WHATSAPP_APP_SECRET)) {
      throw AppError.unauthenticated('Invalid or missing X-Hub-Signature-256 webhook signature');
    }

    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    let processedEvents = 0;
    let duplicateEvents = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        const phoneNumberId = value?.metadata?.phone_number_id;
        const business = await resolveBusinessForWebhook(phoneNumberId);
        if (!business) continue;

        // 1. Handle outbound message status callbacks
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const st of statuses) {
          if (!st?.id || !st?.status) continue;
          const statusName = String(st.status).toLowerCase();
          if (!VALID_PROVIDER_STATUSES.includes(statusName)) continue;

          const eventKey = `${st.id}:${statusName}`;
          const isNew = await tryRecordWebhookEvent({
            businessId: business.id,
            provider: 'whatsapp_cloud',
            eventId: eventKey,
            eventType: `status.${statusName}`,
          });
          if (!isNew) {
            duplicateEvents += 1;
            continue;
          }
          processedEvents += 1;

          const msg = await models.Message.findOne({
            where: { providerMessageId: String(st.id) },
          });
          if (msg) {
            const errText = st.errors?.[0]?.title || st.errors?.[0]?.message || null;
            await msg.update({
              status: statusName,
              errorMessage: statusName === 'failed' ? errText || msg.errorMessage : msg.errorMessage,
              statusUpdatedAt: new Date(),
            });

            const recipient = await models.CampaignRecipient.findOne({
              where: { messageId: msg.id },
            });
            if (recipient) {
              await recipient.update({
                status: statusName,
                errorMessage: statusName === 'failed' ? errText : recipient.errorMessage,
              });
            }

            emitToBusiness(msg.businessId, 'message:status', {
              messageId: msg.id,
              conversationId: msg.conversationId,
              status: msg.status,
              providerMessageId: msg.providerMessageId,
            });
          }
        }

        // 2. Handle inbound customer messages
        const inboundMessages = Array.isArray(value.messages) ? value.messages : [];
        const contactsProfile = Array.isArray(value.contacts) ? value.contacts : [];

        for (const im of inboundMessages) {
          if (!im?.id || !im?.from) continue;

          const isNew = await tryRecordWebhookEvent({
            businessId: business.id,
            provider: 'whatsapp_cloud',
            eventId: String(im.id),
            eventType: 'message.inbound',
          });
          if (!isNew) {
            duplicateEvents += 1;
            continue;
          }
          processedEvents += 1;

          const phone = normalizePhone(im.from);
          const profileName =
            contactsProfile.find((c) => normalizePhone(c.wa_id || '') === phone)?.profile?.name || `WhatsApp ${phone}`;
          const textBody = im.text?.body || im.button?.text || '[Media message]';
          const now = new Date();

          let customer = await models.Customer.findOne({
            where: { businessId: business.id, phone },
          });
          if (!customer) {
            customer = await models.Customer.create({
              businessId: business.id,
              name: profileName,
              phone,
              leadStatus: 'new',
              source: 'whatsapp',
              whatsappOptIn: true,
              optInAt: now,
              lastContactedAt: now,
              isDemo: false,
            });
          } else {
            await customer.update({ lastContactedAt: now });
          }

          let isNewConv = false;
          let conv = await models.Conversation.findOne({
            where: { businessId: business.id, customerId: customer.id },
          });
          if (!conv) {
            isNewConv = true;
            conv = await models.Conversation.create({
              businessId: business.id,
              customerId: customer.id,
              channel: 'whatsapp',
              status: 'open',
              isDemo: false,
              unreadCount: 1,
              lastMessageAt: now,
              lastMessagePreview: textBody.slice(0, 240),
              lastInboundAt: now,
            });
          } else {
            await conv.update({
              status: 'open',
              unreadCount: Number(conv.unreadCount || 0) + 1,
              lastMessageAt: now,
              lastMessagePreview: textBody.slice(0, 240),
              lastInboundAt: now,
            });
          }

          const createdMsg = await models.Message.create({
            businessId: business.id,
            conversationId: conv.id,
            direction: 'inbound',
            type: 'text',
            body: textBody,
            status: 'received',
            providerMessageId: String(im.id),
            statusUpdatedAt: now,
          });

          emitToBusiness(business.id, 'message:new', {
            id: Number(createdMsg.id),
            conversationId: Number(conv.id),
            direction: 'inbound',
            type: 'text',
            body: textBody,
            status: 'received',
            createdAt: createdMsg.createdAt,
          });

          if (isNewConv) {
            await runWorkflowsForEvent({
              businessId: business.id,
              triggerType: 'new_conversation',
              conversation: conv,
              customer,
              message: createdMsg,
            });
          }
          await runWorkflowsForEvent({
            businessId: business.id,
            triggerType: 'keyword_received',
            conversation: conv,
            customer,
            message: createdMsg,
          });
        }
      }
    }

    return res.status(200).json({
      data: {
        received: true,
        processedEvents,
        duplicateEvents,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  verifyWhatsappWebhook,
  receiveWhatsappWebhook,
};
