const request = require('supertest');
const TestDbSetup = require('../utils/testDbSetup');
const express = require('express');
const notionRoutes = require('../../src/routes/notion');

describe('Character Sociogram Data Endpoint Integration', () => {
  let dbSetup;
  let app;
  let db;

  beforeAll(async () => {
    // Initialize test database and set it as the global instance
    const { initializeDatabase, closeDB } = require('../../src/db/database');
    
    // Close any existing connection
    await closeDB();
    
    // Initialize with in-memory test database
    db = initializeDatabase(':memory:');
    
    dbSetup = new TestDbSetup();
    // Don't call initialize since we already have a db
    dbSetup.db = db;
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api', notionRoutes);
  });

  afterEach(async () => {
    await dbSetup.clearData();
  });

  afterAll(async () => {
    const { closeDB } = require('../../src/db/database');
    await closeDB();
  });

  describe('GET /api/characters/with-sociogram-data', () => {
    it('should return enriched character data with relationship counts', async () => {
      // Create test characters
      const characters = [
        { id: 'alex', name: 'Alex Reeves', type: 'Player', tier: 'Core' },
        { id: 'marcus', name: 'Marcus Blackwood', type: 'NPC', tier: 'Core' },
        { id: 'sarah', name: 'Sarah Blackwood', type: 'Player', tier: 'Core' },
        { id: 'victoria', name: 'Victoria Kingsley', type: 'Player', tier: 'Core' }
      ];

      for (const char of characters) {
        dbSetup.insertTestCharacter(char);
      }

      // Create character links (relationships)
      await dbSetup.createCharacterLink('alex', 'marcus', 'timeline_event', 'event-1');
      await dbSetup.createCharacterLink('alex', 'sarah', 'element', 'elem-1');
      await dbSetup.createCharacterLink('marcus', 'sarah', 'puzzle', 'puzzle-1');
      await dbSetup.createCharacterLink('sarah', 'victoria', 'timeline_event', 'event-2');

      // Create some elements and associations
      const elements = [
        { id: 'elem-1', name: 'Memory Token 1', description: 'SF_ValueRating: [3]' },
        { id: 'elem-2', name: 'Memory Token 2', description: 'SF_ValueRating: [5]' }
      ];

      for (const elem of elements) {
        await dbSetup.insertTestElement(elem);
      }

      dbSetup.createCharacterElementLink('alex', 'elem-1', true);
      dbSetup.createCharacterElementLink('marcus', 'elem-2', true);
      dbSetup.createCharacterElementLink('sarah', 'elem-1', false); // associated, not owned

      // Create timeline events
      dbSetup.insertTestTimelineEvent({ id: 'event-1', description: 'Party begins' });
      dbSetup.insertTestTimelineEvent({ id: 'event-2', description: 'Discovery' });
      
      dbSetup.createCharacterTimelineLink('alex', 'event-1');
      dbSetup.createCharacterTimelineLink('marcus', 'event-1');
      dbSetup.createCharacterTimelineLink('sarah', 'event-2');

      // Set memory values and resolution paths
      db.prepare('UPDATE characters SET total_memory_value = 5000, resolution_paths = ? WHERE id = ?')
        .run(JSON.stringify(['Black Market']), 'alex');
      db.prepare('UPDATE characters SET total_memory_value = 10000, resolution_paths = ? WHERE id = ?')
        .run(JSON.stringify(['Detective', 'Black Market']), 'marcus');

      // Make request
      const response = await request(app)
        .get('/api/characters/with-sociogram-data')
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveLength(4);
      
      // Find specific characters in response
      const alex = response.body.find(c => c.id === 'alex');
      const marcus = response.body.find(c => c.id === 'marcus');
      const sarah = response.body.find(c => c.id === 'sarah');
      const victoria = response.body.find(c => c.id === 'victoria');

      // Verify Alex's data
      expect(alex).toMatchObject({
        id: 'alex',
        name: 'Alex Reeves',
        memoryValue: 5000,
        relationshipCount: 2, // linked to marcus and sarah
        elementCount: 1, // owns elem-1
        timelineEventCount: 1, // event-1
        resolutionPaths: ['Black Market']
      });

      // Verify Marcus's data
      expect(marcus).toMatchObject({
        id: 'marcus',
        name: 'Marcus Blackwood',
        memoryValue: 10000,
        relationshipCount: 2, // linked to alex and sarah
        elementCount: 1, // owns elem-2
        timelineEventCount: 1, // event-1
        resolutionPaths: ['Detective', 'Black Market']
      });

      // Verify Sarah's data
      expect(sarah).toMatchObject({
        id: 'sarah',
        name: 'Sarah Blackwood',
        memoryValue: 0,
        relationshipCount: 3, // linked to alex, marcus, victoria
        elementCount: 1, // associated with elem-1
        timelineEventCount: 1, // event-2
        resolutionPaths: []
      });

      // Verify Victoria's data (minimal connections)
      expect(victoria).toMatchObject({
        id: 'victoria',
        name: 'Victoria Kingsley',
        memoryValue: 0,
        relationshipCount: 1, // linked to sarah
        elementCount: 0,
        timelineEventCount: 0,
        resolutionPaths: []
      });
    });

    it('should handle characters with no relationships gracefully', async () => {
      // Create isolated character
      dbSetup.insertTestCharacter({
        id: 'loner',
        name: 'Isolated Character',
        type: 'NPC',
        tier: 'Tertiary'
      });

      const response = await request(app)
        .get('/api/characters/with-sociogram-data')
        .expect(200);

      expect(response.body).toHaveLength(1);
      
      const loner = response.body[0];
      expect(loner).toMatchObject({
        id: 'loner',
        name: 'Isolated Character',
        memoryValue: 0,
        relationshipCount: 0,
        elementCount: 0,
        timelineEventCount: 0,
        resolutionPaths: []
      });
    });

    it('should correctly count bidirectional relationships', async () => {
      // Create characters
      const chars = ['A', 'B', 'C'].map(id => ({
        id: `char-${id}`,
        name: `Character ${id}`
      }));

      for (const char of chars) {
        dbSetup.insertTestCharacter(char);
      }

      // Create bidirectional links
      // A <-> B (counted once for each)
      await dbSetup.createCharacterLink('char-A', 'char-B', 'element', 'elem-1');
      
      // A -> C and C -> A (should count as one relationship for each)
      await dbSetup.createCharacterLink('char-A', 'char-C', 'puzzle', 'puzzle-1');
      await dbSetup.createCharacterLink('char-C', 'char-A', 'timeline_event', 'event-1');

      const response = await request(app)
        .get('/api/characters/with-sociogram-data')
        .expect(200);

      const charA = response.body.find(c => c.id === 'char-A');
      const charB = response.body.find(c => c.id === 'char-B');
      const charC = response.body.find(c => c.id === 'char-C');

      // A is connected to B and C
      expect(charA.relationshipCount).toBe(2);
      // B is connected to A
      expect(charB.relationshipCount).toBe(1);
      // C is connected to A (multiple links to same character count as 1)
      expect(charC.relationshipCount).toBe(1);
    });

    it('should include all required fields for sociogram visualization', async () => {
      // Create a character with all types of data
      dbSetup.insertTestCharacter({
        id: 'full-char',
        name: 'Fully Connected Character',
        type: 'Player',
        tier: 'Core',
        logline: 'A character with everything'
      });

      // Add resolution paths and memory value
      db.prepare(`
        UPDATE characters 
        SET total_memory_value = 25000,
            resolution_paths = ?
        WHERE id = ?
      `).run(
        JSON.stringify(['Black Market', 'Third Path']),
        'full-char'
      );

      const response = await request(app)
        .get('/api/characters/with-sociogram-data')
        .expect(200);

      const fullChar = response.body[0];
      
      // Verify all required fields are present
      expect(fullChar).toHaveProperty('id');
      expect(fullChar).toHaveProperty('name');
      expect(fullChar).toHaveProperty('type');
      expect(fullChar).toHaveProperty('tier');
      expect(fullChar).toHaveProperty('logline');
      expect(fullChar).toHaveProperty('memoryValue');
      expect(fullChar).toHaveProperty('relationshipCount');
      expect(fullChar).toHaveProperty('elementCount');
      expect(fullChar).toHaveProperty('timelineEventCount');
      expect(fullChar).toHaveProperty('resolutionPaths');
      expect(fullChar).toHaveProperty('resolution_paths'); // Both formats
      
      // Verify values
      expect(fullChar.memoryValue).toBe(25000);
      expect(fullChar.resolutionPaths).toEqual(['Black Market', 'Third Path']);
      expect(fullChar.resolution_paths).toEqual(['Black Market', 'Third Path']);
    });

    it('should handle performance requirements for production data scale', async () => {
      // Create 20+ characters as per requirements
      const characterCount = 25;
      for (let i = 0; i < characterCount; i++) {
        dbSetup.insertTestCharacter({
          id: `perf-char-${i}`,
          name: `Character ${i}`,
          type: i < 5 ? 'Player' : 'NPC',
          tier: i < 5 ? 'Core' : i < 12 ? 'Secondary' : 'Tertiary'
        });
      }

      // Create 125 character links
      let linkCount = 0;
      for (let i = 0; i < characterCount && linkCount < 125; i++) {
        for (let j = i + 1; j < characterCount && linkCount < 125; j++) {
          if (Math.random() > 0.7) { // 30% chance of connection
            await dbSetup.createCharacterLink(
              `perf-char-${i}`,
              `perf-char-${j}`,
              'timeline_event',
              `event-${linkCount}`
            );
            linkCount++;
          }
        }
      }

      // Measure performance
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/characters/with-sociogram-data')
        .expect(200);
      const endTime = Date.now();

      expect(response.body).toHaveLength(characterCount);
      expect(endTime - startTime).toBeLessThan(500); // Should be well under 500ms
      
      // Verify some characters have relationships
      const connectedChars = response.body.filter(c => c.relationshipCount > 0);
      expect(connectedChars.length).toBeGreaterThan(0);
    });
  });
});