# DataSyncService Refactoring Plan

**Date**: June 9, 2025  
**Author**: Production Intelligence Tool Development Team  
**Status**: PROPOSED  
**Scope**: Breaking down the 760-line `dataSyncService.js` monolith into focused, testable modules

---

## Executive Summary

The current `dataSyncService.js` violates several SOLID principles by handling data fetching, transformation, database operations, computation, logging, and caching in a single 760-line class. This refactoring plan proposes decomposing it into 7 focused modules organized in a clear directory structure that separates concerns and improves testability.

---

## Current State Analysis

### Identified Responsibilities (Violations of SRP)
1. **Database Connection Management** - Should be handled by database layer
2. **Sync Orchestration** - Core responsibility, but needs isolation
3. **Entity-Specific Sync Logic** - 4 different entity types with similar patterns
4. **Relationship Sync Logic** - Separate concern from entity sync
5. **Derived Field Computation** - Business logic that should be isolated
6. **Character Link Computation** - Complex graph analysis logic
7. **Cache Maintenance** - Infrastructure concern
8. **Sync Logging** - Cross-cutting concern
9. **Error Handling & Transactions** - Mixed throughout

### Code Smells Identified
- **God Class**: 760 lines handling 9+ responsibilities
- **Duplicate Code**: Similar sync patterns repeated 4 times
- **Hard to Test**: Direct database access throughout
- **Tight Coupling**: Direct dependencies on external services
- **Mixed Abstraction Levels**: Low-level SQL next to high-level orchestration

---

## Proposed Architecture

```
backend/src/
├── services/
│   ├── sync/
│   │   ├── SyncOrchestrator.js          // Main entry point, coordinates sync phases
│   │   ├── entitySyncers/
│   │   │   ├── BaseSyncer.js            // Abstract base class for entity syncers
│   │   │   ├── CharacterSyncer.js       // Characters-specific sync logic
│   │   │   ├── ElementSyncer.js         // Elements-specific sync logic
│   │   │   ├── PuzzleSyncer.js          // Puzzles-specific sync logic
│   │   │   └── TimelineEventSyncer.js   // Timeline events-specific sync logic
│   │   ├── RelationshipSyncer.js        // Handles all relationship syncing
│   │   └── SyncLogger.js                // Centralized sync logging
│   │
│   ├── compute/
│   │   ├── DerivedFieldComputer.js      // Orchestrates all computations
│   │   ├── ActFocusComputer.js          // Timeline event act focus
│   │   ├── NarrativeThreadComputer.js   // Puzzle narrative threads
│   │   ├── ResolutionPathComputer.js    // Resolution paths for all entities
│   │   └── CharacterLinkComputer.js     // Character relationship graph
│   │
│   └── cache/
│       └── JourneyCacheManager.js       // Journey cache maintenance
```

---

## Module Specifications

### 1. SyncOrchestrator.js
**Responsibility**: High-level sync coordination and phase management

```javascript
class SyncOrchestrator {
  constructor(entitySyncers, relationshipSyncer, derivedFieldComputer, cacheManager, logger) {
    this.entitySyncers = entitySyncers;
    this.relationshipSyncer = relationshipSyncer;
    this.derivedFieldComputer = derivedFieldComputer;
    this.cacheManager = cacheManager;
    this.logger = logger;
  }

  async syncAll() {
    const syncId = await this.logger.startSync('all');
    try {
      await this.phase1_syncEntities();
      await this.phase2_syncRelationships();
      await this.phase3_computeLinks();
      await this.phase4_computeDerivedFields();
      await this.phase5_maintainCache();
      await this.logger.completeSync(syncId, stats);
    } catch (error) {
      await this.logger.failSync(syncId, error);
      throw error;
    }
  }

  // Delegates to specific modules for each phase
}
```

### 2. BaseSyncer.js
**Responsibility**: Common sync patterns using Template Method pattern

```javascript
class BaseSyncer {
  constructor(notionService, propertyMapper, db, logger) {
    this.notionService = notionService;
    this.propertyMapper = propertyMapper;
    this.db = db;
    this.logger = logger;
  }

  async sync() {
    const logId = await this.logger.startSync(this.entityType);
    const stats = { fetched: 0, synced: 0, errors: 0 };
    
    try {
      const notionData = await this.fetchFromNotion();
      stats.fetched = notionData.length;
      
      await this.db.transaction(async () => {
        await this.clearExistingData();
        for (const item of notionData) {
          try {
            const mapped = await this.mapData(item);
            await this.insertData(mapped);
            stats.synced++;
          } catch (error) {
            stats.errors++;
            this.handleItemError(item, error);
          }
        }
      });
      
      await this.logger.completeSync(logId, stats);
    } catch (error) {
      await this.logger.failSync(logId, error, stats);
      throw error;
    }
  }

  // Abstract methods for subclasses
  abstract fetchFromNotion();
  abstract clearExistingData();
  abstract mapData(notionItem);
  abstract insertData(mappedItem);
}
```

### 3. DerivedFieldComputer.js
**Responsibility**: Orchestrate all field computations

```javascript
class DerivedFieldComputer {
  constructor(computers, db, logger) {
    this.computers = computers; // Array of specific computers
    this.db = db;
    this.logger = logger;
  }

  async computeAll() {
    const logId = await this.logger.startSync('derived_fields');
    
    try {
      await this.db.transaction(async () => {
        for (const computer of this.computers) {
          await computer.compute();
        }
      });
      
      await this.logger.completeSync(logId, stats);
    } catch (error) {
      await this.logger.failSync(logId, error);
      throw error;
    }
  }
}
```

### 4. ResolutionPathComputer.js
**Responsibility**: Business logic for computing resolution paths

