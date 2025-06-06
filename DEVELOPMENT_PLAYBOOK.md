# Development Playbook
## Building the Production Intelligence Tool

**Purpose**: Step-by-step implementation guide for developers. Keep this open while coding.

**Status**: **REVISED for Technical Debt Repayment** (Post 2025-06-07)

---

## 📚 Essential Context

### Core References
- **[PRODUCTION_INTELLIGENCE_TOOL_PRD.md](./PRODUCTION_INTELLIGENCE_TOOL_PRD.md)** - The complete specification, *updated with the new Narrative Graph model*.
- **[QUICK_STATUS.md](./QUICK_STATUS.md)** - Current progress tracker
- **[SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md)** - Notion→SQL field mappings

### Game Design Background
For deeper understanding of game mechanics when implementing calculated fields:
- **[active_synthesis_streamlined.md](./game design background/active_synthesis_streamlined.md)** - Complete game design (memory economy, three paths)
- **[concept_evolution_streamlined.md](./game design background/concept_evolution_streamlined.md)** - Why certain design choices were made
- **[questions_log_streamlined.md](./game design background/questions_log_streamlined.md)** - Clarifications on game mechanics

## 🏗️ Architecture Overview

### Directory Structure
```
storyforge/backend/src/services/
├── sync/                      # Data synchronization
│   ├── SyncOrchestrator.js    # Main coordinator
│   ├── SyncLogger.js          # Centralized logging
│   ├── entitySyncers/         # Entity-specific sync
│   │   ├── BaseSyncer.js      # Template Method pattern
│   │   ├── CharacterSyncer.js
│   │   ├── ElementSyncer.js
│   │   ├── PuzzleSyncer.js
│   │   └── TimelineEventSyncer.js
│   └── RelationshipSyncer.js  # Cross-entity relationships
├── compute/                   # Derived field computation
│   ├── DerivedFieldComputer.js
│   ├── ActFocusComputer.js
│   ├── ResolutionPathComputer.js
│   ├── NarrativeThreadComputer.js
│   └── CharacterLinkComputer.js
└── cache/                     # Cache management
    └── JourneyCache.js        # Journey graph caching
```

### Core Components

#### 1. Sync Architecture
- **SyncOrchestrator**: Coordinates sync phases
  - Phase 1: Base entities (characters, elements, puzzles, timeline)
  - Phase 2: Relationships and character links
  - Phase 3: Compute derived fields
  - Phase 4: Cache maintenance
- **BaseSyncer**: Template Method pattern
  - Common workflow: fetch → validate → map → insert → post-process
  - Transaction management with rollback
  - Comprehensive error handling
- **Entity Syncers**: Extend BaseSyncer
  - Each handles specific entity type
  - Consistent interface and error handling
  - Integration tests for each syncer
- **RelationshipSyncer**: Two-phase sync
  - Validates relationships before sync
  - Prevents foreign key violations
  - Computes character links
  - Weighted scoring system

#### 2. Compute Services
- **DerivedFieldComputer**: Base class
  - Pure functions with no side effects
  - Idempotent operations
  - Performance targets
  - Comprehensive test coverage
- **ActFocusComputer**: Timeline events
  - Computes from related elements
  - Performance: < 1s for 75 events
- **ResolutionPathComputer**: All entities
  - Based on ownership patterns
  - Performance: < 2s for 137 entities
- **NarrativeThreadComputer**: Puzzles
  - Rollup from reward elements
  - Performance: < 1s for 32 puzzles
- **CharacterLinkComputer**: Character relationships
  - Weighted scoring system
  - Performance: < 1s for 25 characters

#### 3. Cache Management
- **JourneyCache**: Graph data caching
  - Version hash validation
  - 24-hour TTL
  - LRU tracking
  - Cache invalidation on sync

### Implementation Guidelines

#### 1. Adding New Entity Types
1. Create new syncer extending BaseSyncer
2. Implement required methods:
   - `fetchFromNotion()`
   - `mapData()`
   - `insertData()`
   - `postProcess()`
3. Add integration tests
4. Update SyncOrchestrator

#### 2. Adding New Computed Fields
1. Create new computer extending DerivedFieldComputer
2. Implement compute() method
3. Add performance tests
4. Update ComputeOrchestrator
5. Add database migration

#### 3. Error Handling
- All sync operations in transactions
- Automatic rollback on failure
- Clear error messages
- Comprehensive logging
- Integration test coverage

#### 4. Performance Targets
- Entity sync: < 2s for 25 characters
- Relationship sync: < 1s for 125 links
- Compute services: See individual targets
- Cache hit rate: > 80%

---

## 🎯 Current Development Status

**Active Phase**: **Technical Debt Repayment**
**Current Milestone**: P.DEBT.3 - DataSyncService Refactor Implementation
**Last Completed**: <!-- AUTO:LAST_COMPLETED -->P.DEBT.3.10 (2025-06-06)<!-- /AUTO:LAST_COMPLETED -->
**Current Task**: <!-- AUTO:CURRENT_TASK -->P.DEBT.3.11 – Complete Test Coverage (NEXT)<!-- /AUTO:CURRENT_TASK -->
**Branch**: `feature/production-intelligence-tool`

### Task Verification Status
Last Verified: June 10, 2025
- ✅ All prerequisites met
- ✅ Documentation aligned
- ✅ Test coverage adequate
- ✅ No conflicts in progress
- ✅ Database state verified
- ⚠️ Known warnings documented (non-blocking)

