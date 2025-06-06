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

---

## 🎯 Current Development Status

**Active Phase**: **Technical Debt Repayment**
**Current Milestone**: P.DEBT.3 - DataSyncService Refactor Implementation
**Last Completed**: P.DEBT.3.3 - Extract Remaining Entity Syncers (Current Time)
**Current Task**: P.DEBT.3.4 - Extract Relationship Syncer
**Branch**: `fix/technical-debt-cleanup`

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

### 🔴 Active Priority:
- **Solidify Foundation**: All new feature development is paused until the critical technical debt identified in the review is fully paid down.

---

## 🛠️ Technical Debt Repayment Plan

This is our sole focus. We will address these items sequentially, starting with Priority 1.

### 🔴 Priority 1: Critical Risk Cleanup

**Goal**: Eradicate all "zombie code" and architectural remnants of the legacy timeline/gap model.

#### **P.DEBT.1.1: Sanitize `db/queries.js`**
-   **Problem**: The `queries.js` file exports numerous deprecated functions (`getEventsForCharacter`, etc.) and functions that rely on obsolete tables (`getCachedJourney`, `updateGapResolution`), creating a high risk of misuse.
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
-   **Problem**: The database contains four obsolete tables from the old model: `journey_segments`, `gaps`, `cached_journey_segments`, `cached_journey_gaps`.
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

**Goal**: Improve maintainability, performance, and developer experience.

#### **P.DEBT.2.1: Refactor Hybrid API Response** ✅ COMPLETE
-   **Problem**: The `buildCharacterJourney` function returns a confusing hybrid data structure containing both the new `graph` object and deprecated `segments: []`, `gaps: []` arrays.
-   **File(s) Affected**: `storyforge/backend/src/services/journeyEngine.js`, (Frontend) `storyforge/frontend/src/stores/journeyStore.js` or equivalent data-fetching component.
-   **Action**:
    1.  Modify `buildCharacterJourney` to return a clean object containing only `character_info` and `graph`.
    2.  Update the corresponding frontend code that consumes the `/api/journeys/:characterId` endpoint to expect the new, cleaner data structure.
-   **Acceptance Criteria**:
    -   [✅] The API response for a journey is clean and no longer contains `segments` or `gaps`.
    -   [✅] The frontend `JourneyGraphView` renders correctly with the new data structure.
-   **STATUS: COMPLETE (2025-06-06)** - Refactored `buildCharacterJourney` to return clean structure. Deprecated gap-related endpoints with 410 status codes.

#### **P.DEBT.2.2: Re-implement Journey Caching** ✅ COMPLETE
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

#### **P.DEBT.2.3: Plan `dataSyncService.js` Refactor** ✅ COMPLETE
-   **Problem**: `dataSyncService.js` is a 760-line monolith.
-   **File(s) Affected**: `storyforge/backend/src/services/dataSyncService.js`.
-   **Action**: This is a planning task. Create a new document outlining a refactor strategy. The plan should propose a new file structure (e.g., `/services/sync/`, `/services/compute/`) and define the API for each new module.
-   **Acceptance Criteria**:
    -   [✅] A markdown file (`REFACTOR_PLAN_DATASYNC.md`) is created with a detailed plan for breaking down the monolith.
    -   **STATUS: COMPLETE (2025-06-09)** - Created comprehensive refactor plan with 7 focused modules, migration strategy, and testing approach.

---

### 🔧 Priority 3: DataSyncService Refactor Implementation

**Goal**: Execute the refactor plan created in P.DEBT.2.3, transforming the monolithic `dataSyncService.js` into maintainable, testable modules.

#### **P.DEBT.3.1: Create Refactor Directory Structure & Base Classes**
-   **Problem**: Need foundational structure before extracting sync logic.
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

#### **P.DEBT.3.2: Extract Character Syncer** ✅ COMPLETE
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

#### **P.DEBT.3.3: Extract Remaining Entity Syncers** ✅ COMPLETE
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
-   **Problem**: Relationship sync logic handles cross-entity concerns.
-   **Files to Create**:
    - `storyforge/backend/src/services/sync/RelationshipSyncer.js`
-   **Action**:
    1. Create `RelationshipSyncer` class
    2. Move `syncCharacterRelationships()` logic
    3. Ensure proper dependency on entity sync completion
    4. Add validation for referential integrity
-   **Acceptance Criteria**:
    -   [ ] Relationships sync correctly after entities
    -   [ ] No orphaned relationships
    -   [ ] Performance maintained
    -   [ ] Clear error messages for missing entities

