const request = require('supertest');
const app = require('../../src/index');
const mockNotionService = require('../services/__mocks__/notionService');
const { MOCK_TIMELINE_EVENTS, MOCK_DATA_BY_ID, DB_IDS } = mockNotionService;

jest.mock('../../src/services/notionService.js', () => require('../services/__mocks__/notionService.js'));

describe('Timeline API Endpoints - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/timeline', () => { // Corrected endpoint from /api/timelines to /api/timeline based on controller
    it('should return a list of timeline events', async () => {
      mockNotionService.getTimelineEvents.mockResolvedValue(MOCK_TIMELINE_EVENTS.map(ev => ({...ev, description: ev.properties.Description.title[0].plain_text })));

      const response = await request(app).get('/api/timeline');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_TIMELINE_EVENTS.length);
      expect(response.body[0].description).toBe('Party begins'); 
      expect(mockNotionService.getTimelineEvents).toHaveBeenCalledWith(undefined);
    });

    it('should return 500 if notionService.getTimelineEvents fails', async () => {
      mockNotionService.getTimelineEvents.mockRejectedValue(new Error('Notion API error'));
      const response = await request(app).get('/api/timeline');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Something went wrong!');
    });

    it('should filter timeline events by memType', async () => {
      mockNotionService.getTimelineEvents.mockResolvedValue(MOCK_TIMELINE_EVENTS.filter(ev => ev.properties['mem type'].rich_text[0]?.plain_text === 'Prop'));
      const response = await request(app).get('/api/timeline?memType=Prop');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(ev => ev.memType === 'Prop')).toBe(true);
      expect(mockNotionService.getTimelineEvents).toHaveBeenCalledWith(expect.objectContaining({ property: 'mem type', value: 'Prop' }));
    });

    it('should filter timeline events by memType and character', async () => {
      mockNotionService.getTimelineEvents.mockResolvedValue(MOCK_TIMELINE_EVENTS.filter(ev => ev.properties['mem type'].rich_text[0]?.plain_text === 'Prop' && ev.properties['Characters Involved'].relation.some(r => r.id === 'char-id-1')));
      const response = await request(app).get('/api/timeline?memType=Prop&character=char-id-1');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(ev => ev.memType === 'Prop' && ev.charactersInvolved.includes('char-id-1'))).toBe(true);
      expect(mockNotionService.getTimelineEvents).toHaveBeenCalledWith(expect.objectContaining({
        and: [
          expect.objectContaining({ property: 'mem type', value: 'Prop' }),
          expect.objectContaining({ property: 'Characters Involved', value: 'char-id-1' })
        ]
      }));
    });

    it('should return empty array if filter matches nothing', async () => {
      mockNotionService.getTimelineEvents.mockResolvedValue([]);
      const response = await request(app).get('/api/timeline?memType=Nonexistent');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should ignore invalid filter keys and return all timeline events', async () => {
      mockNotionService.getTimelineEvents.mockResolvedValue(MOCK_TIMELINE_EVENTS);
      const response = await request(app).get('/api/timeline?invalidKey=foo');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(MOCK_TIMELINE_EVENTS.length);
    });
  });

  describe('GET /api/timeline/:id', () => {
    it('should return a single timeline event by ID', async () => {
      const eventId = 'event-id-1';
      mockNotionService.getPage.mockResolvedValue(MOCK_DATA_BY_ID[eventId]);

      const response = await request(app).get(`/api/timeline/${eventId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(eventId);
      expect(response.body.description).toBe('Party begins');
      expect(mockNotionService.getPage).toHaveBeenCalledWith(eventId);
    });

    it('should return 404 if timeline event not found', async () => {
      const nonExistentId = 'event-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null);

      const response = await request(app).get(`/api/timeline/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Timeline event not found');
    });
  });

  describe('GET /api/timeline/:id/graph', () => {
    it('should return graphData for a timeline event', async () => {
      const eventId = 'event-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));

      const response = await request(app).get(`/api/timeline/${eventId}/graph`);

      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData).toHaveProperty('center');
      expect(graphData).toHaveProperty('nodes');
      expect(graphData).toHaveProperty('edges');
      expect(graphData.center.id).toBe(eventId);
      expect(graphData.center.description).toBe('Party begins');
      // MOCK_TIMELINE_EVENTS[0] (event-id-1) involves char-id-1, char-id-2 and has element-id-1 as Memory_Evidence
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['event-id-1', 'char-id-1', 'char-id-2', 'element-id-1']));
      expect(graphData.edges.length).toBeGreaterThanOrEqual(2); // Involves Chars, Has Evidence
    });

    it('should return 404 if timeline event for graph not found', async () => {
      const nonExistentId = 'event-id-nonexistent';
      mockNotionService.getPage.mockResolvedValue(null);

      const response = await request(app).get(`/api/timeline/${nonExistentId}/graph`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Timeline event not found');
    });

    it('should return graphData with 2nd-degree relations when depth=2', async () => {
      const eventId = 'event-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/timeline/${eventId}/graph?depth=2`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.length).toBeGreaterThan(2);
    });

    it('should return only the center node when depth=0', async () => {
      const eventId = 'event-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/timeline/${eventId}/graph?depth=0`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.length).toBe(1);
      expect(graphData.nodes[0].id).toBe(eventId);
    });

    it('should handle invalid depth param gracefully (defaults to 1)', async () => {
      const eventId = 'event-id-1';
      mockNotionService.getPage.mockImplementation(async (id) => MOCK_DATA_BY_ID[id] || null);
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean));
      const response = await request(app).get(`/api/timeline/${eventId}/graph?depth=notanumber`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['event-id-1', 'char-id-1', 'char-id-2', 'element-id-1']));
    });

    it('should handle missing required fields in mock data gracefully', async () => {
      const eventId = 'event-id-malformed';
      mockNotionService.getPage.mockResolvedValue({ id: eventId });
      mockNotionService.getPagesByIds.mockResolvedValue([]);
      const response = await request(app).get(`/api/timeline/${eventId}/graph`);
      expect(response.status).toBe(200);
      const graphData = response.body;
      expect(graphData.center.id).toBe(eventId);
      expect(graphData.nodes.length).toBe(1);
    });
  });
}); 