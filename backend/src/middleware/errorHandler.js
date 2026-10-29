'use strict';

const AppError = require('../utils/AppError');

function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const body = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (err.details) body.error.details = err.details;
    return res.status(err.status).json(body);
  }

  if (err && err.name === 'SequelizeUniqueConstraintError') {
    const details = (err.errors || []).map((e) => ({ field: e.path, message: e.message }));
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: details[0]?.message || 'A record with these details already exists.',
        details,
      },
    });
  }

  if (err && err.name === 'SequelizeValidationError') {
    const details = (err.errors || []).map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: details[0]?.message || 'Validation failed.',
        details,
      },
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON body.',
      },
    });
  }

  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV !== 'test') console.error('[UnhandledError]', err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.',
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