#### **P.DEBT.3.5: Extract Compute Services**
-   **Problem**: Derived field computation mixed with sync logic.
-   **Files to Create**:
    - `storyforge/backend/src/services/compute/DerivedFieldComputer.js`
    - `storyforge/backend/src/services/compute/ActFocusComputer.js`
    - `storyforge/backend/src/services/compute/NarrativeThreadComputer.js`
    - `storyforge/backend/src/services/compute/ResolutionPathComputer.js`
    - `storyforge/backend/src/services/compute/CharacterLinkComputer.js`
-   **Action**:
    1. Extract computation logic into pure functions
    2. Create orchestrator for running all computations
    3. Add comprehensive unit tests
    4. Ensure computations are idempotent
-   **Acceptance Criteria**:
    -   [ ] All computers work independently
    -   [ ] Pure functions with no side effects
    -   [ ] 100% unit test coverage
    -   [ ] Performance improvement from parallel execution

#### **P.DEBT.3.6: Create Sync Orchestrator**
-   **Problem**: Need coordinator for all sync phases.
-   **Files to Create**:
    - `storyforge/backend/src/services/sync/SyncOrchestrator.js`
-   **Action**:
    1. Implement `SyncOrchestrator` with dependency injection
    2. Define clear phases: entities → relationships → links → derived fields → cache
    3. Add progress tracking and cancellation
    4. Implement rollback on failure
-   **Acceptance Criteria**:
    -   [ ] Orchestrator coordinates all sync phases
    -   [ ] Progress events emitted
    -   [ ] Rollback works on any phase failure
    -   [ ] Can sync individual phases

#### **P.DEBT.3.7: Integrate & Deprecate Old Code**
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

### Implementation Steps

#### Step 1: Add Computed Field Functions to dataSyncService.js

```javascript
// Add these functions to dataSyncService.js

async function computeTimelineActFocus(timelineEvent) {
  const db = getDB();
  const elementIds = JSON.parse(timelineEvent.element_ids || '[]');
  
  if (elementIds.length === 0) return null;
  
  // Get elements and count acts
  const elements = db.prepare(
    'SELECT first_available FROM elements WHERE id IN (' + 
    elementIds.map(() => '?').join(',') + ')'
  ).all(...elementIds);
  
  const actCounts = {};
  elements.forEach(el => {
    if (el.first_available) {
      actCounts[el.first_available] = (actCounts[el.first_available] || 0) + 1;
    }
  });
  
  // Return most common act
  return Object.entries(actCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
}

async function computePuzzleNarrativeThreads(puzzle) {
  const db = getDB();
  const rewardIds = JSON.parse(puzzle.reward_ids || '[]');
  
  if (rewardIds.length === 0) return [];
  
  // Get narrative threads from reward elements
  const elements = db.prepare(
    'SELECT narrative_threads FROM elements WHERE id IN (' + 
    rewardIds.map(() => '?').join(',') + ')'
  ).all(...rewardIds);
  
  const threads = new Set();
  elements.forEach(el => {
    const elThreads = JSON.parse(el.narrative_threads || '[]');
    elThreads.forEach(thread => threads.add(thread));
  });
  
  return Array.from(threads);
}

function computeResolutionPaths(entity, entityType) {
  const paths = [];
  
  if (entityType === 'character') {
    // Check owned elements for path indicators
    const ownedElements = JSON.parse(entity.owned_element_ids || '[]');
    const hasBlackMarket = ownedElements.some(id => 
      id.includes('1dc2f33d583f8056bf34c6a9922067d8') // Black Market card ID
    );
    if (hasBlackMarket) paths.push('Black Market');
    
    // High connections suggest Third Path
    if (entity.connections > 5) paths.push('Third Path');
    
    // TODO: Add detective path detection based on evidence ownership
  }
  
  if (entityType === 'puzzle') {
    // Based on narrative threads
    const threads = entity.narrative_threads || [];
    if (threads.includes('Underground Parties')) paths.push('Black Market');
    if (threads.includes('Corp. Espionage')) paths.push('Detective');
  }
  
  if (entityType === 'element') {
    // Based on element name/type
    if (entity.name?.toLowerCase().includes('black market')) {
      paths.push('Black Market');
    }
    if (entity.type === 'evidence' || entity.name?.toLowerCase().includes('clue')) {
      paths.push('Detective');
    }
  }
  
  return paths.length > 0 ? paths : ['Unassigned'];
}
```

