const request = require('supertest');
const express = require('express');
const notionCharacterController = require('../../src/controllers/notionCharacterController');
const notionService = require('../../src/services/notionService');
const warningService = require('../../src/services/warningService');
const { getDB } = require('../../src/db/database');

// Mock dependencies
jest.mock('../../src/services/notionService', () => ({
  notionCache: {
    get: jest.fn(),
    set: jest.fn()
  },
  makeCacheKey: jest.fn(),
  getCharactersForList: jest.fn(),
  getCharacterById: jest.fn()
}));
jest.mock('../../src/services/warningService');
jest.mock('../../src/db/database');

describe('NotionCharacterController', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add routes directly for testing - order matters!
    app.get('/characters', notionCharacterController.getCharacters);
    app.get('/characters/with-warnings', notionCharacterController.getCharactersWithWarnings);
    app.get('/characters/:id', notionCharacterController.getCharacterById);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /characters', () => {
    it('should return a list of characters', async () => {
      const mockCharacters = [
        { id: '1', name: 'Alex Reeves' },
        { id: '2', name: 'Jordan Hayes' }
      ];
      
      notionService.getCharactersForList.mockResolvedValue(mockCharacters);
      
      const response = await request(app)
        .get('/characters')
        .expect(200);
      
      expect(response.body).toEqual(mockCharacters);
      expect(notionService.getCharactersForList).toHaveBeenCalledWith({});
    });

    it('should pass query parameters to the service', async () => {
      notionService.getCharactersForList.mockResolvedValue([]);
      
      await request(app)
        .get('/characters?status=Active')
        .expect(200);
      
      expect(notionService.getCharactersForList).toHaveBeenCalledWith({ status: 'Active' });
    });
  });

  describe('GET /characters/:id', () => {
    it('should return a character by ID', async () => {
      const mockCharacter = { 
        id: '123', 
        name: 'Alex Reeves',
        description: 'Test character'
      };
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('character-123');
      notionService.getCharacterById.mockResolvedValue(mockCharacter);
      
      const response = await request(app)
        .get('/characters/123')
        .expect(200);
      
      expect(response.body).toEqual(mockCharacter);
      expect(notionService.getCharacterById).toHaveBeenCalledWith('123');
    });

    it('should return 404 if character not found', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('character-456');
      notionService.getCharacterById.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/characters/456')
        .expect(404);
      
      expect(response.body).toEqual({ error: 'Character not found' });
    });

    it('should use cached data if available', async () => {
      const cachedCharacter = { id: '789', name: 'Cached Character' };
      
      notionService.notionCache.get.mockReturnValue(cachedCharacter);
      notionService.makeCacheKey.mockReturnValue('character-789');
      
      const response = await request(app)
        .get('/characters/789')
        .expect(200);
      
      expect(response.body).toEqual(cachedCharacter);
      expect(notionService.getCharacterById).not.toHaveBeenCalled();
    });
  });

  describe('GET /characters/with-warnings', () => {
    it('should return characters with warnings', async () => {
      const mockWarnings = [
        {
          id: '1',
          name: 'Alex Reeves',
          type: 'Character',
          warnings: [{ warningType: 'NoPuzzles', message: 'Character is not associated with any puzzles.' }]
        }
      ];
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('characters-warnings');
      warningService.getCharacterWarnings.mockResolvedValue(mockWarnings);
      
      const response = await request(app)
        .get('/characters/with-warnings')
        .expect(200);
      
      expect(response.body).toEqual(mockWarnings);
      expect(warningService.getCharacterWarnings).toHaveBeenCalled();
    });
  });
});