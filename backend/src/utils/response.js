'use strict';

function parsePagination(query = {}, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function sendSuccess(res, data, status = 200, meta = undefined) {
  const payload = { data };
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
}

module.exports = { parsePagination, buildMeta, sendSuccess };