#### Step 2: Integrate Computations into Sync Process

```javascript
// In syncTimelineEvents function, after inserting base data:
for (const event of mappedEvents) {
  const actFocus = await computeTimelineActFocus(event);
  if (actFocus) {
    db.prepare('UPDATE timeline_events SET act_focus = ? WHERE id = ?')
      .run(actFocus, event.id);
  }
}

// In syncPuzzles function, after inserting base data:
for (const puzzle of mappedPuzzles) {
  const narrativeThreads = await computePuzzleNarrativeThreads(puzzle);
  if (narrativeThreads.length > 0) {
    db.prepare('UPDATE puzzles SET computed_narrative_threads = ? WHERE id = ?')
      .run(JSON.stringify(narrativeThreads), puzzle.id);
  }
  
  const resolutionPaths = computeResolutionPaths(puzzle, 'puzzle');
  db.prepare('UPDATE puzzles SET resolution_paths = ? WHERE id = ?')
    .run(JSON.stringify(resolutionPaths), puzzle.id);
}

// Similar for characters and elements...
```

#### Step 3: Update Database Schema

```sql
-- Add columns for computed fields
ALTER TABLE timeline_events ADD COLUMN act_focus TEXT;
ALTER TABLE puzzles ADD COLUMN computed_narrative_threads TEXT; -- JSON array
ALTER TABLE puzzles ADD COLUMN resolution_paths TEXT; -- JSON array
ALTER TABLE characters ADD COLUMN resolution_paths TEXT; -- JSON array
ALTER TABLE elements ADD COLUMN resolution_paths TEXT; -- JSON array
```

#### Step 4: Include Computed Fields in API Responses

```javascript
// In queries.js, update getters to include computed fields
function getAllTimelineEvents() {
  return db.prepare(`
    SELECT *, act_focus as computedActFocus 
    FROM timeline_events 
    ORDER BY date ASC
  `).all();
}

// In journeyEngine.js, ensure linked characters are included
const linkedCharacters = await dbQueries.getLinkedCharacters(characterId);
computedJourney.character_info.linkedCharacters = linkedCharacters;
```

### Testing Computed Fields

```javascript
// Test timeline act focus computation
const event = { element_ids: JSON.stringify(['elem1', 'elem2']) };
const actFocus = await computeTimelineActFocus(event);
console.log('Computed act focus:', actFocus); // Should be most common act

// Test resolution paths
const character = { 
  owned_element_ids: JSON.stringify(['1dc2f33d583f8056bf34c6a9922067d8']),
  connections: 3 
};
const paths = computeResolutionPaths(character, 'character');
console.log('Resolution paths:', paths); // Should include "Black Market"
```

---

## Phase 1: Foundation - Journey Infrastructure 🚧

### Overview
Backend can compute and serve character journeys with gap detection.

### P1.M1: SQLite Database Layer 🚧

#### P1.M1.1: Install Dependencies & Create Database Service ✅
**File**: `backend/src/db/database.js`

```javascript
// Implementation complete
const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = process.env.DATABASE_PATH || './data/production.db';
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
  }
  
  // Additional methods implemented...
}
```

**Verification**: 
- [x] `npm list better-sqlite3` shows installed
- [x] Database file created at `./data/production.db`
- [x] Can connect and run test query

#### P1.M1.2: Schema Implementation ✅
**Note**: Schema definitions (`CREATE TABLE IF NOT EXISTS`) are located within `backend/src/db/database.js` in the `initializeDatabase` function.

**Verification**:
- [x] All tables created successfully
- [x] Foreign key constraints working
- [x] Test data insertable

#### P1.M1.3: Implement Robust Migration System ✅
**File(s) likely affected**:
- `storyforge/backend/src/db/migrations.js` (major overhaul)
- `storyforge/backend/src/db/database.js` (potential adjustments)
- New directory: `backend/src/db/migration-scripts/`

**Implementation Plan**:
1. Design a schema for a `schema_migrations` table (e.g., `id`, `version`, `name`, `applied_at`).
2. Implement logic in `migrations.js` to:
    - Create the `schema_migrations` table if it doesn't exist.
    - Read all migration script files (e.g., `YYYYMMDDHHMMSS_description.sql`) from `migration-scripts/`.
    - Check against the `schema_migrations` table to determine pending migrations.
    - Apply pending migrations sequentially, recording each in the `schema_migrations` table.
