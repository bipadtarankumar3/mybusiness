'use strict';

const { Op } = require('sequelize');
const { z } = require('zod');
const models = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, buildMeta, sendSuccess } = require('../utils/response');
const { normalizePhone, isValidPhone } = require('../utils/phone');
const { checkPlanLimit } = require('../services/usageService');
const { logActivity } = require('../services/activityService');
const { runWorkflowsForEvent } = require('../services/workflowEngine');

const createContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  phone: z.string().trim().min(8, 'Phone number is required').max(25),
  email: z
    .string()
    .trim()
    .email('Invalid email format')
    .max(191)
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  leadStatus: z.enum(['new', 'contacted', 'qualified', 'customer', 'lost']).optional(),
  source: z.enum(['whatsapp', 'website', 'walk_in', 'referral', 'manual', 'import']).optional(),
  notes: z.string().max(5000).optional().nullable(),
  whatsappOptIn: z.boolean().optional(),
  tagIds: z.array(z.coerce.number().int().positive()).optional(),
});

const updateContactSchema = createContactSchema.partial();

const tagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(60),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/, 'Color must be a hex code like #16C784')
    .optional(),
});

function serializeCustomer(c) {
  return {
    id: Number(c.id),
    name: c.name,
    phone: c.phone,
    email: c.email,
    leadStatus: c.leadStatus,
    source: c.source,
    notes: c.notes || '',
    whatsappOptIn: Boolean(c.whatsappOptIn),
    optInAt: c.optInAt,
    optedOutAt: c.optedOutAt,
    lastContactedAt: c.lastContactedAt,
    isDemo: Boolean(c.isDemo),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    tags: (c.tags || []).map((t) => ({
      id: Number(t.id),
      name: t.name,
      color: t.color,
    })),
  };
}

async function listContacts(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const { page, limit, offset } = parsePagination(req.query, 20, 100);
    const where = { businessId };

    if (req.query.leadStatus && models.Customer.LEAD_STATUSES.includes(req.query.leadStatus)) {
      where.leadStatus = req.query.leadStatus;
    }

    if (req.query.search) {
      const q = `%${String(req.query.search).trim()}%`;
      where[Op.or] = [{ name: { [Op.like]: q } }, { phone: { [Op.like]: q } }, { email: { [Op.like]: q } }];
    }

    const include = [
      {
        model: models.CustomerTag,
        as: 'tags',
        through: { attributes: [] },
      },
    ];

    if (req.query.tagId) {
      include.push({
        model: models.CustomerTagMapping,
        as: 'tagMappings',
        where: { tagId: Number(req.query.tagId), businessId },
        attributes: [],
        required: true,
      });
    }

    let order = [['createdAt', 'DESC']];
    if (req.query.sort === 'createdAt') order = [['createdAt', 'ASC']];
    else if (req.query.sort === 'name') order = [['name', 'ASC']];
    else if (req.query.sort === '-name') order = [['name', 'DESC']];

    const { rows, count } = await models.Customer.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset,
      distinct: true,
    });

    return sendSuccess(res, rows.map(serializeCustomer), 200, buildMeta(page, limit, count));
  } catch (err) {
    return next(err);
  }
}

