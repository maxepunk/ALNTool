const request = require('supertest');
const express = require('express');
const journeyRoutes = require('../../src/routes/journeyRoutes');
const TestDbSetup = require('../utils/testDbSetup');

describe('Journey Endpoints', () => {
  let app;
  let testDb;
  
  beforeAll(async () => {
    testDb = new TestDbSetup();
    await testDb.initialize();
    
    app = express();
    app.use(express.json());
    app.use('/api', journeyRoutes);
  });
  
  beforeEach(async () => {
    await testDb.clearData();
    
    // Insert test data
    await testDb.insertTestCharacter({
      id: 'char1',
      name: 'Test Character',
      type: 'Protagonist'
    });
    
    await testDb.insertTestElement({
      id: 'elem1',
      name: 'Test Element',
      type: 'Story',
      description: 'A test element',
      status: 'Active',
      owner_id: 'char1'
    });
    
    await testDb.insertTestTimelineEvent({
      id: 'event1',
      description: 'Test event',
      element_ids: JSON.stringify(['elem1'])
    });
    
    await testDb.createCharacterTimelineLink('char1', 'event1');
  });
  
  afterAll(async () => {
    await testDb.db.close();
  });

  describe('GET /api/journeys/:characterId', () => {
    it('should return a journey for an existing character', async () => {
      const response = await request(app)
        .get('/api/journeys/char1')
        .expect(200);
      
      expect(response.body).toHaveProperty('character_info');
      expect(response.body).toHaveProperty('graph');
      expect(response.body.graph).toHaveProperty('nodes');
      expect(response.body.graph).toHaveProperty('edges');
      
      // Verify character info
      expect(response.body.character_info).toMatchObject({
        id: 'char1',
        name: 'Test Character',
        type: 'Protagonist'
      });
      
      // Verify graph structure
      const nodes = response.body.graph.nodes;
      const edges = response.body.graph.edges;
      
      expect(nodes).toContainEqual(expect.objectContaining({
        id: 'char1',
        type: 'character'
      }));
      
      expect(nodes).toContainEqual(expect.objectContaining({
        id: 'elem1',
        type: 'element'
      }));
      
      expect(nodes).toContainEqual(expect.objectContaining({
        id: 'event1',
        type: 'timeline_event'
      }));
      
      expect(edges).toContainEqual(expect.objectContaining({
        source: 'char1',
        target: 'event1',
        type: 'participates_in'
      }));
      
      expect(edges).toContainEqual(expect.objectContaining({
        source: 'event1',
        target: 'elem1',
        type: 'involves'
      }));
    });

    it('should return 404 for a non-existent character', async () => {
      await request(app)
        .get('/api/journeys/nonexistent')
        .expect(404);
    });
  });

  describe('GET /api/journeys/:characterId/gaps', () => {
    it('should return gaps for an existing character', async () => {
      const response = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      // Gaps are computed based on timeline events, so we expect at least one gap
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify gap structure
      const gap = response.body[0];
      expect(gap).toHaveProperty('id');
      expect(gap).toHaveProperty('character_id', 'char1');
      expect(gap).toHaveProperty('start_minute');
      expect(gap).toHaveProperty('end_minute');
      expect(gap).toHaveProperty('severity');
    });

    it('should return an empty array if no gaps exist', async () => {
      // Clear all timeline events to ensure no gaps
      await testDb.clearData();
      await testDb.insertTestCharacter({
        id: 'char1',
        name: 'Test Character',
        type: 'Protagonist'
      });
      
      const response = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/gaps/all', () => {
    it('should return all gaps for all characters', async () => {
      // Add another character with gaps
      await testDb.insertTestCharacter({
        id: 'char2',
        name: 'Another Character',
        type: 'Supporting'
      });
      
      await testDb.insertTestTimelineEvent({
        id: 'event2',
        description: 'Another event',
        element_ids: JSON.stringify(['elem1'])
      });
      
      await testDb.createCharacterTimelineLink('char2', 'event2');
      
      const response = await request(app)
        .get('/api/gaps/all')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify gaps from both characters are included
      const characterIds = new Set(response.body.map(gap => gap.character_id));
      expect(characterIds).toContain('char1');
      expect(characterIds).toContain('char2');
    });

    it('should return an empty array if no characters exist', async () => {
      await testDb.clearData();
      
      const response = await request(app)
        .get('/api/gaps/all')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/journeys/:characterId/gaps/:gapId/suggestions', () => {
    it('should return suggestions for a valid gap', async () => {
      // First get a gap ID
      const gapsResponse = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      const gapId = gapsResponse.body[0].id;
      
      const response = await request(app)
        .get(`/api/journeys/char1/gaps/${gapId}/suggestions`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify suggestion structure
      const suggestion = response.body[0];
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('description');
      expect(suggestion).toHaveProperty('impact');
    });

    it('should return 404 if the gapId does not exist', async () => {
      await request(app)
        .get('/api/journeys/char1/gaps/nonexistent/suggestions')
        .expect(404);
    });

    it('should return 404 if characterId for suggestions does not exist', async () => {
      // First get a gap ID
      const gapsResponse = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      const gapId = gapsResponse.body[0].id;
      
      await request(app)
        .get(`/api/journeys/nonexistent/gaps/${gapId}/suggestions`)
        .expect(404);
    });
  });
});
