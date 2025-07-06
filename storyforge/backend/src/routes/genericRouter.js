const express = require('express');
const { param, query, body, validationResult } = require('express-validator');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

// Import controllers
const notionCharacterController = require('../controllers/notionCharacterController');
const notionTimelineController = require('../controllers/notionTimelineController');
const notionPuzzleController = require('../controllers/notionPuzzleController');
const notionElementController = require('../controllers/notionElementController');

/**
 * Entity configuration mapping
 */
const entityConfig = {
  characters: {
    controller: notionCharacterController,
    singularName: 'character',
    idField: 'id',
    listMethod: 'getCharacters',
    getByIdMethod: 'getCharacterById',
    createMethod: null, // Not implemented yet
    updateMethod: null, // Not implemented yet
    deleteMethod: null, // Not implemented yet
    validators: {
      list: [],
      getById: [
        param('id').isString().notEmpty().withMessage('Character ID is required')
      ]
    }
  },
  elements: {
    controller: notionElementController,
    singularName: 'element',
    idField: 'id',
    listMethod: 'getElements',
    getByIdMethod: 'getElementById',
    createMethod: null,
    updateMethod: null,
    deleteMethod: null,
    validators: {
      list: [
        query('filterGroup').optional().isIn(['memoryTypes']).withMessage('Invalid filter group'),
        query('basicType').optional().isString().withMessage('Basic type must be a string'),
        query('status').optional().isString().withMessage('Status must be a string'),
        query('location').optional().isString().withMessage('Location must be a string')
      ],
      getById: [
        param('id').isString().notEmpty().withMessage('Element ID is required')
      ]
    }
  },
  puzzles: {
    controller: notionPuzzleController,
    singularName: 'puzzle',
    idField: 'id',
    listMethod: 'getPuzzles',
    getByIdMethod: 'getPuzzleById',
    createMethod: null,
    updateMethod: null,
    deleteMethod: null,
    validators: {
      list: [
        query('timing').optional().isString().withMessage('Timing must be a string'),
        query('narrativeThreadContains').optional().isString().withMessage('Narrative thread must be a string')
      ],
      getById: [
        param('id').isString().notEmpty().withMessage('Puzzle ID is required')
      ]
    }
  },
  timeline: {
    controller: notionTimelineController,
    singularName: 'timeline event',
    idField: 'id',
    listMethod: 'getTimelineEvents',
    getByIdMethod: 'getTimelineEventById',
    createMethod: null,
    updateMethod: null,
    deleteMethod: null,
    validators: {
      list: [],
      getById: [
        param('id').isString().notEmpty().withMessage('Timeline event ID is required')
      ]
    }
  }
};

/**
 * Validation error handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

/**
 * Create a generic CRUD router for a given entity type
 */
function createGenericRouter() {
  const router = express.Router();

  // GET /:entityType - List all entities
  router.get('/:entityType', 
    param('entityType').isIn(Object.keys(entityConfig)).withMessage('Invalid entity type'),
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const { entityType } = req.params;
        const config = entityConfig[entityType];
        
        // Apply entity-specific validators
        const validators = config.validators.list || [];
        for (const validator of validators) {
          await validator.run(req);
        }
        handleValidationErrors(req, res, () => {});

        // Call the appropriate controller method
        if (!config.listMethod || !config.controller[config.listMethod]) {
          throw new NotFoundError(`List operation not supported for ${entityType}`);
        }

        // Log deprecated route usage
        if (req.headers['x-api-version'] !== '2.0') {
          logger.warn(`Deprecated route usage: GET /${entityType} - Use generic API instead`);
          res.setHeader('X-Deprecation-Warning', 'This endpoint pattern is deprecated. Use /api/v2/entities endpoints.');
        }

        return config.controller[config.listMethod](req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /:entityType/:id - Get entity by ID
  router.get('/:entityType/:id',
    param('entityType').isIn(Object.keys(entityConfig)).withMessage('Invalid entity type'),
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const { entityType } = req.params;
        const config = entityConfig[entityType];
        
        // Apply entity-specific validators
        const validators = config.validators.getById || [];
        for (const validator of validators) {
          await validator.run(req);
        }
        handleValidationErrors(req, res, () => {});

        // Call the appropriate controller method
        if (!config.getByIdMethod || !config.controller[config.getByIdMethod]) {
          throw new NotFoundError(`Get by ID operation not supported for ${entityType}`);
        }

        // Log deprecated route usage
        if (req.headers['x-api-version'] !== '2.0') {
          logger.warn(`Deprecated route usage: GET /${entityType}/:id - Use generic API instead`);
          res.setHeader('X-Deprecation-Warning', 'This endpoint pattern is deprecated. Use /api/v2/entities endpoints.');
        }

        return config.controller[config.getByIdMethod](req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /:entityType - Create new entity
  router.post('/:entityType',
    param('entityType').isIn(Object.keys(entityConfig)).withMessage('Invalid entity type'),
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const { entityType } = req.params;
        const config = entityConfig[entityType];

        if (!config.createMethod || !config.controller[config.createMethod]) {
          throw new NotFoundError(`Create operation not supported for ${entityType}`);
        }

        return config.controller[config.createMethod](req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /:entityType/:id - Update entity
  router.put('/:entityType/:id',
    param('entityType').isIn(Object.keys(entityConfig)).withMessage('Invalid entity type'),
    param('id').isString().notEmpty().withMessage('Entity ID is required'),
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const { entityType } = req.params;
        const config = entityConfig[entityType];

        if (!config.updateMethod || !config.controller[config.updateMethod]) {
          throw new NotFoundError(`Update operation not supported for ${entityType}`);
        }

        return config.controller[config.updateMethod](req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /:entityType/:id - Delete entity
  router.delete('/:entityType/:id',
    param('entityType').isIn(Object.keys(entityConfig)).withMessage('Invalid entity type'),
    param('id').isString().notEmpty().withMessage('Entity ID is required'),
    handleValidationErrors,
    async (req, res, next) => {
      try {
        const { entityType } = req.params;
        const config = entityConfig[entityType];

        if (!config.deleteMethod || !config.controller[config.deleteMethod]) {
          throw new NotFoundError(`Delete operation not supported for ${entityType}`);
        }

        return config.controller[config.deleteMethod](req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

module.exports = {
  createGenericRouter,
  entityConfig
};