### ✅ Recently Completed:
- **Technical Debt Review (2025-06-08)**: A systematic review of the codebase was completed, producing a prioritized action plan.
- **Documentation Refactor (2025-06-08)**: All core documentation (`QUICK_STATUS`, `DEVELOPMENT_PLAYBOOK`, `PRD`) updated to reflect the new focus on repaying technical debt.
- **P.DEBT.1.1 (2025-06-06)**: Sanitized `db/queries.js` - removed 7 deprecated functions and cleaned module.exports.
- **P.DEBT.1.2 (2025-06-06)**: Decommissioned legacy database tables - created migration to drop 4 obsolete tables and removed references from dataSyncService.js.
- **P.DEBT.1.3 (2025-06-06)**: Removed zombie logic from `journeyEngine.js` - deleted `suggestGapSolutions` and `getInteractionWindows` methods.
- **P.DEBT.2.1 (2025-06-06)**: Refactored hybrid API response - `buildCharacterJourney` now returns clean object structure without deprecated segments/gaps arrays.
- **P.DEBT.2.2 (2025-06-06)**: Re-implemented journey caching - created `cached_journey_graphs` table, added caching functions to queries.js, integrated into journeyEngine.
- **P.DEBT.3.1 (2025-06-09)**: Created refactor directory structure and implemented foundational classes (SyncLogger and BaseSyncer) with comprehensive unit tests.
- **P.DEBT.3.2**: Extracted CharacterSyncer from monolithic dataSyncService - new syncer handles all character sync logic including relationships, with integration tests.
- **P.DEBT.3.3 (Current Time)**: Extracted remaining entity syncers (ElementSyncer, PuzzleSyncer, TimelineEventSyncer) with comprehensive tests. Reduced dataSyncService from 760 to 540 lines.
- **P.DEBT.3.4 (Current Time)**: Implemented RelationshipSyncer with two-phase sync architecture, reducing dataSyncService to 420 lines (45% total reduction). All tests passing and integration complete.
- **P.DEBT.3.5 (Current Time)**: Extracted Compute Services (ActFocusComputer, ResolutionPathComputer, NarrativeThreadComputer, CharacterLinkComputer) from monolithic dataSyncService. Each service follows the established pattern with comprehensive tests. Reduced dataSyncService from 760 to 540 lines (29% reduction).
- **P.DEBT.3.8 (2025-06-10)**: Fixed migration system with enhanced verification and auto-fix capabilities. All migrations now apply correctly via initializeDatabase() with comprehensive verification system.
- **P.DEBT.3.9 (2025-06-10)**: Implemented comprehensive memory value extraction system. Created MemoryValueExtractor to parse SF_ fields (RFID, ValueRating, MemoryType, Group) and MemoryValueComputer for character aggregation. System ready for memory tokens with group completion bonus logic.

### 🔴 Active Priority:
- **Solidify Foundation**: All new feature development is paused until the critical technical debt identified in the review is fully paid down.
- **Current Focus**: Extract Compute Services to handle derived fields (Act Focus, Resolution Paths, Narrative Threads) essential for core features.

---

## 🛠️ Technical Debt Repayment Plan

This is our sole focus. We will address these items sequentially, starting with Priority 1.

### Task Verification Protocol

Before starting ANY task in this plan:

1. **Pre-Task Verification**
   ```bash
   # Run comprehensive verification
   cd storyforge/backend
   npm run verify:all
   
   # Expected output:
   # - All migrations applied (8 migrations)
   # - Critical tables and columns present
   # - Computed fields populated
   # - Puzzle sync status from sync_log
   # - Known warnings documented:
   #   - Characters with no links (Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling)
   #   - 42 timeline_events missing act_focus computed field
   ```

2. **Documentation Check**
   - [ ] README.md status matches current state
   - [ ] QUICK_STATUS.md is up to date
   - [ ] This task's prerequisites are met
   - [ ] Dependencies are available
   - [ ] Verification warnings are documented

3. **Codebase Check**
   - [ ] Affected files exist and match documentation
   - [ ] Test coverage is adequate
   - [ ] No conflicting changes in progress
   - [ ] Database state is known
   - [ ] Computed fields are working:
     - Act Focus (Timeline Events)
     - Resolution Paths (All Entities)
     - Narrative Threads (Puzzles)
     - Character Links

4. **Post-Task Verification**
   ```bash
   # Run after completing each task
   npm run verify:all          # Verifies overall system state
   npm run verify-task-complete # Verifies task-specific completion
   npm run update-docs         # Updates documentation
   ```

5. **Known Warnings (Non-Blocking)**
   - Characters with no links (Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling)
   - 42 records in timeline_events missing act_focus computed field
   - These warnings are documented but not blocking for current tasks

### 🔴 Priority 1: Critical Risk Cleanup

#### **P.DEBT.1.1: Sanitize `db/queries.js`**

**Verification Required**:
```bash
# Before starting:
npm run verify-queries-state  # Checks current state of queries.js
npm run verify-db-deps       # Verifies database dependencies

# Expected output:
# - Current function count: 23
# - Deprecated functions: 7
# - Database dependencies: [list]
```

