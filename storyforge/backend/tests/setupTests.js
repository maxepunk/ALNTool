// This file runs before all tests in Jest

// Load environment variables for tests
require('dotenv').config({ path: '.env.test' });

// Add global test utilities or mocks here if needed
global.console = {
  ...console,
  // Make tests less noisy by not logging expected errors during tests
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Add helper for creating a test app
const express = require('express');
const notionController = require('../src/controllers/notionController');

// Factory to create a test app with direct controller bindings
global.createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Attach controller methods directly
  app.get('/api/puzzles', notionController.getPuzzles);
  app.get('/api/puzzles/:id', notionController.getPuzzleById);
  
  app.get('/api/characters', notionController.getCharacters);
  app.get('/api/characters/:id', notionController.getCharacterById);
  
  app.get('/api/timeline', notionController.getTimelineEvents);
  app.get('/api/timeline/:id', notionController.getTimelineEventById);
  
  app.get('/api/elements', notionController.getElements);
  app.get('/api/elements/:id', notionController.getElementById);
  
  app.get('/api/metadata', notionController.getDatabasesMetadata);
  
  return app;
}; 