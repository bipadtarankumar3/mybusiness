'use strict';

const models = require('../models');
const AppError = require('../utils/AppError');
const { getWhatsAppProvider, resolveWhatsAppConfig } = require('../integrations/whatsapp');
const { enqueueOutboundMessage } = require('../jobs/outboundQueue');

const SUPPORTED_TRIGGERS = ['new_conversation', 'keyword_received', 'tag_added'];
const SUPPORTED_CONDITIONS = ['business_hours', 'has_tag', 'lead_status_is'];
const SUPPORTED_ACTIONS = ['assign_member', 'send_reply', 'create_follow_up', 'update_lead_status', 'add_tag'];

function validateWorkflowGraph(definition) {
  if (!definition || typeof definition !== 'object') {
    throw AppError.validation('Workflow definition must be an object containing nodes and edges.');
  }
  const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
  const edges = Array.isArray(definition.edges) ? definition.edges : [];

  if (nodes.length === 0) {
    throw AppError.validation('Workflow must contain at least one trigger and one action node.');
  }

  const triggers = [];
  const actions = [];
  const nodeMap = new Map();

  for (const n of nodes) {
    if (!n || !n.id || !n.type) {
      throw AppError.validation('Every workflow node must have an id and type.');
    }
    if (nodeMap.has(n.id)) {
      throw AppError.validation(`Duplicate workflow node id "${n.id}".`);
    }
    nodeMap.set(n.id, n);

    if (SUPPORTED_TRIGGERS.includes(n.type)) {
      triggers.push(n);
    } else if (SUPPORTED_CONDITIONS.includes(n.type)) {
      // valid condition
    } else if (SUPPORTED_ACTIONS.includes(n.type)) {
      actions.push(n);
    } else {
      throw AppError.validation(`Unsupported workflow node type "${n.type}".`);
    }
  }

  if (triggers.length !== 1) {
    throw AppError.validation(`Workflow must have exactly one trigger node (found ${triggers.length}).`);
  }

  if (actions.length === 0) {
    throw AppError.validation('Workflow must include at least one action node.');
  }

  // Verify connectivity from the trigger node
  const adjacency = new Map();
  for (const id of nodeMap.keys()) adjacency.set(id, []);
  for (const e of edges) {
    const from = e.from || e.source;
    const to = e.to || e.target;
    if (!from || !to || !nodeMap.has(from) || !nodeMap.has(to)) {
      throw AppError.validation('Workflow edge references an unknown node id.');
    }
    adjacency.get(from).push(to);
  }

  const visited = new Set();
  const queue = [triggers[0].id];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    for (const nextId of adjacency.get(curr) || []) {
      if (!visited.has(nextId)) queue.push(nextId);
    }
  }

  if (visited.size !== nodeMap.size) {
    throw AppError.validation('All workflow nodes must be connected to the trigger node.');
  }

  return {
    triggerNode: triggers[0],
  };
}

function isWithinBusinessHours(business) {
  const bh = business?.businessHours;
  if (!bh || typeof bh !== 'object') return true;
  if (bh.alwaysOpen === true) return true;
  if (bh.alwaysClosed === true) return false;
  return true;
}

async function evaluateCondition(node, { business, customer }) {
  const cfg = node.config || {};
  if (node.type === 'business_hours') {
    return isWithinBusinessHours(business);
  }
  if (node.type === 'lead_status_is') {
    return customer && customer.leadStatus === cfg.status;
  }
  if (node.type === 'has_tag') {
    if (!customer || !cfg.tagId) return false;
    const mapping = await models.CustomerTagMapping.findOne({
      where: { businessId: customer.businessId, customerId: customer.id, tagId: Number(cfg.tagId) },
    });
    return Boolean(mapping);
  }
  return true;
}

