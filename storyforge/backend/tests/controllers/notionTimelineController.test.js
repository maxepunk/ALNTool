const request = require('supertest');
const express = require('express');
const notionTimelineController = require('../../src/controllers/notionTimelineController');
const notionService = require('../../src/services/notionService');
const { getDB } = require('../../src/db/database');

// Mock dependencies
jest.mock('../../src/services/notionService', () => ({
  notionCache: {
    get: jest.fn(),
    set: jest.fn()
  },
  makeCacheKey: jest.fn(),
  getTimelineEvents: jest.fn(),
  getTimelineEventById: jest.fn()
}));
jest.mock('../../src/db/database');

describe('NotionTimelineController', () => {
  let app;
  let mockDB;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add routes directly for testing
    app.get('/timeline-events', notionTimelineController.getTimelineEvents);
    app.get('/timeline-events/list', notionTimelineController.getTimelineEventsList);
    app.get('/timeline-events/:id', notionTimelineController.getTimelineEventById);
    app.get('/timeline-events/:id/graph', notionTimelineController.getTimelineGraph);
    
    // Mock database
    mockDB = {
      prepare: jest.fn().mockReturnThis(),
      all: jest.fn(),
      get: jest.fn()
    };
    getDB.mockReturnValue(mockDB);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /timeline-events', () => {
    it('should return timeline events from Notion', async () => {
      const mockEvents = [
        { id: '1', name: 'Event 1', act_position: 'Act 1' },
        { id: '2', name: 'Event 2', act_position: 'Act 2' }
      ];
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('timeline-events');
      notionService.getTimelineEvents.mockResolvedValue(mockEvents);
      
      const response = await request(app)
        .get('/timeline-events')
        .expect(200);
      
      expect(response.body).toEqual(mockEvents);
      expect(notionService.getTimelineEvents).toHaveBeenCalledWith({});
    });

    it('should pass query parameters to service', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('timeline-events');
      notionService.getTimelineEvents.mockResolvedValue([]);
      
      await request(app)
        .get('/timeline-events?act=Act%201')
        .expect(200);
      
      expect(notionService.getTimelineEvents).toHaveBeenCalledWith({ act: 'Act 1' });
    });

    it('should use cached data if available', async () => {
      const cachedEvents = [{ id: '1', name: 'Cached Event' }];
      
      notionService.notionCache.get.mockReturnValue(cachedEvents);
      notionService.makeCacheKey.mockReturnValue('timeline-events');
      
      const response = await request(app)
        .get('/timeline-events')
        .expect(200);
      
      expect(response.body).toEqual(cachedEvents);
      expect(notionService.getTimelineEvents).not.toHaveBeenCalled();
    });
  });

  describe('GET /timeline-events/list', () => {
    it('should return timeline events from database', async () => {
      const mockEvents = [
        { id: '1', name: 'DB Event 1', act_position: 'Act 1' },
        { id: '2', name: 'DB Event 2', act_position: 'Act 2' }
      ];
      
      mockDB.all.mockReturnValue(mockEvents);
      
      const response = await request(app)
        .get('/timeline-events/list')
        .expect(200);
      
      expect(response.body).toEqual(mockEvents);
      expect(mockDB.prepare).toHaveBeenCalledWith('SELECT * FROM timeline_events ORDER BY act_position');
      expect(mockDB.all).toHaveBeenCalled();
    });
  });

  describe('GET /timeline-events/:id', () => {
    it('should return a timeline event by ID', async () => {
      const mockEvent = { 
        id: '123', 
        name: 'Test Event',
        act_position: 'Act 1',
        description: 'Test timeline event'
      };
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('timeline-event-123');
      notionService.getTimelineEventById.mockResolvedValue(mockEvent);
      
      const response = await request(app)
        .get('/timeline-events/123')
        .expect(200);
      
      expect(response.body).toEqual(mockEvent);
      expect(notionService.getTimelineEventById).toHaveBeenCalledWith('123');
    });

    it('should return 404 if timeline event not found', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('timeline-event-456');
      notionService.getTimelineEventById.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/timeline-events/456')
        .expect(404);
      
      expect(response.body).toEqual({ error: 'Timeline event not found' });
    });

    it('should use cached data if available', async () => {
      const cachedEvent = { id: '789', name: 'Cached Event' };
      
      notionService.notionCache.get.mockReturnValue(cachedEvent);
      notionService.makeCacheKey.mockReturnValue('timeline-event-789');
      
      const response = await request(app)
        .get('/timeline-events/789')
        .expect(200);
      
      expect(response.body).toEqual(cachedEvent);
      expect(notionService.getTimelineEventById).not.toHaveBeenCalled();
    });
  });

  describe('GET /timeline-events/:id/graph', () => {
    it('should return timeline event graph data', async () => {
      const mockEvent = { 
        id: '123', 
        name: 'Test Event',
        act_position: 'Act 1'
      };
      const mockCharacters = [
        { id: 'char1', name: 'Character 1' },
        { id: 'char2', name: 'Character 2' }
      ];
      const mockRelatedEvents = [
        { id: '456', name: 'Related Event', act_position: 'Act 1' }
      ];
      
      mockDB.get.mockReturnValue(mockEvent);
      mockDB.all
        .mockReturnValueOnce(mockCharacters)
        .mockReturnValueOnce(mockRelatedEvents);
      
      const response = await request(app)
        .get('/timeline-events/123/graph')
        .expect(200);
      
      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('edges');
      expect(response.body.nodes).toHaveLength(4); // 1 event + 2 characters + 1 related
      expect(response.body.edges).toHaveLength(3); // 2 character connections + 1 related
      
      expect(mockDB.prepare).toHaveBeenCalledWith('SELECT * FROM timeline_events WHERE id = ?');
      expect(mockDB.get).toHaveBeenCalledWith('123');
    });

    it('should return 404 if timeline event not found in database', async () => {
      mockDB.get.mockReturnValue(null);
      
      const response = await request(app)
        .get('/timeline-events/456/graph')
        .expect(404);
      
      expect(response.body).toEqual({ error: 'Timeline event not found' });
    });

    it('should handle empty related data', async () => {
      const mockEvent = { 
        id: '123', 
        name: 'Test Event',
        act_position: 'Act 1'
      };
      
      mockDB.get.mockReturnValue(mockEvent);
      mockDB.all
        .mockReturnValueOnce([]) // No connected characters
        .mockReturnValueOnce([]); // No related events
      
      const response = await request(app)
        .get('/timeline-events/123/graph')
        .expect(200);
      
      expect(response.body.nodes).toHaveLength(1); // Just the event itself
      expect(response.body.edges).toHaveLength(0); // No connections
    });
  });
});