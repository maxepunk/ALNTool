const { getDB } = require('../../../db/database');

/**
 * Abstract base class for entity syncers using Template Method pattern.
 * Provides common sync workflow while allowing subclasses to implement specific logic.
 */
class BaseSyncer {
  /**
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.notionService - Service for fetching from Notion
   * @param {Object} dependencies.propertyMapper - Service for mapping Notion properties
   * @param {Object} dependencies.logger - SyncLogger instance
   * @param {string} dependencies.entityType - Type of entity being synced (e.g. 'characters', 'elements')
   */
  constructor({ notionService, propertyMapper, logger, entityType }) {
    if (new.target === BaseSyncer) {
      throw new Error('BaseSyncer is an abstract class and cannot be instantiated directly');
    }

    if (!entityType) {
      throw new Error('entityType is required in BaseSyncer constructor');
    }

    this.notionService = notionService;
    this.propertyMapper = propertyMapper;
    this.logger = logger;
    this.db = null;
    this.entityType = entityType;
  }

  /**
   * Initialize database connection
   * @protected
   */
  initDB() {
    if (!this.db) {
      this.db = getDB();
    }
    return this.db;
  }

  /**
   * Main sync method using Template Method pattern
   * @param {Object} options - Sync options
   * @param {number} options.batchSize - Number of records to process at once
   * @param {boolean} options.continueOnError - Whether to continue syncing on item errors
   * @returns {Object} Sync results with statistics
   */
  async sync(options = {}) {
    const { batchSize = 100, continueOnError = true } = options;

    const logId = this.logger.startSync(this.entityType);
    const stats = { fetched: 0, synced: 0, errors: 0 };

    try {
      // Step 1: Fetch data from Notion
      const notionData = await this.fetchFromNotion();
      stats.fetched = notionData.length;

      if (stats.fetched === 0) {
        this.logger.warn(`No ${this.entityType} found in Notion.`);
        this.logger.completeSync(logId, stats);
        return stats;
      }

      // Step 2: Process in transaction
      this.initDB();
      this.db.exec('BEGIN');

      try {
        // Step 3: Clear existing data
        await this.clearExistingData();

        // Step 4: Process items in batches
        for (let i = 0; i < notionData.length; i += batchSize) {
          const batch = notionData.slice(i, i + batchSize);

          for (const item of batch) {
            try {
              // Step 5: Map and validate data
              const mappedData = await this.mapData(item);

              if (mappedData && !mappedData.error) {
                // Step 6: Insert data
                await this.insertData(mappedData);
                stats.synced++;
              } else {
                stats.errors++;
                this.handleItemError(item, mappedData?.error || 'Unknown mapping error');

                if (!continueOnError) {
                  throw new Error(`Failed to sync ${this.entityType} item: ${item.id}`);
                }
              }
            } catch (itemError) {
              stats.errors++;
              this.handleItemError(item, itemError);

              if (!continueOnError) {
                throw itemError;
              }
            }
          }
        }

        // Step 7: Post-process if needed
        await this.postProcess();

        // Commit transaction
        this.db.exec('COMMIT');

        // Log success
        this.logger.completeSync(logId, stats);

        return stats;

      } catch (error) {
        // Rollback on error
        if (this.db.inTransaction) {
          this.db.exec('ROLLBACK');
        }
        throw error;
      }

    } catch (error) {
      this.logger.failSync(logId, error, stats);
      throw error;
    }
  }

  /**
   * Handle individual item sync errors
   * @protected
   * @param {Object} item - The item that failed
   * @param {Error|string} error - The error that occurred
   */
  handleItemError(item, error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(
      `Error processing ${this.entityType} ${item.id}`,
      errorMessage
    );
  }

  /**
   * Optional post-processing step after all items are synced
   * @protected
   * @returns {Promise<void>}
   */
  async postProcess() {
    // Default implementation does nothing
    // Subclasses can override if needed
  }

  // Abstract methods that must be implemented by subclasses

  /**
   * Fetch data from Notion
   * @abstract
   * @returns {Promise<Array>} Array of Notion objects
   */
  async fetchFromNotion() {
    throw new Error(`${this.constructor.name} must implement fetchFromNotion()`);
  }

  /**
   * Clear existing data before sync
   * @abstract
   * @returns {Promise<void>}
   */
  async clearExistingData() {
    throw new Error(`${this.constructor.name} must implement clearExistingData()`);
  }

  /**
   * Map Notion data to database format
   * @abstract
   * @param {Object} notionItem - Raw Notion item
   * @returns {Promise<Object>} Mapped data object
   */
  async mapData(notionItem) {
    throw new Error(`${this.constructor.name} must implement mapData()`);
  }

  /**
   * Insert mapped data into database
   * @abstract
   * @param {Object} mappedData - Mapped data object
   * @returns {Promise<void>}
   */
  async insertData(mappedData) {
    throw new Error(`${this.constructor.name} must implement insertData()`);
  }

  /**
   * Perform a dry run to preview changes without committing
   * @param {Object} options - Same options as sync()
   * @returns {Object} Preview of changes that would be made
   */
  async dryRun(options = {}) {
    const stats = { fetched: 0, toDelete: 0, toAdd: 0, errors: 0 };

    try {
      // Fetch data from Notion
      const notionData = await this.fetchFromNotion();
      stats.fetched = notionData.length;

      // Get current database state
      this.initDB();
      const currentCount = await this.getCurrentRecordCount();
      stats.toDelete = currentCount;

      // Validate mappings
      for (const item of notionData) {
        try {
          const mappedData = await this.mapData(item);
          if (mappedData && !mappedData.error) {
            stats.toAdd++;
          } else {
            stats.errors++;
          }
        } catch (error) {
          stats.errors++;
        }
      }

      return {
        ...stats,
        wouldSync: stats.toAdd,
        wouldDelete: stats.toDelete,
        wouldError: stats.errors
      };

    } catch (error) {
      throw new Error(`Dry run failed: ${error.message}`);
    }
  }

  /**
   * Get current record count for this entity type
   * @protected
   * @returns {Promise<number>} Current record count
   */
  async getCurrentRecordCount() {
    // Default implementation - subclasses should override for accuracy
    return 0;
  }
}

module.exports = BaseSyncer;