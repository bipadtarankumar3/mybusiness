'use strict';

const { Op } = require('sequelize');
const { z } = require('zod');
const models = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, buildMeta, sendSuccess } = require('../utils/response');
const { logActivity } = require('../services/activityService');

const createFollowUpSchema = z.object({
  customerId: z.coerce.number().int().positive('customerId is required'),
  title: z.string().trim().min(2, 'Title is required').max(200),
  dueAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Valid dueAt ISO timestamp is required'),
  notes: z.string().max(2000).optional().nullable(),
  assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
});

const updateFollowUpSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  dueAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Valid dueAt ISO timestamp is required')
    .optional(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
});

const createSaleSchema = z.object({
  customerId: z.coerce.number().int().positive('customerId is required'),
  amount: z.coerce.number().positive('Sale amount must be greater than 0'),
  note: z.string().trim().max(255).optional().nullable(),
  recordedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid recordedAt timestamp')
    .optional(),
});

function serializeFollowUp(f) {
  return {
    id: Number(f.id),
    customerId: Number(f.customerId),
    customer: f.customer
      ? {
          id: Number(f.customer.id),
          name: f.customer.name,
          phone: f.customer.phone,
        }
      : null,
    title: f.title,
    notes: f.notes || '',
    dueAt: f.dueAt,
    status: f.status,
    completedAt: f.completedAt,
    assignedToUserId: f.assignedToUserId ? Number(f.assignedToUserId) : null,
    createdAt: f.createdAt,
  };
}

async function listFollowUps(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const { page, limit, offset } = parsePagination(req.query, 25, 100);
    const where = { businessId };

    if (req.query.status && ['pending', 'completed', 'cancelled'].includes(req.query.status)) {
      where.status = req.query.status;
    }
    if (req.query.customerId) {
      where.customerId = Number(req.query.customerId);
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    if (req.query.due === 'overdue') {
      where.dueAt = { [Op.lt]: startOfToday };
      if (!where.status) where.status = 'pending';
    } else if (req.query.due === 'today') {
      where.dueAt = { [Op.between]: [startOfToday, endOfToday] };
    } else if (req.query.due === 'upcoming') {
      where.dueAt = { [Op.gt]: endOfToday };
    }

    const { rows, count } = await models.FollowUpReminder.findAndCountAll({
      where,
      include: [{ model: models.Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
      order: [['dueAt', 'ASC']],
      limit,
      offset,
    });

    return sendSuccess(res, rows.map(serializeFollowUp), 200, buildMeta(page, limit, count));
  } catch (err) {
    return next(err);
  }
}

async function createFollowUp(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const customer = await models.Customer.findOne({
      where: { id: req.body.customerId, businessId },
    });
    if (!customer) {
      throw AppError.notFound('Customer not found in your workspace');
    }

    const reminder = await models.FollowUpReminder.create({
      businessId,
      customerId: customer.id,
      assignedToUserId: req.body.assignedToUserId || req.ctx.userId,
      createdByUserId: req.ctx.userId,
      title: req.body.title.trim(),
      notes: req.body.notes || null,
      dueAt: new Date(req.body.dueAt),
      status: 'pending',
    });

    await logActivity({
      businessId,
      actorUserId: req.ctx.userId,
      type: 'followup.created',
      description: `Scheduled follow-up "${reminder.title}" for ${customer.name}`,
      entityType: 'customer',
      entityId: customer.id,
    });

    const reloaded = await models.FollowUpReminder.findByPk(reminder.id, {
      include: [{ model: models.Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
    });

    return sendSuccess(res, serializeFollowUp(reloaded), 201);
  } catch (err) {
    return next(err);
  }
}

async function updateFollowUp(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const reminder = await models.FollowUpReminder.findOne({
      where: { id: req.params.id, businessId },
      include: [{ model: models.Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
    });
    if (!reminder) {
      throw AppError.notFound('Follow-up reminder not found');
    }

    const patch = {};
    if (req.body.title !== undefined) patch.title = req.body.title.trim();
    if (req.body.notes !== undefined) patch.notes = req.body.notes;
    if (req.body.dueAt !== undefined) patch.dueAt = new Date(req.body.dueAt);
    if (req.body.assignedToUserId !== undefined) patch.assignedToUserId = req.body.assignedToUserId;
    if (req.body.status !== undefined) {
      patch.status = req.body.status;
      patch.completedAt = req.body.status === 'completed' ? new Date() : null;
    }

    await reminder.update(patch);
    return sendSuccess(res, serializeFollowUp(reminder));
  } catch (err) {
    return next(err);
  }
}

async function deleteFollowUp(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const reminder = await models.FollowUpReminder.findOne({
      where: { id: req.params.id, businessId },
    });
    if (!reminder) {
      throw AppError.notFound('Follow-up reminder not found');
    }
    await reminder.destroy();
    return sendSuccess(res, { id: Number(reminder.id), deleted: true });
  } catch (err) {
    return next(err);
  }
}

async function listSales(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const { page, limit, offset } = parsePagination(req.query, 20, 100);
    const where = { businessId };
    if (req.query.customerId) {
      where.customerId = Number(req.query.customerId);
    }

    const { rows, count } = await models.Sale.findAndCountAll({
      where,
      include: [{ model: models.Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
      order: [['recordedAt', 'DESC']],
      limit,
      offset,
    });

    const data = rows.map((s) => ({
      id: Number(s.id),
      customerId: Number(s.customerId),
      customer: s.customer ? { id: Number(s.customer.id), name: s.customer.name, phone: s.customer.phone } : null,
      amount: s.amount,
      currency: s.currency,
      note: s.note,
      recordedAt: s.recordedAt,
      isDemo: Boolean(s.isDemo),
      createdAt: s.createdAt,
    }));

    return sendSuccess(res, data, 200, buildMeta(page, limit, count));
  } catch (err) {
    return next(err);
  }
}

async function createSale(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const customer = await models.Customer.findOne({
      where: { id: req.body.customerId, businessId },
    });
    if (!customer) {
      throw AppError.notFound('Customer not found in your workspace');
    }

    const sale = await models.Sale.create({
      businessId,
      customerId: customer.id,
      recordedByUserId: req.ctx.userId,
      amount: Number(req.body.amount).toFixed(2),
      currency: 'INR',
      note: req.body.note || null,
      recordedAt: req.body.recordedAt ? new Date(req.body.recordedAt) : new Date(),
      isDemo: false,
    });

    if (customer.leadStatus !== 'customer') {
      await customer.update({ leadStatus: 'customer' });
    }

    await logActivity({
      businessId,
      actorUserId: req.ctx.userId,
      type: 'sale.recorded',
      description: `Recorded sale of ₹${sale.amount} for ${customer.name}`,
      entityType: 'customer',
      entityId: customer.id,
    });

    return sendSuccess(
      res,
      {
        id: Number(sale.id),
        customerId: Number(sale.customerId),
        customer: { id: Number(customer.id), name: customer.name, phone: customer.phone },
        amount: sale.amount,
        currency: sale.currency,
        note: sale.note,
        recordedAt: sale.recordedAt,
        isDemo: Boolean(sale.isDemo),
      },
      201
    );
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createFollowUpSchema,
  updateFollowUpSchema,
  createSaleSchema,
  listFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  listSales,
  createSale,
};
