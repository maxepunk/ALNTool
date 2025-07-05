const logger = require('../utils/logger');

/**
 * Response Wrapper Middleware
 * Standardizes all API responses to a consistent format:
 * 
 * Success response:
 * {
 *   success: true,
 *   data: <response data>,
 *   message: <optional success message>
 * }
 * 
 * Error response:
 * {
 *   success: false,
 *   error: {
 *     message: <error message>,
 *     code: <optional error code>,
 *     details: <optional error details>
 *   }
 * }
 */

/**
 * Wraps Express response methods to ensure consistent response format
 */
function responseWrapper(req, res, next) {
  // Save original json method
  const originalJson = res.json.bind(res);

  // Override json method
  res.json = function(data) {
    // If response already has our format, pass through
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson(data);
    }

    // Check if this is an error response (status >= 400)
    const isError = res.statusCode >= 400;

    if (isError) {
      // Standardize error response
      const errorResponse = {
        success: false,
        error: {
          message: data?.message || data?.error || 'An error occurred',
          code: data?.code || res.statusCode,
          details: data?.details || undefined
        }
      };
      
      // Log error
      logger.error('API Error:', {
        path: req.path,
        method: req.method,
        status: res.statusCode,
        error: errorResponse.error
      });

      return originalJson(errorResponse);
    }

    // Standardize success response
    const successResponse = {
      success: true,
      data: data,
      message: data?.message || undefined
    };

    // Remove message from data if it exists to avoid duplication
    if (data?.message && typeof data === 'object') {
      delete data.message;
      // If data only had a message, set data to null
      if (Object.keys(data).length === 0) {
        successResponse.data = null;
      }
    }

    return originalJson(successResponse);
  };

  // Add helper methods for common responses
  res.success = function(data, message) {
    return res.json({
      success: true,
      data: data,
      message: message
    });
  };

  res.error = function(message, code = 500, details = null) {
    res.status(code);
    return res.json({
      success: false,
      error: {
        message: message,
        code: code,
        details: details
      }
    });
  };

  next();
}

/**
 * Error handler middleware to catch and format errors
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Unhandled error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: statusCode,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
}

module.exports = {
  responseWrapper,
  errorHandler
};