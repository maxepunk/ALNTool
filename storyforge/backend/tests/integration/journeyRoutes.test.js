const request = require('supertest');
const express = require('express');
const journeyRoutes = require('../../src/routes/journeyRoutes');
const TestDbSetup = require('../utils/testDbSetup');
const { initializeDatabase, closeDB, getDB } = require('../../src/db/database');

describe('Journey Routes', () => {
  let app;
  let testDb;
  
  beforeAll(async () => {
    // Initialize the shared database instance
    await closeDB();
    const db = initializeDatabase(':memory:');
    
    testDb = new TestDbSetup();
    testDb.db = db; // Use the shared database instance
    
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
    await closeDB();
  });

  describe('GET /api/journeys/:characterId', () => {
    it('should return a journey for an existing character', async () => {
      // Verify character exists in test db
      const char = testDb.db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
      expect(char).toBeDefined();
      expect(char.name).toBe('Test Character');
      
      const response = await request(app)
        .get('/api/journeys/char1')
        .expect(200);
      
      expect(response.body).toHaveProperty('character_info');
      expect(response.body).toHaveProperty('graph');
      expect(response.body.character_info).toHaveProperty('id', 'char1');
      expect(response.body.character_info).toHaveProperty('name', 'Test Character');
    });

    it('should return 404 for a non-existent character', async () => {
      await request(app)
        .get('/api/journeys/nonexistent')
        .expect(404);
    });
  });

  describe('GET /api/journeys/:characterId/gaps', () => {
    it('should return empty array for deprecated gaps endpoint', async () => {
      const response = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/gaps/all', () => {
    it('should return empty array for deprecated all gaps endpoint', async () => {
      const response = await request(app)
        .get('/api/gaps/all')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/sync/status', () => {
    it('should return sync status', async () => {
      const response = await request(app)
        .get('/api/sync/status')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pending_changes');
      expect(response.body).toHaveProperty('last_notion_sync');
      expect(response.body).toHaveProperty('last_local_db_update');
      expect(response.body).toHaveProperty('database_status');
    });
  });

  describe('GET /api/journeys/:characterId/gaps/:gapId/suggestions', () => {
    it('should return 410 for deprecated gap suggestions endpoint', async () => {
      const response = await request(app)
        .get('/api/journeys/char1/gaps/somegap/suggestions')
        .expect(410);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('deprecated');
      expect(response.body).toHaveProperty('migration');
    });
  });

  describe('POST /api/gaps/:gapId/resolve', () => {
    it('should return 410 for deprecated gap resolution endpoint', async () => {
      const response = await request(app)
        .post('/api/gaps/somegap/resolve')
        .send({
          status: 'Resolved',
          comment: 'Test resolution'
        })
        .expect(410);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('deprecated');
      expect(response.body).toHaveProperty('migration');
    });

    it('should return 410 for any gap ID', async () => {
      await request(app)
        .post('/api/gaps/nonexistent/resolve')
        .send({
          status: 'Resolved',
          comment: 'Test comment'
        })
        .expect(410);
    });

    it('should return 410 even without valid payload', async () => {
      await request(app)
        .post('/api/gaps/gap123/resolve')
        .send({
          comment: 'Test comment'
        })
        .expect(410);
    });

    it('should return 410 for any gap resolution attempt', async () => {
      const response = await request(app)
        .post('/api/gaps/gap456/resolve')
        .send({
          status: 'Resolved'
        })
        .expect(410);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});
