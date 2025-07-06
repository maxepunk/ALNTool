const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.constructor.name,
        ...(err.errors && { errors: err.errors })
      }
    });
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: err.errors
      }
    });
  }

  // Handle Notion API errors
  if (err.name === 'NotionAPIError') {
    return res.status(err.status || 503).json({
      success: false,
      error: {
        message: 'Notion API error',
        code: 'NOTION_API_ERROR',
        details: err.message
      }
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('SQLITE')) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR'
      }
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
}

/**
 * Async route handler wrapper to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler
};