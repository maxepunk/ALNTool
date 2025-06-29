/**
 * Integration tests for Game Constants API endpoint
 * Tests the /api/game-constants endpoint end-to-end
 */

const request = require('supertest');
const express = require('express');
const notionRoutes = require('../../src/routes/notion');
const GameConstants = require('../../src/config/GameConstants');

describe('Game Constants API Integration', () => {
  let app;

  beforeAll(() => {
    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api', notionRoutes);
  });

  describe('GET /api/game-constants', () => {
    test('should return game constants successfully', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect('Content-Type', /json/)
        .expect(200);

      // Should return the exact GameConstants object
      expect(response.body).toEqual(GameConstants);
    });

    test('should return all required top-level constant categories', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const constants = response.body;

      // Verify all major constant categories are present
      expect(constants).toHaveProperty('MEMORY_VALUE');
      expect(constants).toHaveProperty('RESOLUTION_PATHS');
      expect(constants).toHaveProperty('ACTS');
      expect(constants).toHaveProperty('CHARACTERS');
      expect(constants).toHaveProperty('ELEMENTS');
      expect(constants).toHaveProperty('PUZZLES');
      expect(constants).toHaveProperty('SYSTEM');
      expect(constants).toHaveProperty('DASHBOARD');
    });

    test('should return proper memory value constants structure', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const { MEMORY_VALUE } = response.body;

      // Test critical memory value constants that frontend depends on
      expect(MEMORY_VALUE).toMatchObject({
        BASE_VALUES: {
          1: 100,
          2: 500,
          3: 1000,
          4: 5000,
          5: 10000
        },
        TYPE_MULTIPLIERS: {
          'Personal': 2.0,
          'Business': 5.0,
          'Technical': 10.0
        },
        TARGET_TOKEN_COUNT: 55,
        MIN_TOKEN_COUNT: 50,
        MAX_TOKEN_COUNT: 60
      });

      expect(MEMORY_VALUE.MEMORY_ELEMENT_TYPES).toContain('Memory Token Video');
      expect(MEMORY_VALUE.MEMORY_ELEMENT_TYPES).toContain('Memory Token Audio');
      expect(MEMORY_VALUE.MEMORY_ELEMENT_TYPES).toContain('Memory Token Physical');
    });

    test('should return proper resolution paths constants', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const { RESOLUTION_PATHS } = response.body;

      expect(RESOLUTION_PATHS.TYPES).toEqual(['Black Market', 'Detective', 'Third Path']);
      expect(RESOLUTION_PATHS.DEFAULT).toBe('Unassigned');
      
      // Verify themes exist for all paths
      const allPaths = [...RESOLUTION_PATHS.TYPES, RESOLUTION_PATHS.DEFAULT];
      allPaths.forEach(path => {
        expect(RESOLUTION_PATHS.THEMES[path]).toMatchObject({
          color: expect.any(String),
          icon: expect.any(String),
          theme: expect.any(String)
        });
      });
    });

    test('should return proper character constants for frontend validation', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const { CHARACTERS } = response.body;

      expect(CHARACTERS.TYPES).toContain('Player');
      expect(CHARACTERS.TYPES).toContain('NPC');
      expect(CHARACTERS.TIERS).toContain('Core');
      expect(CHARACTERS.TIERS).toContain('Secondary');
      expect(CHARACTERS.TIERS).toContain('Tertiary');

      // Verify warning thresholds are valid percentages (0-1)
      expect(CHARACTERS.UNASSIGNED_WARNING_THRESHOLD).toBeGreaterThan(0);
      expect(CHARACTERS.UNASSIGNED_WARNING_THRESHOLD).toBeLessThan(1);
      expect(CHARACTERS.ISOLATED_WARNING_THRESHOLD).toBeGreaterThan(0);
      expect(CHARACTERS.ISOLATED_WARNING_THRESHOLD).toBeLessThan(1);
    });

    test('should return proper elements constants for status validation', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const { ELEMENTS } = response.body;

      // Verify critical status types that frontend filters on
      expect(ELEMENTS.STATUS_TYPES).toContain('Ready for Playtest');
      expect(ELEMENTS.STATUS_TYPES).toContain('Done');
      expect(ELEMENTS.STATUS_TYPES).toContain('In development');

      // Verify element categories include memory types
      expect(ELEMENTS.CATEGORIES).toContain('Prop');
      expect(ELEMENTS.CATEGORIES).toContain('Memory Token Video');
      expect(ELEMENTS.CATEGORIES).toContain('Memory Token Audio');
      expect(ELEMENTS.CATEGORIES).toContain('Memory Token Physical');

      // Verify readiness thresholds are valid
      expect(ELEMENTS.MEMORY_READINESS_THRESHOLD).toBeGreaterThan(0);
      expect(ELEMENTS.MEMORY_READINESS_THRESHOLD).toBeLessThanOrEqual(1);
    });

    test('should return proper puzzle complexity constants', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const { PUZZLES } = response.body;

      // Verify complexity thresholds are logical
      expect(PUZZLES.HIGH_COMPLEXITY_REWARDS_THRESHOLD).toBeGreaterThan(PUZZLES.MEDIUM_COMPLEXITY_REWARDS_THRESHOLD);
      expect(PUZZLES.MEDIUM_COMPLEXITY_REWARDS_THRESHOLD).toBeGreaterThanOrEqual(1);
      expect(PUZZLES.HIGH_COMPLEXITY_OWNERS_THRESHOLD).toBeGreaterThan(0);

      // Verify warning thresholds are valid percentages
      expect(PUZZLES.UNASSIGNED_WARNING_THRESHOLD).toBeGreaterThan(0);
      expect(PUZZLES.UNASSIGNED_WARNING_THRESHOLD).toBeLessThan(1);
    });

    test('should return proper system configuration constants', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const { SYSTEM } = response.body;

      // Verify system settings are reasonable
      expect(SYSTEM.MAX_BATCH_SIZE).toBeGreaterThan(0);
      expect(SYSTEM.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(SYSTEM.MAX_PAGE_SIZE).toBeGreaterThan(SYSTEM.DEFAULT_PAGE_SIZE);

      // Verify cache durations are in logical order
      expect(SYSTEM.CACHE_DURATIONS.SHORT).toBeLessThan(SYSTEM.CACHE_DURATIONS.MEDIUM);
      expect(SYSTEM.CACHE_DURATIONS.MEDIUM).toBeLessThan(SYSTEM.CACHE_DURATIONS.LONG);
    });

    test('should be immutable - endpoint should return frozen object', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      const constants = response.body;

      // While the JSON response itself isn't frozen, it should match our frozen constants
      // The immutability is enforced at the source (GameConstants.js)
      expect(constants).toEqual(GameConstants);
      
      // Verify the source constants are actually frozen
      expect(Object.isFrozen(GameConstants)).toBe(true);
    });

    test('should handle OPTIONS request for CORS preflight', async () => {
      const response = await request(app)
        .options('/api/game-constants');

      // Should handle OPTIONS without error (even if no specific CORS headers are set)
      expect(response.status).not.toBe(500);
    });

    test('should return consistent data across multiple requests', async () => {
      // Make multiple requests to ensure consistency
      const response1 = await request(app).get('/api/game-constants').expect(200);
      const response2 = await request(app).get('/api/game-constants').expect(200);
      const response3 = await request(app).get('/api/game-constants').expect(200);

      // All responses should be identical
      expect(response1.body).toEqual(response2.body);
      expect(response2.body).toEqual(response3.body);
      expect(response1.body).toEqual(GameConstants);
    });

    test('should have reasonable response size', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      // Response should be reasonably sized (not empty, not massive)
      const responseString = JSON.stringify(response.body);
      expect(responseString.length).toBeGreaterThan(1000); // Should have substantial content
      expect(responseString.length).toBeLessThan(50000); // Should not be unreasonably large
    });

    test('should not accept POST requests', async () => {
      await request(app)
        .post('/api/game-constants')
        .send({ test: 'data' })
        .expect(404); // Should not have POST handler
    });

    test('should not accept PUT requests', async () => {
      await request(app)
        .put('/api/game-constants')
        .send({ test: 'data' })
        .expect(404); // Should not have PUT handler
    });

    test('should not accept DELETE requests', async () => {
      await request(app)
        .delete('/api/game-constants')
        .expect(404); // Should not have DELETE handler
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid routes gracefully', async () => {
      await request(app)
        .get('/api/game-constants-invalid')
        .expect(404);
    });

    test('should return proper JSON content type', async () => {
      const response = await request(app)
        .get('/api/game-constants')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance', () => {
    test('should respond quickly (under 100ms)', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/game-constants')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100); // Should be very fast since it's just requiring a module
    });

    test('should handle concurrent requests efficiently', async () => {
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/game-constants').expect(200)
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.body).toEqual(GameConstants);
      });

      // Total time for 10 concurrent requests should be reasonable
      expect(totalTime).toBeLessThan(500);
    });
  });
});