3. Create an initial migration script in `migration-scripts/` containing the current complete schema to establish a baseline.
4. Refactor `initializeDatabase` in `database.js` to rely on the migration system. `runMigrations` should be the primary entry point for schema setup.

**Acceptance Criteria**:
- [x] `schema_migrations` table is created and used to track applied migrations.
- [x] System can apply new SQL migration scripts from a designated directory.
- [x] Initial schema is successfully established via the first migration script.
- [x] `runMigrations` function correctly brings the database schema to the latest version.

### P1.M2: Journey Engine 🚧

#### P1.M2.1: Core Engine Structure ✅
**File**: `backend/src/services/journeyEngine.js`

```javascript
class JourneyEngine {
  constructor() { // constructor(notionService, db)
    // this.notionService = notionService; // Note: Data sourced via dbQueries
    // this.db = db; // Note: db connection likely handled internally or passed differently
  }
**Note**: Data for journey building is primarily sourced via `dbQueries.js` (local database) rather than direct `notionService` calls within `buildCharacterJourney`.

  async buildCharacterJourney(characterId) {
    // 1. Fetch character data (from local DB via dbQueries)
    const character = await this.notionService.getCharacter(characterId);
    
    // 2. Fetch related data (events, puzzles, elements from local DB via dbQueries)
    const events = await this.notionService.getCharacterEvents(characterId);
    const puzzles = await this.notionService.getCharacterPuzzles(characterId);
    const elements = await this.notionService.getCharacterElements(characterId);
    
    // 3. Compute segments
    const segments = this.computeJourneySegments(character, events, puzzles, elements);
    
    // 4. Detect gaps
    const gaps = this.detectGaps(segments);
    
    // 5. Cache in database // Addressed by P1.M2.4
    // this.cacheJourney(characterId, segments, gaps);
    
    return { character, segments, gaps };
  }
  
  // Additional methods implemented...
}
```

**Verification**:
- [x] Can instantiate JourneyEngine
- [x] All methods defined
- [x] Data Sourcing: Confirmed that JourneyEngine sources data for journey construction via the local database (dbQueries.js), per architectural design (Notion sync is handled separately).

#### P1.M2.2: Segment Computation ✅
**Implementation**: Creates 5-minute segments for 90-minute journey

```javascript
computeJourneySegments(character, events, puzzles, elements) {
  const segments = [];
  
  for (let minute = 0; minute < 90; minute += 5) {
    const segment = {
      id: `${character.id}-${minute}`,
      characterId: character.id,
      startMinute: minute,
      endMinute: minute + 5,
      activities: this.findActivitiesInRange(minute, minute + 5, puzzles, elements),
      interactions: this.findInteractionsInRange(minute, minute + 5, events),
      discoveries: this.findDiscoveriesInRange(minute, minute + 5, elements),
      gapStatus: null // Set by gap detection
    };
    segments.push(segment);
  }
  
  return segments;
}
```

**Verification**:
- [x] Generates 18 segments (90 min / 5 min)
- [x] Each segment has correct structure
- [x] Time ranges are continuous

#### P1.M2.3: Gap Detection Algorithm ✅
**Implementation**: Identifies empty segments and bottlenecks

```javascript
detectGaps(segments) {
  const gaps = [];
  
  segments.forEach((segment, index) => {
    const hasContent = 
      segment.activities.length > 0 || 
      segment.interactions.length > 0 || 
      segment.discoveries.length > 0;
    
    if (!hasContent) {
      // Check if this is part of a larger gap
      const gapStart = this.findGapStart(segments, index);
      const gapEnd = this.findGapEnd(segments, index);
      
      // Only create gap if we're at the start of a gap sequence
      if (index === gapStart) {
        gaps.push({
          id: `gap-${segment.characterId}-${segment.startMinute}`,
          characterId: segment.characterId,
          startMinute: segments[gapStart].startMinute,
          endMinute: segments[gapEnd].endMinute + 5,
          severity: this.calculateSeverity(gapEnd - gapStart + 1),
          type: 'empty',
          suggestedSolutions: [] // Note: Actual gap objects do not include a 'type' field.
        });
      }
    }
  });
  
  return gaps;
}
```

**Verification**:
- [x] Identifies all empty segments
- [x] Groups consecutive gaps
- [x] Calculates severity correctly

#### P1.M2.4: Implement Journey Caching in Database ✅

