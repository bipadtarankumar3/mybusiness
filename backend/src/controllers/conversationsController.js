'use strict';

const { Op } = require('sequelize');
const { z } = require('zod');
const models = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, buildMeta, sendSuccess } = require('../utils/response');
const { resolveWhatsAppConfig } = require('../integrations/whatsapp');
const { checkPlanLimit } = require('../services/usageService');
const { enqueueOutboundMessage } = require('../jobs/outboundQueue');
const { emitToBusiness } = require('../utils/realtime');

const updateConversationSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved']).optional(),
  assignedToUserId: z.coerce.number().int().positive().optional().nullable(),
});

const sendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message body cannot be empty').max(4096),
  type: z.enum(['text', 'note']).default('text'),
});

function serializeConversation(c) {
  return {
    id: Number(c.id),
    channel: c.channel,
    status: c.status,
    isDemo: Boolean(c.isDemo),
    unreadCount: Number(c.unreadCount || 0),
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    lastInboundAt: c.lastInboundAt,
    assignedTo: c.assignedTo
      ? {
          id: Number(c.assignedTo.id),
          name: c.assignedTo.name,
        }
      : null,
    customer: c.customer
      ? {
          id: Number(c.customer.id),
          name: c.customer.name,
          phone: c.customer.phone,
          email: c.customer.email,
          leadStatus: c.customer.leadStatus,
          notes: c.customer.notes || '',
          whatsappOptIn: Boolean(c.customer.whatsappOptIn),
          tags: (c.customer.tags || []).map((t) => ({
            id: Number(t.id),
            name: t.name,
            color: t.color,
          })),
        }
      : null,
  };
}

function serializeMessage(m) {
  return {
    id: Number(m.id),
    conversationId: Number(m.conversationId),
    direction: m.direction,
    type: m.type,
    body: m.body,
    status: m.status,
    providerMessageId: m.providerMessageId,
    errorMessage: m.errorMessage,
    sentBy: m.sentBy
      ? {
          id: Number(m.sentBy.id),
          name: m.sentBy.name,
        }
      : null,
    createdAt: m.createdAt,
  };
}

