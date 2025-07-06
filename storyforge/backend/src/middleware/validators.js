const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

/**
 * Character validation rules
 */
const characterValidators = {
  getById: [
    param('id').isString().notEmpty().withMessage('Character ID is required'),
    handleValidationErrors
  ]
};

/**
 * Element validation rules
 */
const elementValidators = {
  getById: [
    param('id').isString().notEmpty().withMessage('Element ID is required'),
    handleValidationErrors
  ],
  getList: [
    query('filterGroup').optional().isIn(['memoryTypes']).withMessage('Invalid filter group'),
    query('basicType').optional().isString().withMessage('Basic type must be a string'),
    query('status').optional().isString().withMessage('Status must be a string'),
    query('location').optional().isString().withMessage('Location must be a string'),
    handleValidationErrors
  ]
};

/**
 * Puzzle validation rules
 */
const puzzleValidators = {
  getById: [
    param('id').isString().notEmpty().withMessage('Puzzle ID is required'),
    handleValidationErrors
  ],
  getList: [
    query('timing').optional().isString().withMessage('Timing must be a string'),
    query('narrativeThreadContains').optional().isString().withMessage('Narrative thread must be a string'),
    handleValidationErrors
  ]
};

/**
 * Timeline validation rules
 */
const timelineValidators = {
  getById: [
    param('id').isString().notEmpty().withMessage('Timeline event ID is required'),
    handleValidationErrors
  ]
};

/**
 * Search validation rules
 */
const searchValidators = {
  globalSearch: [
    query('query').isString().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
    handleValidationErrors
  ]
};

/**
 * Sync validation rules
 */
const syncValidators = {
  startSync: [
    body('force').optional().isBoolean().withMessage('Force parameter must be a boolean'),
    handleValidationErrors
  ]
};

module.exports = {
  characterValidators,
  elementValidators,
  puzzleValidators,
  timelineValidators,
  searchValidators,
  syncValidators,
  handleValidationErrors
};