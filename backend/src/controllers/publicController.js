'use strict';

const { z } = require('zod');
const { getEnv } = require('../config/env');
const models = require('../models');
const { sendSuccess } = require('../utils/response');

const contactRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().email('Valid email is required').max(191),
  phone: z.string().trim().max(20).optional().nullable(),
  businessName: z.string().trim().max(150).optional().nullable(),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000),
});

async function getHealth(_req, res) {
  const env = getEnv();
  let dbStatus = 'up';
  try {
    await models.sequelize.authenticate();
  } catch (_e) {
    dbStatus = 'down';
  }
  return sendSuccess(res, {
    status: dbStatus === 'up' ? 'ok' : 'degraded',
    db: dbStatus,
    whatsapp: env.whatsappConfigured ? 'configured' : 'demo',
    ai: env.aiConfigured ? 'configured' : 'demo',
  });
}

async function getPlans(_req, res, next) {
  try {
    const plans = await models.Plan.findAll({
      where: { isPublic: true },
      order: [['sortOrder', 'ASC']],
    });
    const data = plans.map((p) => ({
      id: Number(p.id),
      code: p.code,
      name: p.name,
      description: p.description,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      currency: p.currency,
      limits: p.limits || {},
      features: p.features || [],
    }));
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

async function createContactRequest(req, res, next) {
  try {
    const record = await models.ContactRequest.create({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone || null,
      businessName: req.body.businessName || null,
      message: req.body.message,
      status: 'new',
    });
    return sendSuccess(
      res,
      {
        id: Number(record.id),
        name: record.name,
        email: record.email,
        phone: record.phone,
        businessName: record.businessName,
        status: record.status,
        createdAt: record.createdAt,
      },
      201
    );
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  contactRequestSchema,
  getHealth,
  getPlans,
  createContactRequest,
};
