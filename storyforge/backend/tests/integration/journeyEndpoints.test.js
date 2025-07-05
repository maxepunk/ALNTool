const request = require('supertest');
const express = require('express');
const { initializeDatabase, closeDB } = require('../../src/db/database');
const journeyRoutes = require('../../src/routes/journeyRoutes');
const TestDbSetup = require('../utils/testDbSetup');

describe('Journey Endpoints', () => {
  let app;
  let db;
  let testDb;

  beforeAll(async () => {
    // Initialize the in-memory database for tests
    await closeDB();
    db = initializeDatabase(':memory:');
    
    testDb = new TestDbSetup();
    testDb.db = db;

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api', journeyRoutes);
    
    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Reset data between tests
    await testDb.clearData();
    await setupTestData();
  });

  async function setupTestData() {
    // Insert test characters
    testDb.insertTestCharacter({ id: 'char1', name: 'Test Character 1' });
    testDb.insertTestCharacter({ id: 'char2', name: 'Test Character 2' });
    
    // Insert test elements
    testDb.insertTestElement({ 
      id: 'elem1', 
      name: 'Test Element 1', 
      description: 'A test element'
    });
    
    // Insert test puzzles
    testDb.insertTestPuzzle({ 
      id: 'puzzle1', 
      name: 'Test Puzzle 1',
      description: 'A test puzzle'
    });
    
    // Insert test timeline events
    testDb.insertTestTimelineEvent({
      id: 'event1',
      name: 'Test Event 1',
      description: 'A test event',
      date: '2023-01-01'
    });
    
    // Insert relationships
    await testDb.createCharacterLink('char1', 'char2', 'timeline_event', 'event1');
    testDb.createCharacterTimelineLink('char1', 'event1');
    testDb.createCharacterElementLink('char1', 'elem1', true);
    testDb.createCharacterPuzzleLink('char1', 'puzzle1');
  }

  describe('GET /api/journeys/:characterId', () => {
    it('should return a journey for an existing character', async () => {
      const response = await request(app)
        .get('/api/journeys/char1')
        .expect(200);
      
      expect(response.body).toHaveProperty('character_info');
      expect(response.body).toHaveProperty('graph');
      expect(response.body.character_info).toHaveProperty('id', 'char1');
      expect(response.body.character_info).toHaveProperty('name', 'Test Character 1');
      
      // Verify graph structure
      expect(response.body.graph).toHaveProperty('nodes');
      expect(response.body.graph).toHaveProperty('edges');
      expect(Array.isArray(response.body.graph.nodes)).toBe(true);
      expect(Array.isArray(response.body.graph.edges)).toBe(true);
    });

    it('should include linked characters in the response', async () => {
      const response = await request(app)
        .get('/api/journeys/char1')
        .expect(200);
      
      expect(response.body.character_info).toHaveProperty('linkedCharacters');
      expect(Array.isArray(response.body.character_info.linkedCharacters)).toBe(true);
      
      // Verify linked character structure
      if (response.body.character_info.linkedCharacters.length > 0) {
        const linkedChar = response.body.character_info.linkedCharacters[0];
        expect(linkedChar).toHaveProperty('linked_character_id');
        expect(linkedChar).toHaveProperty('linked_character_name');
        expect(linkedChar).toHaveProperty('link_count');
        expect(linkedChar).toHaveProperty('link_type');
      }
    });

    it('should include graph structure with correct node types', async () => {
      const response = await request(app)
        .get('/api/journeys/char1')
        .expect(200);
      
      // Check that we have nodes of different types
      const nodes = response.body.graph.nodes;
      const nodeTypes = nodes.map(n => n.type);
      
      expect(nodeTypes).toContain('activityNode'); // puzzles
      expect(nodeTypes).toContain('discoveryNode'); // elements
      expect(nodeTypes).toContain('loreNode'); // timeline events
      
      // Verify node data structure
      const activityNode = nodes.find(n => n.type === 'activityNode');
      if (activityNode) {
        expect(activityNode.data).toHaveProperty('name');
        expect(activityNode.data).toHaveProperty('type', 'puzzle');
      }
    });

    it('should handle character with no journey data', async () => {
      // Create a character with no relationships
      await testDb.clearData();
      testDb.insertTestCharacter({ id: 'char1', name: 'Test Character 1' });
      
      const response = await request(app)
        .get('/api/journeys/char1')
        .expect(200);
      
      expect(response.body.graph.nodes).toHaveLength(0);
      expect(response.body.graph.edges).toHaveLength(0);
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
      // Gaps are deprecated, so we expect an empty array
      expect(response.body.length).toBe(0);
    });

    it('should return an empty array if no gaps exist', async () => {
      // Clear all timeline events to ensure no gaps
      await testDb.clearData();
      testDb.insertTestCharacter({ id: 'char1', name: 'Test Character 1' });
      
      const response = await request(app)
        .get('/api/journeys/char1/gaps')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return empty array for non-existent character', async () => {
      const response = await request(app)
        .get('/api/journeys/nonexistent/gaps')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/gaps/all', () => {
    it('should return empty array for deprecated gaps endpoint', async () => {
      const response = await request(app)
        .get('/api/gaps/all')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      // Gaps are deprecated, so we expect an empty array
      expect(response.body.length).toBe(0);
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
    it('should return 410 for deprecated suggestions endpoint', async () => {
      const response = await request(app)
        .get('/api/journeys/char1/gaps/somegap/suggestions')
        .expect(410);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('deprecated');
      expect(response.body).toHaveProperty('migration');
    });

    it('should return 410 for any gap suggestion request', async () => {
      const response = await request(app)
        .get('/api/journeys/char1/gaps/nonexistent/suggestions')
        .expect(410);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should return 410 even if characterId does not exist', async () => {
      const response = await request(app)
        .get('/api/journeys/nonexistent/gaps/somegap/suggestions')
        .expect(410);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/sync/status', () => {
    it('should return sync status', async () => {
      const response = await request(app)
        .get('/api/sync/status')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'foundational_sync_ok');
      expect(response.body).toHaveProperty('pending_changes', 0);
      expect(response.body).toHaveProperty('last_notion_sync');
      expect(response.body).toHaveProperty('last_local_db_update');
      expect(response.body).toHaveProperty('database_status', 'online');
    });
  });

  describe('POST /api/gaps/:gapId/resolve', () => {
    it('should return 410 for deprecated gap resolution endpoint', async () => {
      const response = await request(app)
        .post('/api/gaps/somegap/resolve')
        .send({ resolution: 'some resolution' })
        .expect(410);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('deprecated');
      expect(response.body).toHaveProperty('migration');
    });
  });
});