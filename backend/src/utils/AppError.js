'use strict';

class AppError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static validation(message, details) {
    return new AppError('VALIDATION_ERROR', message, 422, details);
  }

  static unauthenticated(message = 'Authentication required') {
    return new AppError('UNAUTHENTICATED', message, 401);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError('FORBIDDEN', message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError('NOT_FOUND', message, 404);
  }

  static conflict(message = 'Resource conflict') {
    return new AppError('CONFLICT', message, 409);
  }

  static rateLimited(message = 'Too many requests, please try again later') {
    return new AppError('RATE_LIMITED', message, 429);
  }

  static notConfigured(message = 'Integration is not configured') {
    return new AppError('NOT_CONFIGURED', message, 409);
  }

  static planLimit(message = 'Plan limit reached. Please upgrade your subscription.') {
    return new AppError('PLAN_LIMIT', message, 402);
  }
}

module.exports = AppError;