async function executeAction(node, { business, conversation, customer }) {
  const cfg = node.config || {};
  const businessId = business.id;

  if (node.type === 'assign_member') {
    let targetUserId = cfg.userId ? Number(cfg.userId) : null;
    if (!targetUserId) {
      const members = await models.BusinessMember.findAll({
        where: { businessId, status: 'active' },
        order: [['id', 'ASC']],
      });
      if (members.length > 0) {
        targetUserId = members[0].userId;
      }
    }
    if (targetUserId && conversation) {
      await conversation.update({ assignedToUserId: targetUserId });
    }
    return { assignedToUserId: targetUserId };
  }

  if (node.type === 'send_reply') {
    const replyText = cfg.text || 'Thank you for contacting us! We will get back to you shortly.';
    if (!conversation) return { skipped: 'no_conversation' };

    const waCfg = await resolveWhatsAppConfig(businessId);
    const isSimulated = Boolean(conversation.isDemo || business.isDemo || !waCfg.configured);
    const msg = await models.Message.create({
      businessId,
      conversationId: conversation.id,
      direction: 'outbound',
      type: 'text',
      body: replyText,
      status: isSimulated ? 'simulated' : 'queued',
      metadata: { automatedByWorkflow: true },
    });
    await conversation.update({
      lastMessageAt: new Date(),
      lastMessagePreview: replyText.slice(0, 240),
    });
    if (!isSimulated) {
      await enqueueOutboundMessage({ messageId: msg.id });
    } else {
      const provider = await getWhatsAppProvider(businessId);
      await provider.sendText({ to: customer?.phone, body: replyText });
    }
    return { messageId: msg.id, status: msg.status };
  }

  if (node.type === 'create_follow_up') {
    if (!customer) return { skipped: 'no_customer' };
    const delayHours = Number(cfg.delayHours || 4);
    const dueAt = new Date(Date.now() + delayHours * 3600 * 1000);
    const reminder = await models.FollowUpReminder.create({
      businessId,
      customerId: customer.id,
      assignedToUserId: conversation?.assignedToUserId || null,
      title: cfg.title || 'Automated workflow follow-up',
      notes: cfg.notes || 'Created automatically by workflow',
      dueAt,
      status: 'pending',
    });
    return { followUpId: reminder.id };
  }

  if (node.type === 'update_lead_status') {
    if (customer && cfg.status && models.Customer.LEAD_STATUSES.includes(cfg.status)) {
      await customer.update({ leadStatus: cfg.status });
      return { leadStatus: cfg.status };
    }
    return { skipped: 'invalid_status' };
  }

  if (node.type === 'add_tag') {
    if (customer && cfg.tagId) {
      const tag = await models.CustomerTag.findOne({ where: { id: Number(cfg.tagId), businessId } });
      if (tag) {
        await models.CustomerTagMapping.findOrCreate({
          where: { businessId, customerId: customer.id, tagId: tag.id },
          defaults: { businessId, customerId: customer.id, tagId: tag.id },
        });
        return { tagId: tag.id };
      }
    }
    return { skipped: 'tag_not_found' };
  }

  return {};
}

async function runWorkflowsForEvent({ businessId, triggerType, conversation = null, customer = null, message = null, tagId = null }) {
  const workflows = await models.Workflow.findAll({
    where: { businessId, status: 'published', triggerType },
  });
  if (!workflows.length) return [];

  const business = await models.Business.findByPk(businessId);
  const executions = [];

  for (const wf of workflows) {
    const def = wf.definition || {};
    const nodes = Array.isArray(def.nodes) ? def.nodes : [];
    const edges = Array.isArray(def.edges) ? def.edges : [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const triggerNode = nodes.find((n) => SUPPORTED_TRIGGERS.includes(n.type));
    if (!triggerNode) continue;

    const trigCfg = triggerNode.config || wf.triggerConfig || {};
    if (triggerType === 'keyword_received') {
      const keywords = Array.isArray(trigCfg.keywords) ? trigCfg.keywords : [];
      const bodyLower = String(message?.body || '').toLowerCase();
      if (keywords.length > 0 && !keywords.some((kw) => bodyLower.includes(String(kw).toLowerCase().trim()))) {
        continue;
      }
    }
    if (triggerType === 'tag_added' && trigCfg.tagId) {
      if (Number(trigCfg.tagId) !== Number(tagId)) continue;
    }

    const adjacency = new Map();
    for (const n of nodes) adjacency.set(n.id, []);
    for (const e of edges) {
      const from = e.from || e.source;
      const to = e.to || e.target;
      if (adjacency.has(from)) adjacency.get(from).push(to);
    }

    const log = [{ nodeId: triggerNode.id, type: triggerNode.type, outcome: 'triggered' }];
    let execStatus = 'completed';

    const queue = [...(adjacency.get(triggerNode.id) || [])];
    const visited = new Set([triggerNode.id]);

    try {
      while (queue.length > 0) {
        const currId = queue.shift();
        if (visited.has(currId)) continue;
        visited.add(currId);
        const node = nodeMap.get(currId);
        if (!node) continue;

        if (SUPPORTED_CONDITIONS.includes(node.type)) {
          const passed = await evaluateCondition(node, { business, customer, conversation });
          log.push({ nodeId: node.id, type: node.type, outcome: passed });
          if (!passed) {
            execStatus = 'skipped';
            break;
          }
        } else if (SUPPORTED_ACTIONS.includes(node.type)) {
          const res = await executeAction(node, { business, conversation, customer });
          log.push({ nodeId: node.id, type: node.type, outcome: 'executed', details: res });
        }

        for (const nextId of adjacency.get(currId) || []) {
          if (!visited.has(nextId)) queue.push(nextId);
        }
      }
    } catch (err) {
      execStatus = 'failed';
      log.push({ error: err.message });
    }

    const execRecord = await models.WorkflowExecution.create({
      businessId,
      workflowId: wf.id,
      conversationId: conversation?.id || null,
      customerId: customer?.id || null,
      triggerType,
      status: execStatus,
      log,
      startedAt: new Date(),
      finishedAt: new Date(),
    });
    await wf.increment('executionCount', { by: 1 });
    executions.push(execRecord);
  }

  return executions;
}

module.exports = {
  SUPPORTED_TRIGGERS,
  SUPPORTED_CONDITIONS,
  SUPPORTED_ACTIONS,
  validateWorkflowGraph,
  runWorkflowsForEvent,
};
