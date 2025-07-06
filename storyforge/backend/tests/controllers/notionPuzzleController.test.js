const request = require('supertest');
const express = require('express');
const notionPuzzleController = require('../../src/controllers/notionPuzzleController');
const notionService = require('../../src/services/notionService');
const propertyMapper = require('../../src/utils/notionPropertyMapper');
const puzzleFlowService = require('../../src/services/puzzleFlowService');
const warningService = require('../../src/services/warningService');
const graphService = require('../../src/services/graphService');

// Mock dependencies
jest.mock('../../src/services/notionService', () => ({
  notionCache: {
    get: jest.fn(),
    set: jest.fn()
  },
  makeCacheKey: jest.fn(),
  getPuzzles: jest.fn(),
  getPage: jest.fn()
}));
jest.mock('../../src/utils/notionPropertyMapper');
jest.mock('../../src/services/puzzleFlowService');
jest.mock('../../src/services/warningService');
jest.mock('../../src/services/graphService');
jest.mock('../../src/db/database');

// Mock console to prevent log output during tests
const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };
});

describe('NotionPuzzleController', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add routes directly for testing - order matters!
    app.get('/puzzles', notionPuzzleController.getPuzzles);
    app.get('/puzzles/with-warnings', notionPuzzleController.getPuzzlesWithWarnings);
    app.get('/puzzles/:id', notionPuzzleController.getPuzzleById);
    app.get('/puzzles/:id/graph', notionPuzzleController.getPuzzleGraph);
    app.get('/puzzles/:id/flow', notionPuzzleController.getPuzzleFlow);
    app.get('/puzzles/:id/flowgraph', notionPuzzleController.getPuzzleFlowGraph);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /puzzles', () => {
    it('should return a list of puzzles', async () => {
      const mockNotionPuzzles = [
        { id: '1', properties: { Name: { title: [{ text: { content: 'Puzzle 1' } }] } } },
        { id: '2', properties: { Name: { title: [{ text: { content: 'Puzzle 2' } }] } } }
      ];
      const mockMappedPuzzles = [
        { id: '1', name: 'Puzzle 1', timing: 'Early' },
        { id: '2', name: 'Puzzle 2', timing: 'Mid' }
      ];
      
      notionService.getPuzzles.mockResolvedValue(mockNotionPuzzles);
      propertyMapper.mapPuzzleWithNames
        .mockResolvedValueOnce(mockMappedPuzzles[0])
        .mockResolvedValueOnce(mockMappedPuzzles[1]);
      
      const response = await request(app)
        .get('/puzzles')
        .expect(200);
      
      expect(response.body).toEqual(mockMappedPuzzles);
      expect(notionService.getPuzzles).toHaveBeenCalledWith(undefined);
    });

    it('should apply filters to puzzles', async () => {
      notionService.getPuzzles.mockResolvedValue([]);
      propertyMapper.mapPuzzleWithNames.mockResolvedValue([]);
      
      await request(app)
        .get('/puzzles?timing=Early&narrativeThreadContains=Family')
        .expect(200);
      
      expect(notionService.getPuzzles).toHaveBeenCalledWith({
        and: [
          { property: 'Timing', select: { equals: 'Early' } },
          { property: 'Narrative Threads', multi_select: { contains: 'Family' } }
        ]
      });
    });
  });

  describe('GET /puzzles/:id', () => {
    it('should return a puzzle by ID', async () => {
      const mockPuzzle = { 
        id: '123', 
        properties: { Name: { title: [{ text: { content: 'Test Puzzle' } }] } }
      };
      const mockMappedPuzzle = { 
        id: '123', 
        name: 'Test Puzzle',
        timing: 'Mid',
        narrativeThreads: ['Family', 'Work']
      };
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('mapped-puzzle-v1.1-narrative-123');
      notionService.getPage.mockResolvedValue(mockPuzzle);
      propertyMapper.mapPuzzleWithNames.mockResolvedValue(mockMappedPuzzle);
      
      const response = await request(app)
        .get('/puzzles/123')
        .expect(200);
      
      expect(response.body).toEqual(mockMappedPuzzle);
      expect(notionService.getPage).toHaveBeenCalledWith('123');
    });

    it('should return 404 if puzzle not found', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('mapped-puzzle-v1.1-narrative-456');
      notionService.getPage.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/puzzles/456')
        .expect(404);
      
      expect(response.body).toEqual({ error: 'Puzzle not found' });
    });

    it('should use cached data if available', async () => {
      const cachedPuzzle = { id: '789', name: 'Cached Puzzle' };
      
      notionService.notionCache.get.mockReturnValue(cachedPuzzle);
      notionService.makeCacheKey.mockReturnValue('mapped-puzzle-v1.1-narrative-789');
      
      const response = await request(app)
        .get('/puzzles/789')
        .expect(200);
      
      expect(response.body).toEqual(cachedPuzzle);
      expect(notionService.getPage).not.toHaveBeenCalled();
    });
  });

  describe('GET /puzzles/:id/graph', () => {
    it('should return puzzle graph data', async () => {
      const mockGraphData = {
        nodes: [{ id: '1', type: 'puzzle' }],
        edges: [{ source: '1', target: '2' }]
      };
      
      graphService.getPuzzleGraph.mockResolvedValue(mockGraphData);
      
      const response = await request(app)
        .get('/puzzles/123/graph')
        .expect(200);
      
      expect(response.body).toEqual(mockGraphData);
      expect(graphService.getPuzzleGraph).toHaveBeenCalledWith('123');
    });
  });

  describe('GET /puzzles/:id/flow', () => {
    it('should return puzzle flow data', async () => {
      const mockFlowData = {
        centralPuzzle: { id: '123', name: 'Central Puzzle' },
        inputElements: [],
        outputElements: []
      };
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('puzzle-flow-v1-123');
      puzzleFlowService.getPuzzleFlowData.mockResolvedValue(mockFlowData);
      
      const response = await request(app)
        .get('/puzzles/123/flow')
        .expect(200);
      
      expect(response.body).toEqual(mockFlowData);
      expect(puzzleFlowService.getPuzzleFlowData).toHaveBeenCalledWith('123');
    });

    it('should return 404 if puzzle flow not found', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('puzzle-flow-v1-456');
      puzzleFlowService.getPuzzleFlowData.mockRejectedValue(new Error('Puzzle not found'));
      
      const response = await request(app)
        .get('/puzzles/456/flow')
        .expect(404);
      
      expect(response.body).toEqual({ error: 'Puzzle not found' });
    });
  });

  describe('GET /puzzles/:id/flowgraph', () => {
    it('should return puzzle flow graph data', async () => {
      const mockGraphData = {
        center: { id: '123', name: 'Central Puzzle' },
        nodes: [],
        edges: []
      };
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('puzzle-flow-graph-v1-123');
      puzzleFlowService.buildPuzzleFlowGraph.mockResolvedValue(mockGraphData);
      
      const response = await request(app)
        .get('/puzzles/123/flowgraph')
        .expect(200);
      
      expect(response.body).toEqual(mockGraphData);
      expect(puzzleFlowService.buildPuzzleFlowGraph).toHaveBeenCalledWith('123');
    });

    it('should handle errors in flow graph generation', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('puzzle-flow-graph-v1-456');
      puzzleFlowService.buildPuzzleFlowGraph.mockRejectedValue(new Error('Graph generation failed'));
      
      const response = await request(app)
        .get('/puzzles/456/flowgraph')
        .expect(500);
      
      expect(response.body).toEqual({ error: 'Failed to generate puzzle flow graph' });
    });
  });

  describe('GET /puzzles/with-warnings', () => {
    it('should return puzzles with warnings', async () => {
      const mockWarnings = [
        {
          id: '1',
          name: 'Broken Puzzle',
          type: 'Puzzle',
          warnings: [{ 
            warningType: 'NoInputElements', 
            message: 'Puzzle has no input elements.' 
          }]
        }
      ];
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('puzzles-warnings');
      warningService.getPuzzleWarnings.mockResolvedValue(mockWarnings);
      
      const response = await request(app)
        .get('/puzzles/with-warnings')
        .expect(200);
      
      expect(response.body).toEqual(mockWarnings);
      expect(warningService.getPuzzleWarnings).toHaveBeenCalled();
    });
  });
});