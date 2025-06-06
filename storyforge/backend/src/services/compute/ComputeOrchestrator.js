const ActFocusComputer = require('./ActFocusComputer');
const ResolutionPathComputer = require('./ResolutionPathComputer');
const NarrativeThreadComputer = require('./NarrativeThreadComputer');

/**
 * Orchestrates the computation of all derived fields
 * Manages the execution of individual computers and coordinates their updates
 */
class ComputeOrchestrator {
  constructor(db) {
    if (!db) throw new Error('Database connection required');
    this.db = db;
    
    // Initialize computers
    this.actFocusComputer = new ActFocusComputer(db);
    this.resolutionPathComputer = new ResolutionPathComputer(db);
    this.narrativeThreadComputer = new NarrativeThreadComputer(db);
  }

  /**
   * Compute all derived fields for all entities
   * @returns {Promise<{processed: number, errors: number, details: Object}>} Computation stats
   */
  async computeAll() {
    const stats = {
      processed: 0,
      errors: 0,
      details: {}
    };

    try {
      // Start transaction
      this.db.exec('BEGIN');

      // 1. Compute Act Focus for Timeline Events
      console.log('🧮 Computing Act Focus for timeline events...');
      const actFocusStats = await this.actFocusComputer.computeAll();
      stats.processed += actFocusStats.processed;
      stats.errors += actFocusStats.errors;
      stats.details.actFocus = actFocusStats;
      console.log(`✅ Act Focus computed for ${actFocusStats.processed} events (${actFocusStats.errors} errors)`);

      // 2. Compute Resolution Paths for all entity types
      console.log('🧮 Computing Resolution Paths...');
      const entityTypes = ['character', 'puzzle', 'element'];
      for (const type of entityTypes) {
        console.log(`- Computing paths for ${type}s...`);
        const pathStats = await this.resolutionPathComputer.computeAll(type);
        stats.processed += pathStats.processed;
        stats.errors += pathStats.errors;
        stats.details[`${type}Paths`] = pathStats;
        console.log(`✅ Paths computed for ${pathStats.processed} ${type}s (${pathStats.errors} errors)`);
      }

      // 3. Compute Narrative Threads for Puzzles
      console.log('🧮 Computing Narrative Threads for puzzles...');
      const threadStats = await this.narrativeThreadComputer.computeAll();
      stats.processed += threadStats.processed;
      stats.errors += threadStats.errors;
      stats.details.narrativeThreads = threadStats;
      console.log(`✅ Narrative threads computed for ${threadStats.processed} puzzles (${threadStats.errors} errors)`);

      // Commit transaction
      this.db.exec('COMMIT');
      console.log(`✅ All derived fields computed (${stats.processed} total, ${stats.errors} errors)`);
      
      return stats;
    } catch (error) {
      // Rollback on error
      this.db.exec('ROLLBACK');
      throw new Error(`Failed to compute derived fields: ${error.message}`);
    }
  }

  /**
   * Compute derived fields for a specific entity
   * @param {string} entityType - Type of entity ('timeline_event', 'character', 'puzzle', 'element')
   * @param {string} entityId - ID of the entity
   * @returns {Promise<Object>} Computed fields
   */
  async computeEntity(entityType, entityId) {
    let transactionStarted = false;
    try {
      // Get entity from appropriate table
      const tableMap = {
        timeline_event: 'timeline_events',
        character: 'characters',
        puzzle: 'puzzles',
        element: 'elements'
      };
      
      const tableName = tableMap[entityType];
      if (!tableName) {
        throw new Error(`Unsupported entity type: ${entityType}`);
      }

      const entity = this.db.prepare(
        `SELECT * FROM ${tableName} WHERE id = ?`
      ).get(entityId);

      if (!entity) {
        throw new Error(`${entityType} ${entityId} not found`);
      }

      // Start transaction
      this.db.exec('BEGIN');
      transactionStarted = true;

      const computedFields = {};

      // Compute appropriate fields based on entity type
      switch (entityType) {
        case 'timeline_event':
          const { act_focus } = await this.actFocusComputer.compute(entity);
          computedFields.act_focus = act_focus;
          break;

        case 'puzzle':
          // Compute both resolution paths and narrative threads for puzzles
          const [pathResult, threadResult] = await Promise.all([
            this.resolutionPathComputer.compute(entity, entityType),
            this.narrativeThreadComputer.compute(entity)
          ]);
          computedFields.resolution_paths = pathResult.resolution_paths;
          computedFields.computed_narrative_threads = threadResult.computed_narrative_threads;
          break;

        case 'character':
        case 'element':
          const { resolution_paths } = await this.resolutionPathComputer.compute(
            entity, 
            entityType
          );
          computedFields.resolution_paths = resolution_paths;
          break;
      }

      // Update database
      await this.actFocusComputer.updateDatabase(
        tableName,
        'id',
        entity,
        computedFields
      );

      // Commit transaction
      this.db.exec('COMMIT');
      
      return computedFields;
    } catch (error) {
      // Rollback on error only if transaction was started
      if (transactionStarted) {
        this.db.exec('ROLLBACK');
      }
      throw new Error(`Failed to compute fields for ${entityType} ${entityId}: ${error.message}`);
    }
  }
}

module.exports = ComputeOrchestrator; 