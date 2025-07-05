const request = require('supertest');
const express = require('express');
const syncRoutes = require('../../src/routes/syncRoutes');
const dataSyncService = require('../../src/services/dataSyncService');
const { getDB } = require('../../src/db/database');

// Mock dependencies
jest.mock('../../src/services/dataSyncService');
jest.mock('../../src/db/database');

describe('Sync Routes', () => {
  let app;
  let mockDB;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup express app
    app = express();
    app.use(express.json());
    app.use('/api', syncRoutes);
    
    // Mock database
    mockDB = {
      prepare: jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue({
          count: 10
        }),
        all: jest.fn().mockReturnValue([])
      })
    };
    
    getDB.mockReturnValue(mockDB);
  });

  describe('POST /api/sync', () => {
    it('should trigger a full sync successfully', async () => {
      // Mock successful sync
      dataSyncService.syncFromNotion.mockResolvedValue({
        success: true,
        stats: {
          characters: { synced: 5, errors: 0 },
          elements: { synced: 10, errors: 0 },
          puzzles: { synced: 3, errors: 0 },
          timeline_events: { synced: 8, errors: 0 }
        }
      });

      const response = await request(app)
        .post('/api/sync')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('stats');
      expect(dataSyncService.syncFromNotion).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      // Mock sync error
      dataSyncService.syncFromNotion.mockRejectedValue(new Error('Sync failed'));

      const response = await request(app)
        .post('/api/sync')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Sync failed');
    });
  });

  describe('GET /api/sync/status', () => {
    it('should return current sync status', async () => {
      // Mock sync status data
      mockDB.prepare.mockReturnValue({
        get: jest.fn()
          .mockReturnValueOnce({ count: 22 }) // characters
          .mockReturnValueOnce({ count: 35 }) // elements
          .mockReturnValueOnce({ count: 15 }) // puzzles
          .mockReturnValueOnce({ count: 42 }) // timeline_events
          .mockReturnValueOnce({ count: 4 }) // tables
          .mockReturnValueOnce({ 
            timestamp: '2025-06-11T18:00:00Z',
            status: 'completed'
          }), // last sync
        all: jest.fn().mockReturnValue([])
      });

      const response = await request(app)
        .get('/api/sync/status')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database_status');
      expect(response.body).toHaveProperty('entity_counts');
      expect(response.body.entity_counts).toHaveProperty('characters');
    });
  });

  describe('POST /api/sync/entities/:entityType', () => {
    it('should sync specific entity type', async () => {
      dataSyncService.syncEntityType.mockResolvedValue({
        success: true,
        synced: 5,
        errors: 0
      });

      const response = await request(app)
        .post('/api/sync/entities/characters')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('synced', 5);
      expect(dataSyncService.syncEntityType).toHaveBeenCalledWith('characters');
    });

    it('should validate entity type', async () => {
      const response = await request(app)
        .post('/api/sync/entities/invalid_type')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid entity type');
    });
  });

  describe('POST /api/sync/compute', () => {
    it('should trigger computed fields update', async () => {
      dataSyncService.updateComputedFields.mockResolvedValue({
        success: true,
        updated: {
          act_focus: 42,
          memory_values: 35,
          narrative_threads: 22,
          resolution_paths: 18
        }
      });

      const response = await request(app)
        .post('/api/sync/compute')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('updated');
      expect(response.body.updated).toHaveProperty('act_focus', 42);
    });
  });

  describe('GET /api/sync/history', () => {
    it('should return sync history', async () => {
      mockDB.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue([
          {
            id: 1,
            timestamp: '2025-06-11T18:00:00Z',
            entity_type: 'characters',
            status: 'completed',
            records_synced: 22,
            errors: 0
          },
          {
            id: 2,
            timestamp: '2025-06-11T17:00:00Z',
            entity_type: 'elements',
            status: 'completed',
            records_synced: 35,
            errors: 1
          }
        ])
      });

      const response = await request(app)
        .get('/api/sync/history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('entity_type', 'characters');
    });

    it('should support limit parameter', async () => {
      mockDB.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue([])
      });

      await request(app)
        .get('/api/sync/history?limit=5')
        .expect(200);

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?')
      );
      expect(mockDB.prepare().all).toHaveBeenCalledWith(5);
    });
  });

  describe('DELETE /api/sync/cache', () => {
    it('should clear sync cache', async () => {
      dataSyncService.clearCache.mockResolvedValue({
        success: true,
        cleared: {
          journey_graphs: 22,
          computed_fields: 0
        }
      });

      const response = await request(app)
        .delete('/api/sync/cache')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('cleared');
      expect(dataSyncService.clearCache).toHaveBeenCalled();
    });
  });
});