**Problem**: `db/queries.js` contains 7 deprecated functions from the legacy timeline/gap model.
-   **File(s) Affected**: `storyforge/backend/src/db/queries.js`
-   **Action**:
    1.  Delete the following functions from the file: `getEventsForCharacter`, `getPuzzlesForCharacter`, `getElementsForCharacter`, `getCachedJourney`, `saveCachedJourney`, `isValidJourneyCache`, `updateGapResolution`.
    2.  Carefully review the `module.exports` list and remove all deleted functions, ensuring only active, graph-model-related queries are exported.
-   **Acceptance Criteria**:
    -   [✅] `queries.js` file no longer contains any of the deprecated or obsolete functions.
    -   [✅] The `module.exports` in `queries.js` is clean and only exports valid functions.
    -   [✅] The application runs without errors after these changes.
    -   **STATUS: COMPLETE (2025-06-06)** - All deprecated functions removed, module.exports cleaned, no breaking changes detected.

#### **P.DEBT.1.2: Decommission Legacy Database Tables**

**Verification Required**:
```bash
# Before starting:
npm run verify-db-tables     # Lists all current tables
npm run verify-table-deps    # Shows table dependencies

# Expected output:
# - Current tables: [list]
# - Legacy tables: 4
# - Dependencies: [list]
```

**Problem**: Four obsolete tables remain in the database.
-   **File(s) Affected**: `storyforge/backend/src/db/migration-scripts/`, `storyforge/backend/src/services/dataSyncService.js`
-   **Action**:
    1.  Create a new migration script: `storyforge/backend/src/db/migration-scripts/YYYYMMDDHHMMSS_drop_legacy_journey_tables.sql`.
    2.  Add `DROP TABLE IF EXISTS <table_name>;` for each of the four obsolete tables.
    3.  In `dataSyncService.js`, find the `syncCharacters` function and remove the lines that delete from `cached_journey_gaps` and `cached_journey_segments`.
-   **Acceptance Criteria**:
    -   [✅] The new migration script is created and successfully drops the four tables.
    -   [✅] `dataSyncService.js` no longer references the obsolete tables.
    -   [✅] The `syncAll` command runs successfully without the legacy tables.
    -   **STATUS: COMPLETE (2025-06-06)** - Migration script created (`20250606000000_drop_legacy_journey_tables.sql`), removed references from dataSyncService.js.

#### **P.DEBT.1.3: Remove Zombie Logic from `journeyEngine.js`**
-   **Problem**: `journeyEngine.js` contains obsolete methods (`suggestGapSolutions`, `getInteractionWindows`) based on the old "gap" model.
-   **File(s) Affected**: `storyforge/backend/src/services/journeyEngine.js`
-   **Action**:
    1.  Delete the entire `suggestGapSolutions` method.
    2.  Delete the entire `getInteractionWindows` method.
-   **Acceptance Criteria**:
    -   [✅] The obsolete methods are removed from the `JourneyEngine` class.
    -   [✅] The application runs without errors.
    -   **STATUS: COMPLETE (2025-06-06)** - Both methods removed along with unused import `parseTimingToMinutes`.

---

### 🟡 Priority 2: Architectural & Performance Polish

#### **P.DEBT.2.1: Refactor Hybrid API Response**

**Verification Required**:
```bash
# Before starting:
npm run verify-api-state     # Checks current API structure
npm run verify-frontend-deps # Verifies frontend dependencies

# Expected output:
# - Current endpoints: [list]
# - Hybrid responses: 1
# - Frontend consumers: [list]
```

**Problem**: The `buildCharacterJourney` function returns a confusing hybrid data structure.
-   **File(s) Affected**: `storyforge/backend/src/services/journeyEngine.js`, (Frontend) `storyforge/frontend/src/stores/journeyStore.js` or equivalent data-fetching component.
-   **Action**:
    1.  Modify `buildCharacterJourney` to return a clean object containing only `character_info` and `graph`.
    2.  Update the corresponding frontend code that consumes the `/api/journeys/:characterId` endpoint to expect the new, cleaner data structure.
-   **Acceptance Criteria**:
    -   [✅] The API response for a journey is clean and no longer contains `segments` or `gaps`.
    -   [✅] The frontend `JourneyGraphView` renders correctly with the new data structure.
-   **STATUS: COMPLETE (2025-06-06)** - Refactored `buildCharacterJourney` to return clean structure. Deprecated gap-related endpoints with 410 status codes.

#### **P.DEBT.2.2: Re-implement Journey Caching**
-   **Problem**: Journey caching was disabled during the refactor, creating a performance liability.
-   **File(s) Affected**: `storyforge/backend/src/services/journeyEngine.js`, `storyforge/backend/src/db/queries.js`.
-   **Action**:
    1.  Design a caching strategy suitable for graph data (e.g., storing the final `nodes` and `edges` arrays as JSON in a new `cached_journey_graphs` table).
    2.  Implement `saveCachedJourneyGraph` and `getCachedJourneyGraph` in `queries.js`.
    3.  Integrate the caching logic into `buildCharacterJourney` in `journeyEngine.js`.
-   **Acceptance Criteria**:
    -   [✅] Requesting the same journey twice in a row results in the second request being served from the cache.
    -   [✅] A new `cached_journey_graphs` table exists and is populated.
-   **STATUS: COMPLETE (2025-06-06)** - Implemented graph caching with version hash validation, 24-hour TTL, and LRU tracking. Added cache invalidation to sync process.