```javascript
class ResolutionPathComputer {
  constructor(db) {
    this.db = db;
  }

  async compute() {
    await this.computeCharacterPaths();
    await this.computePuzzlePaths();
    await this.computeElementPaths();
  }

  computePathsForEntity(entity, entityType) {
    // Extracted business logic, now testable in isolation
    const analyzer = new PathAnalyzer(entity, entityType);
    return analyzer.analyze();
  }
}

// Separate testable business logic
class PathAnalyzer {
  constructor(entity, entityType) {
    this.entity = entity;
    this.entityType = entityType;
  }

  analyze() {
    // Pure function, no database access
    const strategies = {
      character: this.analyzeCharacter.bind(this),
      puzzle: this.analyzePuzzle.bind(this),
      element: this.analyzeElement.bind(this)
    };
    
    return strategies[this.entityType]() || ['Unassigned'];
  }
}
```

---

## API Design for New Modules

### SyncOrchestrator API
```javascript
const orchestrator = new SyncOrchestrator(dependencies);

// Main sync method
await orchestrator.syncAll();

// Individual phase methods (for testing/debugging)
await orchestrator.syncEntities(['characters', 'elements']);
await orchestrator.computeDerivedFields();

// Status and monitoring
const status = await orchestrator.getSyncStatus();
const progress = orchestrator.onProgress((phase, percent) => {
  console.log(`${phase}: ${percent}%`);
});
```

### Entity Syncer API
```javascript
const characterSyncer = new CharacterSyncer(notionService, mapper, db, logger);

// Sync all characters
await characterSyncer.sync();

// Sync with options
await characterSyncer.sync({
  batchSize: 50,
  continueOnError: true
});

// Dry run
const changes = await characterSyncer.dryRun();
```

### Computer API
```javascript
const pathComputer = new ResolutionPathComputer(db);

// Compute all paths
await pathComputer.compute();

// Compute for specific entity types
await pathComputer.computeForType('character');

// Get computation logic (for testing)
const paths = pathComputer.computePathsForEntity(entity, 'character');
```

---

## Migration Strategy

### Phase 1: Create New Structure (Week 1)
1. Create directory structure
2. Implement `BaseSyncer` abstract class
3. Extract sync logging to `SyncLogger`
4. Create failing tests for each module

### Phase 2: Extract Entity Syncers (Week 1-2)
1. Create `CharacterSyncer` extending `BaseSyncer`
2. Move character sync logic, keeping same behavior
3. Repeat for other entity types
4. Ensure all tests pass

### Phase 3: Extract Computers (Week 2)
1. Create computer modules
2. Extract computation logic as pure functions
3. Add comprehensive unit tests
4. Integrate with orchestrator

### Phase 4: Wire Everything Together (Week 3)
1. Implement `SyncOrchestrator`
2. Update `dataSyncService.js` to delegate to orchestrator
3. Run parallel testing (old vs new implementation)
4. Deprecate old methods

### Phase 5: Cleanup (Week 3)
1. Remove old code from `dataSyncService.js`
2. Update all imports
3. Update documentation
4. Final testing and optimization

---

## Benefits of This Approach

### 1. **Single Responsibility**
Each module has one clear purpose, making code easier to understand and modify.

### 2. **Testability**
- Entity syncers can be tested with mock Notion data
- Computers can be tested as pure functions
- Orchestrator can be tested with mock dependencies

### 3. **Maintainability**
- Changes to sync logic don't affect computation
- New entity types can be added by extending `BaseSyncer`
- Easy to locate code for specific functionality

### 4. **Performance**
- Computers can be parallelized
- Sync phases can be optimized independently
- Easier to add caching at appropriate levels

### 5. **Flexibility**
- Can sync individual entity types
- Can recompute derived fields without full sync
- Can add new computed fields easily

---

## Testing Strategy

### Unit Tests
```javascript
// Example: Testing ResolutionPathComputer
describe('ResolutionPathComputer', () => {
  describe('computePathsForEntity', () => {
    it('should assign Black Market path for memory-heavy characters', () => {
      const entity = {
        id: 'char1',
        ownedElements: [
          { name: 'Black Market Card', type: 'memory' }
        ]
      };
      
      const paths = computer.computePathsForEntity(entity, 'character');
      expect(paths).toContain('Black Market');
    });
  });
});
```

### Integration Tests
```javascript
// Example: Testing CharacterSyncer
describe('CharacterSyncer Integration', () => {
  it('should sync characters from Notion to database', async () => {
    const mockNotionData = [/* test data */];
    notionService.getCharacters.mockResolvedValue(mockNotionData);
    
    await characterSyncer.sync();
    
    const dbCharacters = db.prepare('SELECT * FROM characters').all();
    expect(dbCharacters).toHaveLength(mockNotionData.length);
  });
});
```

---

## Rollback Plan

If issues arise during migration:

1. **Feature Flag**: Use environment variable to switch between old/new implementation
2. **Parallel Run**: Run both implementations and compare results
3. **Gradual Rollout**: Migrate one entity type at a time
4. **Quick Revert**: Keep old code until new implementation is proven

---

## Success Metrics

- ✅ All existing tests continue to pass
- ✅ Code coverage increases to >80%
- ✅ Sync performance maintains or improves
- ✅ Each module is under 200 lines
- ✅ Circular dependencies eliminated
- ✅ New developers can understand a module in <15 minutes

---

## Next Steps

1. **Review & Approve**: Team reviews this plan
2. **Create Tasks**: Break down into JIRA tickets
3. **Begin Phase 1**: Create structure and base classes
4. **Daily Progress**: Update QUICK_STATUS.md with progress

This refactoring will transform our monolithic sync service into a maintainable, testable, and extensible system that follows SOLID principles and supports the long-term growth of the Production Intelligence Tool.