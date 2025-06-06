# Sync Service Architecture

This directory contains the refactored data synchronization services, extracted from the monolithic `dataSyncService.js` to follow SOLID principles and improve maintainability.

## Directory Structure

```
sync/
├── SyncOrchestrator.js       # Main coordinator for sync operations
├── SyncLogger.js             # Centralized logging for sync operations
├── entitySyncers/            # Entity-specific sync implementations
│   ├── BaseSyncer.js         # Abstract base class (Template Method pattern)
│   ├── CharacterSyncer.js    # Character sync logic
│   ├── ElementSyncer.js      # Element sync logic
│   ├── PuzzleSyncer.js       # Puzzle sync logic
│   └── TimelineEventSyncer.js # Timeline event sync logic
└── RelationshipSyncer.js     # Cross-entity relationship sync
```

## Core Concepts

### SyncLogger
- Provides consistent logging interface
- Tracks sync operations in the database
- Methods: `startSync()`, `completeSync()`, `failSync()`

### BaseSyncer
- Abstract base class using Template Method pattern
- Defines common sync workflow:
  1. Fetch from Notion
  2. Begin transaction
  3. Clear existing data
  4. Map and insert new data
  5. Post-process (optional)
  6. Commit/rollback
- Subclasses implement specific logic for each entity type

### Entity Syncers
Each entity syncer extends `BaseSyncer` and implements:
- `fetchFromNotion()` - Retrieve data from Notion API
- `clearExistingData()` - Clean up before sync
- `mapData()` - Transform Notion data to database format
- `insertData()` - Insert into SQLite

### SyncOrchestrator
Coordinates the entire sync process:
1. Phase 1: Sync base entities (characters, elements, puzzles, timeline)
2. Phase 2: Sync relationships
3. Phase 3: Compute character links
4. Phase 4: Compute derived fields
5. Phase 5: Cache maintenance

## Usage

```javascript
// Create orchestrator with dependencies
const orchestrator = new SyncOrchestrator({
  entitySyncers: [characterSyncer, elementSyncer, ...],
  relationshipSyncer,
  derivedFieldComputer,
  cacheManager,
  logger
});

// Run full sync
await orchestrator.syncAll();

// Or sync specific phases
await orchestrator.syncEntities(['characters', 'elements']);
```

## Benefits

1. **Single Responsibility**: Each module has one clear purpose
2. **Testability**: Easy to unit test individual components
3. **Maintainability**: Changes isolated to specific modules
4. **Extensibility**: Easy to add new entity types or computed fields
5. **Performance**: Can parallelize independent operations

## Migration Status

- [x] Base infrastructure (SyncLogger, BaseSyncer)
- [ ] CharacterSyncer
- [ ] ElementSyncer
- [ ] PuzzleSyncer
- [ ] TimelineEventSyncer
- [ ] RelationshipSyncer
- [ ] SyncOrchestrator
- [ ] Integration with existing code