'use strict';

const { z } = require('zod');
const models = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { checkPlanLimit } = require('../services/usageService');
const { validateWorkflowGraph, SUPPORTED_TRIGGERS } = require('../services/workflowEngine');
const { logActivity } = require('../services/activityService');

const workflowSchema = z.object({
  name: z.string().trim().min(2, 'Workflow name is required').max(150),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['draft', 'published', 'paused']).optional(),
  trigger: z
    .object({
      type: z.string(),
      config: z.record(z.any()).optional(),
    })
    .optional(),
  definition: z.object({
    nodes: z.array(z.record(z.any())),
    edges: z.array(z.record(z.any())),
  }),
});

const updateWorkflowSchema = workflowSchema.partial();

function serializeWorkflow(w) {
  return {
    id: Number(w.id),
    name: w.name,
    description: w.description || '',
    status: w.status,
    trigger: {
      type: w.triggerType || 'new_conversation',
      config: w.triggerConfig || {},
    },
    definition: w.definition || { nodes: [], edges: [] },
    publishedAt: w.publishedAt,
    executionCount: Number(w.executionCount || 0),
    isDemo: Boolean(w.isDemo),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

function extractTriggerFromDefinition(definition, fallbackTrigger) {
  const nodes = Array.isArray(definition?.nodes) ? definition.nodes : [];
  const trigNode = nodes.find((n) => SUPPORTED_TRIGGERS.includes(n?.type));
  if (trigNode) {
    return {
      triggerType: trigNode.type,
      triggerConfig: trigNode.config || {},
    };
  }
  return {
    triggerType: fallbackTrigger?.type || 'new_conversation',
    triggerConfig: fallbackTrigger?.config || {},
  };
}

async function listWorkflows(req, res, next) {
  try {
    const workflows = await models.Workflow.findAll({
      where: { businessId: req.ctx.businessId },
      order: [['createdAt', 'DESC']],
    });
    return sendSuccess(res, workflows.map(serializeWorkflow));
  } catch (err) {
    return next(err);
  }
}

async function createWorkflow(req, res, next) {
  try {
    const businessId = req.ctx.businessId;
    await checkPlanLimit({ businessId, plan: req.ctx.plan, metric: 'workflows', additional: 1 });

    const { triggerType, triggerConfig } = extractTriggerFromDefinition(req.body.definition, req.body.trigger);

    const wf = await models.Workflow.create({
      businessId,
      createdByUserId: req.ctx.userId,
      name: req.body.name.trim(),
      description: req.body.description || null,
      status: 'draft',
      triggerType,
      triggerConfig,
      definition: req.body.definition,
      executionCount: 0,
      isDemo: false,
    });

    return sendSuccess(res, serializeWorkflow(wf), 201);
  } catch (err) {
    return next(err);
  }
}

async function getWorkflow(req, res, next) {
  try {
    const wf = await models.Workflow.findOne({
      where: { id: req.params.id, businessId: req.ctx.businessId },
    });
    if (!wf) throw AppError.notFound('Workflow not found');
    return sendSuccess(res, serializeWorkflow(wf));
  } catch (err) {
    return next(err);
  }
}

async function updateWorkflow(req, res, next) {
  try {
    const wf = await models.Workflow.findOne({
      where: { id: req.params.id, businessId: req.ctx.businessId },
    });
    if (!wf) throw AppError.notFound('Workflow not found');

    const patch = {};
    if (req.body.name !== undefined) patch.name = req.body.name.trim();
    if (req.body.description !== undefined) patch.description = req.body.description;
    if (req.body.status !== undefined) {
      if (req.body.status === 'published') {
        const def = req.body.definition !== undefined ? req.body.definition : wf.definition;
        const { triggerNode } = validateWorkflowGraph(def);
        patch.triggerType = triggerNode.type;
        patch.triggerConfig = triggerNode.config || {};
        patch.publishedAt = new Date();
      }
      patch.status = req.body.status;
    }
    if (req.body.definition !== undefined) {
      patch.definition = req.body.definition;
      const extracted = extractTriggerFromDefinition(req.body.definition, req.body.trigger);
      patch.triggerType = extracted.triggerType;
      patch.triggerConfig = extracted.triggerConfig;
    }

    await wf.update(patch);
    return sendSuccess(res, serializeWorkflow(wf));
  } catch (err) {
    return next(err);
  }
}

async function publishWorkflow(req, res, next) {
  try {
    const wf = await models.Workflow.findOne({
      where: { id: req.params.id, businessId: req.ctx.businessId },
    });
    if (!wf) throw AppError.notFound('Workflow not found');

    const { triggerNode } = validateWorkflowGraph(wf.definition);

    await wf.update({
      status: 'published',
      triggerType: triggerNode.type,
      triggerConfig: triggerNode.config || {},
      publishedAt: new Date(),
    });

    await logActivity({
      businessId: req.ctx.businessId,
      actorUserId: req.ctx.userId,
      type: 'workflow.published',
      description: `Published workflow "${wf.name}"`,
      entityType: 'workflow',
      entityId: wf.id,
    });

    return sendSuccess(res, serializeWorkflow(wf));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  workflowSchema,
  updateWorkflowSchema,
  listWorkflows,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  publishWorkflow,
};