**File(s) likely affected**:
- `backend/src/services/journeyEngine.js` (modify `buildCharacterJourney`)
- `backend/src/db/queries.js` (new queries to write/read cached journeys)
- `backend/src/db/database.js` (potential schema changes for caching tables/fields)

**Implementation Plan**:
1. Determine schema for storing computed/cached journeys (e.g., new tables like `computed_journey_segments` or adapt existing ones).
2. Modify `buildCharacterJourney` in `journeyEngine.js`:
    - Before computation, attempt to fetch a previously computed journey for the `characterId`.
    - If a valid cached journey exists (e.g., based on TTL or data change detection), return it.
    - Otherwise, compute the journey and then save the resulting segments and gaps to the database.
3. Add necessary functions to `db/queries.js` for these save/retrieve operations.

**Acceptance Criteria**:
- [x] `buildCharacterJourney` first attempts to retrieve a computed journey from the database.
- [x] If cached journey is found and valid, it's returned without re-computation.
- [x] If no valid cached journey, it's computed and then the results are stored in the database.

### P1.M3: API Endpoints 🚧

#### P1.M3.1: Journey Routes ✅
**Files**: Route definitions are primarily in `backend/src/routes/journeyRoutes.js` (mounted at `/api`). See also `backend/src/index.js` for how routes are mounted.

```javascript
// GET /api/journeys/:characterId
router.get('/journeys/:characterId', async (req, res) => {
  try {
    const journey = await journeyController.getJourney(req.params.characterId);
    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/journeys/:characterId/gaps
router.get('/journeys/:characterId/gaps', async (req, res) => {
  try {
    const gaps = await journeyController.getGaps(req.params.characterId);
    res.json(gaps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Verification**:
- [x] Routes registered in Express
- [x] Return correct data structure
- [x] Error handling works

#### P1.M3.2: Gap Management Endpoints ✅
**Implementation**: CRUD operations for gaps

```javascript
// GET /api/gaps/all
router.get('/gaps/all', async (req, res) => {
  try {
    const gaps = await gapController.getAllGaps();
    res.json(gaps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

**Task: Implement `POST /api/gaps/:gapId/resolve` Endpoint** ✅

**File(s) likely affected**:
- `backend/src/routes/journeyRoutes.js` (add route)
- `backend/src/controllers/journeyController.js` (new `resolveGap` handler)
- `backend/src/db/queries.js` (new query to update gap in DB)

**Implementation Plan**:
1. Define `router.post('/gaps/:gapId/resolve', resolveGap);` in `journeyRoutes.js`.
2. Implement `resolveGap` controller in `journeyController.js` to handle request body (e.g., status, comment) and call DB query.
3. Implement DB query in `queries.js` to update the gap record.

**Acceptance Criteria (for the POST endpoint)**:
- [x] `POST /api/gaps/:gapId/resolve` endpoint is implemented and functional.
- [x] Endpoint accepts a payload to update the gap (e.g., new status, resolution notes).
- [x] The corresponding gap record in the database is updated correctly.
- [x] Appropriate success or error responses are returned.
```

**Verification**:
- [x] Can fetch all gaps across characters
- [x] Resolution endpoint (`POST /api/gaps/:gapId/resolve`) accepts payload (status, comment) and updates database correctly.
- [x] Appropriate success/error responses are returned by the endpoint.

### P1.M4: Frontend State Foundation ✅

#### P1.M4.1: Journey Store Setup ✅
**File**: `frontend/src/stores/journeyStore.js`

```javascript
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { api } from '../services/api';

const useJourneyStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      activeCharacterId: null,
      journeyData: new Map(),
      gaps: new Map(),
      selectedTimeRange: [0, 90],
      selectedGap: null,
      
      // Actions
      setActiveCharacter: (characterId) => 
        set({ activeCharacterId: characterId }),
      
      loadJourney: async (characterId) => {
        try {
          const data = await api.getJourney(characterId);
          set(state => ({
            journeyData: new Map(state.journeyData).set(characterId, data),
            gaps: new Map(state.gaps).set(characterId, data.gaps)
          }));
        } catch (error) {
          console.error('Failed to load journey:', error);
        }
      },
      
      selectGap: (gap) => set({ selectedGap: gap }),
      
      // Computed (via selectors)
      selectors: {
        getActiveJourney: () => {
          const state = get();
          return state.journeyData.get(state.activeCharacterId);
        },
        
        getActiveGaps: () => {
          const state = get();
          return state.gaps.get(state.activeCharacterId) || [];
        }
      }
    }))
  )
);
```

**Verification**:
- [x] Store creates successfully
- [x] Can load journey data
- [x] Selectors return correct data

#### P1.M4.2: User Review and Frontend Access (Phase 1 End)

**Expected Frontend State:**
- While no interactive UI components are built in Phase 1, the frontend's `journeyStore.js` is capable of fetching and managing character journey data (segments, activities, interactions, discoveries) and gap information from the backend API.

**Accessing for Review:**
- **Method:** Developer-assisted demonstration or via a temporary debug interface.
- **Steps (Developer Lead):**
    1. Run the backend server.
    2. Run the frontend application.
    3. Using browser developer tools or a temporary debug view, demonstrate that selecting/inputting a `characterId` triggers API calls to `/api/journeys/:characterId`.
    4. Show that the `journeyStore` is populated with the expected data structures:
        - Journey segments (e.g., 18 segments for a 90-minute journey).
        - Associated activities, interactions, and discoveries within segments.
        - Identified gaps with their start and end times.

**Key Review Goals:**
- Verify that the frontend can successfully connect to the backend API.
- Confirm that character journey data and gap information are fetched and structured correctly in the frontend state store (`journeyStore.js`).
- Check for any errors during data fetching or processing in the browser console.

---

## Phase 2: Core Views - Journey & System Lenses 🚧

### Overview
Build the dual-lens interface with Player Journey Timeline as centerpiece.

### P2.M1: Player Journey Timeline Component 🚧

#### P2.M1.1: Basic Timeline Structure ✅
**File**: `frontend/src/components/PlayerJourney/TimelineView.jsx`

```jsx
import React from 'react';
import { Box, Paper } from '@mui/material';
import { useJourneyStore } from '../../stores/journeyStore';

