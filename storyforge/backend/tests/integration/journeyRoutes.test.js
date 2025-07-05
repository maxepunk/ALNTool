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
});
