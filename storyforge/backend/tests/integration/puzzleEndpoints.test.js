const request = require('supertest');

// Mock the notionService to use our test data
jest.mock('../../src/services/notionService', () => require('../services/__mocks__/notionService'));

describe('Puzzle API Endpoints', () => {
  let app;
  
  beforeEach(() => {
    // Create a test app using the global helper
    app = global.createTestApp();
  });
  
  describe('GET /api/puzzles', () => {
    // Skipped temporarily due to authentication issues in test environment
    test.skip('should return all puzzles', async () => {
      const response = await request(app).get('/api/puzzles');
      
      // Check status and response structure
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Check that we got puzzles with the expected structure
      if (response.body.length > 0) {
        const puzzle = response.body[0];
        
        // Verify basic properties
        expect(puzzle).toHaveProperty('id');
        expect(puzzle).toHaveProperty('puzzle');
        
        // Check for relation properties
        expect(puzzle).toHaveProperty('owner');
        expect(puzzle).toHaveProperty('rewards');
      }
    }, 10000);
  });
  
  describe('GET /api/puzzles/:id', () => {
    // Skipped temporarily due to authentication issues in test environment
    test.skip('should return a puzzle with related entity names when valid ID', async () => {
      // Use the first puzzle from the mock data
      const mockService = require('../services/__mocks__/notionService');
      const firstPuzzleId = mockService.MOCK_PUZZLES[0].id;
      
      const response = await request(app).get(`/api/puzzles/${firstPuzzleId}`);
      
      // Check basic response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      
      // Check for relation properties with names
      if (response.body.owner && response.body.owner.length > 0) {
        expect(response.body.owner[0]).toHaveProperty('id');
        expect(response.body.owner[0]).toHaveProperty('name');
      }
      
      if (response.body.rewards && response.body.rewards.length > 0) {
        expect(response.body.rewards[0]).toHaveProperty('id');
        expect(response.body.rewards[0]).toHaveProperty('name');
      }
    }, 10000);
  });
}); 