const express = require('express');
const notionCharacterController = require('../controllers/notionCharacterController');
const notionTimelineController = require('../controllers/notionTimelineController');
const notionPuzzleController = require('../controllers/notionPuzzleController');
const notionElementController = require('../controllers/notionElementController');
const notionGeneralController = require('../controllers/notionGeneralController');
const { 
  characterValidators, 
  elementValidators, 
  puzzleValidators, 
  timelineValidators, 
  searchValidators 
} = require('../middleware/validators');

const router = express.Router();

// Database metadata endpoint - useful for frontend configuration
router.get('/metadata', notionGeneralController.getDatabasesMetadata);

// Game constants endpoint - provides all business rules to frontend
router.get('/game-constants', notionGeneralController.getGameConstants);

// Character routes
router.get('/characters', notionCharacterController.getCharacters);
router.get('/characters/with-warnings', notionCharacterController.getCharactersWithWarnings);
router.get('/characters/with-sociogram-data', notionCharacterController.getCharactersWithSociogramData); // New endpoint for Memory Economy
router.get('/character-links', notionCharacterController.getAllCharacterLinks); // All character relationship links
router.get('/characters/:id/graph', characterValidators.getById, notionCharacterController.getCharacterGraph);
router.get('/characters/:id', characterValidators.getById, notionCharacterController.getCharacterById);

// Timeline routes
router.get('/timeline', notionTimelineController.getTimelineEvents);
router.get('/timeline/list', notionTimelineController.getTimelineEventsList); // Database-backed for dashboard
router.get('/timeline/:id', timelineValidators.getById, notionTimelineController.getTimelineEventById);
router.get('/timeline/:id/graph', timelineValidators.getById, notionTimelineController.getTimelineGraph);

// Puzzle routes
router.get('/puzzles', puzzleValidators.getList, notionPuzzleController.getPuzzles);
router.get('/puzzles/with-warnings', notionPuzzleController.getPuzzlesWithWarnings);
router.get('/puzzles/:id/graph', puzzleValidators.getById, notionPuzzleController.getPuzzleGraph);
router.get('/puzzles/:id/flow', puzzleValidators.getById, notionPuzzleController.getPuzzleFlow); // Flow data endpoint
router.get('/puzzles/:id/flowgraph', puzzleValidators.getById, notionPuzzleController.getPuzzleFlowGraph); // Graph visualization endpoint
router.get('/puzzles/:id', puzzleValidators.getById, notionPuzzleController.getPuzzleById);

// Element routes
router.get('/elements', elementValidators.getList, notionElementController.getElements);
router.get('/elements/with-warnings', notionElementController.getElementsWithWarnings);
router.get('/elements/:id/graph', elementValidators.getById, notionElementController.getElementGraph);
router.get('/elements/:id', elementValidators.getById, notionElementController.getElementById);

// Narrative threads routes
router.get('/narrative-threads/unique', notionGeneralController.getAllUniqueNarrativeThreads);
router.get('/narrative-threads', notionGeneralController.getAllUniqueNarrativeThreads); // For now, use same endpoint

// Global search endpoint
router.get('/search', searchValidators.globalSearch, notionGeneralController.globalSearch);

// Manual cache clear endpoint
router.post('/cache/clear', notionGeneralController.clearCache);

module.exports = router;