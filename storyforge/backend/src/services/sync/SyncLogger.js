const { getDB } = require('../../db/database');

const logger = require('../../utils/logger');
/**
 * Centralized logging service for sync operations.
 * Provides consistent logging interface and tracks sync progress in the database.
 */
class SyncLogger {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   * @private
   */
  initDB() {
    if (!this.db) {
      this.db = getDB();
    }
    return this.db;
  }

  /**
   * Start a new sync operation log entry
   * @param {string} entityType - Type of entity being synced (e.g., 'characters', 'all')
   * @returns {number} The log ID for this sync operation
   */
  startSync(entityType) {
    this.initDB();

    const stmt = this.db.prepare(
      'INSERT INTO sync_log (start_time, status, entity_type) VALUES (?, ?, ?)'
    );

    const { lastInsertRowid } = stmt.run(
      new Date().toISOString(),
      'started',
      entityType
    );

    logger.debug(`🔄 Starting sync for ${entityType}...`);
    return lastInsertRowid;
  }

  /**
   * Mark a sync operation as successfully completed
   * @param {number} logId - The log ID from startSync
   * @param {Object} stats - Statistics about the sync operation
   * @param {number} stats.fetched - Number of records fetched from source
   * @param {number} stats.synced - Number of records successfully synced
   * @param {number} stats.errors - Number of errors encountered
   */
  completeSync(logId, stats = {}) {
    this.initDB();

    const { fetched = 0, synced = 0, errors = 0 } = stats;

    this.db.prepare(
      `UPDATE sync_log 
       SET end_time = ?, status = 'completed', 
           records_fetched = ?, records_synced = ?, errors = ?
       WHERE id = ?`
    ).run(
      new Date().toISOString(),
      fetched,
      synced,
      errors,
      logId
    );

    // Get entity type for logging
    const { entity_type } = this.db.prepare(
      'SELECT entity_type FROM sync_log WHERE id = ?'
    ).get(logId);

    logger.debug(`✅ ${entity_type}: ${synced}/${fetched} synced successfully` +
                (errors > 0 ? ` (${errors} errors)` : ''));
  }

  /**
   * Mark a sync operation as failed
   * @param {number} logId - The log ID from startSync
   * @param {Error} error - The error that caused the failure
   * @param {Object} stats - Partial statistics if available
   */
  failSync(logId, error, stats = {}) {
    this.initDB();

    const { fetched = 0, synced = 0 } = stats;

    this.db.prepare(
      `UPDATE sync_log 
       SET end_time = ?, status = 'failed', 
           error_details = ?, records_fetched = ?, records_synced = ?
       WHERE id = ?`
    ).run(
      new Date().toISOString(),
      error.message || String(error),
      fetched,
      synced,
      logId
    );

    // Get entity type for logging
    const { entity_type } = this.db.prepare(
      'SELECT entity_type FROM sync_log WHERE id = ?'
    ).get(logId);

    logger.error(`❌ ${entity_type} sync failed:`, error.message);
  }

  /**
   * Log a warning message during sync
   * @param {string} message - Warning message
   * @param {*} details - Additional details to log
   */
  warn(message, details = null) {
    logger.warn(`⚠️  ${message}`, details || '');
  }

  /**
   * Log an error message during sync
   * @param {string} message - Error message
   * @param {Error|*} error - Error object or details
   */
  error(message, error = null) {
    if (error instanceof Error) {
      logger.error(`❌ ${message}:`, error.message);
    } else {
      logger.error(`❌ ${message}`, error || '');
    }
  }

  /**
   * Log an info message during sync
   * @param {string} message - Info message
   */
  info(message) {
    logger.debug(`📝 ${message}`);
  }

  /**
   * Get recent sync history
   * @param {number} limit - Number of recent sync operations to retrieve
   * @returns {Array} Array of sync log entries
   */
  getRecentSyncHistory(limit = 10) {
    this.initDB();

    return this.db.prepare(
      `SELECT * FROM sync_log 
       ORDER BY start_time DESC 
       LIMIT ?`
    ).all(limit);
  }

  /**
   * Get sync statistics for a specific entity type
   * @param {string} entityType - The entity type to get stats for
   * @returns {Object} Statistics object
   */
  getSyncStats(entityType) {
    this.initDB();

    const stats = this.db.prepare(
      `SELECT 
        COUNT(*) as total_syncs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_syncs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_syncs,
        AVG(records_synced) as avg_records_synced,
        MAX(end_time) as last_sync_time
       FROM sync_log 
       WHERE entity_type = ?`
    ).get(entityType);

    return stats;
  }
}

module.exports = SyncLogger;