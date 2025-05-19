const request = require('supertest');
const app = require('../../src/index');
const mockNotionService = require('../services/__mocks__/notionService');
const { MOCK_PUZZLES, MOCK_DATA_BY_ID, DB_IDS } = mockNotionService;

jest.mock('../../src/services/notionService.js', () => require('../services/__mocks__/notionService.js'));

describe('Puzzle API Endpoints - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/puzzles', () => {
    it('should return a list of puzzles', async () => {
      mockNotionService.getPuzzles.mockResolvedValue(MOCK_PUZZLES.map(p => ({...p, puzzle: p.properties.Puzzle.title[0].plain_text }))); // Simplified map

      const response = await request(app).get('/api/puzzles');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_PUZZLES.length);
      expect(response.body[0].puzzle).toBe('Locked Safe'); 
      expect(mockNotionService.getPuzzles).toHaveBeenCalledWith(undefined);
    });

    it('should return 500 if notionService.getPuzzles fails', async () => {
      mockNotionService.getPuzzles.mockRejectedValue(new Error('Notion API error'));
      const response = await request(app).get('/api/puzzles');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should filter puzzles by timing', async () => {
      mockNotionService.getPuzzles.mockResolvedValue(MOCK_PUZZLES.filter(p => p.properties.Timing.select.name === 'Act 1'));
      const response = await request(app).get('/api/puzzles?timing=Act%201');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(p => p.timing === 'Act 1')).toBe(true);
      expect(mockNotionService.getPuzzles).toHaveBeenCalledWith(expect.objectContaining({ property: 'Timing', value: 'Act 1' }));
    });

    it('should filter puzzles by timing and owner', async () => {
      mockNotionService.getPuzzles.mockResolvedValue(MOCK_PUZZLES.filter(p => p.properties.Timing.select.name === 'Act 1' && p.properties.Owner.relation[0]?.id === 'char-id-1'));
      const response = await request(app).get('/api/puzzles?timing=Act%201&owner=char-id-1');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(p => p.timing === 'Act 1' && p.owner === 'char-id-1')).toBe(true);
      expect(mockNotionService.getPuzzles).toHaveBeenCalledWith(expect.objectContaining({
        and: [
          expect.objectContaining({ property: 'Timing', value: 'Act 1' }),
          expect.objectContaining({ property: 'Owner', value: 'char-id-1' })
        ]
      }));
    });

    it('should return empty array if filter matches nothing', async () => {
      mockNotionService.getPuzzles.mockResolvedValue([]);
      const response = await request(app).get('/api/puzzles?timing=Nonexistent');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should ignore invalid filter keys and return all puzzles', async () => {
      mockNotionService.getPuzzles.mockResolvedValue(MOCK_PUZZLES);
      const response = await request(app).get('/api/puzzles?invalidKey=foo');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_PUZZLES.length);
    });
  });

  describe('GET /api/puzzles/:id', () => {
    it('should return a single puzzle by ID', async () => {
      const puzzleId = 'puzzle-id-1';
      mockNotionService.getPage.mockResolvedValue(MOCK_DATA_BY_ID[puzzleId]);

      const response = await request(app).get(`/api/puzzles/${puzzleId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(puzzleId);
      expect(response.body.puzzle).toBe('Locked Safe');
      expect(mockNotionService.getPage).toHaveBeenCalledWith(puzzleId);
    });

    it('should return 404 if puzzle not found', async () => {
      const nonExistentId = 'puzzle-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null);

      const response = await request(app).get(`/api/puzzles/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Puzzle not found');
    });
  });

  describe('GET /api/puzzles/:id/graph', () => {
    it('should return graphData for a puzzle', async () => {
      const puzzleId = 'puzzle-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));

      const response = await request(app).get(`/api/puzzles/${puzzleId}/graph`);

      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData).toHaveProperty('center');
      expect(graphData).toHaveProperty('nodes');
      expect(graphData).toHaveProperty('edges');
      expect(graphData.center.id).toBe(puzzleId);
      expect(graphData.center.puzzle).toBe('Locked Safe');
      // MOCK_PUZZLES[0] (puzzle-id-1) is owned by char-id-1, rewards element-id-1.
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['puzzle-id-1', 'char-id-1', 'element-id-1']));
      expect(graphData.edges.length).toBeGreaterThanOrEqual(2); // Owns, Rewards
    });

    it('should return 404 if puzzle for graph not found', async () => {
      const nonExistentId = 'puzzle-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null);

      const response = await request(app).get(`/api/puzzles/${nonExistentId}/graph`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Puzzle not found');
    });

    it('should return graphData with 2nd-degree relations when depth=2', async () => {
      const puzzleId = 'puzzle-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/puzzles/${puzzleId}/graph?depth=2`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.length).toBeGreaterThan(2);
    });

    it('should return only the center node when depth=0', async () => {
      const puzzleId = 'puzzle-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/puzzles/${puzzleId}/graph?depth=0`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.length).toBe(1);
      expect(graphData.nodes[0].id).toBe(puzzleId);
    });

    it('should handle invalid depth param gracefully (defaults to 1)', async () => {
      const puzzleId = 'puzzle-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/puzzles/${puzzleId}/graph?depth=notanumber`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['puzzle-id-1', 'char-id-1', 'element-id-1']));
    });

    it('should handle missing required fields in mock data gracefully', async () => {
      const puzzleId = 'puzzle-id-malformed';
      mockNotionService.getPage.mockResolvedValue({ id: puzzleId });
      mockNotionService.getPagesByIds.mockResolvedValue([]);
      const response = await request(app).get(`/api/puzzles/${puzzleId}/graph`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.center.id).toBe(puzzleId);
      expect(graphData.nodes.length).toBe(1);
    });
  });
}); 