#### **P.DEBT.2.3: Plan `dataSyncService.js` Refactor**
-   **Problem**: `dataSyncService.js` is a 760-line monolith.
-   **File(s) Affected**: `storyforge/backend/src/services/dataSyncService.js`.
-   **Action**: This is a planning task. Create a new document outlining a refactor strategy. The plan should propose a new file structure (e.g., `/services/sync/`, `/services/compute/`) and define the API for each new module.
-   **Acceptance Criteria**:
    -   [✅] A markdown file (`REFACTOR_PLAN_DATASYNC.md`) is created with a detailed plan for breaking down the monolith.
    -   **STATUS: COMPLETE (2025-06-09)** - Created comprehensive refactor plan with 7 focused modules, migration strategy, and testing approach.

---

### 🔧 Priority 3: DataSyncService Refactor Implementation

#### **P.DEBT.3.1: Create Refactor Directory Structure & Base Classes**

**Verification Required**:
```bash
# Before starting:
npm run verify-sync-state    # Checks current sync structure
npm run verify-test-coverage # Shows current test coverage

# Expected output:
# - Current sync files: [list]
# - Test coverage: [percentage]
# - Missing tests: [list]
```

**Problem**: Need foundational structure before extracting sync logic.
-   **Files to Create**:
    - `storyforge/backend/src/services/sync/` directory
    - `storyforge/backend/src/services/sync/SyncLogger.js`
    - `storyforge/backend/src/services/sync/entitySyncers/BaseSyncer.js`
    - `storyforge/backend/src/services/compute/` directory
    - `storyforge/backend/src/services/cache/` directory
-   **Action**:
    1. Create the directory structure as specified in REFACTOR_PLAN_DATASYNC.md
    2. Implement `SyncLogger` class with methods: `startSync()`, `completeSync()`, `failSync()`
    3. Implement `BaseSyncer` abstract class with template method pattern
    4. Create basic unit tests for both classes
-   **Acceptance Criteria**:
    -   [✅] Directory structure matches the refactor plan
    -   [✅] `SyncLogger` can log sync operations to the sync_log table
    -   [✅] `BaseSyncer` provides abstract methods for subclasses
    -   [✅] Unit tests pass for both classes
    -   [✅] No changes to existing functionality
    -   **STATUS: COMPLETE (2025-06-09)** - Created directory structure and implemented foundational classes with comprehensive unit tests.

#### **P.DEBT.3.2: Extract Character Syncer**
-   **Problem**: Character sync logic is embedded in the monolith.
-   **Files Affected**:
    - Create: `storyforge/backend/src/services/sync/entitySyncers/CharacterSyncer.js`
    - Modify: `storyforge/backend/src/services/dataSyncService.js`
-   **Action**:
    1. Create `CharacterSyncer` extending `BaseSyncer`
    2. Move character sync logic from `dataSyncService.syncCharacters()`
    3. Add comprehensive error handling
    4. Create integration tests
    5. Update `dataSyncService` to use `CharacterSyncer`
-   **Acceptance Criteria**:
    -   [✅] `CharacterSyncer` successfully syncs all characters
    -   [✅] Maintains exact same behavior as original
    -   [✅] Integration tests verify database state
    -   [✅] Original sync still works (parallel run)
    -   **STATUS: COMPLETE** - Created CharacterSyncer with full relationship handling via postProcess(). Integration tests written. dataSyncService updated to delegate to new syncer.

#### **P.DEBT.3.3: Extract Remaining Entity Syncers**
-   **Problem**: Elements, Puzzles, and Timeline Events sync logic needs extraction.
-   **Files to Create**:
    - `storyforge/backend/src/services/sync/entitySyncers/ElementSyncer.js`
    - `storyforge/backend/src/services/sync/entitySyncers/PuzzleSyncer.js`
    - `storyforge/backend/src/services/sync/entitySyncers/TimelineEventSyncer.js`
-   **Action**:
    1. Follow same pattern as CharacterSyncer for each entity type
    2. Ensure proper transaction handling
    3. Add entity-specific error handling
    4. Create tests for each syncer
-   **Acceptance Criteria**:
    -   [✅] All three syncers implemented and tested
    -   [✅] Each maintains original behavior
    -   [✅] No data loss during sync
    -   [✅] Performance metrics comparable or better
    -   **STATUS: COMPLETE** - Created ElementSyncer, PuzzleSyncer, and TimelineEventSyncer following the same pattern as CharacterSyncer. Each has comprehensive tests. Updated dataSyncService to use all new syncers, reducing file size from 760 to 540 lines (29% reduction).

#### **P.DEBT.3.4: Extract Relationship Syncer**
-   **Problem**: Relationship sync logic was mixed with entity syncers, causing potential race conditions and making testing difficult.
-   **Files Affected**:
    - Created: `storyforge/backend/src/services/sync/RelationshipSyncer.js`
    - Modified: `storyforge/backend/src/services/dataSyncService.js`
    - Updated: All entity syncer tests to use new relationship handling
