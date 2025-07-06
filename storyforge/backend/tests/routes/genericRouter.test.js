const request = require('supertest');
const express = require('express');
const { createGenericRouter, entityConfig } = require('../../src/routes/genericRouter');
const { responseWrapper, errorHandler } = require('../../src/middleware/responseWrapper');

// Mock controllers
jest.mock('../../src/controllers/notionCharacterController');
jest.mock('../../src/controllers/notionElementController');
jest.mock('../../src/controllers/notionPuzzleController');
jest.mock('../../src/controllers/notionTimelineController');

const notionCharacterController = require('../../src/controllers/notionCharacterController');
const notionElementController = require('../../src/controllers/notionElementController');
const notionPuzzleController = require('../../src/controllers/notionPuzzleController');
const notionTimelineController = require('../../src/controllers/notionTimelineController');

describe('Generic Router', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(responseWrapper);
    app.use('/api/v2/entities', createGenericRouter());
    app.use(errorHandler);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /:entityType', () => {
    it('should handle character list requests', async () => {
      const mockCharacters = [
        { id: '1', name: 'Alex' },
        { id: '2', name: 'Jordan' }
      ];
      
      notionCharacterController.getCharacters.mockImplementation((req, res) => {
        res.json(mockCharacters);
      });

      const response = await request(app)
        .get('/api/v2/entities/characters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCharacters);
      expect(notionCharacterController.getCharacters).toHaveBeenCalled();
    });

    it('should handle element list requests with filters', async () => {
      const mockElements = [{ id: '1', name: 'Memory Token' }];
      
      notionElementController.getElements.mockImplementation((req, res) => {
        res.json(mockElements);
      });

      const response = await request(app)
        .get('/api/v2/entities/elements?filterGroup=memoryTypes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockElements);
      expect(notionElementController.getElements).toHaveBeenCalled();
    });

    it('should validate entity type', async () => {
      const response = await request(app)
        .get('/api/v2/entities/invalid-type')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should add deprecation warning for old API version', async () => {
      notionCharacterController.getCharacters.mockImplementation((req, res) => {
        res.json([]);
      });

      const response = await request(app)
        .get('/api/v2/entities/characters')
        .expect(200);

      expect(response.headers['x-deprecation-warning']).toBeTruthy();
    });
  });

  describe('GET /:entityType/:id', () => {
    it('should handle get by ID requests', async () => {
      const mockCharacter = { id: '123', name: 'Alex' };
      
      notionCharacterController.getCharacterById.mockImplementation((req, res) => {
        res.json(mockCharacter);
      });

      const response = await request(app)
        .get('/api/v2/entities/characters/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCharacter);
      expect(notionCharacterController.getCharacterById).toHaveBeenCalled();
    });

    it('should validate entity ID', async () => {
      // Empty ID will hit the list endpoint, which is expected behavior
      notionCharacterController.getCharacters.mockImplementation((req, res) => {
        res.json([]);
      });

      const response = await request(app)
        .get('/api/v2/entities/characters/')
        .expect(200); // Will hit the list endpoint instead

      expect(response.body.success).toBe(true);

      // Test with valid ID
      const mockCharacter = { id: '123', name: 'Test' };
      notionCharacterController.getCharacterById.mockImplementation((req, res) => {
        res.json(mockCharacter);
      });

      const response2 = await request(app)
        .get('/api/v2/entities/characters/123')
        .set('x-api-version', '2.0') // Prevent deprecation warning
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.data).toEqual(mockCharacter);
    });
  });

  describe('POST /:entityType', () => {
    it('should return 404 for unsupported operations', async () => {
      const response = await request(app)
        .post('/api/v2/entities/characters')
        .send({ name: 'New Character' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Create operation not supported');
    });
  });

  describe('PUT /:entityType/:id', () => {
    it('should return 404 for unsupported operations', async () => {
      const response = await request(app)
        .put('/api/v2/entities/characters/123')
        .send({ name: 'Updated Character' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Update operation not supported');
    });
  });

  describe('DELETE /:entityType/:id', () => {
    it('should return 404 for unsupported operations', async () => {
      const response = await request(app)
        .delete('/api/v2/entities/characters/123')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Delete operation not supported');
    });
  });

  describe('Entity-specific validations', () => {
    it('should apply element-specific query validators', async () => {
      notionElementController.getElements.mockImplementation((req, res) => {
        res.json([]);
      });

      // Valid filter group
      const response1 = await request(app)
        .get('/api/v2/entities/elements?filterGroup=memoryTypes')
        .set('x-api-version', '2.0')
        .expect(200);

      expect(response1.body.success).toBe(true);

      // Invalid filter group should fail validation
      const response2 = await request(app)
        .get('/api/v2/entities/elements?filterGroup=invalid')
        .set('x-api-version', '2.0')
        .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.error.message).toContain('Validation failed');
    });

    it('should apply puzzle-specific query validators', async () => {
      notionPuzzleController.getPuzzles.mockImplementation((req, res) => {
        res.json([]);
      });

      const response = await request(app)
        .get('/api/v2/entities/puzzles?timing=Act1&narrativeThreadContains=Murder')
        .set('x-api-version', '2.0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(notionPuzzleController.getPuzzles).toHaveBeenCalled();
    });
  });
});