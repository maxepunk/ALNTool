const request = require('supertest');
const express = require('express');
const notionGeneralController = require('../../src/controllers/notionGeneralController');
const notionService = require('../../src/services/notionService');
const propertyMapper = require('../../src/utils/notionPropertyMapper');
const GameConstants = require('../../src/config/GameConstants');

// Mock dependencies
jest.mock('../../src/services/notionService', () => ({
  notionCache: {
    get: jest.fn(),
    set: jest.fn(),
    flushAll: jest.fn()
  },
  makeCacheKey: jest.fn(),
  getDatabasesMetadata: jest.fn(),
  searchDatabases: jest.fn(),
  getCharacters: jest.fn(),
  getElements: jest.fn(),
  getPuzzles: jest.fn(),
  getTimelineEvents: jest.fn()
}));
jest.mock('../../src/utils/notionPropertyMapper');
jest.mock('../../src/config/GameConstants', () => ({
  MEMORY_TYPES: ['Type1', 'Type2'],
  TOKEN_VALUES: { Type1: 100, Type2: 200 }
}));

describe('NotionGeneralController', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add routes directly for testing
    app.get('/databases/metadata', notionGeneralController.getDatabasesMetadata);
    app.get('/game/constants', notionGeneralController.getGameConstants);
    app.get('/search', notionGeneralController.globalSearch);
    app.post('/cache/clear', notionGeneralController.clearCache);
    app.get('/narrative-threads/unique', notionGeneralController.getAllUniqueNarrativeThreads);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /databases/metadata', () => {
    it('should return databases metadata', async () => {
      const mockMetadata = {
        Characters: { id: 'db1', properties: {} },
        Elements: { id: 'db2', properties: {} }
      };
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('metadata');
      notionService.getDatabasesMetadata.mockResolvedValue(mockMetadata);
      
      const response = await request(app)
        .get('/databases/metadata')
        .expect(200);
      
      expect(response.body).toEqual(mockMetadata);
      expect(notionService.getDatabasesMetadata).toHaveBeenCalled();
    });

    it('should use cached metadata if available', async () => {
      const cachedMetadata = {
        Characters: { id: 'db1', properties: {} },
        Elements: { id: 'db2', properties: {} }
      };
      
      notionService.notionCache.get.mockReturnValue(cachedMetadata);
      notionService.makeCacheKey.mockReturnValue('metadata');
      
      const response = await request(app)
        .get('/databases/metadata')
        .expect(200);
      
      expect(response.body).toEqual(cachedMetadata);
      expect(notionService.getDatabasesMetadata).not.toHaveBeenCalled();
    });
  });

  describe('GET /game/constants', () => {
    it('should return game constants', async () => {
      const response = await request(app)
        .get('/game/constants')
        .expect(200);
      
      expect(response.body).toEqual({
        MEMORY_TYPES: ['Type1', 'Type2'],
        TOKEN_VALUES: { Type1: 100, Type2: 200 }
      });
    });
  });

  describe('GET /search', () => {
    it('should return empty array for short queries', async () => {
      const response = await request(app)
        .get('/search?query=a')
        .expect(200);
      
      expect(response.body).toEqual([]);
      expect(notionService.searchDatabases).not.toHaveBeenCalled();
    });

    it('should return empty array for missing query', async () => {
      const response = await request(app)
        .get('/search')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('should search across all databases', async () => {
      const mockCharacters = [{ id: 'c1', properties: {} }];
      const mockElements = [{ id: 'e1', properties: {} }];
      const mockPuzzles = [{ id: 'p1', properties: {} }];
      const mockTimeline = [{ id: 't1', properties: {} }];
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('search-test');
      notionService.searchDatabases
        .mockResolvedValueOnce(mockCharacters)
        .mockResolvedValueOnce(mockElements)
        .mockResolvedValueOnce(mockPuzzles)
        .mockResolvedValueOnce(mockTimeline);
      
      propertyMapper.mapCharacterWithNames.mockResolvedValue({ id: 'c1', name: 'Character 1' });
      propertyMapper.mapElementWithNames.mockResolvedValue({ id: 'e1', name: 'Element 1' });
      propertyMapper.mapPuzzleWithNames.mockResolvedValue({ id: 'p1', name: 'Puzzle 1' });
      propertyMapper.mapTimelineEventWithNames.mockResolvedValue({ id: 't1', name: 'Timeline 1' });
      
      const response = await request(app)
        .get('/search?query=test')
        .expect(200);
      
      expect(response.body).toHaveLength(4);
      expect(response.body[0]).toHaveProperty('type', 'Character');
      expect(response.body[1]).toHaveProperty('type', 'Element');
      expect(response.body[2]).toHaveProperty('type', 'Puzzle');
      expect(response.body[3]).toHaveProperty('type', 'Timeline Event');
      
      expect(notionService.searchDatabases).toHaveBeenCalledTimes(4);
      expect(notionService.searchDatabases).toHaveBeenCalledWith('test', 'Characters');
      expect(notionService.searchDatabases).toHaveBeenCalledWith('test', 'Elements');
      expect(notionService.searchDatabases).toHaveBeenCalledWith('test', 'Puzzles');
      expect(notionService.searchDatabases).toHaveBeenCalledWith('test', 'Timeline Events');
    });

    it('should filter out mapping errors', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('search-error');
      notionService.searchDatabases.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      
      propertyMapper.mapCharacterWithNames
        .mockResolvedValueOnce({ id: '1', name: 'Valid' })
        .mockResolvedValueOnce({ error: 'Mapping failed' });
      propertyMapper.mapElementWithNames.mockResolvedValue({ error: 'All failed' });
      propertyMapper.mapPuzzleWithNames.mockResolvedValue({ error: 'All failed' });
      propertyMapper.mapTimelineEventWithNames.mockResolvedValue({ error: 'All failed' });
      
      const response = await request(app)
        .get('/search?query=test')
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual({ id: '1', name: 'Valid', type: 'Character' });
    });
  });

  describe('POST /cache/clear', () => {
    it('should clear the cache', async () => {
      const response = await request(app)
        .post('/cache/clear')
        .expect(200);
      
      expect(response.body).toEqual({ message: 'Cache cleared successfully' });
      expect(notionService.notionCache.flushAll).toHaveBeenCalled();
    });
  });

  describe('GET /narrative-threads/unique', () => {
    it('should return unique narrative threads', async () => {
      const mockCharacters = [{ id: 'c1' }];
      const mockElements = [{ id: 'e1' }];
      const mockPuzzles = [{ id: 'p1' }];
      const mockTimeline = [{ id: 't1' }];
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('unique-narrative-threads-v1');
      notionService.getCharacters.mockResolvedValue(mockCharacters);
      notionService.getElements.mockResolvedValue(mockElements);
      notionService.getPuzzles.mockResolvedValue(mockPuzzles);
      notionService.getTimelineEvents.mockResolvedValue(mockTimeline);
      
      propertyMapper.mapCharacterWithNames.mockResolvedValue({ 
        id: 'c1', 
        narrativeThreads: ['Family', 'Work'] 
      });
      propertyMapper.mapElementWithNames.mockResolvedValue({ 
        id: 'e1', 
        narrativeThreads: ['Family', 'Mystery'] 
      });
      propertyMapper.mapPuzzleWithNames.mockResolvedValue({ 
        id: 'p1', 
        narrativeThreads: ['Mystery', 'Tech'] 
      });
      propertyMapper.mapTimelineEventWithNames.mockResolvedValue({ 
        id: 't1', 
        narrativeThreads: ['Work', 'Tech'] 
      });
      
      const response = await request(app)
        .get('/narrative-threads/unique')
        .expect(200);
      
      expect(response.body).toEqual(['Family', 'Mystery', 'Tech', 'Work']);
      expect(notionService.getCharacters).toHaveBeenCalled();
      expect(notionService.getElements).toHaveBeenCalled();
      expect(notionService.getPuzzles).toHaveBeenCalled();
      expect(notionService.getTimelineEvents).toHaveBeenCalled();
    });

    it('should handle entities without narrative threads', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('unique-narrative-threads-v1');
      notionService.getCharacters.mockResolvedValue([{ id: '1' }]);
      notionService.getElements.mockResolvedValue([]);
      notionService.getPuzzles.mockResolvedValue([]);
      notionService.getTimelineEvents.mockResolvedValue([]);
      
      propertyMapper.mapCharacterWithNames.mockResolvedValue({ 
        id: '1', 
        // No narrativeThreads property
      });
      
      const response = await request(app)
        .get('/narrative-threads/unique')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('should use cached threads if available', async () => {
      const cachedThreads = ['Cached1', 'Cached2'];
      
      notionService.notionCache.get.mockReturnValue(cachedThreads);
      notionService.makeCacheKey.mockReturnValue('unique-narrative-threads-v1');
      
      const response = await request(app)
        .get('/narrative-threads/unique')
        .expect(200);
      
      expect(response.body).toEqual(cachedThreads);
      expect(notionService.getCharacters).not.toHaveBeenCalled();
    });
  });
});