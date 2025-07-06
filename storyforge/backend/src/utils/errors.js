/**
 * Base error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for validation failures
 */
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Error for resource not found
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Error for authentication failures
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Error for authorization failures
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

/**
 * Error for database operations
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

/**
 * Error for external service failures
 */
class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error', originalError = null) {
    super(`${service}: ${message}`, 503);
    this.service = service;
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ExternalServiceError
};