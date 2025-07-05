const request = require('supertest');
const express = require('express');
const charactersRouter = require('../characters');
const graphService = require('../../services/graphService');

// Mock graphService
jest.mock('../../services/graphService');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/characters', charactersRouter);

describe('Character Graph Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/characters/:id/graph', () => {
    it('should return graph data for valid character', async () => {
      const mockGraphData = {
        center: { id: 'char-1', name: 'Test Character' },
        nodes: [
          { id: 'char-1', name: 'Test Character', type: 'character' },
          { id: 'char-2', name: 'Related Character', type: 'character' }
        ],
        edges: [
          { source: 'char-1', target: 'char-2', label: 'knows' }
        ]
      };

      graphService.getCharacterGraph.mockResolvedValue(mockGraphData);

      const response = await request(app)
        .get('/api/characters/char-1/graph')
        .expect(200);

      expect(response.body).toEqual(mockGraphData);
      expect(graphService.getCharacterGraph).toHaveBeenCalledWith('char-1', 1);
    });

    it('should handle character not found error', async () => {
      graphService.getCharacterGraph.mockRejectedValue(new Error('Character not found'));

      const response = await request(app)
        .get('/api/characters/invalid-id/graph')
        .expect(404);

      expect(response.body).toEqual({ error: 'Character not found' });
    });

    it('should handle database errors gracefully', async () => {
      graphService.getCharacterGraph.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/characters/char-1/graph')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch character graph' });
    });

    it('should validate depth parameter', async () => {
      const mockGraphData = { nodes: [], edges: [] };
      graphService.getCharacterGraph.mockResolvedValue(mockGraphData);

      await request(app)
        .get('/api/characters/char-1/graph?depth=2')
        .expect(200);

      expect(graphService.getCharacterGraph).toHaveBeenCalledWith('char-1', 2);
    });
  });
});