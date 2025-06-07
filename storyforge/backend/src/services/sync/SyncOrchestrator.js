const SyncLogger = require('./SyncLogger');
const CharacterSyncer = require('./entitySyncers/CharacterSyncer');
const ElementSyncer = require('./entitySyncers/ElementSyncer');
const PuzzleSyncer = require('./entitySyncers/PuzzleSyncer');
const TimelineEventSyncer = require('./entitySyncers/TimelineEventSyncer');
const RelationshipSyncer = require('./RelationshipSyncer');
const ComputeOrchestrator = require('../compute/ComputeOrchestrator');
const notionService = require('../notionService');
const propertyMapper = require('../../utils/notionPropertyMapper');
const { invalidateJourneyCache, clearExpiredJourneyCache } = require('../../db/queries');

/**
 * SyncOrchestrator coordinates the multi-phase sync process:
 * 1. Entity Phase: Sync base entities (characters, elements, puzzles, timeline)
 * 2. Relationship Phase: Sync relationships and compute character links
 * 3. Compute Phase: Calculate derived fields (act focus, resolution paths, etc.)
 * 4. Cache Phase: Invalidate and refresh cache
 */
class SyncOrchestrator {
  constructor(db) {
    if (!db) throw new Error('Database connection required');
    this.db = db;
    this.logger = new SyncLogger(db);
    
    // Prepare dependencies for entity syncers
    const dependencies = {
      notionService,
      propertyMapper,
      logger: this.logger
    };
    
    // Initialize entity syncers with proper dependencies
    this.characterSyncer = new CharacterSyncer(dependencies);
    this.elementSyncer = new ElementSyncer(dependencies);
    this.puzzleSyncer = new PuzzleSyncer(dependencies);
    this.timelineEventSyncer = new TimelineEventSyncer(dependencies);
    this.relationshipSyncer = new RelationshipSyncer(dependencies);
    
    // Initialize compute orchestrator
    this.computeOrchestrator = new ComputeOrchestrator(db);
  }

  /**
   * Run complete sync process with all phases
   * @param {Object} options - Sync options
   * @param {boolean} options.skipCompute - Skip compute phase
   * @param {boolean} options.skipCache - Skip cache invalidation
   * @returns {Promise<Object>} Sync results
   */
  async syncAll(options = {}) {
    const startTime = Date.now();
    const phases = {};
    
    try {
      console.log('🚀 Starting sync orchestration...');
      
      // Phase 1: Entity Sync
      console.log('\n📋 Phase 1: Syncing base entities...');
      const entityStartTime = Date.now();
      
      phases.entities = await this.syncEntities();
      phases.entities.duration = Date.now() - entityStartTime;
      console.log(`✅ Entity sync completed in ${phases.entities.duration}ms`);
      
      // Phase 2: Relationship Sync
      console.log('\n🔗 Phase 2: Syncing relationships...');
      const relationshipStartTime = Date.now();
      
      phases.relationships = await this.syncRelationships();
      phases.relationships.duration = Date.now() - relationshipStartTime;
      console.log(`✅ Relationship sync completed in ${phases.relationships.duration}ms`);
      
      // Phase 3: Compute Derived Fields (unless skipped)
      if (!options.skipCompute) {
        console.log('\n🧮 Phase 3: Computing derived fields...');
        const computeStartTime = Date.now();
        
        phases.compute = await this.computeDerivedFields();
        phases.compute.duration = Date.now() - computeStartTime;
        console.log(`✅ Compute phase completed in ${phases.compute.duration}ms`);
      } else {
        console.log('\n⏭️  Phase 3: Skipped compute phase');
        phases.compute = { skipped: true };
      }
      
      // Phase 4: Cache Management (unless skipped)
      if (!options.skipCache) {
        console.log('\n🗄️  Phase 4: Managing cache...');
        const cacheStartTime = Date.now();
        
        phases.cache = await this.manageCaches();
        phases.cache.duration = Date.now() - cacheStartTime;
        console.log(`✅ Cache management completed in ${phases.cache.duration}ms`);
      } else {
        console.log('\n⏭️  Phase 4: Skipped cache management');
        phases.cache = { skipped: true };
      }
      
      const totalDuration = Date.now() - startTime;
      console.log(`\n🎉 Sync orchestration completed successfully in ${totalDuration}ms`);
      
      return {
        success: true,
        status: 'completed',
        totalDuration,
        phases,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString()
      };
      
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error('❌ Sync orchestration failed:', error.message);
      
      return {
        success: false,
        status: 'failed',
        error: error.message,
        totalDuration,
        phases,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString()
      };
    }
  }

