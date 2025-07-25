const SyncOrchestrator = require('./sync/SyncOrchestrator');
const SyncLogger = require('./sync/SyncLogger');
const CharacterSyncer = require('./sync/entitySyncers/CharacterSyncer');
const ElementSyncer = require('./sync/entitySyncers/ElementSyncer');
const PuzzleSyncer = require('./sync/entitySyncers/PuzzleSyncer');
const TimelineEventSyncer = require('./sync/entitySyncers/TimelineEventSyncer');
const RelationshipSyncer = require('./sync/RelationshipSyncer');
const notionService = require('./notionService');
const propertyMapper = require('../utils/notionPropertyMapper');
const { getDB } = require('../db/database');
const { invalidateJourneyCache, clearExpiredJourneyCache } = require('../db/queries');
const ComputeOrchestrator = require('./compute/ComputeOrchestrator');
const ActFocusComputer = require('./compute/ActFocusComputer');
const ResolutionPathComputer = require('./compute/ResolutionPathComputer');
const NarrativeThreadComputer = require('./compute/NarrativeThreadComputer');

const logger = require('../utils/logger');
/**
 * DataSyncService coordinates data synchronization between Notion and SQLite.
 * Uses SyncOrchestrator to manage the sync process in phases:
 * 1. Sync base entities (characters, elements, puzzles, timeline)
 * 2. Sync relationships and compute character links
 * 3. Compute derived fields
 * 4. Maintain cache (optional)
 *
 * @deprecated The following methods are deprecated and will be removed in v2.0:
 * - performCacheMaintenance() - Use cacheManager.refreshCache() instead
 * - computeDerivedFields() - Use computeServices in orchestrator instead
 * - syncRelationships() - Use relationshipSyncer in orchestrator instead
 * - logSyncStart(), logSyncSuccess(), logSyncFailure() - Use SyncLogger instead
 */
class DataSyncService {
  constructor() {
    if (DataSyncService.instance) {
      return DataSyncService.instance;
    }
    DataSyncService.instance = this;

    this.db = null;
    this.logger = new SyncLogger();

    // Initialize sync components
    this.entitySyncers = [
      new CharacterSyncer({ notionService, propertyMapper, logger: this.logger }),
      new ElementSyncer({ notionService, propertyMapper, logger: this.logger }),
      new PuzzleSyncer({ notionService, propertyMapper, logger: this.logger }),
      new TimelineEventSyncer({ notionService, propertyMapper, logger: this.logger })
    ];

    this.relationshipSyncer = new RelationshipSyncer({
      notionService,
      propertyMapper,
      logger: this.logger
    });

    // Initialize compute services
    this.computeServices = [
      new ActFocusComputer(getDB()),
      new ResolutionPathComputer(getDB()),
      new NarrativeThreadComputer(getDB())
    ];

    // Initialize cache manager
    this.cacheManager = {
      refreshCache: async () => {
        await invalidateJourneyCache();
        await clearExpiredJourneyCache();
        return { refreshed: true };
      }
    };

    // Create orchestrator (will be initialized when db is available)
    this.orchestrator = null;
  }

  /**
   * Initialize database connection and orchestrator
   * @private
   */
  initDB() {
    if (!this.db) {
      this.db = getDB();
      // Initialize orchestrator with database connection
      this.orchestrator = new SyncOrchestrator(this.db);
    }
  }

  /**
   * Run a complete sync operation
   * @param {Object} options - Sync options
   * @param {boolean} options.skipCache - Whether to skip cache maintenance
   * @returns {Promise<Object>} Sync results with statistics
   */
  async syncAll(options = {}) {
    try {
      this.initDB();
      const result = await this.orchestrator.syncAll(options);

      logger.debug('Sync completed successfully:', {
        duration: result.totalDuration,
        status: result.status,
        phases: result.phases
      });

      return result;

    } catch (error) {
      logger.error('Sync failed:', error);
      throw error;
    }
  }

  /**
   * Get current sync status including database counts
   * @returns {Promise<Object>} Current sync status with database statistics
   */
  async getSyncStatus() {
    try {
      this.initDB();

      // Get current database counts
      const counts = {};
      const tables = ['characters', 'elements', 'puzzles', 'timeline_events', 'character_links'];

      for (const table of tables) {
        try {
          const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
          counts[table] = result.count;
        } catch (error) {
          logger.warn(`Failed to count ${table}:`, error.message);
          counts[table] = 0;
        }
      }

      return {
        success: true,
        counts,
        lastSync: new Date().toISOString(),
        orchestratorStatus: this.orchestrator.getStatus()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        counts: {},
        lastSync: null
      };
    }
  }

  /**
   * Cancel the current sync operation
   * @returns {boolean} Whether cancellation was successful
   */
  cancelSync() {
    this.initDB();
    return this.orchestrator.cancel();
  }

  /**
   * @deprecated Use cacheManager.refreshCache() instead
   * @private
   */
  async performCacheMaintenance() {
    logger.warn('performCacheMaintenance() is deprecated. Use cacheManager.refreshCache() instead.');
    return this.cacheManager.refreshCache();
  }

  /**
   * @deprecated Use computeServices in orchestrator instead
   * @private
   */
  async computeDerivedFields() {
    logger.warn('computeDerivedFields() is deprecated. Use computeServices in orchestrator instead.');
    const stats = { processed: 0, errors: 0 };
    for (const service of this.computeServices) {
      const result = await service.compute();
      stats.processed += result.computed || 0;
      stats.errors += result.errors || 0;
    }
    return stats;
  }

  /**
   * @deprecated Use relationshipSyncer in orchestrator instead
   * @private
   */
  async syncRelationships() {
    logger.warn('syncRelationships() is deprecated. Use relationshipSyncer in orchestrator instead.');
    return this.relationshipSyncer.sync();
  }

  /**
   * @deprecated Use SyncLogger instead
   * @private
   */
  logSyncStart(entityType) {
    logger.warn('logSyncStart() is deprecated. Use SyncLogger instead.');
    return this.logger.startSync(entityType);
  }

  /**
   * @deprecated Use SyncLogger instead
   * @private
   */
  logSyncSuccess(logId, recordsFetched, recordsSynced, errors) {
    logger.warn('logSyncSuccess() is deprecated. Use SyncLogger instead.');
    return this.logger.completeSync(logId, { fetched: recordsFetched, synced: recordsSynced, errors });
  }

  /**
   * @deprecated Use SyncLogger instead
   * @private
   */
  logSyncFailure(logId, error, recordsFetched = 0, recordsSynced = 0) {
    logger.warn('logSyncFailure() is deprecated. Use SyncLogger instead.');
    return this.logger.failSync(logId, error, { fetched: recordsFetched, synced: recordsSynced });
  }
}

// Export singleton instance
module.exports = new DataSyncService();