-   **Action**:
    1. Created `RelationshipSyncer` extending `BaseSyncer`
    2. Implemented two-phase sync architecture:
       - Phase 1: Sync all base entities (characters, elements, puzzles, timeline_events)
       - Phase 2: Sync all relationships after base data exists
    3. Added comprehensive validation:
       - Checks for missing referenced entities
       - Prevents foreign key constraint violations
       - Validates relationship types
    4. Implemented character link computation:
       - Based on shared experiences (events, puzzles, elements)
       - Weighted scoring system (events: 30, puzzles: 25, elements: 15)
       - Capped at 100 strength points
    5. Added transaction management:
       - All operations in single transaction
       - Automatic rollback on failure
       - Clear error messages
    6. Created integration tests verifying:
       - Relationships sync after entities
       - No orphaned relationships
       - Performance maintained
       - Clear error messages
-   **Acceptance Criteria**:
    - [✅] `RelationshipSyncer` handles all relationship types:
      - Character-Character (from shared events/elements)
      - Character-Element (ownership/association)
      - Character-Puzzle (participation)
      - Element-Puzzle (containment)
      - TimelineEvent-Character (participation)
    - [✅] Two-phase sync prevents foreign key violations
    - [✅] All relationship tests pass
    - [✅] Performance impact < 10% vs current
    - [✅] Clear error messages for missing entities
    - [✅] Documentation updated with new architecture
    - **STATUS: COMPLETE (Current Time)** - RelationshipSyncer implemented with comprehensive validation, transaction management, and test coverage. Reduced dataSyncService to 420 lines (45% total reduction).

#### **P.DEBT.3.5: Extract Compute Services**
-   **Problem**: Derived field computation mixed with sync logic.
-   **Files to Create**:
    - `storyforge/backend/src/services/compute/DerivedFieldComputer.js` (Base class)
    - `storyforge/backend/src/services/compute/ActFocusComputer.js`
    - `storyforge/backend/src/services/compute/ResolutionPathComputer.js`
    - `storyforge/backend/src/services/compute/NarrativeThreadComputer.js`
    - `storyforge/backend/src/services/compute/CharacterLinkComputer.js`
-   **Implementation Steps**:
    1. Create `DerivedFieldComputer` base class:
       - Abstract class with template method pattern
       - Common validation and error handling
       - Performance monitoring hooks
       - Transaction support
    2. Implement `ActFocusComputer`:
       - Computes act focus for timeline events
       - Aggregates from related elements
       - Used for timeline filtering
       - Performance target: < 1s for 75 events
    3. Implement `ResolutionPathComputer`:
       - Computes paths for all entities
       - Based on ownership patterns and game logic
       - Critical for Balance Dashboard
       - Performance target: < 2s for 137 entities
    4. Implement remaining computers:
       - `NarrativeThreadComputer`: Rollup from rewards
       - `CharacterLinkComputer`: Based on shared experiences
    5. Add comprehensive testing:
       - Unit tests for each computation
       - Integration tests for sync process
       - Performance benchmarks
       - Edge case coverage
-   **Acceptance Criteria**:
    - [✅] All computers work independently
    - [✅] Pure functions with no side effects
    - [✅] 100% unit test coverage
    - [✅] Performance improvement from parallel execution
    - [✅] Clear error messages for computation failures
    - [✅] Documentation of computation rules
-   **Critical Requirements**:
    1. All computations must be pure functions
    2. Results must be idempotent
    3. Must meet performance targets
    4. Must handle edge cases gracefully
    5. Must provide clear error messages
    6. Must be well-documented
-   **Performance Targets**:
    1. Act Focus: < 1s for 75 events
    2. Resolution Paths: < 2s for 137 entities
    3. Narrative Threads: < 1s for 32 puzzles
    4. Character Links: < 1s for 25 characters
-   **Status**: COMPLETE (Current Time)
-   **Next Steps**:
    1. Proceed to P.DEBT.3.6 (Create Sync Orchestrator) to orchestrate all sync phases (entities → relationships → compute → cache) robustly.
    2. Ensure progress tracking, cancellation, and rollback on failure.
    3. Update documentation and tests accordingly.

#### **P.DEBT.3.6: Create Sync Orchestrator**
- **Problem**: Need coordinator for all sync phases.
- **Files Created**:
  - `storyforge/backend/src/services/sync/SyncOrchestrator.js`
  - `storyforge/backend/src/services/sync/__tests__/SyncOrchestrator.test.js`
- **Implementation**:
  - ✅ Implemented `SyncOrchestrator` with dependency injection
  - ✅ Defined clear phases: entities → relationships → compute → cache
  - ✅ Added progress tracking and cancellation
  - ✅ Implemented rollback on failure
- **Acceptance Criteria**:
  - ✅ Orchestrator coordinates all sync phases
  - ✅ Progress events emitted
  - ✅ Rollback works on any phase failure
  - ✅ Can sync individual phases
- **Status**: ✅ COMPLETE

#### **P.DEBT.3.7: Sync Route Testing**
- **Problem**: Need comprehensive test coverage for sync endpoints.
- **Files to Create/Modify**:
  - `storyforge/backend/src/routes/__tests__/syncRoutes.test.js`
  - Update: `storyforge/backend/src/routes/syncRoutes.js`
- **Test Requirements**:
  1. **Endpoint Tests**
     - `POST /api/sync/data`
       - Success case with full sync
       - Error handling
       - Response format validation
       - Performance benchmarks
     - `GET /api/sync/status`
       - Status reporting accuracy
       - Error states
       - Response format
     - `POST /api/sync/cancel`
       - Successful cancellation
       - No-op when no sync running
       - Error handling
  2. **Integration Tests**
     - DataSyncService singleton integration
     - Transaction management
     - Cache invalidation
     - Error propagation
  3. **Performance Tests**
     - Sync duration benchmarks
     - Memory usage monitoring
     - Database connection handling
