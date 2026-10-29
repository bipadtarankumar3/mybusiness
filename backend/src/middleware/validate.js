'use strict';

const AppError = require('../utils/AppError');

function formatZodIssues(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

function validateBody(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      const details = formatZodIssues(parsed.error);
      const firstMsg = details[0] ? `${details[0].field ? `${details[0].field}: ` : ''}${details[0].message}` : 'Invalid request payload';
      return next(AppError.validation(firstMsg, details));
    }
    req.body = parsed.data;
    return next();
  };
}

function validateQuery(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query || {});
    if (!parsed.success) {
      const details = formatZodIssues(parsed.error);
      return next(AppError.validation('Invalid query parameters', details));
    }
    req.query = parsed.data;
    return next();
  };
}

module.exports = { validateBody, validateQuery };