async function createContact(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    await checkPlanLimit({ businessId, plan: req.ctx.plan, metric: 'contacts', additional: 1 });

    const normalizedPhone = normalizePhone(req.body.phone);
    if (!isValidPhone(normalizedPhone)) {
      throw AppError.validation('Please provide a valid phone number in E.164 or 10-digit Indian mobile format.', [
        { field: 'phone', message: 'Invalid phone number' },
      ]);
    }

    const existing = await models.Customer.findOne({
      where: { businessId, phone: normalizedPhone },
      paranoid: false,
    });
    if (existing && !existing.deletedAt) {
      throw AppError.conflict('A contact with this phone number already exists in your workspace.', [
        { field: 'phone', message: 'Phone number already exists' },
      ]);
    }
    if (existing && existing.deletedAt) {
      await existing.destroy({ force: true });
    }

    const optIn = req.body.whatsappOptIn !== undefined ? Boolean(req.body.whatsappOptIn) : true;
    const customer = await models.Customer.create({
      businessId,
      name: req.body.name.trim(),
      phone: normalizedPhone,
      email: req.body.email || null,
      leadStatus: req.body.leadStatus || 'new',
      source: req.body.source || 'manual',
      notes: req.body.notes || null,
      whatsappOptIn: optIn,
      optInAt: optIn ? new Date() : null,
      isDemo: false,
    });

    const tagIds = Array.isArray(req.body.tagIds) ? req.body.tagIds : [];
    const addedTagIds = [];
    if (tagIds.length > 0) {
      const validTags = await models.CustomerTag.findAll({
        where: { businessId, id: tagIds },
      });
      for (const t of validTags) {
        await models.CustomerTagMapping.findOrCreate({
          where: { businessId, customerId: customer.id, tagId: t.id },
          defaults: { businessId, customerId: customer.id, tagId: t.id },
        });
        addedTagIds.push(t.id);
      }
    }

    await logActivity({
      businessId,
      actorUserId: req.ctx.userId,
      type: 'contact.created',
      description: `Added contact ${customer.name} (${customer.phone})`,
      entityType: 'customer',
      entityId: customer.id,
    });

    for (const tid of addedTagIds) {
      await runWorkflowsForEvent({
        businessId,
        triggerType: 'tag_added',
        customer,
        tagId: tid,
      });
    }

    const reloaded = await models.Customer.findOne({
      where: { id: customer.id, businessId },
      include: [{ model: models.CustomerTag, as: 'tags', through: { attributes: [] } }],
    });

    return sendSuccess(res, serializeCustomer(reloaded), 201);
  } catch (err) {
    return next(err);
  }
}

async function getContact(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const customer = await models.Customer.findOne({
      where: { id: req.params.id, businessId },
      include: [
        { model: models.CustomerTag, as: 'tags', through: { attributes: [] } },
        {
          model: models.FollowUpReminder,
          as: 'followUps',
          where: { businessId },
          required: false,
        },
        {
          model: models.Sale,
          as: 'sales',
          where: { businessId },
          required: false,
        },
        {
          model: models.Conversation,
          as: 'conversations',
          where: { businessId },
          required: false,
          attributes: ['id', 'status', 'lastMessageAt', 'lastMessagePreview', 'unreadCount', 'isDemo'],
        },
      ],
    });

    if (!customer) {
      throw AppError.notFound('Contact not found');
    }

    const base = serializeCustomer(customer);
    base.followUps = (customer.followUps || []).map((f) => ({
      id: Number(f.id),
      customerId: Number(f.customerId),
      title: f.title,
      notes: f.notes,
      dueAt: f.dueAt,
      status: f.status,
      completedAt: f.completedAt,
      assignedToUserId: f.assignedToUserId ? Number(f.assignedToUserId) : null,
    }));
    base.sales = (customer.sales || []).map((s) => ({
      id: Number(s.id),
      customerId: Number(s.customerId),
      amount: s.amount,
      currency: s.currency,
      note: s.note,
      recordedAt: s.recordedAt,
    }));
    base.conversations = (customer.conversations || []).map((cv) => ({
      id: Number(cv.id),
      status: cv.status,
      lastMessageAt: cv.lastMessageAt,
      lastMessagePreview: cv.lastMessagePreview,
      unreadCount: cv.unreadCount,
      isDemo: Boolean(cv.isDemo),
    }));

    return sendSuccess(res, base);
  } catch (err) {
    return next(err);
  }
}