const TimelineView = () => {
  const journey = useJourneyStore(state => state.selectors.getActiveJourney());
  
  if (!journey) {
    return <Box>Select a character to view their journey</Box>;
  }
  
  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      // <TimelineHeader character={journey.character} /> // Note: Header functionality (character name display) is integrated directly into TimelineView.
      // <TimelineRuler /> // Note: Ruler functionality (time interval display) is integrated directly.
      // <TimelineSegments segments={journey.segments} /> // Note: Segment rendering is integrated, utilizing ActivityBlock.jsx for items.
      // <GapIndicators gaps={journey.gaps} /> // Note: Uses singular GapIndicator.jsx component in a loop for each gap.
    </Paper>
  );
};
```

**Verification**:
- [x] Component renders without errors
- [x] Shows loading state
- [x] Displays basic timeline structure

#### P2.M1.2: Segment Visualization ✅
**Note**: The functionality for segment visualization is primarily handled within `frontend/src/components/PlayerJourney/TimelineView.jsx`, utilizing the `ActivityBlock.jsx` component for displaying individual activities, interactions, and discoveries. There is no separate `TimelineSegment.jsx` file.

```jsx
// const TimelineSegment = ({ segment, index }) => {
//   const { activities, interactions, discoveries } = segment;
//   const isEmpty = !activities.length && !interactions.length && !discoveries.length;
  