- **Mock Requirements**:
  1. **Notion API Mocks**
     - Success responses
     - Rate limit errors
     - Network failures
  2. **Database Mocks**
     - Transaction management
     - Rollback scenarios
     - Connection errors
  3. **Cache Mocks**
     - Invalidation calls
     - Refresh operations
- **Acceptance Criteria**:
  - [ ] All endpoints have >90% test coverage
  - [ ] Integration tests verify singleton behavior
  - [ ] Performance tests meet benchmarks
  - [ ] Error handling verified for all scenarios
  - [ ] Test documentation complete
- **Implementation Steps**:
  1. Create test infrastructure
     - Setup Jest mocks
     - Create test utilities
     - Define test data
  2. Implement endpoint tests
     - Success cases
     - Error cases
     - Edge cases
  3. Add integration tests
     - Service integration
     - Transaction handling
     - Cache management
  4. Create performance tests
     - Benchmark suite
     - Memory profiling
     - Connection testing
  5. Document test strategy
     - Test organization
     - Mock usage
     - Performance targets

#### **P.DEBT.3.8: Integrate & Deprecate Old Code**
-   **Problem**: Need smooth transition from old to new implementation.
-   **Files Affected**:
    - Modify: `storyforge/backend/src/services/dataSyncService.js`
    - Update: All files importing dataSyncService
-   **Action**:
    1. Add feature flag for new sync implementation
    2. Update `dataSyncService.syncAll()` to delegate to orchestrator
    3. Run parallel tests comparing old vs new
    4. Remove old methods after verification
    5. Update all imports and documentation
-   **Acceptance Criteria**:
    -   [ ] Feature flag controls implementation
    -   [ ] Both implementations produce identical results
    -   [ ] All tests pass with new implementation
    -   [ ] Old code removed, file under 100 lines
    -   [ ] Documentation updated

---
## 🚀 Post-Debt Development Plan

Once all Priority 1 and 2 tasks are complete, we will resume our feature development roadmap.

### 🔧 Journey Engine: The Narrative Graph

### Core Concept Evolution
Our most critical architectural insight was realizing that a player's journey is not a linear timeline, but a **causal graph of dependencies**. The `journeyEngine` has been completely refactored around this principle.

### `buildJourneyGraph(characterId)`
This is the new core function. It constructs a directed graph representing the "blow-by-blow" narrative path for a character.

**Multi-Pass Implementation:**
1.  **Pass 1: Node Collection**: Gathers all relevant entities (puzzles, elements, events) for a character using the new `getCharacterJourneyData` query. Each entity becomes a typed node (`activityNode`, `discoveryNode`, `loreNode`).
2.  **Pass 2: Gameplay Graph (Dependency Edges)**: Creates "hard" dependency edges between gameplay nodes. For example: `Element (Key) -> Puzzle (Unlock Chest) -> Element (Reward)`.
3.  **Pass 3: Lore Weaving (Context Edges)**: Connects `Discovery` nodes from the Gameplay Graph to `Event` nodes in the Lore Graph, showing the narrative reason for a discovery.
4.  **Pass 4: Interaction Mapping (Pending)**: Will identify and create edges representing interactions between different character journeys.

### 🖥️ Frontend: Graph Visualization

The frontend has been refactored to consume and display the new narrative graph data structure.

### `JourneyGraphView.jsx`
- This new component replaces the old `TimelineView`.
- It uses `@xyflow/react` to render the nodes and edges provided by the `/api/journeys/:characterId` endpoint.

### `useAutoLayout.js` Hook
- A new custom hook that uses the `dagre` library to automatically calculate node positions.
- It takes the raw nodes and edges and returns a set of nodes with `x` and `y` coordinates, ensuring a clean, hierarchical layout.

### Custom Node Components
- Located in `storyforge/frontend/src/components/PlayerJourney/customNodes/`.
- We have created distinct components for each node type to provide visual clarity:
    - `ActivityNode` (for puzzles)
    - `DiscoveryNode` (for elements)
    - `LoreNode` (for historical events)

### `ContextWorkspace.jsx`
- This component has been refactored to be node-aware.
- It subscribes to the `selectedNode` state in the `journeyStore`.
- When a user clicks a node in the graph, this component updates to display its details.

---

## 🧮 Computed Fields Implementation Guide

### Overview
Several critical fields don't exist in Notion but must be computed from relationships. These are NOT optional - core PRD features depend on them.

### ✅ IMPLEMENTED (2025-06-07)

#### Act Focus (Timeline Events) - WORKING!
- Computed for all 75 timeline events
- Based on most common act from related elements
- Enables timeline filtering by act

#### Resolution Paths (All Entities) - WORKING!
- Computed for 22 characters, 100 elements, 15 puzzles
- Based on ownership patterns and game logic
- Enables Balance Dashboard and Resolution Path Analyzer

#### Linked Characters - WORKING!
- Query implemented and added to journey API
- Returns character relationships from character_links table
- Enables Character Sociogram visualization

#### Narrative Threads (Puzzles) - WORKING!
- **UNBLOCKED**: The database migration now runs correctly, so the `narrative_threads` and `computed_narrative_threads` columns exist and are populated during the sync.

