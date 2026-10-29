'use strict';

const models = require('../models');

async function logActivity({ businessId, actorUserId = null, type, description, entityType = null, entityId = null, metadata = null, transaction }) {
  try {
    return await models.ActivityLog.create(
      {
        businessId,
        actorUserId,
        type,
        description,
        entityType,
        entityId,
        metadata,
      },
      transaction ? { transaction } : undefined
    );
  } catch (_err) {
    return null;
  }
}

module.exports = { logActivity };
