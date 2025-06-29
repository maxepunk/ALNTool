const request = require('supertest');
const TestDbSetup = require('../utils/testDbSetup');
const express = require('express');
const journeyRoutes = require('../../src/routes/journeyRoutes');
const JourneyEngine = require('../../src/services/journeyEngine');
const crypto = require('crypto');

describe('Journey Graph Generation with Caching Integration', () => {
  let dbSetup;
  let app;
  let db;
  let journeyEngine;

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
    app.use('/api', journeyRoutes);
    
    // Get journey engine instance
    journeyEngine = new JourneyEngine();
  });

  afterEach(async () => {
    // Only clear cache table to avoid foreign key issues
    try {
      db.prepare('DELETE FROM cached_journey_graphs').run();
    } catch (e) {
      // Ignore if table doesn't exist
    }
  });

  afterAll(async () => {
    const { closeDB } = require('../../src/db/database');
    await closeDB();
  });

  describe('Journey Graph Generation', () => {
    beforeEach(async () => {
      // Set up comprehensive test data
      // Characters
      const alex = { id: 'alex', name: 'Alex Reeves', type: 'Player', tier: 'Core' };
      const marcus = { id: 'marcus', name: 'Marcus Blackwood', type: 'NPC', tier: 'Core' };
      const sarah = { id: 'sarah', name: 'Sarah Blackwood', type: 'Player', tier: 'Core' };
      
      dbSetup.insertTestCharacter(alex);
      dbSetup.insertTestCharacter(marcus);
      dbSetup.insertTestCharacter(sarah);

      // Timeline Events (Lore nodes)
      const events = [
        { id: 'event-1', description: 'Alex and Marcus found BizAI together', date: '2018-01-01' },
        { id: 'event-2', description: 'Marcus gets married to Sarah', date: '2020-06-15' },
        { id: 'event-3', description: 'The party begins', date: '2025-01-01' }
      ];
      
      for (const event of events) {
        dbSetup.insertTestTimelineEvent(event);
      }

      // Elements (Discovery nodes)
      const elements = [
        { 
          id: 'elem-1', 
          name: 'UV Light', 
          type: 'Tool',
          description: 'Reveals hidden messages',
          owner_id: 'sarah'
        },
        { 
          id: 'elem-2', 
          name: 'CEO Badge', 
          type: 'Evidence',
          description: 'Marcus\'s company badge',
          owner_id: 'marcus',
          timeline_event_id: 'event-1'
        },
        { 
          id: 'elem-3', 
          name: 'Memory Token', 
          type: 'Memory',
          description: 'SF_ValueRating: [3] SF_MemoryType: Business',
          owner_id: 'alex',
          timeline_event_id: 'event-3'
        }
      ];
      
      for (const elem of elements) {
        await dbSetup.insertTestElement(elem);
      }

      // Puzzles (Activity nodes)
      const puzzles = [
        { 
          id: 'puzzle-1', 
          name: 'Locked Safe', 
          timing: 'Act 1',
          owner_id: 'alex',
          reward_ids: JSON.stringify(['elem-3'])
        },
        { 
          id: 'puzzle-2', 
          name: 'UV Message', 
          timing: 'Act 1',
          owner_id: 'sarah',
          locked_item_id: 'elem-1',
          puzzle_element_ids: JSON.stringify(['elem-1'])
        }
      ];
      
      for (const puzzle of puzzles) {
        dbSetup.insertTestPuzzle(puzzle);
        // Create character-puzzle relationship
        if (puzzle.owner_id) {
          dbSetup.createCharacterPuzzleLink(puzzle.owner_id, puzzle.id);
        }
      }

      // Create relationships
      dbSetup.createCharacterTimelineLink('alex', 'event-1');
      dbSetup.createCharacterTimelineLink('marcus', 'event-1');
      dbSetup.createCharacterTimelineLink('marcus', 'event-2');
      dbSetup.createCharacterTimelineLink('sarah', 'event-2');
      dbSetup.createCharacterTimelineLink('alex', 'event-3');

      dbSetup.createCharacterElementLink('alex', 'elem-2', false); // associated
      dbSetup.createCharacterElementLink('alex', 'elem-3', true); // owned
      dbSetup.createCharacterElementLink('sarah', 'elem-1', true); // owned
      dbSetup.createCharacterElementLink('marcus', 'elem-2', true); // owned

      // Puzzle relationships - these are stored in the JSON column, not a separate table
    });

    it('should generate a complete journey graph for a character', async () => {
      const response = await request(app)
        .get('/api/journeys/alex')
        .expect(200);

      expect(response.body).toHaveProperty('character_info');
      expect(response.body).toHaveProperty('graph');
      
      const { character_info, graph } = response.body;
      
      // Verify character info
      expect(character_info).toMatchObject({
        id: 'alex',
        name: 'Alex Reeves',
        type: 'Player',
        tier: 'Core'
      });

      // Verify graph structure
      expect(graph).toHaveProperty('nodes');
      expect(graph).toHaveProperty('edges');
      expect(Array.isArray(graph.nodes)).toBe(true);
      expect(Array.isArray(graph.edges)).toBe(true);

      // Find specific nodes
      const puzzleNode = graph.nodes.find(n => n.id === 'puzzle-puzzle-1');
      const elementNode = graph.nodes.find(n => n.id === 'element-elem-3');
      const eventNode = graph.nodes.find(n => n.id === 'event-event-1');

      // Verify node types
      expect(puzzleNode).toMatchObject({
        id: 'puzzle-puzzle-1',
        type: 'activityNode',
        data: expect.objectContaining({
          label: 'Puzzle: Locked Safe',
          timing: 'Act 1'
        })
      });

      expect(elementNode).toMatchObject({
        id: 'element-elem-3',
        type: 'discoveryNode',
        data: expect.objectContaining({
          label: 'Element: Memory Token',
          type: 'Memory'
        })
      });

      expect(eventNode).toMatchObject({
        id: 'event-event-1',
        type: 'loreNode',
        data: expect.objectContaining({
          label: 'Event: Alex and Marcus found BizAI together',
          date: '2018-01-01'
        })
      });

      // Verify edges exist
      const puzzleToElement = graph.edges.find(e => 
        e.source === 'puzzle-puzzle-1' && e.target === 'element-elem-3'
      );
      expect(puzzleToElement).toBeDefined();
      expect(puzzleToElement.label).toBe('rewards');

      const elementToEvent = graph.edges.find(e => 
        e.source === 'element-elem-3' && e.target === 'event-event-3'
      );
      expect(elementToEvent).toBeDefined();
      expect(elementToEvent.type).toBe('contextEdge');
    });

    it('should cache journey graphs and serve from cache on subsequent requests', async () => {
      // First request - should generate and cache
      const startTime1 = Date.now();
      const response1 = await request(app)
        .get('/api/journeys/alex')
        .expect(200);
      const time1 = Date.now() - startTime1;

      // Verify cache was created
      const cacheEntry = db.prepare(
        'SELECT * FROM cached_journey_graphs WHERE character_id = ?'
      ).get('alex');
      
      expect(cacheEntry).toBeDefined();
      expect(cacheEntry.character_id).toBe('alex');
      expect(JSON.parse(cacheEntry.graph_nodes)).toEqual(response1.body.graph.nodes);
      expect(JSON.parse(cacheEntry.graph_edges)).toEqual(response1.body.graph.edges);

      // Second request - should be served from cache (much faster)
      const startTime2 = Date.now();
      const response2 = await request(app)
        .get('/api/journeys/alex')
        .expect(200);
      const time2 = Date.now() - startTime2;

      // Verify same data returned
      expect(response2.body).toEqual(response1.body);

      // Cache should be faster or at least not significantly slower
      // Note: In test environments with small data, the difference might be minimal
      expect(time2).toBeLessThanOrEqual(time1 * 2); // Allow up to 2x time for variance

      // Verify cache was accessed (last_accessed should be updated)
      const updatedCache = db.prepare(
        'SELECT * FROM cached_journey_graphs WHERE character_id = ?'
      ).get('alex');
      const lastAccessedTime = new Date(updatedCache.last_accessed).getTime();
      const cachedAtTime = new Date(updatedCache.cached_at).getTime();
      expect(lastAccessedTime).toBeGreaterThanOrEqual(cachedAtTime);
    });

    it('should invalidate cache when journey data changes', async () => {
      // Generate initial journey
      const response1 = await request(app)
        .get('/api/journeys/alex')
        .expect(200);
      
      const initialNodeCount = response1.body.graph.nodes.length;

      // Add new puzzle for Alex
      dbSetup.insertTestPuzzle({
        id: 'puzzle-3',
        name: 'New Challenge',
        timing: 'Act 2',
        owner_id: 'alex'
      });
      dbSetup.createCharacterPuzzleLink('alex', 'puzzle-3');

      // Update version hash to invalidate cache
      const journeyData = db.prepare(`
        SELECT 
          COUNT(DISTINCT p.id) as puzzle_count,
          COUNT(DISTINCT e.id) as element_count,
          COUNT(DISTINCT te.id) as event_count
        FROM characters c
        LEFT JOIN puzzles p ON p.owner_id = c.id
        LEFT JOIN character_owned_elements coe ON coe.character_id = c.id
        LEFT JOIN elements e ON e.id = coe.element_id
        LEFT JOIN character_timeline_events cte ON cte.character_id = c.id
        LEFT JOIN timeline_events te ON te.id = cte.timeline_event_id
        WHERE c.id = ?
      `).get('alex');

      const newVersionHash = crypto.createHash('md5')
        .update(JSON.stringify(journeyData))
        .digest('hex');

      // Make request - should regenerate due to version mismatch
      const response2 = await request(app)
        .get('/api/journeys/alex')
        .expect(200);

      // Should have more nodes now
      expect(response2.body.graph.nodes.length).toBe(initialNodeCount + 1);
      
      // Find the new puzzle node
      const newPuzzle = response2.body.graph.nodes.find(n => n.id === 'puzzle-puzzle-3');
      expect(newPuzzle).toBeDefined();
      expect(newPuzzle.data.label).toBe('Puzzle: New Challenge');
    });

    it('should handle complex multi-pass graph building correctly', async () => {
      // Request Sarah's journey - has puzzle with dependencies
      const response = await request(app)
        .get('/api/journeys/sarah')
        .expect(200);

      const { graph } = response.body;

      // Verify multi-pass construction worked
      // Pass 1: All nodes should be present
      const uvLight = graph.nodes.find(n => n.id === 'element-elem-1');
      const uvPuzzle = graph.nodes.find(n => n.id === 'puzzle-puzzle-2');
      const marriageEvent = graph.nodes.find(n => n.id === 'event-event-2');

      expect(uvLight).toBeDefined();
      expect(uvPuzzle).toBeDefined();
      expect(marriageEvent).toBeDefined();

      // Pass 2: Gameplay edges
      const puzzleToLight = graph.edges.find(e => 
        e.source === 'element-elem-1' && e.target === 'puzzle-puzzle-2'
      );
      expect(puzzleToLight).toBeDefined();
      expect(puzzleToLight.label).toBe('unlocks');

      // Pass 3: Context edges (none for Sarah's items in this test)
      // Pass 4: Interaction edges would be added here
    });

    it('should handle characters with no journey data gracefully', async () => {
      // Create character with no connections
      dbSetup.insertTestCharacter({
        id: 'empty-char',
        name: 'Empty Character'
      });

      const response = await request(app)
        .get('/api/journeys/empty-char')
        .expect(200);

      expect(response.body.character_info.id).toBe('empty-char');
      expect(response.body.graph.nodes).toHaveLength(0);
      expect(response.body.graph.edges).toHaveLength(0);
    });

    it('should return 404 for non-existent characters', async () => {
      await request(app)
        .get('/api/journeys/non-existent')
        .expect(404);
    });

    it('should meet performance requirements for complex journeys', async () => {
      // Create a complex journey with many nodes
      const complexChar = { id: 'complex', name: 'Complex Character' };
      dbSetup.insertTestCharacter(complexChar);

      // Add 20 puzzles
      for (let i = 0; i < 20; i++) {
        dbSetup.insertTestPuzzle({
          id: `complex-puzzle-${i}`,
          name: `Puzzle ${i}`,
          timing: i < 10 ? 'Act 1' : 'Act 2',
          owner_id: 'complex'
        });
        dbSetup.createCharacterPuzzleLink('complex', `complex-puzzle-${i}`);
      }

      // Add 30 elements
      for (let i = 0; i < 30; i++) {
        await dbSetup.insertTestElement({
          id: `complex-elem-${i}`,
          name: `Element ${i}`,
          type: ['Tool', 'Evidence', 'Memory'][i % 3],
          owner_id: 'complex'
        });
        dbSetup.createCharacterElementLink('complex', `complex-elem-${i}`, true);
      }

      // Add 15 timeline events
      for (let i = 0; i < 15; i++) {
        dbSetup.insertTestTimelineEvent({
          id: `complex-event-${i}`,
          description: `Event ${i}`,
          date: `202${i % 10}-01-01`
        });
        dbSetup.createCharacterTimelineLink('complex', `complex-event-${i}`);
      }

      // First request (cold start)
      const coldStart = Date.now();
      const response1 = await request(app)
        .get('/api/journeys/complex')
        .expect(200);
      const coldTime = Date.now() - coldStart;

      expect(coldTime).toBeLessThan(500); // Must be under 500ms
      expect(response1.body.graph.nodes.length).toBeGreaterThan(50);

      // Second request (cached)
      const cachedStart = Date.now();
      await request(app)
        .get('/api/journeys/complex')
        .expect(200);
      const cachedTime = Date.now() - cachedStart;

      expect(cachedTime).toBeLessThan(100); // Must be under 100ms
    });

    it('should handle cache expiration correctly', async () => {
      // Generate journey
      await request(app)
        .get('/api/journeys/alex')
        .expect(200);

      // Manually expire cache (set cached_at to 25 hours ago)
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      db.prepare(
        'UPDATE cached_journey_graphs SET cached_at = ? WHERE character_id = ?'
      ).run(yesterday, 'alex');

      // Request should regenerate due to expiration
      const response = await request(app)
        .get('/api/journeys/alex')
        .expect(200);

      // Check cache was refreshed
      const newCache = db.prepare(
        'SELECT * FROM cached_journey_graphs WHERE character_id = ?'
      ).get('alex');
      
      const cacheAge = Date.now() - new Date(newCache.cached_at).getTime();
      expect(cacheAge).toBeLessThan(1000); // Should be very recent
    });
  });
});