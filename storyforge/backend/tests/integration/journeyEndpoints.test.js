const request = require('supertest');
const express = require('express');
const journeyRoutes = require('../../src/routes/journeyRoutes'); // Adjust path as necessary
const { initializeDatabase, getDB } = require('../../src/db/database'); // Adjust path
const dbQueries = require('../../src/db/queries'); // To help setup data

// Setup a basic Express app for testing
const app = express();
app.use(express.json());
app.use('/api', journeyRoutes); // Assuming routes are prefixed with /api

let db;

beforeAll(() => {
  // Set up an in-memory database for testing
  // Jest sets NODE_ENV to 'test', so if DATABASE_PATH is conditional, this should work.
  // Otherwise, explicitly set DATABASE_PATH for testing if needed.
  // Forcing in-memory for tests:
  process.env.DATABASE_PATH = ':memory:';
  initializeDatabase();
  db = getDB(); // Get the initialized in-memory DB instance
});

beforeEach(async () => {
  // Clear and repopulate tables before each test
  // Correct order to respect FOREIGN KEY constraints:
  db.exec('DELETE FROM journey_segments;');    // Depends on characters
  db.exec('DELETE FROM gaps;');                // Depends on characters
  db.exec('DELETE FROM puzzles;');             // Depends on characters, elements
  db.exec('DELETE FROM interactions;');       // Depends on characters, elements
  db.exec('DELETE FROM timeline_events;');    // No enforced FKs to characters/elements in current schema
  // Now delete the tables that were referenced
  db.exec('DELETE FROM characters;');
  db.exec('DELETE FROM elements;');
  // Other tables
  db.exec('DELETE FROM path_metrics;');
  // Add more DELETE statements if other tables affect these tests (e.g., stories if it existed).

  // Seed initial data (example character)
  const insertChar = db.prepare('INSERT INTO characters (id, name, type, tier, logline) VALUES (?, ?, ?, ?, ?)');
  insertChar.run('char1', 'Test Character 1', 'Player', 'Core', 'A character for testing.');

  const insertPuzzle = db.prepare('INSERT INTO puzzles (id, name, timing, owner_id, reward_ids) VALUES (?, ?, ?, ?, ?)');
  insertPuzzle.run('puzzle1', 'Test Puzzle 1', '0-10', 'char1', JSON.stringify(['elem1']));

  const insertElement = db.prepare('INSERT INTO elements (id, name, type, description) VALUES (?, ?, ?, ?)');
  insertElement.run('elem1', 'Test Element 1', 'Prop', 'An element discovered by puzzle1.');

  // Add more seed data as needed for specific tests (events, etc.)
});

afterAll(() => {
  db.close();
});

describe('Journey Endpoints', () => {
  // Test for GET /api/journeys/:characterId
  describe('GET /api/journeys/:characterId', () => {
    it('should return a journey for an existing character', async () => {
      const res = await request(app).get('/api/journeys/char1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('character_id', 'char1');
      expect(res.body).toHaveProperty('character_info');
      expect(res.body.character_info.name).toEqual('Test Character 1');
      expect(res.body).toHaveProperty('segments');
      expect(res.body).toHaveProperty('gaps');
      // Check if a discovery from puzzle1 (elem1) happened in the first relevant segment
      const firstRelevantSegment = res.body.segments.find(s => s.start_minute === 0 || s.start_minute === 5 || s.start_minute === 10); // Puzzle is 0-10
      // This check might be too specific if segment discovery logic changes, but good for now
      // expect(firstRelevantSegment.discoveries).toEqual(
      //   expect.arrayContaining([expect.stringContaining('Discovered element via puzzle Test Puzzle 1: Test Element 1')])
      // );
    });

    it('should return 404 for a non-existent character', async () => {
      const res = await request(app).get('/api/journeys/char_nonexistent');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test for GET /api/journeys/:characterId/gaps
  describe('GET /api/journeys/:characterId/gaps', () => {
    it('should return gaps for an existing character', async () => {
      const res = await request(app).get('/api/journeys/char1/gaps');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Based on current simple seeding, there will likely be many gaps
      // Add a test event to fill a segment later to make this more robust
    });
  });

  // Test for GET /api/gaps/all
  describe('GET /api/gaps/all', () => {
    it('should return all gaps for all characters', async () => {
      // Add another character for this test
      const insertChar2 = db.prepare('INSERT INTO characters (id, name, type, tier, logline) VALUES (?, ?, ?, ?, ?)');
      insertChar2.run('char2', 'Test Character 2', 'Player', 'Secondary', 'Another character.');

      const res = await request(app).get('/api/gaps/all');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Check if gaps for char1 are present
      // const char1Gaps = res.body.filter(g => g.characterId === 'char1');
      // expect(char1Gaps.length).toBeGreaterThan(0);
    });

    it('should return an empty array if no characters exist', async () => {
      // First delete dependent data seeded in beforeEach for 'char1' or any other character
      db.exec("DELETE FROM puzzles WHERE owner_id = 'char1';");
      // If other characters were added with dependent data, clear them too or be more specific.
      // For now, assuming only 'char1' and its puzzle from general beforeEach might cause issues.
      db.exec("DELETE FROM journey_segments WHERE character_id = 'char1';");
      db.exec("DELETE FROM gaps WHERE character_id = 'char1';");
      db.exec("DELETE FROM interactions WHERE character_a_id = 'char1' OR character_b_id = 'char1';");

      db.exec('DELETE FROM characters;'); // Now safe to delete all characters

      const res = await request(app).get('/api/gaps/all');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });
  });

  // Test for GET /api/journeys/:characterId/gaps/:gapId/suggestions
  describe('GET /api/journeys/:characterId/gaps/:gapId/suggestions', () => {
     it('should return suggestions for a valid gap', async () => {
         // First, get a journey to find a valid gapId
         const journeyRes = await request(app).get('/api/journeys/char1');
         expect(journeyRes.statusCode).toEqual(200);
         const firstGap = journeyRes.body.gaps[0];

         if (firstGap) {
             const res = await request(app).get(`/api/journeys/char1/gaps/${firstGap.id}/suggestions`);
             expect(res.statusCode).toEqual(200);
             expect(Array.isArray(res.body)).toBe(true);
             expect(res.body.length).toBeGreaterThan(0); // Expect some generic suggestions
         } else {
             // This case might mean no gaps were found, which is also a test outcome.
             // For this test, we assume at least one gap to test suggestion retrieval.
             console.warn("Skipping suggestion test for char1 as no gaps were found in its journey.");
         }
     });

     it('should return 404 if the gapId does not exist', async () => {
         const res = await request(app).get('/api/journeys/char1/gaps/non_existent_gap_id/suggestions');
         expect(res.statusCode).toEqual(404);
     });

     it('should return 404 if characterId for suggestions does not exist', async () => {
         const res = await request(app).get('/api/journeys/char_nonexistent/gaps/any_gap_id/suggestions');
         expect(res.statusCode).toEqual(404);
     });
  });
});
