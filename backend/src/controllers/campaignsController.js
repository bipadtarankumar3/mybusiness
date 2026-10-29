'use strict';

const { z } = require('zod');
const { getEnv } = require('../config/env');
const models = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, buildMeta, sendSuccess } = require('../utils/response');
const { resolveWhatsAppConfig } = require('../integrations/whatsapp');
const { enqueueOutboundMessage } = require('../jobs/outboundQueue');
const { logActivity } = require('../services/activityService');

const audienceSchema = z
  .object({
    tagIds: z.array(z.coerce.number().int().positive()).optional().default([]),
    leadStatuses: z.array(z.enum(['new', 'contacted', 'qualified', 'customer', 'lost'])).optional().default([]),
  })
  .default({ tagIds: [], leadStatuses: [] });

const createCampaignSchema = z.object({
  name: z.string().trim().min(2, 'Campaign name is required').max(150),
  templateId: z.coerce.number().int().positive('templateId is required'),
  audience: audienceSchema,
  scheduledAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid scheduledAt timestamp')
    .optional()
    .nullable(),
});

const updateCampaignSchema = createCampaignSchema.partial();

async function evaluateCampaignAudience(businessId, audience = {}, template = null) {
  const tagIds = Array.isArray(audience?.tagIds) ? audience.tagIds.map(Number) : [];
  const leadStatuses = Array.isArray(audience?.leadStatuses) ? audience.leadStatuses : [];

  const where = { businessId };
  if (leadStatuses.length > 0) {
    where.leadStatus = leadStatuses;
  }

  const include = [];
  if (tagIds.length > 0) {
    include.push({
      model: models.CustomerTagMapping,
      as: 'tagMappings',
      where: { businessId, tagId: tagIds },
      attributes: ['tagId'],
      required: true,
    });
  }

  const matchedCustomers = await models.Customer.findAll({
    where,
    include,
    order: [['id', 'ASC']],
  });

  let noOptIn = 0;
  let optedOut = 0;
  let duplicate = 0;
  const seenPhones = new Set();
  const eligible = [];

  for (const c of matchedCustomers) {
    if (c.optedOutAt) {
      optedOut += 1;
      continue;
    }
    if (!c.whatsappOptIn) {
      noOptIn += 1;
      continue;
    }
    if (seenPhones.has(c.phone)) {
      duplicate += 1;
      continue;
    }
    seenPhones.add(c.phone);
    eligible.push(c);
  }

  const env = getEnv();
  const unitRate = template?.category === 'utility' ? env.WA_UTILITY_RATE_INR : env.WA_MARKETING_RATE_INR;
  const estimatedCost = (eligible.length * unitRate).toFixed(2);

  return {
    eligible,
    eligibleRecipients: eligible.length,
    excluded: { noOptIn, optedOut, duplicate },
    unitRate,
    estimatedCost,
  };
}

async function computeCampaignStats(campaign) {
  if (campaign.isDemo && campaign.demoStats) {
    return campaign.demoStats;
  }
  const rows = await models.CampaignRecipient.findAll({
    where: { campaignId: campaign.id, businessId: campaign.businessId },
    attributes: ['status'],
  });
  const stats = {
    total: rows.length,
    queued: 0,
    accepted: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    skipped: 0,
  };
  for (const r of rows) {
    if (stats[r.status] !== undefined) stats[r.status] += 1;
  }
  return stats;
}

async function serializeCampaign(c) {
  const stats = await computeCampaignStats(c);
  return {
    id: Number(c.id),
    name: c.name,
    status: c.status,
    templateId: c.templateId ? Number(c.templateId) : null,
    template: c.template
      ? {
          id: Number(c.template.id),
          name: c.template.name,
          category: c.template.category,
          language: c.template.language,
          body: c.template.body,
          status: c.template.status,
        }
      : null,
    audience: c.audience || { tagIds: [], leadStatuses: [] },
    scheduledAt: c.scheduledAt,
    startedAt: c.startedAt,
    completedAt: c.completedAt,
    estimatedRecipients: Number(c.estimatedRecipients || 0),
    estimatedCost: c.estimatedCost || '0.00',
    currency: 'INR',
    isDemo: Boolean(c.isDemo),
    stats,
    createdAt: c.createdAt,
  };
}