//   return (
//     <Box
//       sx={{
//         position: 'absolute',
//         left: `${(segment.startMinute / 90) * 100}%`,
//         width: `${(5 / 90) * 100}%`,
//         height: '100%',
//         borderRight: '1px solid #333',
//         backgroundColor: isEmpty ? '#ff000020' : 'transparent',
//         '&:hover': { backgroundColor: '#ffffff10' }
//       }}
//     >
//       {/* {activities.map(activity => (
//         <ActivityIcon key={activity.id} activity={activity} /> // Note: Items rendered via ActivityBlock.jsx
//       ))} */}
//       {/* {interactions.map(interaction => (
//         <InteractionLine key={interaction.id} interaction={interaction} /> // Note: Items rendered via ActivityBlock.jsx
//       ))} */}
//       {/* {discoveries.map(discovery => (
//         <DiscoveryMarker key={discovery.id} discovery={discovery} /> // Note: Items rendered via ActivityBlock.jsx
//       ))} */}
//     </Box>
//   );
// };
// The snippet below illustrated the intended logic for displaying segment items. This is now primarily handled by ActivityBlock.jsx within TimelineView.jsx.
```

**Verification**:
- [x] Segments positioned correctly
- [ ] Empty segments highlighted // Implemented differently: shows message for empty 5-min intervals in selected range.
- [ ] Content icons display // Uses ActivityBlock with text Chips, not specific icons.

#### P2.M1.3: Timeline Interactivity ✅
**Implementation Goal**: Add zoom, pan, and click interactions

```jsx
const TimelineControls = () => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  
  return (
    <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
      <IconButton onClick={() => setZoom(Math.min(zoom * 1.2, 5))}>
        <ZoomInIcon />
      </IconButton>
      <IconButton onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))}>
        <ZoomOutIcon />
      </IconButton>
      <IconButton onClick={() => { setZoom(1); setPan(0); }}>
        <CenterFocusIcon />
      </IconButton>
    </Box>
  );
};
```

**Acceptance Criteria**:
- [x] Can zoom in/out (0.5x to 5x)
- [x] Can pan when zoomed
- [x] Click segment to see details
- [x] Keyboard shortcuts (Ctrl+scroll for zoom)
- [ ] Touch gestures on mobile

**Test Implementation**:
```javascript
// frontend/src/components/PlayerJourney/__tests__/TimelineView.test.jsx
describe('Timeline Interactivity', () => {
  it('should zoom in when zoom in button clicked', () => {
    const { getByLabelText } = render(<TimelineView />);
    const zoomIn = getByLabelText('Zoom in');
    fireEvent.click(zoomIn);
    // Assert transform scale increased
  });
  
  it('should pan when dragged while zoomed', () => {
    // Test pan functionality
  });
});
```

#### P2.M1.4: Gap Highlighting & Selection ✅
**Waiting on**: P2.M1.3 completion

**Implementation Plan**:
1. Visual gap indicators with severity colors ✅ (Implemented in GapIndicator.jsx)
2. Click gap to select in store ✅ (Implemented in GapIndicator.jsx)
3. Hover to preview gap details ✅
4. Animated attention indicators ✅

#### P2.M1.5: Fix Puzzle Sync Errors ✅
**Status**: **Complete (Code-Side)**. The sync process is now stable.
**Problem**: During data sync, 17 out of 32 puzzles were failing.
**Impact**: Missing puzzle data in the application.

**Resolution**:
1.  **Fixed Migration Failure**: Corrected the database initialization and migration process, which created the missing `narrative_threads` column and resolved the primary crash cause.
2.  **Fixed Name Mapping**: Updated `dataSyncService.js` to correctly handle puzzles named with a "Puzzle" property or a "Name" property.
3.  **Confirmed Data Issue**: The remaining 17 errors are confirmed to be data integrity problems within the source Notion pages (e.g., missing required fields like `Timing`).

**Next Steps**: This task is now a data-curation task for the content team, not a development task.

### P2.M1.X: User Review and Frontend Access (Player Journey Timeline)
*(Note: This review point assumes completion of P2.M1.1 through P2.M1.4)*

**Expected Frontend State:**
- The `TimelineView.jsx` component is implemented and integrated, providing a visual representation of character journeys.
- The timeline should display segments, activities, interactions, discoveries, and highlight identified gaps.
- Basic timeline interactivity (zoom, pan, click for details - subject to P2.M1.3 completion) should be functional.

**Accessing for Review:**
- **Method:** Run the full application (backend and frontend) and navigate to the Player Journey Timeline view.
- **Steps:**
    1. Ensure the backend server is running and serving data.
    2. Start the frontend development server (e.g., `npm run dev` or equivalent in `storyforge/frontend`).
    3. Open the application in a web browser.
    4. Navigate to a specific character's detail page (e.g., `/characters/:id`). From there, click the 'Player Journey' button in the page actions area. This will set the active character and navigate to the Player Journey Timeline view (`/player-journey`).

**Key Review Goals:**
- **Visual Accuracy:**
    - Timeline displays with a clear header, time ruler, and 18 chronological segments for a 90-minute journey.
    - Activities, interactions, and discoveries are represented as icons/markers within the correct time segments.
    - Empty segments are visually distinct (e.g., different background color).
    - Identified gaps are highlighted on the timeline (severity colors if P2.M1.4 is complete).
    - Spot-check data accuracy for a few key events against Notion or test data.
- **Interactivity (as per P2.M1.3 completion):**
    - **Zoom:** The timeline can be zoomed in and out using available controls.
    - **Pan:** When zoomed, the timeline can be panned horizontally.
    - **Selection/Details:** Clicking on a segment, event, or gap provides more details or highlights it (specifics depend on P2.M1.4 implementation for gaps).
- **Responsiveness & Errors:**
    - The timeline view loads without errors in the console.
    - Basic responsiveness is adequate (no major layout breaks).
- **Character Switching:** Navigating to a different character's detail page and clicking their 'Player Journey' button correctly updates the timeline to show that specific character's journey.

### P2.M2: Gap Resolution Workflow 🚧

#### P2.M2.1: Context Panel ⏳
**Waiting on**: P2.M1.3 completion

**File**: `frontend/src/components/GapResolution/ContextPanel.jsx`

**Implementation Plan**:
```jsx
const ContextPanel = () => {
  const selectedGap = useJourneyStore(state => state.selectedGap);
  
  if (!selectedGap) return null;
  
  return (
    <Paper sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
      <GapDetails gap={selectedGap} />
      <SuggestedSolutions gap={selectedGap} />
      <QuickActions gap={selectedGap} />
    </Paper>
  );
};
```

#### P2.M2.2: Smart Suggestions ⏳
**Waiting on**: P2.M2.1 completion

**Backend Integration Required**:
- Endpoint: `GET /api/gaps/:gapId/suggestions`
- Returns: Ranked list of content that could fill gap
- Considers: Time availability, character proximity, theme

### P2.M3: Layout Restructuring ⏳

#### P2.M3.1: Dual-Lens Layout ⏳
**Waiting on**: Timeline component completion

**File**: `frontend/src/components/Layout/DualLensLayout.jsx`

**Implementation Plan**:
1. Split screen with resizable divider
2. Journey Space (left) - Timeline focus
3. System Space (right) - Analytics focus
4. Context Workspace (bottom) - Adaptive
5. Command Bar (top) - Persistent

### P2.M4: View Synchronization ⏳

#### P2.M4.1: Shared State Management ⏳
**Waiting on**: Layout implementation

**Implementation**: Cross-view state coordination
- Selected time range affects both views
- Character selection updates analytics
- Gap selection shows system impact

---

## Phase 3: System Intelligence 📅

### Overview
Add system-wide analytics and balance monitoring.

### P3.M1: Balance Dashboard 📅

#### P3.M1.1: Three-Path Metrics
**File**: `frontend/src/components/SystemViews/BalanceDashboard.jsx`

**Implementation Plan**:
1. Calculate path values from journey data
2. Visual comparison (bar charts)
3. Trend analysis over time
4. Imbalance warnings

#### P3.M1.2: Path Simulation
**Backend Required**: 
- `POST /api/balance/simulate`
- Input: Proposed changes
- Output: Predicted impact

### P3.M2: Interaction Matrix 📅

#### P3.M2.1: Heat Map Visualization
**Implementation**: D3.js or Canvas-based matrix
- 19x19 character grid
- Color intensity = interaction frequency
- Time-based filtering

#### P3.M2.2: Isolation Detection
**Algorithm**: Find characters with low interaction scores
- Warning thresholds
- Suggested pairings
- Time slot availability

### P3.M3: Timeline Archaeology 📅

#### P3.M3.1: Event Surface Map
**Visualization**: How past events emerge in gameplay
- Vertical timeline (19 years)
- Discovery probability
- Connected elements

---

## 🛠️ Implementation Guidelines

### Code Standards

#### File Naming
```
ComponentName.jsx       // React components
componentName.js        // Regular JS files
ComponentName.test.jsx  // Test files
use-hook-name.js       // Custom hooks
```

#### Commit Messages
```
Complete P1.M2.3 - Gap detection algorithm
Fix P2.M1.2 - Segment positioning issue  
WIP P2.M1.3 - Timeline zoom controls
```

#### Testing Requirements
- Unit tests for all utility functions
- Integration tests for API endpoints
- Component tests for user interactions
- E2E tests for critical paths

### Development Flow

1. **Start Task**
   - Check this playbook for current task
   - Create feature branch: `feature/P2.M1.3-timeline-interactivity`
   - Write tests first (TDD)

2. **During Development**
   - Implement acceptance criteria
   - Run tests frequently
   - Check against PRD UI specs
   - Update progress markers

3. **Complete Task**
   - All tests passing
   - Code reviewed (or self-reviewed)
   - Update this playbook's verification checkboxes
   - Merge to main branch

### Common Patterns

#### API Integration
```javascript
// Always use try-catch with loading states
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await api.getSomething();
    // Process data
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### State Updates
```javascript
// Always use immutable updates
set(state => ({
  ...state,
  someMap: new Map(state.someMap).set(key, value),
  someArray: [...state.someArray, newItem]
}));
```

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