### ⚠️ PARTIALLY IMPLEMENTED

#### Path Affinity Scores
- Need to extract memory values from descriptions
- Calculate alignment scores for each path

#### Memory Value Totals
- Parse SF_ValueRating from element descriptions
- Aggregate per character

#### Interaction Density
- Count interactions per time segment
- Flag low-interaction segments

**Implementation Priority:**
1. 🔴 Linked Characters (Frontend blocked)
2. 🟡 Puzzle sync fixes (Data integrity)
3. 🟡 Missing field storage (Data completeness)
4. 🟢 Analytics computation (Enhancement)

---

## 🔧 Critical Architecture: Computed Fields

### Overview
The Production Intelligence Tool relies on computed fields that transform raw Notion data into actionable insights. These fields are essential for core features like the Balance Dashboard and Resolution Path Analyzer.

### Data Flow Architecture
1. **Notion**: Source of truth for raw data
2. **SQLite**: Local cache with computed fields
3. **Frontend**: Always uses SQLite data via backend API

### Essential Computed Fields
1. **Act Focus**
   - Computed for timeline events
   - Aggregates from related elements
   - Used for timeline filtering and balance analysis

2. **Resolution Paths**
   - Computed for all entities (characters, puzzles, elements)
   - Based on ownership patterns and game logic
   - Critical for Balance Dashboard (Phase 3 PRD requirement)
   - Calculation rules:
     - Black Market path = owns memory tokens or black market cards
     - Detective path = has evidence or investigation tools
     - Third Path = high community connections

3. **Narrative Threads**
   - Rollup from rewards
   - Used for story coherence analysis
   - Essential for Timeline Archaeology feature

4. **Character Links**
   - Computed from shared timeline events, elements, puzzles
   - Stored in character_links table
   - Used for relationship visualization

### Implementation Requirements
1. All computed fields must be calculated during sync
2. Results stored in SQLite for performance
3. Frontend must never call Notion API directly
4. All API endpoints must use SQLite data
5. Clear error messages if computed fields missing

### Testing Requirements
1. Unit tests for each computation
2. Integration tests for sync process
3. End-to-end tests for API responses
4. Performance benchmarks for large datasets

## 🧪 Testing Strategy

### Unit Testing Requirements
1. **BaseSyncer Tests**
   - Template method pattern implementation
   - Error handling and logging
   - Transaction management
   - Coverage: 100% for base class

2. **Entity Syncer Tests**
   - Mock Notion responses
   - Database state verification
   - Error handling scenarios
   - Coverage: >90% for each syncer

3. **Relationship Syncer Tests**
   - Two-phase sync verification
   - Foreign key constraint handling
   - Orphaned relationship prevention
   - Coverage: 100% for critical paths

4. **Compute Service Tests**
   - Pure function testing
   - Edge cases for each computation
   - Performance benchmarks
   - Coverage: 100% for all computers

### Integration Testing Requirements
1. **Sync Flow Tests**
   - End-to-end sync process
   - Data integrity verification
   - Error recovery
   - Performance metrics

2. **API Response Tests**
   - Response structure validation
   - Computed field presence
   - Error message clarity
   - Performance benchmarks

### Test Data Requirements
1. **Notion Mock Data**
   - Complete character journeys
   - All relationship types
   - Edge cases (missing fields, invalid data)
   - Performance test datasets

2. **Database Fixtures**
   - Pre-populated test database
   - Known state for verification
   - Cleanup procedures
   - Migration test data

## 📊 Performance Benchmarks

### Sync Performance Targets
1. **Entity Sync**
   - Characters: < 2s for 25 characters
   - Elements: < 3s for 100 elements
   - Puzzles: < 2s for 32 puzzles
   - Timeline Events: < 2s for 75 events

2. **Relationship Sync**
   - Character Links: < 1s for 125 links
   - Element Relationships: < 2s for 200 relationships
   - Puzzle Relationships: < 1s for 64 relationships

3. **Computed Fields**
   - Act Focus: < 1s for 75 events
   - Resolution Paths: < 2s for 137 entities
   - Narrative Threads: < 1s for 32 puzzles
   - Character Links: < 1s for 25 characters

### API Performance Targets
1. **Journey API**
   - Cold Start: < 500ms
   - Cached: < 100ms
   - Graph Generation: < 200ms

2. **Relationship API**
   - Character Links: < 100ms
   - Element Network: < 200ms
   - Puzzle Dependencies: < 150ms

## 🔧 Troubleshooting Guide

### Common Sync Issues
1. **Foreign Key Violations**
   - **Symptom**: "FOREIGN KEY constraint failed"
   - **Cause**: Relationship sync before entity sync
   - **Fix**: Ensure two-phase sync (entities → relationships)
   - **Prevention**: Use transaction rollback

2. **Missing Computed Fields**
   - **Symptom**: "Property not found in Notion object"
   - **Cause**: Trying to extract computed field from Notion
   - **Fix**: Use SQLite data instead of Notion API
   - **Prevention**: Update frontend to use backend API

3. **Puzzle Sync Failures**
   - **Symptom**: 17/32 puzzles fail to sync
   - **Cause**: Missing required fields in Notion
   - **Fix**: Debug specific Notion entries
   - **Workaround**: App works with partial data

