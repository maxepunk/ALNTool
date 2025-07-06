const request = require('supertest');
const express = require('express');
const apiV2Routes = require('../../src/routes/apiV2');
const { responseWrapper, errorHandler } = require('../../src/middleware/responseWrapper');

// Mock dependencies
jest.mock('../../src/services/dataSyncService');
jest.mock('../../src/controllers/journeyController');
jest.mock('../../src/controllers/notionCharacterController');
jest.mock('../../src/controllers/notionElementController');
jest.mock('../../src/controllers/notionGeneralController');
jest.mock('../../src/controllers/notionPuzzleController');
jest.mock('../../src/controllers/notionTimelineController');

const dataSyncService = require('../../src/services/dataSyncService');
const journeyController = require('../../src/controllers/journeyController');
const notionCharacterController = require('../../src/controllers/notionCharacterController');
const notionElementController = require('../../src/controllers/notionElementController');
const notionGeneralController = require('../../src/controllers/notionGeneralController');
const notionPuzzleController = require('../../src/controllers/notionPuzzleController');
const notionTimelineController = require('../../src/controllers/notionTimelineController');

describe('API v2 Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(responseWrapper);
    app.use('/api/v2', apiV2Routes);
    app.use(errorHandler);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/v2/sync/notion', () => {
    it('should trigger Notion sync successfully', async () => {
      dataSyncService.getSyncStatus.mockReturnValue({ isRunning: false });
      dataSyncService.syncAll.mockResolvedValue({
        phases: { sync: 'completed' },
        totalDuration: 1000,
        status: 'success'
      });

      const response = await request(app)
        .post('/api/v2/sync/notion')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sync completed successfully');
      expect(dataSyncService.syncAll).toHaveBeenCalled();
    });

    it('should return 409 if sync is already running', async () => {
      dataSyncService.getSyncStatus.mockReturnValue({ isRunning: true });

      const response = await request(app)
        .post('/api/v2/sync/notion')
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sync already in progress');
      expect(dataSyncService.syncAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v2/journey/:characterId', () => {
    it('should get character journey', async () => {
      const mockJourney = { characterId: '123', events: [] };
      journeyController.getCharacterJourney.mockImplementation((req, res) => {
        res.json(mockJourney);
      });

      const response = await request(app)
        .get('/api/v2/journey/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockJourney);
      expect(journeyController.getCharacterJourney).toHaveBeenCalled();
    });
  });

  describe('GET /api/v2/elements/performance', () => {
    it('should get performance elements', async () => {
      const mockElements = [{ id: '1', type: 'performance' }];
      notionElementController.getElements.mockImplementation((req, res) => {
        res.json(mockElements);
      });

      const response = await request(app)
        .get('/api/v2/elements/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockElements);
    });
  });

  describe('GET /api/v2/characters/links', () => {
    it('should get character links', async () => {
      const mockLinks = [{ from: '1', to: '2' }];
      notionCharacterController.getAllCharacterLinks.mockImplementation((req, res) => {
        res.json(mockLinks);
      });

      const response = await request(app)
        .get('/api/v2/characters/links')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLinks);
    });
  });

  describe('GET /api/v2/relationships/:entityType/:entityId', () => {
    it('should get character relationships', async () => {
      const mockGraph = { nodes: [], edges: [] };
      notionCharacterController.getCharacterGraph.mockImplementation((req, res) => {
        res.json(mockGraph);
      });

      const response = await request(app)
        .get('/api/v2/relationships/characters/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGraph);
      expect(notionCharacterController.getCharacterGraph).toHaveBeenCalled();
    });

    it('should return 404 for unsupported entity types', async () => {
      const response = await request(app)
        .get('/api/v2/relationships/invalid/123')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Relationships not supported');
    });
  });

  describe('GET /api/v2/search', () => {
    it('should perform global search', async () => {
      const mockResults = [{ id: '1', name: 'Result' }];
      notionGeneralController.globalSearch.mockImplementation((req, res) => {
        res.json(mockResults);
      });

      const response = await request(app)
        .get('/api/v2/search?query=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResults);
    });
  });

  describe('GET /api/v2/warnings/:entityType', () => {
    it('should get entity warnings', async () => {
      const mockWarnings = [{ id: '1', warnings: ['No description'] }];
      notionCharacterController.getCharactersWithWarnings.mockImplementation((req, res) => {
        res.json(mockWarnings);
      });

      const response = await request(app)
        .get('/api/v2/warnings/characters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockWarnings);
    });

    it('should return 404 for unsupported entity types', async () => {
      const response = await request(app)
        .get('/api/v2/warnings/invalid')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Warnings not supported');
    });
  });

  describe('GET /api/v2/views/:viewType', () => {
    it('should get sociogram view', async () => {
      const mockData = { characters: [], links: [] };
      notionCharacterController.getCharactersWithSociogramData.mockImplementation((req, res) => {
        res.json(mockData);
      });

      const response = await request(app)
        .get('/api/v2/views/sociogram')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });

    it('should return 404 for unsupported view types', async () => {
      const response = await request(app)
        .get('/api/v2/views/invalid')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('View type not supported');
    });
  });

  describe('GET /api/v2/analysis/puzzle-flow/:puzzleId', () => {
    it('should get puzzle flow analysis', async () => {
      const mockFlow = { puzzle: '123', flow: [] };
      notionPuzzleController.getPuzzleFlow.mockImplementation((req, res) => {
        res.json(mockFlow);
      });

      const response = await request(app)
        .get('/api/v2/analysis/puzzle-flow/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockFlow);
    });
  });

  describe('GET /api/v2/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v2/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API v2 is healthy');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});