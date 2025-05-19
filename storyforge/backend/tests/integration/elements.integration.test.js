const request = require('supertest');
const app = require('../../src/index');
const mockNotionService = require('../services/__mocks__/notionService');
const { MOCK_ELEMENTS, MOCK_DATA_BY_ID, DB_IDS } = mockNotionService;

jest.mock('../../src/services/notionService.js', () => require('../services/__mocks__/notionService.js'));

describe('Element API Endpoints - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/elements', () => {
    it('should return a list of elements', async () => {
      mockNotionService.getElements.mockResolvedValue(MOCK_ELEMENTS.map(el => ({...el, name: el.properties.Name.title[0].plain_text }))); // Simplified map for basic check

      const response = await request(app).get('/api/elements');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_ELEMENTS.length);
      expect(response.body[0].name).toBe('Memory Video 1'); 
      expect(mockNotionService.getElements).toHaveBeenCalledWith(undefined); // No filter by default
    });

    it('should return 500 if notionService.getElements fails', async () => {
      mockNotionService.getElements.mockRejectedValue(new Error('Notion API error'));
      const response = await request(app).get('/api/elements');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should filter elements by basicType', async () => {
      mockNotionService.getElements.mockResolvedValue(MOCK_ELEMENTS.filter(e => e.properties['Basic Type'].select.name === 'Prop'));
      const response = await request(app).get('/api/elements?basicType=Prop');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(e => e.basicType === 'Prop')).toBe(true);
      expect(mockNotionService.getElements).toHaveBeenCalledWith(expect.objectContaining({
        property: 'Basic Type',
        value: 'Prop',
      }));
    });

    it('should filter elements by basicType and status', async () => {
      mockNotionService.getElements.mockResolvedValue(MOCK_ELEMENTS.filter(e => e.properties['Basic Type'].select.name === 'Prop' && e.properties.Status.select.name === 'Ready for Playtest'));
      const response = await request(app).get('/api/elements?basicType=Prop&status=Ready%20for%20Playtest');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(e => e.basicType === 'Prop' && e.status === 'Ready for Playtest')).toBe(true);
      expect(mockNotionService.getElements).toHaveBeenCalledWith(expect.objectContaining({
        and: [
          expect.objectContaining({ property: 'Basic Type', value: 'Prop' }),
          expect.objectContaining({ property: 'Status', value: 'Ready for Playtest' })
        ]
      }));
    });

    it('should return empty array if filter matches nothing', async () => {
      mockNotionService.getElements.mockResolvedValue([]);
      const response = await request(app).get('/api/elements?basicType=Nonexistent');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should ignore invalid filter keys and return all elements', async () => {
      mockNotionService.getElements.mockResolvedValue(MOCK_ELEMENTS);
      const response = await request(app).get('/api/elements?invalidKey=foo');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_ELEMENTS.length);
    });
  });

  describe('GET /api/elements/:id', () => {
    it('should return a single element by ID', async () => {
      const elementId = 'element-id-1';
      // Ensure the mock service returns the raw page for getPage, controller will map it.
      mockNotionService.getPage.mockResolvedValue(MOCK_DATA_BY_ID[elementId]);

      const response = await request(app).get(`/api/elements/${elementId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(elementId);
      expect(response.body.name).toBe('Memory Video 1'); // Name after mapping
      expect(mockNotionService.getPage).toHaveBeenCalledWith(elementId);
    });

    it('should return 404 if element not found', async () => {
      const nonExistentId = 'element-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null);

      const response = await request(app).get(`/api/elements/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Element not found');
    });
  });

  describe('GET /api/elements/:id/graph', () => {
    it('should return graphData for an element', async () => {
      const elementId = 'element-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));

      const response = await request(app).get(`/api/elements/${elementId}/graph`);

      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData).toHaveProperty('center');
      expect(graphData).toHaveProperty('nodes');
      expect(graphData).toHaveProperty('edges');
      expect(graphData.center.id).toBe(elementId);
      expect(graphData.center.name).toBe('Memory Video 1');
      // MOCK_ELEMENTS[0] (element-id-1) is owned by char-id-1.
      // It's also a reward for puzzle-id-1, and evidence in event-id-1.
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['element-id-1', 'char-id-1', 'puzzle-id-1', 'event-id-1']));
      expect(graphData.edges.length).toBeGreaterThanOrEqual(1); // At least ownedBy edge
    });

    it('should return 404 if element for graph not found', async () => {
      const nonExistentId = 'element-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null);

      const response = await request(app).get(`/api/elements/${nonExistentId}/graph`);

      expect(response.status).toBe(404);
      // The controller getElementGraph returns { error: 'Element not found' }
      // but the catchAsync wrapper might change this to the generic error. Let's check controller.
      // It is `res.status(404).json({ error: 'Element not found' })` for graph too.
      expect(response.body).toHaveProperty('error', 'Element not found');
    });

    it('should return graphData with 2nd-degree relations when depth=2', async () => {
      const elementId = 'element-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/elements/${elementId}/graph?depth=2`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.length).toBeGreaterThan(2);
    });

    it('should return only the center node when depth=0', async () => {
      const elementId = 'element-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/elements/${elementId}/graph?depth=0`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.length).toBe(1);
      expect(graphData.nodes[0].id).toBe(elementId);
    });

    it('should handle invalid depth param gracefully (defaults to 1)', async () => {
      const elementId = 'element-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/elements/${elementId}/graph?depth=notanumber`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['element-id-1', 'char-id-1', 'puzzle-id-1', 'event-id-1']));
    });

    it('should handle missing required fields in mock data gracefully', async () => {
      const elementId = 'element-id-malformed';
      mockNotionService.getPage.mockResolvedValue({ id: elementId });
      mockNotionService.getPagesByIds.mockResolvedValue([]);
      const response = await request(app).get(`/api/elements/${elementId}/graph`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.center.id).toBe(elementId);
      expect(graphData.nodes.length).toBe(1);
    });
  });
}); 