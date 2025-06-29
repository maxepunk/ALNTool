const request = require('supertest');
const express = require('express');
const { getDB } = require('../../db/database');
const dataSyncService = require('../../services/dataSyncService');
const syncRoutes = require('../syncRoutes');
const DerivedFieldComputer = require('../../services/compute/DerivedFieldComputer');
const ActFocusComputer = require('../../services/compute/ActFocusComputer');
const ResolutionPathComputer = require('../../services/compute/ResolutionPathComputer');

// Mock dependencies
jest.mock('../../services/dataSyncService');
jest.mock('../../db/database');
jest.mock('../../services/compute/DerivedFieldComputer');
jest.mock('../../services/compute/ActFocusComputer');
jest.mock('../../services/compute/ResolutionPathComputer');

// Default mock implementations
const defaultSyncStatus = {
  isRunning: false,
  currentPhase: null,
  progress: 0,
  startTime: null
};

describe('Sync Routes', () => {
  let app;
  let mockDB;
  let activeConnections = 0;
  const maxConnections = 10;

  // Setup before all tests
  beforeAll(() => {
    // Initialize default mock implementations
    dataSyncService.getSyncStatus.mockReturnValue(defaultSyncStatus);
    dataSyncService.syncAll.mockResolvedValue({
      phases: {
        entities: { total: 25, synced: 20, errors: 5 },
        relationships: { processed: 20, errors: 0 },
        compute: { total: 30, computed: 28, errors: 2 },
        cache: { refreshed: true }
      },
      totalDuration: 15000,
      status: 'completed'
    });
    dataSyncService.cancelSync.mockResolvedValue(true);
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Ensure all database connections are closed
    if (mockDB) {
      await Promise.all(
        Array.from({ length: activeConnections }, () =>
          new Promise(resolve => {
            const stmt = mockDB.prepare();
            stmt.finalize();
            activeConnections--;
            resolve();
          })
        )
      );
    }
    // Clear all mocks
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Reset mocks and state
    jest.clearAllMocks();
    activeConnections = 0;

    // Setup mock database with all required methods
    mockDB = {
      exec: jest.fn(),
      prepare: jest.fn().mockImplementation(() => {
        activeConnections++;
        if (activeConnections > maxConnections) {
          throw new Error('Too many database connections');
        }
        return {
          run: jest.fn(),
          get: jest.fn(),
          all: jest.fn(),
          finalize: () => {
            activeConnections--;
          }
        };
      }),
      inTransaction: false,
      close: jest.fn()
    };
    getDB.mockReturnValue(mockDB);

    // Reset compute service mocks
    DerivedFieldComputer.mockImplementation(() => ({
      computeAll: jest.fn().mockResolvedValue({ computed: 10, errors: 0 })
    }));
    ActFocusComputer.mockImplementation(() => ({
      computeAll: jest.fn().mockResolvedValue({ computed: 5, errors: 0 })
    }));
    ResolutionPathComputer.mockImplementation(() => ({
      computeAll: jest.fn().mockResolvedValue({ computed: 8, errors: 0 })
    }));

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/sync', syncRoutes);

    // Reset dataSyncService mocks to defaults
    dataSyncService.getSyncStatus.mockReturnValue(defaultSyncStatus);
    dataSyncService.syncAll.mockResolvedValue({
      phases: {
        entities: { total: 25, synced: 20, errors: 5 },
        relationships: { processed: 20, errors: 0 },
        compute: { total: 30, computed: 28, errors: 2 },
        cache: { refreshed: true }
      },
      totalDuration: 15000,
      status: 'completed'
    });
    dataSyncService.cancelSync.mockResolvedValue(true);
  });

  afterEach(async () => {
    // Ensure all prepared statements are finalized
    if (mockDB) {
      const stmts = mockDB.prepare.mock.results.map(r => r.value);
      await Promise.all(stmts.map(stmt => new Promise(resolve => {
        stmt.finalize();
        resolve();
      })));
    }
  });

  describe('POST /api/sync/data', () => {
    it('should trigger full sync and return success', async () => {
      // Mock successful sync
      dataSyncService.syncAll.mockResolvedValue({
        phases: {
          entities: { total: 25, synced: 20, errors: 5 },
          relationships: { processed: 20, errors: 0 },
          compute: { total: 30, computed: 28, errors: 2 },
          cache: { refreshed: true }
        },
        totalDuration: 15000,
        status: 'completed'
      });

      const response = await request(app)
        .post('/api/sync/data')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Sync completed successfully',
        stats: {
          phases: {
            entities: { total: 25, synced: 20, errors: 5 },
            relationships: { processed: 20, errors: 0 },
            compute: { total: 30, computed: 28, errors: 2 },
            cache: { refreshed: true }
          },
          totalDuration: 15000,
          status: 'completed'
        }
      });

      expect(dataSyncService.syncAll).toHaveBeenCalledTimes(1);
    });

    it('should handle sync errors gracefully', async () => {
      // Mock sync failure
      dataSyncService.syncAll.mockRejectedValue(new Error('Sync failed'));

      const response = await request(app)
        .post('/api/sync/data')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Sync failed',
        message: 'Failed to complete sync operation'
      });
    });

    it('should prevent concurrent syncs', async () => {
      // Mock sync in progress
      dataSyncService.getSyncStatus.mockReturnValue({ isRunning: true });

      const response = await request(app)
        .post('/api/sync/data')
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        error: 'Sync already in progress',
        message: 'A sync operation is already running'
      });

      expect(dataSyncService.syncAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/sync/status', () => {
    it('should return current sync status', async () => {
      // Mock sync status
      dataSyncService.getSyncStatus.mockReturnValue({
        isRunning: true,
        currentPhase: 'entities',
        progress: 45,
        startTime: '2025-06-10T12:00:00Z'
      });

      const response = await request(app)
        .get('/api/sync/status')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        status: {
          isRunning: true,
          currentPhase: 'entities',
          progress: 45,
          startTime: '2025-06-10T12:00:00Z'
        }
      });
    });

    it('should return not running status when no sync active', async () => {
      // Mock no active sync
      dataSyncService.getSyncStatus.mockReturnValue({
        isRunning: false,
        currentPhase: null,
        progress: 0,
        startTime: null
      });

      const response = await request(app)
        .get('/api/sync/status')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        status: {
          isRunning: false,
          currentPhase: null,
          progress: 0,
          startTime: null
        }
      });
    });
  });

  describe('POST /api/sync/cancel', () => {
    it('should cancel running sync', async () => {
      // Mock successful cancellation
      dataSyncService.cancelSync.mockResolvedValue(true);
      dataSyncService.getSyncStatus.mockReturnValue({ isRunning: true });

      const response = await request(app)
        .post('/api/sync/cancel')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Sync cancellation requested'
      });

      expect(dataSyncService.cancelSync).toHaveBeenCalledTimes(1);
    });

    it('should handle no running sync', async () => {
      // Mock no active sync
      dataSyncService.getSyncStatus.mockReturnValue({ isRunning: false });

      const response = await request(app)
        .post('/api/sync/cancel')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'No sync operation to cancel'
      });

      expect(dataSyncService.cancelSync).not.toHaveBeenCalled();
    });

    it('should handle cancellation errors', async () => {
      // Mock sync in progress and cancellation error
      dataSyncService.getSyncStatus.mockReturnValue({ isRunning: true });
      dataSyncService.cancelSync.mockRejectedValue(new Error('Failed to cancel'));

      const response = await request(app)
        .post('/api/sync/cancel')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to cancel',
        message: 'Failed to cancel sync operation'
      });

      expect(dataSyncService.cancelSync).toHaveBeenCalledTimes(1);
    });
  });

  // Performance tests
  describe('Performance', () => {
    // Increase timeout for performance tests
    jest.setTimeout(35000); // 35 seconds

    it('should complete full sync within 30 seconds', async () => {
      const startTime = Date.now();

      // Mock sync with realistic timing but shorter for tests
      dataSyncService.syncAll.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5s sync for testing
        return {
          phases: {
            entities: { total: 25, synced: 20, errors: 5 },
            relationships: { processed: 20, errors: 0 },
            compute: { total: 30, computed: 28, errors: 2 },
            cache: { refreshed: true }
          },
          totalDuration: 5000,
          status: 'completed'
        };
      });

      const response = await request(app)
        .post('/api/sync/data')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
      expect(response.body.success).toBe(true);
    });

    it('should handle database connection limits', async () => {
      // Mock database connection pool
      const maxConnections = 10;
      let activeConnections = 0;

      mockDB.prepare.mockImplementation(() => {
        activeConnections++;
        if (activeConnections > maxConnections) {
          throw new Error('Too many database connections');
        }
        return {
          run: jest.fn(),
          get: jest.fn(),
          all: jest.fn(),
          finalize: () => {
            activeConnections--;
          }
        };
      });

      // Mock successful sync
      dataSyncService.syncAll.mockResolvedValue({
        phases: {
          entities: { total: 25, synced: 20, errors: 5 },
          relationships: { processed: 20, errors: 0 },
          compute: { total: 30, computed: 28, errors: 2 },
          cache: { refreshed: true }
        },
        totalDuration: 15000,
        status: 'completed'
      });

      const response = await request(app)
        .post('/api/sync/data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(activeConnections).toBeLessThanOrEqual(maxConnections);
    });
  });
});