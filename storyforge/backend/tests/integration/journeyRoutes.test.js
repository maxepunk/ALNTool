const request = require('supertest');
const express = require('express');
const journeyRoutes = require('../../src/routes/journeyRoutes');
const TestDbSetup = require('../utils/testDbSetup');

describe('Journey Routes', () => {
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

  describe('POST /api/gaps/:gapId/resolve', () => {
    it('should resolve a gap successfully with status and comment', async () => {
      // First get a gap ID
      const gapsResponse = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      const gapId = gapsResponse.body[0].id;
      
      const response = await request(app)
        .post(`/api/gaps/${gapId}/resolve`)
        .send({
          status: 'Resolved',
          comment: 'Test resolution'
        })
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: gapId,
        status: 'Resolved',
        resolution_comment: 'Test resolution'
      });
      
      // Verify the gap is updated in the database
      const updatedGap = testDb.db.prepare(`
        SELECT * FROM cached_journey_graphs 
        WHERE character_id = ? AND graph_nodes LIKE ?
      `).get('char1', `%${gapId}%`);
      
      expect(updatedGap).toBeDefined();
      const nodes = JSON.parse(updatedGap.graph_nodes);
      const gapNode = nodes.find(n => n.id === gapId);
      expect(gapNode).toMatchObject({
        status: 'Resolved',
        resolution_comment: 'Test resolution'
      });
    });

    it('should return 404 if gap not found', async () => {
      await request(app)
        .post('/api/gaps/nonexistent/resolve')
        .send({
          status: 'Resolved',
          comment: 'Test comment'
        })
        .expect(404);
    });

    it('should return 400 if status is missing in payload', async () => {
      // First get a gap ID
      const gapsResponse = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      const gapId = gapsResponse.body[0].id;
      
      await request(app)
        .post(`/api/gaps/${gapId}/resolve`)
        .send({
          comment: 'Test comment'
        })
        .expect(400);
    });

    it('should resolve a gap successfully with only status (comment is optional)', async () => {
      // First get a gap ID
      const gapsResponse = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      const gapId = gapsResponse.body[0].id;
      
      const response = await request(app)
        .post(`/api/gaps/${gapId}/resolve`)
        .send({
          status: 'Resolved'
        })
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: gapId,
        status: 'Resolved',
        resolution_comment: null
      });
    });
  });
});