async function updateContact(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const customer = await models.Customer.findOne({
      where: { id: req.params.id, businessId },
    });
    if (!customer) {
      throw AppError.notFound('Contact not found');
    }

    const patch = {};
    if (req.body.name !== undefined) patch.name = req.body.name.trim();
    if (req.body.email !== undefined) patch.email = req.body.email || null;
    if (req.body.leadStatus !== undefined) patch.leadStatus = req.body.leadStatus;
    if (req.body.source !== undefined) patch.source = req.body.source;
    if (req.body.notes !== undefined) patch.notes = req.body.notes;

    if (req.body.phone !== undefined) {
      const normalized = normalizePhone(req.body.phone);
      if (!isValidPhone(normalized)) {
        throw AppError.validation('Invalid phone number', [{ field: 'phone', message: 'Invalid phone number' }]);
      }
      if (normalized !== customer.phone) {
        const dup = await models.Customer.findOne({ where: { businessId, phone: normalized } });
        if (dup && Number(dup.id) !== Number(customer.id)) {
          throw AppError.conflict('Another contact already uses this phone number.', [
            { field: 'phone', message: 'Phone number already exists' },
          ]);
        }
        patch.phone = normalized;
      }
    }

    if (req.body.whatsappOptIn !== undefined) {
      patch.whatsappOptIn = Boolean(req.body.whatsappOptIn);
      if (patch.whatsappOptIn) {
        patch.optInAt = customer.optInAt || new Date();
        patch.optedOutAt = null;
      } else {
        patch.optedOutAt = new Date();
      }
    }

    await customer.update(patch);

    if (Array.isArray(req.body.tagIds)) {
      const validTags = await models.CustomerTag.findAll({
        where: { businessId, id: req.body.tagIds },
      });
      const validIds = validTags.map((t) => Number(t.id));
      await models.CustomerTagMapping.destroy({
        where: { businessId, customerId: customer.id },
      });
      for (const tid of validIds) {
        await models.CustomerTagMapping.create({
          businessId,
          customerId: customer.id,
          tagId: tid,
        });
      }
    }

    const reloaded = await models.Customer.findOne({
      where: { id: customer.id, businessId },
      include: [{ model: models.CustomerTag, as: 'tags', through: { attributes: [] } }],
    });

    return sendSuccess(res, serializeCustomer(reloaded));
  } catch (err) {
    return next(err);
  }
}

async function deleteContact(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const customer = await models.Customer.findOne({
      where: { id: req.params.id, businessId },
    });
    if (!customer) {
      throw AppError.notFound('Contact not found');
    }
    await customer.destroy();
    return sendSuccess(res, { id: Number(customer.id), deleted: true });
  } catch (err) {
    return next(err);
  }
}

async function listTags(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const tags = await models.CustomerTag.findAll({
      where: { businessId },
      order: [['name', 'ASC']],
    });
    const mappings = await models.CustomerTagMapping.findAll({
      where: { businessId },
      attributes: ['tagId'],
    });
    const counts = {};
    for (const m of mappings) {
      counts[m.tagId] = (counts[m.tagId] || 0) + 1;
    }

    const data = tags.map((t) => ({
      id: Number(t.id),
      name: t.name,
      color: t.color,
      customerCount: counts[t.id] || 0,
    }));
    return sendSuccess(res, data);
  } catch (err) {
    return next(err);
  }
}

async function createTag(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const existing = await models.CustomerTag.findOne({
      where: { businessId, name: req.body.name.trim() },
    });
    if (existing) {
      throw AppError.conflict('A tag with this name already exists');
    }
    const tag = await models.CustomerTag.create({
      businessId,
      name: req.body.name.trim(),
      color: req.body.color || '#16C784',
    });
    return sendSuccess(
      res,
      {
        id: Number(tag.id),
        name: tag.name,
        color: tag.color,
        customerCount: 0,
      },
      201
    );
  } catch (err) {
    return next(err);
  }
}

async function updateTag(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const tag = await models.CustomerTag.findOne({
      where: { id: req.params.id, businessId },
    });
    if (!tag) throw AppError.notFound('Tag not found');

    const patch = {};
    if (req.body.name !== undefined) patch.name = req.body.name.trim();
    if (req.body.color !== undefined) patch.color = req.body.color;
    await tag.update(patch);

    const count = await models.CustomerTagMapping.count({ where: { businessId, tagId: tag.id } });
    return sendSuccess(res, {
      id: Number(tag.id),
      name: tag.name,
      color: tag.color,
      customerCount: count,
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteTag(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const tag = await models.CustomerTag.findOne({
      where: { id: req.params.id, businessId },
    });
    if (!tag) throw AppError.notFound('Tag not found');
    await tag.destroy();
    return sendSuccess(res, { id: Number(tag.id), deleted: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createContactSchema,
  updateContactSchema,
  tagSchema,
  listContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  listTags,
  createTag,
  updateTag,
  deleteTag,
};