async function listConversations(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const { page, limit, offset } = parsePagination(req.query, 25, 100);
    const where = { businessId };

    if (req.query.status && ['open', 'pending', 'resolved'].includes(req.query.status)) {
      where.status = req.query.status;
    }

    if (req.query.assigned === 'me') {
      where.assignedToUserId = req.ctx.userId;
    } else if (req.query.assigned === 'unassigned') {
      where.assignedToUserId = null;
    }

    const customerWhere = {};
    if (req.query.search) {
      const q = `%${String(req.query.search).trim()}%`;
      customerWhere[Op.or] = [{ name: { [Op.like]: q } }, { phone: { [Op.like]: q } }];
    }

    const { rows, count } = await models.Conversation.findAndCountAll({
      where,
      include: [
        { model: models.User, as: 'assignedTo', attributes: ['id', 'name'] },
        {
          model: models.Customer,
          as: 'customer',
          where: Object.keys(customerWhere).length ? customerWhere : undefined,
          required: true,
          include: [{ model: models.CustomerTag, as: 'tags', through: { attributes: [] } }],
        },
      ],
      order: [['lastMessageAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return sendSuccess(res, rows.map(serializeConversation), 200, buildMeta(page, limit, count));
  } catch (err) {
    return next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const conv = await models.Conversation.findOne({
      where: { id: req.params.id, businessId },
      include: [
        { model: models.User, as: 'assignedTo', attributes: ['id', 'name'] },
        {
          model: models.Customer,
          as: 'customer',
          include: [{ model: models.CustomerTag, as: 'tags', through: { attributes: [] } }],
        },
      ],
    });
    if (!conv) throw AppError.notFound('Conversation not found');
    return sendSuccess(res, serializeConversation(conv));
  } catch (err) {
    return next(err);
  }
}

async function updateConversation(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const conv = await models.Conversation.findOne({
      where: { id: req.params.id, businessId },
    });
    if (!conv) throw AppError.notFound('Conversation not found');

    const patch = {};
    if (req.body.status !== undefined) patch.status = req.body.status;
    if (req.body.assignedToUserId !== undefined) {
      if (req.body.assignedToUserId === null) {
        patch.assignedToUserId = null;
      } else {
        const member = await models.BusinessMember.findOne({
          where: { businessId, userId: req.body.assignedToUserId, status: 'active' },
        });
        if (!member) {
          throw AppError.validation('Assigned user must be an active member of this workspace', [
            { field: 'assignedToUserId', message: 'User is not a member of this business' },
          ]);
        }
        patch.assignedToUserId = Number(req.body.assignedToUserId);
      }
    }

    await conv.update(patch);

    const reloaded = await models.Conversation.findOne({
      where: { id: conv.id, businessId },
      include: [
        { model: models.User, as: 'assignedTo', attributes: ['id', 'name'] },
        {
          model: models.Customer,
          as: 'customer',
          include: [{ model: models.CustomerTag, as: 'tags', through: { attributes: [] } }],
        },
      ],
    });
    return sendSuccess(res, serializeConversation(reloaded));
  } catch (err) {
    return next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const conv = await models.Conversation.findOne({
      where: { id: req.params.id, businessId },
    });
    if (!conv) throw AppError.notFound('Conversation not found');

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const where = { conversationId: conv.id, businessId };
    if (req.query.before) {
      where.id = { [Op.lt]: Number(req.query.before) };
    }

    const messages = await models.Message.findAll({
      where,
      include: [{ model: models.User, as: 'sentBy', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
      limit,
    });

    if (conv.unreadCount > 0) {
      await conv.update({ unreadCount: 0 });
    }

    return sendSuccess(res, messages.map(serializeMessage));
  } catch (err) {
    return next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    const conv = await models.Conversation.findOne({
      where: { id: req.params.id, businessId },
      include: [{ model: models.Customer, as: 'customer' }],
    });
    if (!conv) throw AppError.notFound('Conversation not found');

    const { body, type } = req.body;
    const now = new Date();

    if (type === 'note') {
      const noteMsg = await models.Message.create({
        businessId,
        conversationId: conv.id,
        sentByUserId: req.ctx.userId,
        direction: 'outbound',
        type: 'note',
        body,
        status: 'simulated',
        statusUpdatedAt: now,
      });
      const withSender = await models.Message.findByPk(noteMsg.id, {
        include: [{ model: models.User, as: 'sentBy', attributes: ['id', 'name'] }],
      });
      return sendSuccess(res, serializeMessage(withSender), 201);
    }

    // Check 24-hour customer service window for free-form text messages
    const TWENTY_FOUR_HOURS_MS = 24 * 3600 * 1000;
    if (!conv.lastInboundAt || now.getTime() - new Date(conv.lastInboundAt).getTime() > TWENTY_FOUR_HOURS_MS) {
      throw AppError.validation(
        'Outside the 24-hour WhatsApp customer service window. Please send an approved template message instead.',
        [{ field: 'body', message: '24-hour customer service window has expired; template required' }]
      );
    }

    await checkPlanLimit({ businessId, plan: req.ctx.plan, metric: 'messages', additional: 1 });

    const waCfg = await resolveWhatsAppConfig(businessId);
    const isSimulated = Boolean(conv.isDemo || !waCfg.configured);

    const msg = await models.Message.create({
      businessId,
      conversationId: conv.id,
      sentByUserId: req.ctx.userId,
      direction: 'outbound',
      type: 'text',
      body,
      status: isSimulated ? 'simulated' : 'queued',
      statusUpdatedAt: now,
    });

    await conv.update({
      lastMessageAt: now,
      lastMessagePreview: body.slice(0, 240),
    });

    if (conv.customer) {
      await conv.customer.update({ lastContactedAt: now });
    }

    if (!isSimulated) {
      await enqueueOutboundMessage({ messageId: msg.id });
    }

    const reloaded = await models.Message.findByPk(msg.id, {
      include: [{ model: models.User, as: 'sentBy', attributes: ['id', 'name'] }],
    });

    const serialized = serializeMessage(reloaded);
    emitToBusiness(businessId, 'message:new', serialized);

    return sendSuccess(res, serialized, 201);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  updateConversationSchema,
  sendMessageSchema,
  listConversations,
  getConversation,
  updateConversation,
  listMessages,
  sendMessage,
};
