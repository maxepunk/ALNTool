const express = require('express');
const { createGenericRouter } = require('./genericRouter');
const notionCharacterController = require('../controllers/notionCharacterController');
const notionElementController = require('../controllers/notionElementController');
const notionGeneralController = require('../controllers/notionGeneralController');
const journeyController = require('../controllers/journeyController');
const dataSyncService = require('../services/dataSyncService');
const logger = require('../utils/logger');
const { searchValidators } = require('../middleware/validators');

const router = express.Router();

// Mount generic CRUD router for entity operations
router.use('/entities', createGenericRouter());

// Specialized routes that don't fit the CRUD pattern

// 1. Sync operations - POST /api/v2/sync/notion
router.post('/sync/notion', async (req, res, next) => {
  try {
    const status = dataSyncService.getSyncStatus();
    if (status.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Sync already in progress',
        message: 'A sync operation is already running'
      });
    }

    logger.debug('🔄 API sync request received');
    const result = await dataSyncService.syncAll();

    res.json({
      success: true,
      message: 'Sync completed successfully',
      stats: {
        phases: result.phases,
        totalDuration: result.totalDuration,
        status: result.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. Journey endpoint - GET /api/v2/journey/:characterId
router.get('/journey/:characterId', journeyController.getCharacterJourney);

// 3. Performance elements - GET /api/v2/elements/performance
router.get('/elements/performance', notionElementController.getElements);

// 4. Character links - GET /api/v2/characters/links
router.get('/characters/links', notionCharacterController.getAllCharacterLinks);

// 5. Relationships - GET /api/v2/relationships/:entityType/:entityId
router.get('/relationships/:entityType/:entityId', async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Route to appropriate controller based on entity type
    switch (entityType) {
      case 'characters':
        req.params.id = entityId;
        return notionCharacterController.getCharacterGraph(req, res, next);
      case 'elements':
        req.params.id = entityId;
        return notionElementController.getElementGraph(req, res, next);
      case 'puzzles':
        const notionPuzzleController = require('../controllers/notionPuzzleController');
        req.params.id = entityId;
        return notionPuzzleController.getPuzzleGraph(req, res, next);
      case 'timeline':
        const notionTimelineController = require('../controllers/notionTimelineController');
        req.params.id = entityId;
        return notionTimelineController.getTimelineGraph(req, res, next);
      default:
        return res.status(404).json({
          success: false,
          error: `Relationships not supported for entity type: ${entityType}`
        });
    }
  } catch (error) {
    next(error);
  }
});

// 6. Global search - GET /api/v2/search
router.get('/search', searchValidators.globalSearch, notionGeneralController.globalSearch);

// 7. Game metadata - GET /api/v2/metadata
router.get('/metadata', notionGeneralController.getDatabasesMetadata);

// 8. Game constants - GET /api/v2/constants
router.get('/constants', notionGeneralController.getGameConstants);

// 9. Cache management - POST /api/v2/cache/clear
router.post('/cache/clear', notionGeneralController.clearCache);

// 10. Sync status - GET /api/v2/sync/status
router.get('/sync/status', async (req, res, next) => {
  try {
    const syncResult = await dataSyncService.getSyncStatus();
    const status = syncResult.orchestratorStatus || { isRunning: false, progress: 0, startTime: null };

    res.json({
      success: true,
      ...status,
      counts: syncResult.counts || {},
      lastSync: syncResult.lastSync
    });
  } catch (error) {
    next(error);
  }
});

// 11. Entity warnings - GET /api/v2/warnings/:entityType
router.get('/warnings/:entityType', async (req, res, next) => {
  try {
    const { entityType } = req.params;
    
    switch (entityType) {
      case 'characters':
        return notionCharacterController.getCharactersWithWarnings(req, res, next);
      case 'elements':
        return notionElementController.getElementsWithWarnings(req, res, next);
      case 'puzzles':
        const notionPuzzleController = require('../controllers/notionPuzzleController');
        return notionPuzzleController.getPuzzlesWithWarnings(req, res, next);
      default:
        return res.status(404).json({
          success: false,
          error: `Warnings not supported for entity type: ${entityType}`
        });
    }
  } catch (error) {
    next(error);
  }
});

// 12. Specialized data views - GET /api/v2/views/:viewType
router.get('/views/:viewType', async (req, res, next) => {
  try {
    const { viewType } = req.params;
    
    switch (viewType) {
      case 'sociogram':
        return notionCharacterController.getCharactersWithSociogramData(req, res, next);
      case 'narrative-threads':
        return notionGeneralController.getAllUniqueNarrativeThreads(req, res, next);
      case 'timeline-list':
        const notionTimelineController = require('../controllers/notionTimelineController');
        return notionTimelineController.getTimelineEventsList(req, res, next);
      default:
        return res.status(404).json({
          success: false,
          error: `View type not supported: ${viewType}`
        });
    }
  } catch (error) {
    next(error);
  }
});

// 13. Puzzle flow analysis - GET /api/v2/analysis/puzzle-flow/:puzzleId
router.get('/analysis/puzzle-flow/:puzzleId', async (req, res, next) => {
  try {
    const notionPuzzleController = require('../controllers/notionPuzzleController');
    req.params.id = req.params.puzzleId;
    return notionPuzzleController.getPuzzleFlow(req, res, next);
  } catch (error) {
    next(error);
  }
});

// 14. Puzzle flow graph - GET /api/v2/analysis/puzzle-graph/:puzzleId
router.get('/analysis/puzzle-graph/:puzzleId', async (req, res, next) => {
  try {
    const notionPuzzleController = require('../controllers/notionPuzzleController');
    req.params.id = req.params.puzzleId;
    return notionPuzzleController.getPuzzleFlowGraph(req, res, next);
  } catch (error) {
    next(error);
  }
});

// 15. Health check - GET /api/v2/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v2 is healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;