const express = require('express');
const notionController = require('../controllers/notionController');

const router = express.Router();

// Database metadata endpoint - useful for frontend configuration
router.get('/metadata', notionController.getDatabasesMetadata);

// Character routes
router.get('/characters', notionController.getCharacters);
router.get('/characters/with-warnings', notionController.getCharactersWithWarnings);
router.get('/characters/:id/graph', notionController.getCharacterGraph);
router.get('/characters/:id', notionController.getCharacterById);

// Timeline routes
router.get('/timeline', notionController.getTimelineEvents);
router.get('/timeline/:id', notionController.getTimelineEventById);
router.get('/timeline/:id/graph', notionController.getTimelineGraph);

// Puzzle routes
router.get('/puzzles', notionController.getPuzzles);
router.get('/puzzles/with-warnings', notionController.getPuzzlesWithWarnings);
router.get('/puzzles/:id/graph', notionController.getPuzzleGraph);
router.get('/puzzles/:id/flowgraph', notionController.getPuzzleFlowGraph); // New endpoint for graph data
router.get('/puzzles/:id', notionController.getPuzzleById);

// Element routes
router.get('/elements', notionController.getElements);
router.get('/elements/with-warnings', notionController.getElementsWithWarnings);
router.get('/elements/:id/graph', notionController.getElementGraph);
router.get('/elements/:id', notionController.getElementById);

// Global search endpoint
router.get('/search', notionController.globalSearch);

// Manual cache clear endpoint
router.post('/cache/clear', notionController.clearCache);

module.exports = router; 