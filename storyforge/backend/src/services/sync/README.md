# Sync Service Architecture

This directory contains the data synchronization services that coordinate between Notion and SQLite, following SOLID principles and maintaining a clean architecture.

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

### DataSyncService (Singleton)
- Main entry point for sync operations
- Implements singleton pattern to ensure single instance
- Coordinates with SyncOrchestrator for all sync operations
- Provides clean API: syncAll(), getSyncStatus(), cancelSync()

### SyncLogger
- Provides consistent logging interface
- Tracks sync operations in the database
- Methods: startSync(), completeSync(), failSync()

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
Coordinates the entire sync process in phases:
1. Phase 1: Sync base entities (characters, elements, puzzles, timeline)
2. Phase 2: Sync relationships and compute character links
3. Phase 3: Compute derived fields
4. Phase 4: Cache maintenance (optional)

## API Endpoints

The sync service exposes the following REST endpoints:

- `POST /api/sync/data` - Trigger full data sync
- `GET /api/sync/status` - Get current sync status
- `POST /api/sync/cancel` - Cancel current sync operation

## Usage

```javascript
// Get singleton instance
const dataSyncService = require('./services/dataSyncService');

// Run full sync
await dataSyncService.syncAll();

// Get sync status
const status = dataSyncService.getSyncStatus();

// Cancel sync if needed
dataSyncService.cancelSync();
```

## Benefits

1. **Single Responsibility**: Each module has one clear purpose
2. **Testability**: Easy to unit test individual components
3. **Maintainability**: Changes isolated to specific modules
4. **Extensibility**: Easy to add new entity types or computed fields
5. **Performance**: Can parallelize independent operations
6. **Reliability**: Transaction management and rollback support
7. **Observability**: Comprehensive logging and status tracking

## Implementation Status

- [x] Base infrastructure (SyncLogger, BaseSyncer)
- [x] CharacterSyncer
- [x] ElementSyncer
- [x] PuzzleSyncer
- [x] TimelineEventSyncer
- [x] RelationshipSyncer
- [x] SyncOrchestrator
- [x] DataSyncService singleton
- [x] API endpoints
- [ ] Sync route tests

## Next Steps

1. Add comprehensive tests for sync routes
2. Implement monitoring and metrics
3. Add retry logic for transient failures
4. Consider parallel sync for independent entities

## Implementation Details

### RelationshipSyncer
The `RelationshipSyncer` implements a robust two-phase sync architecture:

1. **Validation Phase**
   - Checks for missing referenced entities
   - Prevents foreign key constraint violations
   - Validates relationship types
   - Returns clear error messages

2. **Sync Phase**
   - Clears existing relationships
   - Computes character links based on shared experiences
   - Uses weighted scoring system:
     - Shared events: 30 points each
     - Shared puzzles: 25 points each
     - Shared elements: 15 points each
   - Caps link strength at 100 points
   - All operations in single transaction with rollback

### Entity Syncers
Each entity syncer follows the Template Method pattern from `BaseSyncer`:

1. **CharacterSyncer**
   - Handles character data and relationships
   - Post-processes character links
   - Validates character types and tiers

2. **ElementSyncer**
   - Manages element data and ownership
   - Handles container relationships
   - Tracks element status and availability

3. **PuzzleSyncer**
   - Syncs puzzle data and relationships
   - Manages puzzle elements and rewards
   - Tracks puzzle status and timing

4. **TimelineEventSyncer**
   - Handles timeline event data
   - Manages character and element relationships
   - Tracks event timing and act focus