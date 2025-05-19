const request = require('supertest');
const app = require('../../src/index'); // Import the configured Express app
const mockNotionService = require('../services/__mocks__/notionService');
const { MOCK_CHARACTERS, MOCK_DATA_BY_ID, DB_IDS } = mockNotionService;

// Mock the actual notionService to control its behavior during tests
jest.mock('../../src/services/notionService.js', () => require('../services/__mocks__/notionService.js'));

describe('Character API Endpoints - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/characters', () => {
    it('should return a list of characters', async () => {
      // Mock the service layer
      mockNotionService.queryDatabase.mockResolvedValue(MOCK_CHARACTERS);

      const response = await request(app).get('/api/characters');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_CHARACTERS.length);
      expect(response.body[0].name).toBe('Alex Reeves'); // Based on MOCK_CHARACTERS[0]
      expect(mockNotionService.queryDatabase).toHaveBeenCalledWith(DB_IDS.CHARACTERS, expect.any(Object)); // also check filter if any default
    });

    it('should return 500 if notionService.queryDatabase fails', async () => {
      mockNotionService.queryDatabase.mockRejectedValue(new Error('Notion API error'));
      const response = await request(app).get('/api/characters');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should filter characters by type', async () => {
      mockNotionService.queryDatabase.mockResolvedValue(MOCK_CHARACTERS.filter(c => c.properties.Type.select.name === 'Player'));
      const response = await request(app).get('/api/characters?type=Player');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(c => c.type === 'Player')).toBe(true);
      expect(mockNotionService.queryDatabase).toHaveBeenCalledWith(DB_IDS.CHARACTERS, expect.objectContaining({
        property: 'Type',
        value: 'Player',
      }));
    });

    it('should filter characters by type and tier', async () => {
      mockNotionService.queryDatabase.mockResolvedValue(MOCK_CHARACTERS.filter(c => c.properties.Type.select.name === 'Player' && c.properties.Tier.select.name === 'Core'));
      const response = await request(app).get('/api/characters?type=Player&tier=Core');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(c => c.type === 'Player' && c.tier === 'Core')).toBe(true);
      expect(mockNotionService.queryDatabase).toHaveBeenCalledWith(DB_IDS.CHARACTERS, expect.objectContaining({
        and: [
          expect.objectContaining({ property: 'Type', value: 'Player' }),
          expect.objectContaining({ property: 'Tier', value: 'Core' })
        ]
      }));
    });

    it('should return empty array if filter matches nothing', async () => {
      mockNotionService.queryDatabase.mockResolvedValue([]);
      const response = await request(app).get('/api/characters?type=Nonexistent');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should ignore invalid filter keys and return all characters', async () => {
      mockNotionService.queryDatabase.mockResolvedValue(MOCK_CHARACTERS);
      const response = await request(app).get('/api/characters?invalidKey=foo');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_CHARACTERS.length);
    });
  });

  describe('GET /api/characters/:id', () => {
    it('should return a single character by ID', async () => {
      const characterId = 'char-id-1';
      mockNotionService.getPage.mockResolvedValue(MOCK_DATA_BY_ID[characterId]);

      const response = await request(app).get(`/api/characters/${characterId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(characterId);
      expect(response.body.name).toBe('Alex Reeves');
      expect(mockNotionService.getPage).toHaveBeenCalledWith(characterId);
    });

    it('should return 404 if character not found', async () => {
      const nonExistentId = 'char-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null);

      const response = await request(app).get(`/api/characters/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Character not found');
    });
  });

  describe('GET /api/characters/:id/graph', () => {
    it('should return graphData for a character', async () => {
      const characterId = 'char-id-1';
      // Mock getPage for the main character and its relations
      // Mock getPagesByIds for fetching multiple related items if the controller uses it
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));

      const response = await request(app).get(`/api/characters/${characterId}/graph`);

      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData).toHaveProperty('center');
      expect(graphData).toHaveProperty('nodes');
      expect(graphData).toHaveProperty('edges');
      expect(graphData.center.id).toBe(characterId);
      expect(graphData.center.name).toBe('Alex Reeves');
      // Further assertions on nodes and edges as per PRD 4.E and mock data relations
      // Example: char-id-1 (Alex) is related to event-id-1 and element-id-1
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['char-id-1', 'event-id-1', 'element-id-1']));
      expect(graphData.edges.length).toBe(2); // Alex -> Event, Alex -> Element
    });

    it('should return 404 if character for graph not found', async () => {
      const nonExistentId = 'char-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null); // Initial fetch fails

      const response = await request(app).get(`/api/characters/${nonExistentId}/graph`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Character graph data not found');
    });

    it('should return graphData with 2nd-degree relations when depth=2', async () => {
      const characterId = 'char-id-1';
      // Mock getPage and getPagesByIds to return richer data for depth=2
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/characters/${characterId}/graph?depth=2`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      // Should include 2nd-degree nodes (e.g., related to events/elements)
      expect(graphData.nodes.length).toBeGreaterThan(2); // More than just center and direct relations
    });

    it('should return only the center node when depth=0', async () => {
      const characterId = 'char-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/characters/${characterId}/graph?depth=0`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.length).toBe(1);
      expect(graphData.nodes[0].id).toBe(characterId);
    });

    it('should handle invalid depth param gracefully (defaults to 1)', async () => {
      const characterId = 'char-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/characters/${characterId}/graph?depth=notanumber`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      // Should behave as if depth=1 (direct relations only)
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['char-id-1', 'event-id-1', 'element-id-1']));
    });

    it('should handle missing required fields in mock data gracefully', async () => {
      const characterId = 'char-id-malformed';
      // Simulate a character with missing properties
      mockNotionService.getPage.mockResolvedValue({ id: characterId });
      mockNotionService.getPagesByIds.mockResolvedValue([]);
      const response = await request(app).get(`/api/characters/${characterId}/graph`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.center.id).toBe(characterId);
      // Should not throw, should return at least the center node
      expect(graphData.nodes.length).toBe(1);
    });
  });
}); 