  /**
   * Phase 1: Sync all base entities
   * @returns {Promise<Object>} Entity sync results
   */
  async syncEntities() {
    const results = {};
    
    try {
      // Sync entities sequentially to avoid transaction conflicts
      // Each syncer uses its own transaction, so they cannot run in parallel
      
      console.log('🔄 Starting characters sync...');
      results.characters = await this.characterSyncer.sync();
      
      console.log('🔄 Starting elements sync...');
      results.elements = await this.elementSyncer.sync();
      
      console.log('🔄 Starting puzzles sync...');
      results.puzzles = await this.puzzleSyncer.sync();
      
      console.log('🔄 Starting timeline events sync...');
      results.timeline_events = await this.timelineEventSyncer.sync();
      
      // Calculate totals
      results.totalRecords = Object.values(results).reduce((sum, result) => {
        return sum + (result.recordsProcessed || 0);
      }, 0);
      
      results.totalErrors = Object.values(results).reduce((sum, result) => {
        return sum + (result.errors || 0);
      }, 0);
      
      return results;
      
    } catch (error) {
      throw new Error(`Entity sync failed: ${error.message}`);
    }
  }

  /**
   * Phase 2: Sync relationships between entities
   * @returns {Promise<Object>} Relationship sync results
   */
  async syncRelationships() {
    try {
      return await this.relationshipSyncer.sync();
    } catch (error) {
      throw new Error(`Relationship sync failed: ${error.message}`);
    }
  }

  /**
   * Phase 3: Compute derived fields for all entities
   * @returns {Promise<Object>} Compute results
   */
  async computeDerivedFields() {
    try {
      console.log('🧮 Computing derived fields...');
      return await this.computeOrchestrator.computeAll();
    } catch (error) {
      throw new Error(`Compute phase failed: ${error.message}`);
    }
  }

  /**
   * Phase 4: Manage caches (invalidate journey cache, clear expired)
   * @returns {Promise<Object>} Cache management results
   */
  async manageCaches() {
    try {
      const startTime = Date.now();
      
      // Invalidate journey cache since data has changed
      console.log('♻️  Invalidating journey cache...');
      const invalidateResult = invalidateJourneyCache();
      
      // Clear expired cache entries
      console.log('🧹 Clearing expired cache entries...');
      const clearResult = clearExpiredJourneyCache();
      
      return {
        cacheInvalidated: invalidateResult.changes,
        expiredEntriesCleared: clearResult.changes,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      throw new Error(`Cache management failed: ${error.message}`);
    }
  }

  /**
   * Process the result of an entity sync operation
   * @param {string} entityType - Type of entity (for logging)
   * @param {Object} result - PromiseSettledResult from Promise.allSettled
   * @returns {Object} Processed result
   */
  processEntityResult(entityType, result) {
    if (result.status === 'fulfilled') {
      return {
        success: true,
        recordsProcessed: result.value.recordsProcessed || 0,
        errors: result.value.errors || 0,
        details: result.value
      };
    } else {
      console.error(`❌ ${entityType} sync failed:`, result.reason.message);
      return {
        success: false,
        error: result.reason.message,
        recordsProcessed: 0,
        errors: 1
      };
    }
  }

  /**
   * Run only the entity sync phase
   * @returns {Promise<Object>} Entity sync results
   */
  async syncEntitiesOnly() {
    console.log('📋 Running entity sync only...');
    return await this.syncEntities();
  }

  /**
   * Run only the compute phase
   * @returns {Promise<Object>} Compute results
   */
  async computeOnly() {
    console.log('🧮 Running compute phase only...');
    return await this.computeDerivedFields();
  }

  /**
   * Run only the relationship sync phase
   * @returns {Promise<Object>} Relationship sync results
   */
  async syncRelationshipsOnly() {
    console.log('🔗 Running relationship sync only...');
    return await this.syncRelationships();
  }

  /**
   * Get current sync status
   * @returns {Object} Current sync status
   */
  getStatus() {
    // For now, return a simple status
    return {
      isRunning: false,
      progress: 0,
      startTime: null
    };
  }

  /**
   * Cancel the current sync operation
   * @returns {boolean} Whether cancellation was successful
   */
  cancel() {
    // For now, return false since we don't have cancellation implemented
    return false;
  }
}

module.exports = SyncOrchestrator;