async function listTemplates(req, res, next) {
  try {
    const templates = await models.MessageTemplate.findAll({
      where: { businessId: req.ctx.businessId },
      order: [['id', 'ASC']],
    });
    const data = templates.map((t) => ({
      id: Number(t.id),
      name: t.name,
      category: t.category,
      language: t.language,
      body: t.body,
      variables: t.variables || [],
      status: t.status,
      isDemo: Boolean(t.isDemo),
    }));
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

async function listCampaigns(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const { page, limit, offset } = parsePagination(req.query, 20, 100);
    const where = { businessId };
    if (req.query.status) {
      where.status = req.query.status;
    }

    const { rows, count } = await models.Campaign.findAndCountAll({
      where,
      include: [{ model: models.MessageTemplate, as: 'template' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const serialized = await Promise.all(rows.map(serializeCampaign));
    return sendSuccess(res, serialized, 200, buildMeta(page, limit, count));
  } catch (err) {
    return next(err);
  }
}

async function createCampaign(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const template = await models.MessageTemplate.findOne({
      where: { id: req.body.templateId, businessId },
    });
    if (!template) {
      throw AppError.notFound('Message template not found in your workspace');
    }

    const evaluation = await evaluateCampaignAudience(businessId, req.body.audience, template);

    const campaign = await models.Campaign.create({
      businessId,
      templateId: template.id,
      createdByUserId: req.ctx.userId,
      name: req.body.name.trim(),
      status: 'draft',
      audience: req.body.audience || { tagIds: [], leadStatuses: [] },
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
      estimatedRecipients: evaluation.eligibleRecipients,
      estimatedCost: evaluation.estimatedCost,
      isDemo: false,
    });

    const reloaded = await models.Campaign.findByPk(campaign.id, {
      include: [{ model: models.MessageTemplate, as: 'template' }],
    });
    return sendSuccess(res, await serializeCampaign(reloaded), 201);
  } catch (err) {
    return next(err);
  }
}

async function getCampaign(req, res, next) {
  try {
    const campaign = await models.Campaign.findOne({
      where: { id: req.params.id, businessId: req.ctx.businessId },
      include: [{ model: models.MessageTemplate, as: 'template' }],
    });
    if (!campaign) throw AppError.notFound('Campaign not found');
    return sendSuccess(res, await serializeCampaign(campaign));
  } catch (err) {
    return next(err);
  }
}

async function updateCampaign(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const campaign = await models.Campaign.findOne({
      where: { id: req.params.id, businessId },
      include: [{ model: models.MessageTemplate, as: 'template' }],
    });
    if (!campaign) throw AppError.notFound('Campaign not found');
    if (campaign.status !== 'draft') {
      throw AppError.conflict('Only draft campaigns can be edited');
    }

    let template = campaign.template;
    if (req.body.templateId !== undefined) {
      template = await models.MessageTemplate.findOne({
        where: { id: req.body.templateId, businessId },
      });
      if (!template) throw AppError.notFound('Message template not found');
    }

    const nextAudience = req.body.audience !== undefined ? req.body.audience : campaign.audience;
    const evaluation = await evaluateCampaignAudience(businessId, nextAudience, template);

    await campaign.update({
      name: req.body.name !== undefined ? req.body.name.trim() : campaign.name,
      templateId: template ? template.id : campaign.templateId,
      audience: nextAudience,
      scheduledAt: req.body.scheduledAt !== undefined ? (req.body.scheduledAt ? new Date(req.body.scheduledAt) : null) : campaign.scheduledAt,
      estimatedRecipients: evaluation.eligibleRecipients,
      estimatedCost: evaluation.estimatedCost,
    });

    const reloaded = await models.Campaign.findByPk(campaign.id, {
      include: [{ model: models.MessageTemplate, as: 'template' }],
    });
    return sendSuccess(res, await serializeCampaign(reloaded));
  } catch (err) {
    return next(err);
  }
}

async function validateCampaign(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const campaign = await models.Campaign.findOne({
      where: { id: req.params.id, businessId },
      include: [{ model: models.MessageTemplate, as: 'template' }],
    });
    if (!campaign) throw AppError.notFound('Campaign not found');

    const evaluation = await evaluateCampaignAudience(businessId, campaign.audience, campaign.template);
    const waCfg = await resolveWhatsAppConfig(businessId);

    const templateOk = Boolean(campaign.template && campaign.template.status === 'approved');
    const recipientsOk = evaluation.eligibleRecipients > 0;
    const waOk = Boolean(waCfg.configured);

    const checks = [
      {
        key: 'template_approved',
        ok: templateOk,
        message: templateOk ? 'Template is approved for broadcast' : 'Campaign requires an approved WhatsApp template',
      },
      {
        key: 'eligible_recipients',
        ok: recipientsOk,
        message: recipientsOk
          ? `${evaluation.eligibleRecipients} opted-in recipients matched`
          : 'No opted-in recipients match the selected audience filters',
      },
      {
        key: 'whatsapp_configured',
        ok: waOk,
        message: waOk
          ? 'WhatsApp Cloud API credentials are active'
          : 'WhatsApp Cloud API is not configured (set WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID to launch)',
      },
    ];

    await campaign.update({
      estimatedRecipients: evaluation.eligibleRecipients,
      estimatedCost: evaluation.estimatedCost,
    });

    return sendSuccess(res, {
      ready: templateOk && recipientsOk && waOk,
      checks,
      eligibleRecipients: evaluation.eligibleRecipients,
      excluded: evaluation.excluded,
      estimatedCost: evaluation.estimatedCost,
      currency: 'INR',
    });
  } catch (err) {
    return next(err);
  }
}

async function launchCampaign(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const campaign = await models.Campaign.findOne({
      where: { id: req.params.id, businessId },
      include: [{ model: models.MessageTemplate, as: 'template' }],
    });
    if (!campaign) throw AppError.notFound('Campaign not found');

    if (!['draft', 'scheduled'].includes(campaign.status)) {
      throw AppError.conflict(`Campaign cannot be launched from "${campaign.status}" status.`);
    }

    const waCfg = await resolveWhatsAppConfig(businessId);
    if (!waCfg.configured) {
      throw AppError.notConfigured(
        'Cannot launch campaign because WhatsApp Cloud API is not configured. Configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID first.'
      );
    }

    if (!campaign.template || campaign.template.status !== 'approved') {
      throw AppError.validation('Campaign requires an approved message template.');
    }

    const evaluation = await evaluateCampaignAudience(businessId, campaign.audience, campaign.template);
    if (evaluation.eligibleRecipients === 0) {
      throw AppError.validation('No opted-in recipients match this campaign audience.');
    }

    const jobsToEnqueue = [];
    const now = new Date();

    await models.sequelize.transaction(async (transaction) => {
      await campaign.update(
        {
          status: 'sending',
          startedAt: now,
          estimatedRecipients: evaluation.eligibleRecipients,
          estimatedCost: evaluation.estimatedCost,
          isDemo: false,
        },
        { transaction }
      );

      for (const customer of evaluation.eligible) {
        let conv = await models.Conversation.findOne({
          where: { businessId, customerId: customer.id },
          transaction,
        });
        if (!conv) {
          conv = await models.Conversation.create(
            {
              businessId,
              customerId: customer.id,
              channel: 'whatsapp',
              status: 'open',
              isDemo: false,
              unreadCount: 0,
              lastMessageAt: now,
              lastMessagePreview: campaign.template.body.slice(0, 240),
            },
            { transaction }
          );
        }

        const msg = await models.Message.create(
          {
            businessId,
            conversationId: conv.id,
            templateId: campaign.template.id,
            sentByUserId: req.ctx.userId,
            direction: 'outbound',
            type: 'template',
            body: campaign.template.body.replace('{{1}}', customer.name || 'there'),
            status: 'queued',
            statusUpdatedAt: now,
          },
          { transaction }
        );

        const recipient = await models.CampaignRecipient.create(
          {
            businessId,
            campaignId: campaign.id,
            customerId: customer.id,
            messageId: msg.id,
            phone: customer.phone,
            status: 'queued',
          },
          { transaction }
        );

        jobsToEnqueue.push({ messageId: msg.id, campaignRecipientId: recipient.id });
      }
    });

    for (const job of jobsToEnqueue) {
      await enqueueOutboundMessage(job);
    }

    await logActivity({
      businessId,
      actorUserId: req.ctx.userId,
      type: 'campaign.launched',
      description: `Launched campaign "${campaign.name}" to ${evaluation.eligibleRecipients} recipients`,
      entityType: 'campaign',
      entityId: campaign.id,
    });

    const reloaded = await models.Campaign.findByPk(campaign.id, {
      include: [{ model: models.MessageTemplate, as: 'template' }],
    });
    return sendSuccess(res, await serializeCampaign(reloaded));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createCampaignSchema,
  updateCampaignSchema,
  listTemplates,
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  validateCampaign,
  launchCampaign,
};