4. **Migration Issues**
   - **Symptom**: Computed fields columns missing
   - **Cause**: Migration not auto-applying
   - **Fix**: Manual application via sqlite3
   - **Prevention**: Add migration verification

### Debugging Tools
1. **Sync Logging**
   ```javascript
   // Enable detailed logging
   process.env.SYNC_DEBUG = 'true';
   ```

2. **Database Inspection**
   ```sql
   -- Check computed fields
   SELECT id, name, resolution_paths FROM characters;
   SELECT id, name, act_focus FROM timeline_events;
   ```

3. **Notion Data Verification**
   ```javascript
   // Log raw Notion data
   console.log('Raw Notion data:', await notionService.getCharacters());
   ```

## 📈 Implementation Status

### Computed Fields (Updated 2025-06-09)
1. **✅ Act Focus (Timeline Events)**
   - Status: COMPLETE
   - Coverage: 75/75 events
   - Performance: < 1s computation
   - Used by: Timeline filtering
   - Implementation: Aggregates from related elements

2. **✅ Resolution Paths (All Entities)**
   - Status: COMPLETE
   - Coverage: 137/137 entities
   - Performance: < 2s computation
   - Used by: Balance Dashboard
   - Implementation: Based on ownership patterns and game logic

3. **✅ Linked Characters**
   - Status: COMPLETE
   - Coverage: 125/125 links
   - Performance: < 100ms query
   - Used by: Character Sociogram
   - Implementation: Computed from shared events/elements/puzzles

4. **✅ Narrative Threads (Puzzles)**
   - Status: COMPLETE
   - Coverage: 15/32 puzzles
   - Performance: < 1s computation
   - Blocked by: 17 puzzle sync failures
   - Implementation: Rollup from rewards

5. **⏳ Path Affinity Scores**
   - Status: PENDING
   - Blocked by: Memory value extraction
   - Priority: After puzzle sync fixes
   - Used by: Balance Dashboard
   - Implementation: Will calculate alignment scores for each path

6. **⏳ Memory Value Totals**
   - Status: PENDING
   - Blocked by: Value extraction from descriptions
   - Priority: After puzzle sync fixes
   - Used by: Economy Analysis
   - Implementation: Will parse SF_ValueRating from element descriptions

### Migration Status
1. **✅ Base Tables**
   - Characters, Elements, Puzzles
   - Timeline Events, Character Links
   - All foreign keys and indexes
   - Status: COMPLETE

2. **✅ Computed Fields**
   - Act Focus column
   - Resolution Paths column
   - Narrative Threads column
   - Status: COMPLETE

3. **⏳ Pending Migrations**
   - Memory value columns
   - Path affinity columns
   - Performance optimization indexes
   - Status: BLOCKED by puzzle sync fixes

### Known Issues
1. **Puzzle Sync Failures**
   - 17/32 puzzles failing to sync
   - Root cause: Missing required fields in Notion
   - Impact: Non-critical - app works with partial data
   - Next steps: Debug specific Notion entries

2. **Migration System**
   - Issue: Not auto-applying migrations
   - Impact: Narrative threads computation affected
   - Workaround: Manual application via sqlite3
   - Fix: Add migration verification system

3. **Memory Value Extraction**
   - Status: Not implemented
   - Blocking: Path affinity calculations
   - Priority: After puzzle sync fixes
   - Implementation: Will parse element descriptions

---

## 🚨 Current Blockers & Dependencies

### Active Blockers
- None currently

### Dependency Chain
```
P2.M1.3 (Current) 
  → P2.M1.4 (Gap Selection)
    → P2.M2.1 (Context Panel)
      → P2.M2.2 (Suggestions)
        → P2.M3.1 (Layout)
```

### External Dependencies
- Notion API rate limits (3 req/sec)
- SQLite performance with large datasets
- React Flow license for timeline?

---

## 📊 Progress Tracking

### Phase 1: ✅ Complete
- P1.M1: Database Layer ✅
- P1.M2: Journey Engine ✅  
- P1.M3: API Endpoints ✅
- P1.M4: State Foundation ✅

### Phase 2: 🚧 In Progress (1/4 milestones)
- P2.M1: Timeline Component 🚧 (4/5 tasks - puzzle sync fix remaining)
  - P2.M1.1: Basic Timeline Structure ✅
  - P2.M1.2: Segment Visualization ✅
  - P2.M1.3: Timeline Interactivity ✅
  - P2.M1.4: Gap Highlighting ✅
  - P2.M1.5: Fix Puzzle Sync Errors ✅
- P2.M2: Gap Resolution ⏳ (0/2 tasks)
- P2.M3: Layout ⏳ (0/1 tasks)
- P2.M4: Sync ⏳ (0/1 tasks)

### Phase 3: 📅 Not Started
- P3.M1: Balance Dashboard 📅
- P3.M2: Interaction Matrix 📅
- P3.M3: Timeline Archaeology 📅

Overall: ~45% Complete

---

## 🔍 Quick Task Lookup

**What should I work on?**
→ Check "CURRENT TASK" at the top

**Where is the code?**
→ Each task shows exact file paths

**How do I know it's done?**
→ Check the acceptance criteria

**What's next?**
→ Follow the dependency chain

**I'm stuck?**
→ Check blockers, then TROUBLESHOOTING.md

---

This playbook is the single source of truth. If it's not here, ask before implementing.
