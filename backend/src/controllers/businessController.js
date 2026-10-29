'use strict';

const { z } = require('zod');
const models = require('../models');
const { sendSuccess } = require('../utils/response');
const { resolveWhatsAppConfig } = require('../integrations/whatsapp');

const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  industry: z.string().trim().max(80).optional().nullable(),
  timezone: z.string().trim().max(64).optional(),
  phone: z.string().trim().max(32).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  businessHours: z.record(z.any()).optional().nullable(),
  aiKnowledge: z.string().trim().max(5000).optional().nullable(),
});

function serializeBusiness(b) {
  return {
    id: Number(b.id),
    name: b.name,
    slug: b.slug,
    industry: b.industry,
    timezone: b.timezone,
    phone: b.phone,
    website: b.website,
    businessHours: b.businessHours,
    aiKnowledge: b.aiKnowledge,
    isDemo: Boolean(b.isDemo),
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

async function getCurrentBusiness(req, res) {
  return sendSuccess(res, serializeBusiness(req.ctx.business));
}

async function updateCurrentBusiness(req, res, next) {
  try {
    const business = req.ctx.business;
    const patch = {};
    for (const k of ['name', 'industry', 'timezone', 'phone', 'website', 'businessHours', 'aiKnowledge']) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    await business.update(patch);
    return sendSuccess(res, serializeBusiness(business));
  } catch (err) {
    return next(err);
  }
}

async function getTeamMembers(req, res, next) {
  try {
    const members = await models.BusinessMember.findAll({
      where: { businessId: req.ctx.businessId },
      include: [
        { model: models.User, as: 'user' },
        { model: models.Team, as: 'team' },
      ],
      order: [['id', 'ASC']],
    });
    const data = members.map((m) => ({
      id: Number(m.id),
      userId: Number(m.userId),
      name: m.user?.name || 'Unknown',
      email: m.user?.email || '',
      role: m.role,
      status: m.status,
      team: m.team ? { id: Number(m.team.id), name: m.team.name } : null,
    }));
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

async function getIntegrations(req, res, next) {
  try {
    const waCfg = await resolveWhatsAppConfig(req.ctx.businessId);
    const integration = await models.BusinessIntegration.findOne({
      where: { businessId: req.ctx.businessId, provider: 'whatsapp_cloud' },
    });

    const items = [
      {
        provider: 'whatsapp_cloud',
        status: waCfg.configured ? 'configured' : integration?.status || 'not_configured',
        source: waCfg.source || 'business',
        details: {
          phoneNumberIdConfigured: Boolean(waCfg.phoneNumberId),
          businessAccountIdConfigured: Boolean(waCfg.businessAccountId),
          displayPhoneNumber: integration?.config?.displayPhoneNumber || null,
          lastError: integration?.lastError || null,
        },
      },
    ];
    return sendSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  updateBusinessSchema,
  getCurrentBusiness,
  updateCurrentBusiness,
  getTeamMembers,
  getIntegrations,
};
