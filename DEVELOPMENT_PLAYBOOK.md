# Development Playbook
## Building the Production Intelligence Tool

> **Executive Summary**: This comprehensive implementation guide (10,900+ words) contains everything needed to build and maintain the About Last Night Production Intelligence Tool. It covers current development status (Technical Debt Phase), architecture patterns, detailed requirements, troubleshooting solutions, and the complete game design context. Developers should keep this open while coding, using the Quick Nav to jump to relevant sections. Critical sections include the Technical Debt Repayment Plan (current work), Architecture Overview (system structure), and Troubleshooting Guide (common issues).

**Purpose**: Step-by-step implementation guide for developers. Keep this open while coding.

**Status**: **REVISED for Technical Debt Repayment** (Post 2025-06-07)

## 🗺️ Claude Quick Nav

**Top Sections for Quick Access:**
1. [🎯 Current Development Status](#-current-development-status) - Active phase and current task
2. [🛠️ Technical Debt Repayment Plan](#%EF%B8%8F-technical-debt-repayment-plan) - Priority tasks
3. [🏗️ Architecture Overview](#%EF%B8%8F-architecture-overview) - System structure
4. [🔧 Troubleshooting Guide](#-troubleshooting-guide) - Common issues

**Search Keywords:** 
`current task`, `tech debt`, `architecture`, `sync`, `compute`, `troubleshooting`, `final mile`, `memory value`, `puzzle sync`, `journey`

**Cross-References:**
- Current status → [README.md](./README.md)
- Data mappings → [SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md)
- Claude workflow → [CLAUDE.md](./CLAUDE.md)

---

## 📚 Essential Context

### Core References
- **[README.md](./README.md)** - Current status and progress tracker
- **[SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md)** - Notion→SQL field mappings
- **Requirements & Specifications** section below - Complete product vision and technical requirements

### Game Design Background
For deeper understanding of game mechanics when implementing calculated fields:
- **[active_synthesis_streamlined.md](./docs/archive/design/game design background/active_synthesis_streamlined.md)** - Complete game design (memory economy, three paths)
- **[concept_evolution_streamlined.md](./docs/archive/design/game design background/concept_evolution_streamlined.md)** - Why certain design choices were made
- **[questions_log_streamlined.md](./docs/archive/design/game design background/questions_log_streamlined.md)** - Clarifications on game mechanics

## 📋 Requirements & Specifications

> **Summary**: Complete product requirements including functional specs, user journeys, and technical constraints. Defines what the Production Intelligence Tool must do for game designers and production teams. Covers data management (Notion sync), journey visualization, system intelligence features, and UX patterns. Reference this when implementing new features or validating functionality.

### Core Product Vision
**"See the Journey, Shape the System"** - A Production Intelligence Tool that enables efficient game design and production management for "About Last Night."

#### Target Users
1. **Primary Users**: Game designers and production teams
   - Content creators working on character journeys, puzzles, and memory tokens
   - Production planners organizing physical game sessions
   - Balance analysts monitoring three-path equilibrium

2. **Secondary Users**: Developers and technical contributors
   - Backend developers maintaining data sync and compute services
   - Frontend developers enhancing UI/UX for non-technical users

#### Core Tool Purpose
This tool is designed for **game content creation and balance analysis**, NOT for running live game productions. It serves designers, writers, and production planners during the development phase.

**What the Tool Does**:
- **Content Design**: Create and balance game elements (characters, puzzles, memory tokens)
- **Journey Planning**: Map player paths and interactions  
- **Balance Analysis**: Monitor three-path equilibrium
- **Production Preparation**: Generate specifications and requirements

**What the Tool Does NOT Do**:
- **Live Game Management**: Not for real-time production control
- **RFID Hardware**: Does not interface with physical scanners
- **Player Tracking**: Does not monitor actual players during games
- **Real-Time Decisions**: Not for live facilitation support

### Functional Requirements

<details>
<summary>📋 <strong>1. Data Management Requirements</strong> (Click to expand)</summary>

#### 1. Data Management Requirements
**Notion Integration**:
- Read from four Notion databases (Characters, Elements, Puzzles, Timeline)
- Two-phase sync architecture: entities → relationships → computed fields
- Handle rate limits (3 requests/second) with proper queuing
- Support offline work with local SQLite cache

**Data Integrity**:
- Referential integrity maintained through foreign key constraints
- Transaction-based operations with automatic rollback on failure
- Computed fields calculated during sync (Act Focus, Resolution Paths, Narrative Threads)
- Character relationship scoring with weighted algorithms

**Required Data Coverage**:
- 20+ characters with full relationship mapping
- 100+ elements including memory tokens with value extraction
- 30+ puzzles with dependency chains
- 75+ timeline events spanning 19-year backstory

</details>

<details>
<summary>🚀 <strong>2. Journey Management Requirements</strong> (Click to expand)</summary>

#### 2. Journey Management Requirements
**Character Journey Visualization**:
- Graph-based journey representation (not linear timeline)
- Dependency visualization showing causal chains
- Support for all 3 character tiers (Core/Secondary/Tertiary)
- Real-time journey impact analysis

**Gap Detection & Resolution**:
- Automated identification of unconnected journey nodes
- Paths with no downstream dependencies flagged
- Context-aware content creation suggestions
- Impact preview before adding new content

</details>

<details>
<summary>🧠 <strong>3. System Intelligence Requirements</strong> (Click to expand)</summary>

#### 3. System Intelligence Requirements
**Balance Dashboard**:
- Real-time three-path monitoring (Black Market, Detective, Third Path)
- Visual comparison with imbalance detection
- Character tier balance analysis
- Memory token value distribution tracking

**Production Analytics**:
- Character interaction density heat maps
- Timeline event discovery coverage analysis
- Puzzle dependency bottleneck identification
- Memory economy simulation capabilities

</details>

<details>
<summary>🎨 <strong>4. User Experience Requirements</strong> (Click to expand)</summary>

#### 4. User Experience Requirements
**Designer-Friendly Interface**:
- Dual-lens layout: Journey Space + System Space + Context Workspace
- Progressive disclosure with hover previews
- Context-aware creation tools
- Natural language search across all entities

**Responsive Design**:
- Wide screens: Full three-panel layout
- Standard screens: Tabbed Journey/System spaces  
- Narrow screens: Stacked layout with navigation
- Mobile support for viewing (not editing)

</details>

### Performance Requirements

#### Sync Performance
- Full sync completion: < 30 seconds for complete dataset
- Entity sync: < 2 seconds for 25 characters
- Relationship sync: < 1 second for 125 character links
- Incremental sync: < 5 seconds for typical changes

#### Query Performance  
- Journey graph generation: < 500ms cold start, < 100ms cached
- Balance dashboard updates: < 200ms
- Character relationship queries: < 100ms
- Search operations: < 1 second across all entities

#### Compute Performance
- Act Focus computation: < 1 second for 75 timeline events
- Resolution Path computation: < 2 seconds for 137 entities
- Narrative Thread computation: < 1 second for 32 puzzles
- Character Link computation: < 1 second for 25 characters

### Integration Requirements

#### Notion API Integration
- OAuth authentication with workspace access
- Rate limit compliance with exponential backoff
- Conflict resolution for simultaneous edits
- Field extraction including structured data from descriptions

#### Local Database Integration
- SQLite for offline capability and performance
- Automated migrations with verification
- Transaction management for data consistency
- Backup and restore capabilities

#### Future Integration Readiness
- Export capabilities for production documentation
- API structure for potential external integrations
- Webhook foundation for real-time notifications
- Plugin architecture for custom features

### Data Requirements

#### Memory Token System Support
- RFID tag value extraction from element descriptions
- Value ratings (1-5) with type multipliers (Personal ×1, Business ×3, Technical ×5)
- Group completion bonus calculations
- Memory ownership tracking per character

#### Character Relationship Modeling
- Weighted scoring: Events (30 pts), Puzzles (25 pts), Elements (15 pts)
- Connection strength visualization
- Interaction opportunity identification
- Social network analysis capabilities

#### Game Balance Monitoring
- Three-path value tracking with real-time updates
- Character tier distribution analysis
- Memory token allocation optimization
- Puzzle difficulty progression validation

### Quality Requirements

#### Reliability
- 99.9% uptime for core features
- Automatic error recovery with user notification
- Data backup with point-in-time restore
- Graceful degradation when Notion unavailable

#### Maintainability
- Modular architecture with clear separation of concerns
- Comprehensive test coverage (>90% for critical paths)
- Clear API contracts between frontend and backend
- Documentation automatically updated with code changes

#### Security
- Environment-based API key management
- Local database encryption at rest
- Input validation and sanitization
- Audit trail for all data modifications

### Success Metrics

#### Functionality Metrics
- Can view any character's complete journey graph
- Gap detection accuracy > 95%
- Content creation 5x faster than direct Notion editing
- Three-path balance maintained within 20% variance

#### Performance Metrics
- Journey loads in < 2 seconds
- Gap detection completes in < 500ms
- Smooth 60fps timeline scrolling
- Background sync with no user interruption

#### User Experience Metrics
- Gap to resolution workflow in < 2 minutes
- Intuitive operation without documentation for experienced designers
- Zero data loss or corruption incidents
- Designer adoption rate > 80% for content creation tasks

#### Quality Metrics
- < 5% error rate for sync operations
- Zero critical bugs in production
- All performance targets met under normal load
- User-reported issues resolved within 48 hours

## 🏗️ Architecture Overview

> **Summary**: Describes the system's modular architecture including sync services (SyncOrchestrator pattern), compute services for derived fields, and cache management. Essential for understanding how Notion data flows through the system, gets transformed, and serves the frontend. Includes directory structure, core components, and data flow diagrams.

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

> **Summary**: Following Architecture Remediation Plan (December 2024). Phase 1 (Stabilization) completed with critical issues identified. Phase 2 (Standardization) starting - focused on breaking down god components, standardizing data fetching patterns, and establishing performance monitoring.

**Active Phase**: **Architecture Remediation Phase 2 - Standardization** (starting)
**Phase System**: See [PHASE_TRACKER.md](./docs/PHASE_TRACKER.md) for ONLY valid phase tracking
**Started**: January 2025
**Progress**: Phase 1 completed with critical issues found
**Branch**: `ux-redesign`

### Current Task
**Task 2.1**: Refactor God Components (2 hours)
- Break down NarrativeThreadTrackerPage.jsx (1,065 lines)
- Split into logical sub-components
- Maintain functionality while improving maintainability

### 📊 Real System State (Not Documentation Claims)
**Verified via Commands** (not documentation claims):
- **Test Coverage**: 15% (NOT 63.68% as claimed)
- **Console Logs**: 106 statements in production code
- **Error Boundaries**: Built but 0% integrated
- **Database**: 1 critical error blocking app startup
- **Hidden Features**: Player Journey, Narrative Threads exist but no navigation

### Phase 1 Task Breakdown (COMPLETED)
| Task | Description | Hours | Status |
|------|-------------|-------|--------|
| 1.1 | Integrate Error Boundaries | 1.5 | ✅ DONE |
| 1.2 | Replace Console Logs | 1 | ✅ DONE |
| 1.3 | Fix Player Journey | 2 | 🔴 BLOCKED |
| 1.4 | Integration Testing | 0.5 | 🔴 BLOCKED |

**Total Phase 1**: Completed with critical blocking issues found

### ✅ Completed Work (Archived)
**Phase 0 - Documentation (December 2024)**: COMPLETE!
- Created Architecture Remediation Plan
- Cleaned up documentation conflicts
- Established single phase system
- All technical debt tasks completed and archived

See [docs/archive/](../docs/archive/) for historical task details.

---

## 🛠️ Architecture Remediation Phase 1: Stabilization

> **Summary**: 8 hours of focused work to make the application production-ready. Integrates existing error boundaries, replaces console logs with production logger, fixes critical database error, and ensures hidden features are accessible. Foundation for Phase 2 (Standardization) and Phase 3 (Optimization).

**Objective**: Stabilize the application by fixing critical architectural issues that prevent production deployment.

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
   - [ ] README.md Current Sprint Status section is up to date
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

### 🏗️ Current Development Status

**Active Phase**: Architecture Remediation Phase 1 - Stabilization  
**Started**: January 2025  
**Progress**: In Progress  

**Current Task**: Error Boundary Integration (1.5 hours allocated)

**Priority Tasks**:
1. **Error Boundaries** - Integrate existing ErrorBoundary.jsx across all major components
2. **Production Logger** - Replace 106 console.* statements with centralized logger
3. **Player Journey Fix** - Resolve visualization issues in journey components
4. **Integration Testing** - Verify error recovery and app stability

**Reference**: See [PHASE_TRACKER.md](./docs/PHASE_TRACKER.md) for complete task breakdown and progress tracking.

**Verification Commands**:
```bash
# Check current system state
npm run verify:all          # Overall system verification
npm test                    # Run test suite
npm run lint                # Check code quality
```

**Known Issues**:
- Error boundary coverage: 0% (target: 100%)
- Console statements: 106 (target: 0)
- Test coverage: 15% (improved from 13.7%)

---

### 📋 Technical Implementation Archive

The detailed technical debt tasks that were previously tracked here have been completed and archived. These tasks focused on:

- **Database & API Cleanup**: Sanitizing deprecated functions, removing obsolete tables, and cleaning up hybrid API responses
- **DataSyncService Refactor**: Breaking down the 760-line monolith into focused, testable modules (SyncOrchestrator, entity syncers, compute services)
- **Test Coverage Improvement**: Achieving 63.68% overall test coverage with comprehensive test suites

**Current Development Focus**: The project has transitioned from technical debt resolution to the **Architecture Remediation Phase**, addressing:

1. **Error Boundaries**: Implementing 3-tier error handling to prevent app crashes
2. **Production Logging**: Replacing console.* statements with proper logging
3. **Component Optimization**: Breaking down god components and standardizing data patterns
4. **Performance Monitoring**: Establishing production-ready observability

For current tasks and priorities, see:
- **ARCHITECTURE_REMEDIATION_PLAN.md** - Current phase implementation details
- **SESSION_HANDOFF.md** - Latest session findings and next steps
- **QUICK_START.md** - 30-minute action plan for immediate issues

**Status**: All technical debt tasks completed (2025-06-12). Architecture remediation in progress.

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

> **Summary**: Solutions for common development issues including sync failures, foreign key violations, and missing computed fields. Provides debug commands, SQL queries, and recovery strategies. Check here first when encountering errors during development or testing.

<details>
<summary>🎯 <strong>Notion Validation Protocol</strong> (Click to expand)</summary>

### 🎯 Notion Validation Protocol
**🚨 NEW PROCESS (June 14, 2025)**: Before assuming data issues are technical bugs, validate against Notion first.

#### When to Use Notion Validation
- Missing or NULL computed fields (act_focus, narrative_threads, resolution_paths)
- Unexpected data gaps or patterns  
- Sync appears successful but data seems incomplete
- Documentation claims differ from database reality

#### Validation Steps
1. **Check Field Existence in Notion**
   ```javascript
   // Use MCP Notion tools to query the database
   // Example: Check if Act Focus exists in Timeline database
   await mcp_notion_query_database({
     database_id: "1b52f33d583f80deae5ad20c120dd", // Timeline
     page_size: 5
   });
   ```

2. **Understand Data Dependencies**
   ```javascript
   // Check if computed field dependencies exist
   // Example: Act Focus depends on Elements having "First Available"
   await mcp_notion_query_database({
     database_id: "18c2f33d583f802091bcd84c7dd94306", // Elements
     filter: {
       property: "First Available",
       select: { is_not_empty: true }
     }
   });
   ```

3. **Distinguish Bug vs Data Gap**
   - **Data Gap**: Field missing in Notion → NULL values expected
   - **Technical Bug**: Field exists in Notion but not syncing → Code issue
   - **Design Issue**: Field doesn't exist in Notion → Need computed field

#### Example: Act Focus Analysis
```
Problem: 42/75 timeline events missing act_focus
Notion Check: Act Focus field doesn't exist in Timeline database  
Dependency Check: 59/100 elements missing "First Available" field
Conclusion: Data incompleteness, NOT technical bug
Solution: Document as expected behavior, add data quality reporting
```

</details>

<details>
<summary>🐛 <strong>Common Sync Issues</strong> (Click to expand)</summary>

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

</details>

<details>
<summary>🔨 <strong>Debugging Tools</strong> (Click to expand)</summary>

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

</details>

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

### Known Issues (Verified June 15, 2025)
1. **Notion Data Quality**
   - Act Focus: 42/75 timeline events missing values (Notion data incomplete)
   - Memory Values: Only 1/100 elements has non-zero value
   - SF_ Template: Found in description text, not as structured format
   - Impact: Features work but show limited data
   - Fix: Designer needs to update Notion data

2. **Frontend Access** 
   - Issue: Advanced features lack proper navigation
   - Impact: Users can't access advanced features
   - Fix: Add navigation menu items (1 hour task)

3. **Memory Value Extraction**
   - Status: ✅ Already integrated in ComputeOrchestrator
   - Issue: Only 1 element has memory value in Notion
   - Fix: Data issue, not technical

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
→ Check Troubleshooting section below

---

## 📋 [DEPRECATED SECTION REMOVED]

This section referenced an outdated "Phase 0.5" which conflicts with the current Architecture Remediation Phase system. The tasks described here have been properly incorporated into the Architecture Remediation Phases. See [PHASE_TRACKER.md](./docs/PHASE_TRACKER.md) for the ONLY valid phase tracking.

---


## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### "I don't know what I'm supposed to be building"
1. Check Current Task section above
2. Find your milestone in this playbook
3. Read the Acceptance Criteria
4. Look at the PRD mockups for visual reference

#### "The existing code doesn't match what I'm supposed to build"
This is expected! StoryForge is entity-centric, we're making it journey-centric.
- Keep existing code working (feature flags)
- Build new features alongside
- Only modify existing code when necessary
- Document what you're changing and why

#### "I'm getting 404 errors on journey endpoints"
**Root Cause**: SQLite database is empty
```bash
cd storyforge/backend
node scripts/sync-data.js
# Verify with: node scripts/sync-data.js --status
```

#### "Character sync shows foreign key constraint errors"
This has been fixed with two-phase sync. If you still see this:
- Pull latest code changes
- Check dataSyncService.js has `syncCharacterRelationships()` method
- Ensure sync runs in correct order

#### "Puzzle sync is failing with errors"
**Known Issue**: 17 out of 32 puzzles fail to sync (Notion data issue)
- The app works with partial puzzle data
- Missing puzzles won't break journey computation
- Debug specific puzzles by logging raw Notion data

#### "Database shows 0 records after sync"
```bash
# Run a fresh sync
cd storyforge/backend
node scripts/sync-data.js

# Verify all data synced
node scripts/sync-data.js --status
# Should show:
# characters: 22 records
# elements: 100 records
# puzzles: 15 records (17 fail)
# timeline_events: 75 records
# character_links: 125 records
```

#### "Computed fields are null"
These must be computed after base data sync:
- ✅ Act Focus - Computed for timeline events
- ✅ Resolution Paths - Computed for all entities
- ✅ Narrative Threads - Computed for puzzles

If still null:
1. Ensure full sync completed
2. Check sync output for "Computing derived fields..."
3. Verify computation completed

#### "Timeline events missing act_focus values"
**This is NOT a bug** - it's expected behavior when Notion data is incomplete.

**Root Cause**: Elements missing "First Available" field in Notion
- **Current Status**: 59/100 elements missing "First Available" 
- **Result**: 42/75 timeline events have NULL act_focus
- **Technical Status**: ActFocusComputer works correctly

**Verification Steps**:
```bash
# Check element data quality
cd storyforge/backend
node -e "
const db = require('./src/db/database').getDB();
const stats = db.prepare('SELECT COUNT(*) as total, COUNT(first_available) as has_act FROM elements').get();
console.log('Elements:', stats.total, 'with act:', stats.has_act);
"
```

**Expected Behavior**:
- Tool correctly returns NULL when source data incomplete
- This helps game designers identify data gaps
- Act focus will populate as designers complete "First Available" in Elements

**Action Required**: Game designers must populate "First Available" field in Notion Elements database.

#### "Memory token values aren't being extracted"
Format in Notion Elements:
```
Description: "A memory of the first rave... 
SF_RFID: 12345
SF_ValueRating: 3
SF_MemoryType: Personal"
```

Extraction should happen:
1. During sync (extract and store in separate column)
2. During journey computation (aggregate per character)
3. During path affinity calculation (sum values)

#### "I don't understand the journey computation logic"
**Journey = Character's 90-minute experience**

Key Concepts:
- **Segments**: 5-minute time blocks (18 total)
- **Activities**: What they do (find item, solve puzzle)
- **Interactions**: Who they meet
- **Discoveries**: What they learn
- **Gaps**: Segments with no content

Visual:
```
0-5 min:   [Activities] [Interactions] [Discoveries]
5-10 min:  [Activities] [----GAP----] [Discoveries]
10-15 min: [Activities] [Interactions] [Discoveries]
```

#### "The gap detection seems arbitrary"
**Gap Rules** (from game design):
- **Dead time**: >10 minutes with no activity
- **Isolation**: >15 minutes with no interactions
- **No progress**: No discoveries for >20 minutes
- **Bottlenecks**: Required items not available

```javascript
// Gaps are not just empty time - they're problematic patterns
if (noActivitiesFor(10) || noInteractionsFor(15)) {
  createGap('high_severity');
}
```

#### "State management is confusing"
**Three Layers**:
1. **UI State** (Zustand): What view, what's selected
2. **Data State** (SQLite + React Query): Journeys, gaps
3. **Sync State**: What needs to sync with Notion

Data Flow:
```
Notion → SQLite → React Query → Zustand → Components
         ↑__________________________|
                  (Updates)
```

#### "Performance is terrible"
Common Culprits:
1. **Rendering all journeys at once** - Use virtual scrolling
2. **Re-computing on every render** - Use useMemo for expensive calculations
3. **Too many API calls** - Batch requests, use React Query caching

Performance Checklist:
- [ ] React DevTools Profiler shows <16ms renders
- [ ] No unnecessary re-renders
- [ ] API calls are batched/cached
- [ ] Large lists use virtualization

#### "I don't understand the three resolution paths"
Quick Reference:
- **Black Market**: Accumulate wealth through memory trading
- **Detective**: Pursue truth and justice through evidence
- **Third Path**: Community-focused memory recovery

For Complete Understanding: See [active_synthesis_streamlined.md](./docs/archive/design/game design background/active_synthesis_streamlined.md) Section III.B

Path Assignment Logic - Characters align based on:
- Element ownership (e.g., Black Market card)
- Actions taken (investigating = Detective)
- Community connections (high connections = Third Path)

#### "What's the memory economy?"
**Memory Token System**:
- Physical RFID tokens worth $100-$10,000
- Type multipliers: Personal ×1, Business ×3, Technical ×5
- Only 3 scanners for 5-20 players (creates scarcity)

Complete Details: See [active_synthesis_streamlined.md](./docs/archive/design/game design background/active_synthesis_streamlined.md) Section III

For Implementation:
- Values embedded in Element descriptions as `SF_ValueRating: [1-5]`
- Must extract during sync and calculate totals

#### "Narrative threads computation fails with 'no such column'"
**UPDATE (2025-06-10)**: This has been FIXED!
The migration system has been enhanced with verification and auto-fix capabilities.

If you still see this error:
```bash
# The migration should auto-apply, but if needed:
cd storyforge/backend
sqlite3 data/production.db < src/db/migration-scripts/20250106000000_add_computed_fields.sql
```

#### Recovery Strategies
When completely lost:
1. Git stash your changes
2. Go back to last working commit
3. Re-read the milestone in this playbook
4. Start with smallest possible implementation
5. Build incrementally

### Red Flags You're Off Track
1. Building features not in current milestone
2. Modifying core StoryForge functionality
3. Creating new database schemas not in PRD
4. Implementing complex UI before basic works
5. Working on optimization before functionality

**Remember**: Make it work → Make it right → Make it fast

---

## 📊 Technical Debt Repayment History

### Completed Technical Debt Tasks

**Completed**: June 6, 2025

Removed 7 deprecated functions from legacy timeline/gap model:
- `getEventsForCharacter`, `getPuzzlesForCharacter`, `getElementsForCharacter`
- `getCachedJourney`, `saveCachedJourney`, `isValidJourneyCache`
- `updateGapResolution`

**Impact**: Eliminated risk of using obsolete code, improved clarity

**Completed**: June 6, 2025

Dropped 4 obsolete tables via migration:
- `journey_segments`, `gaps`
- `cached_journey_segments`, `cached_journey_gaps`

**Impact**: Cleaner database schema aligned with graph model

**Completed**: June 6, 2025

Removed obsolete methods from `journeyEngine.js`:
- `suggestGapSolutions`
- `getInteractionWindows`

**Impact**: Cleaner codebase, no confusing dead code

### Technical Debt Patterns Learned
1. **Documentation Drift**: Docs claimed features missing that were actually built
2. **Zombie Code**: Dead functions create confusion and maintenance burden
3. **Schema Evolution**: Old tables lingered after architecture changes
4. **Test Coverage**: Missing tests allowed bugs to reach production

---

## 🎮 Game Design Context

> **Summary**: Complete understanding of "About Last Night" - a 90-minute immersive murder mystery with memory token economy, three resolution paths, and themes critiquing surveillance capitalism. Essential for understanding why certain features exist, how the memory economy works, and the relationship between physical puzzles and digital tracking. Includes detailed character paths, puzzle mechanics, and production considerations.

### Complete Game Understanding
"About Last Night" is a 90-minute immersive murder mystery experience for 5-20 players that critiques surveillance capitalism through innovative gameplay mechanics.

#### Game Structure
- **Act 1 (45-60 minutes)**: Investigation phase
  - Players have amnesia, discover identity through belongings
  - Physical evidence gathering from party aftermath
  - Collaborative puzzle-solving to unlock containers
  - Dual investigation: "What happened to Marcus?" and "Who am I?"
  - Critical discovery: James's video reveals Marcus entering Room 2 at 4:36 AM

- **Act 2 (45-60 minutes)**: Memory economy phase
  - RFID-based memory token trading system
  - Access to Marcus's secret lab after viewing video
  - Three distinct resolution paths emerge
  - 3 handheld scanners create scarcity and negotiation
  - Time pressure drives trading dynamics

#### Core Game Architecture
**Three Resolution Paths**:
1. **Black Market (Wealth)**: Sell memories for profit, highest total wins
2. **Detective (Truth)**: Submit memories as evidence, build comprehensive case
3. **Third Path (Community)**: Return memories to POV owners, reject authorities

**Character System**:
- **Tier 1 (Core 5)**: Primary suspects, always assigned
- **Tier 2 (Secondary)**: Rich experiences, assigned at 6+ players  
- **Tier 3 (Tertiary)**: Lighter content, assigned at 13+ players
- **Balancing**: Lower-tier characters get MORE memory tokens to compensate

**Memory Token Economy**:
- Base Values: $100 / $500 / $1,000 / $5,000 / $10,000
- Type Multipliers: Personal ×1, Business ×3, Technical ×5
- Group Bonuses: Complete sets multiply total value
- **Target**: 50-55 total tokens (currently 13 documented)

#### Database Architecture (Designer Tools)
Four Notion databases structure the game design:
1. **Characters**: Maps complete player journeys from amnesia to understanding
2. **Elements**: All physical and digital items with relationships
3. **Puzzles**: Orchestrates social dynamics through dependencies
4. **Timeline**: 19-year hidden history (2006-2025) generating evidence

**Data Flow**: Timeline Event → Evidence Element → Puzzle Lock → Discovery → Memory Token → Understanding

#### Physical Space Design
- **Room 1**: Act 1 investigation hub
- **Room 2**: Marcus's secret lab (Act 2 revelation)
- **Detective Room**: Glass-windowed trap for Detective during Act 2
- **3 ESP32 scanners** with RFID create meaningful scarcity

#### Information Revelation Design
**Starting State**: Players have only:
- Basic identity (name, profession)
- 3-5 personal items
- No memories of relationships, events, or party

**Discovery Vectors**:
- Physical evidence and props
- Environmental storytelling  
- Memory tokens (audio/video)
- Other players' findings

**Hidden Timeline**: The 19-year history exists only for designers. Players learn events only through discovered evidence. Many events may never be found, creating a world larger than any single playthrough.

#### Critical Puzzle Chains
**UV Light Chain**: Sarah → UV Light → Alex (with Victoria's hint)
**One Pagers Chain**: Victoria → Documents → James
**Birthday Collection**: Ashe gathers info from 5 players

**Minimum Viable Flow**:
```
Victoria (solo) → James (needs Victoria) → 2nd Room Video
Sarah (solo) → UV Light → Alex (needs Sarah)  
Derek (hint from Sarah) → Black Market Card
All converge → Murder Wall → Memory Reader → Act 2
```

#### Design Philosophy
- **Emergence Over Prescription**: Third Path discovered through play
- **Physical-Digital Integration**: RFID tokens make abstract memories tangible
- **Thematic Reinforcement**: Every mechanic reflects surveillance capitalism
- **Intentional Flexibility**: Edge cases handled through human judgment
- **Trust Over Algorithm**: Human implementation over rigid prescription

### Implementation Guidelines for Tool Development

#### When Building Character Features
- Support all 3 tiers with appropriate content distribution
- Lower tiers should have MORE token allocation options
- Character relationships are critical for puzzle dependencies
- 5-20 player scalability must be maintained

#### When Building Puzzle Features  
- Support 3 complexity levels: Simple (1-2min), Complex (5-10min), Collaborative (10-15min)
- Puzzle chains create social dependencies
- Critical path must remain functional with minimal completion
- Tool should help designers identify puzzle bottlenecks

#### When Building Memory Economy Features
- Support value structure: $100-$10,000 with type multipliers
- Group completion bonuses are essential for balance
- Track 3 resolution paths with different victory conditions
- Physical turn-in simulation for testing

#### When Building Timeline Features
- 19-year history drives all evidence generation
- Timeline events should link to discoverable elements
- Support archaeological discovery patterns
- Many events intentionally never discovered

#### Performance Targets for Game Data
- **Characters**: 20+ with full relationship mapping
- **Elements**: 100+ physical and digital items
- **Puzzles**: 30+ with dependency chains
- **Timeline Events**: 75+ spanning 19 years
- **Memory Tokens**: 50-55 total (target completion)

### Common Game Design Questions

#### "How much content should players discover?"
- Timeline: ~30-50% typical discovery rate
- Puzzles: Minimum viable path must work, extras enhance
- Memory tokens: All should be discoverable but not required

#### "How do I balance the three paths?"
- Black Market: Highest monetary total (relative victory)
- Detective: Subjective case quality (30/25/25/20 rubric)
- Third Path: Return memories + reject authorities (trust-based)

#### "What creates optimal trading dynamics?"
- 3 scanners for 5-20 players creates scarcity
- Time pressure escalates negotiations
- Information asymmetry drives strategy
- Alliance tracking only for Black Market

#### "How should the tool help with accessibility?"
- Support alternative interaction methods
- Provide clear content warnings
- Enable facilitator customization
- Document accessibility considerations

For complete game design details, see archived game design background documents.

---

## 🎨 User Experience & Design System

### Core Design Philosophy
**"See the Journey, Shape the System"** - The tool provides dual-lens interface where users can fluidly move between character-specific and system-wide perspectives.

#### Mental Model
```
┌─────────────────────────────────────────────────────────────┐
│                    COMMAND BAR                              │
│  [Search anything...]  [Quick Create ▼]  [Sync] [Export]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  JOURNEY SPACE          │        SYSTEM SPACE              │
│  (Character Focus)      │        (Game Focus)              │
│                         │                                   │
│  ┌─────────────────┐   │   ┌─────────────────┐           │
│  │ Player Journeys │   │   │ Balance Dashboard│           │
│  │                 │   │   │                 │           │
│  │ ┌─ Sarah ────┐ │   │   │ ┌─────────────┐ │           │
│  │ │ ┌─ Alex ──┐│ │   │   │ │ Black Market│ │           │
│  │ │ │ Marcus  ││ │←→ │ ←→│ │ Detective   │ │           │
│  │ │ └─────────┘│ │   │   │ │ Third Path  │ │           │
│  │ └─────────────┘ │   │   │ └─────────────┘ │           │
│  └─────────────────┘   │   └─────────────────┘           │
│                         │                                   │
│  ┌─────────────────┐   │   ┌─────────────────┐           │
│  │ Interactions    │   │   │ Timeline Map   │           │
│  └─────────────────┘   │   └─────────────────┘           │
│                         │                                   │
├─────────────────────────┴───────────────────────────────────┤
│                    CONTEXT WORKSPACE                        │
│  Active Task: "Add content for Derek minutes 20-30"        │
│  [Relevant Info] [Smart Suggestions] [Impact Preview]      │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Principles

#### 1. Persistent Context
- Selected character/element stays active across views
- Breadcrumb trail: Game > Act 1 > Sarah > Minute 15-20
- Related information follows you

#### 2. Fluid Transitions
- Click any element to zoom into its context
- Smooth animations show relationships
- Esc key always zooms out one level

#### 3. Smart Workspace
- Bottom panel adapts to current task
- Relevant tools appear automatically
- Recent actions easily accessible

### Visual Design System

#### Color Coding Standards
- **Journey Space**: Character-based colors (Sarah = Blue, Alex = Green, etc.)
- **System Space**: Path-based colors (Black Market = Gold, Detective = Red, Third Path = Purple)
- **Gaps/Issues**: Red highlights with severity gradients
- **Interactions**: Connecting lines in participant colors

#### Information Density Modes
- **Overview Mode**: High-level patterns visible
- **Standard Mode**: Balanced detail/overview
- **Detail Mode**: All information accessible

#### Interaction Patterns
**Progressive Disclosure**:
1. Hover: Quick preview
2. Click: Expand in place
3. Double-click: Open in workspace
4. Right-click: Context menu

**Drag and Drop**:
- Reorder timeline events
- Connect elements to characters
- Move tokens between paths

### Responsive Design Guidelines

#### Screen Adaptations
- **Wide (1920px+)**: Full three-panel layout
- **Standard (1280px)**: Tabbed Journey/System spaces
- **Narrow (<1280px)**: Stacked layout with navigation

### Core User Flows

#### Flow 1: Morning Production Session
```
1. Open tool → Dashboard shows overnight Notion changes
2. See "3 new gaps identified" → Click to view
3. First gap: "Derek has dead zone 20-30 min"
4. Click gap → Journey view opens with Derek selected
5. Context panel shows: Similar character activities at this time
6. Select "Create collaborative puzzle"
7. Puzzle designer opens with smart defaults
8. Preview shows: "This will affect Alex and Victoria too"
9. Confirm → All three journeys update
10. Return to gap list → Next priority
```

#### Flow 2: Balance Check
```
1. "Is Black Market too dominant?" question
2. Navigate to System Space → Balance Dashboard
3. See visual comparison of three paths
4. Black Market shows 40% higher value
5. Click "Show contributing factors"
6. System highlights: Tier 1 has too many high-value tokens
7. Click "Suggest rebalancing"
8. Get options: Reduce values, add Detective evidence, etc.
9. Select "Add Detective evidence tokens"
10. Token workshop opens with Detective-friendly defaults
```

### Key UI Components

#### Journey Space (Left Side)
**Player Journey Graph**: Primary view for understanding causal chain of character experiences
- Evolved from linear timeline to dependency graph
- Two interwoven layers: Gameplay Graph + Lore Graph
- Context edges link discoveries to historical events
- Color-coded nodes by type: Activity, Discovery, Lore

**Interaction Matrix**: Heat map showing character interaction density
- Time-based filtering (Act 1/Act 2)
- Click intersection for bi-directional journey view
- Warning icons for unbalanced interactions

#### System Space (Right Side)
**Balance Dashboard**: Monitor three-path equilibrium
```
┌─ Three Paths Balance ─────────────────────────────────────┐
│                                                           │
│  BLACK MARKET      DETECTIVE        THIRD PATH           │
│  ████████ $97K    ██████ 47 pcs    ████ 23 acts        │
│                                                           │
│  [Detailed View]  [Run Simulation]  [Get Suggestions]    │
└───────────────────────────────────────────────────────────┘
```

**Timeline Archaeology**: See how hidden history surfaces
- Vertical timeline with depth layers
- Filter by: Discovered/Undiscovered/Critical
- Coverage report shows discovery percentage

**Discovery Flow Map**: Track information revelation patterns
```
        0 min   15 min   30 min   45 min   60 min   75 min
Sarah:  Name → CEO → Threat → Anger → Choice → Values
Alex:   Name → CTO → Competition → Secret → Choice → Ethics  
Marcus: Name → Dead → Timeline → Motive → (memories only)
```

#### Context Workspace (Bottom Panel)
**Smart Creation Tools**: Adaptive interface based on creation context

**Memory Token Workshop**:
```
┌─ Memory Token Workshop ────────────────────────────────────┐
│ Context: Filling Derek's gap at minute 20-30              │
│                                                           │
│ [Basic Info]  [Connections]  [Impact]  [Preview]         │
│                                                           │
│ POV: Derek ▼  Event: 2022 Warehouse Discovery ▼          │
│ Type: ● Personal ○ Business ○ Technical                  │
│ Value: ○ $100 ○ $500 ● $1000 ○ $5000 ○ $10000         │
│                                                           │
│ [Generate Description] [Create Token] [Create Another]    │
└───────────────────────────────────────────────────────────┘
```

**Puzzle Architect**:
```
┌─ Puzzle Architect ─────────────────────────────────────────┐
│ Context: Collaborative puzzle for minute 20-30            │
│                                                           │
│ Type: [Physical|Mental|Hybrid] Difficulty: [●●●○○]       │
│ Players Required: 2-3  Estimated Time: 5-10 min          │
│                                                           │
│ Dependencies:                   Unlocks:                  │
│ - UV Light (Sarah)             - Hidden message          │
│ - Code knowledge (Alex)        - Next clue location      │
│                                                           │
│ [Preview Integration] [Create Puzzle]                     │
└───────────────────────────────────────────────────────────┘
```

#### Command Bar (Top)
**Universal Search**:
- Search any character, element, puzzle, memory, timeline event
- Natural language: "Show me all UV light dependencies"
- Recent searches saved

**Quick Create Menu**:
- Context-aware options based on current view
- Keyboard shortcuts for power users
- Templates for common patterns

**Sync Status**:
- Real-time Notion connection indicator
- Queue for pending changes
- Conflict resolution for simultaneous edits

### Implementation Guidelines

#### When Building UI Components
- Follow dual-lens mental model (Journey + System)
- Support all three information density modes
- Implement progressive disclosure pattern
- Use consistent color coding system

#### When Building Interactions
- Maintain persistent context across views
- Implement fluid transitions with animations
- Support drag-and-drop for relationship building
- Provide hover previews before actions

#### When Building Responsive Features
- Design mobile-first for narrow screens
- Use tabbed interface for medium screens
- Full three-panel layout for wide screens
- Maintain functionality across all breakpoints

#### Accessibility Requirements
- Support keyboard navigation throughout
- Provide ARIA labels for screen readers
- Maintain color contrast ratios
- Enable alternative interaction methods

---

## 🏗️ Production Planning Context

### Tool Purpose Clarification
This tool is designed for **game content creation and balance analysis**, NOT for running live game productions. It serves designers, writers, and production planners during the development phase.

#### What the Tool Does
- **Content Design**: Create and balance game elements (characters, puzzles, memory tokens)
- **Journey Planning**: Map player paths and interactions
- **Balance Analysis**: Monitor three-path equilibrium
- **Production Preparation**: Generate specifications and requirements

#### What the Tool Does NOT Do
- **Live Game Management**: Not for real-time production control
- **RFID Hardware**: Does not interface with physical scanners
- **Player Tracking**: Does not monitor actual players during games
- **Real-Time Decisions**: Not for live facilitation support

### Production Planning Features

#### Physical Space Planning Support
The tool provides digital planning for physical implementation:

**Room Layout Context**:
- **Room 1**: Act 1 investigation hub
- **Room 2**: Marcus's secret lab (revealed in Act 2)
- **Detective Room**: Glass-windowed space for Detective during Act 2
- **Support Areas**: Facilitator staging and equipment storage

**Hardware Planning**:
- **3 ESP32 scanners** with RFID readers
- **50-55 memory tokens** with RFID tags
- **Physical props** and environmental storytelling elements
- **Safety considerations** for multi-room setup

#### Production Documentation Generation
The tool should help generate:

**Setup Documentation**:
- Token inventory checklists
- Room setup diagrams
- Props placement guides
- Equipment requirements lists

**Facilitator Materials**:
- Character briefing sheets
- Puzzle solution guides
- Memory token value references
- Emergency procedures

**Training Resources**:
- Black Market operation procedures
- Detective evaluation rubrics
- Third Path recognition guidelines
- Edge case handling protocols

#### Missing Production Features (Enhancement Opportunities)
Current gaps that could enhance production planning:

1. **Physical Layout Designer**: Visual room arrangement tool
2. **Device Allocation Simulator**: Plan scanner placement and queuing
3. **Setup Timeline Planner**: Sequence setup and teardown tasks
4. **Safety Checklist Generator**: Multi-room safety protocols
5. **Facilitator Script Builder**: Step-by-step operation guides
6. **Hardware Requirements Calculator**: Equipment needs by group size
7. **Accessibility Adaptation Planner**: Alternative interaction methods

### Implementation Guidelines

#### When Building Production Features
- Focus on planning and specification generation
- Support export to production-friendly formats
- Provide clear separation between design and execution
- Enable customization for different venue constraints

#### Production Planning Data Model
The tool tracks production-relevant information:

**Venue Requirements**:
- Room count and configuration
- Equipment placement needs
- Safety considerations
- Accessibility requirements

**Resource Planning**:
- Token distribution by character tier
- Scanner placement optimization
- Facilitator role assignments
- Time allocation for phases

**Documentation Export**:
- Setup checklists and procedures
- Character briefing materials
- Puzzle reference guides
- Safety and emergency protocols

### Common Production Questions

#### "How do I plan physical token distribution?"
- Use Memory Economy tools to balance token allocation
- Export token lists with values and character assignments
- Plan distribution based on character tier balance

#### "What hardware do I need for X players?"
- 3 scanners optimal for 5-20 players (creates scarcity)
- One facilitator minimum, two preferred
- Room capacity determines maximum players
- RFID equipment scales with token count

#### "How do I train facilitators?"
- Export character interaction maps
- Generate puzzle solution references
- Create path evaluation rubrics
- Document edge case handling procedures

#### "What about accessibility accommodations?"
- Alternative token interaction methods
- Visual/auditory puzzle adaptations
- Physical space modifications
- Communication alternatives

For complete production requirements, coordinate with physical venue and equipment teams.

---

## 🚀 Documentation Automation System

### Overview
This project features a **fully automated documentation system** that eliminates manual documentation updates and ensures consistency across all files.

### Core Infrastructure
- **TaskStatusManager**: Central hub for all documentation automation
- **Template Markers**: Automatic update points in documentation files
- **NPM Scripts**: Simple commands for documentation management
- **Verification Integration**: Documentation consistency checks in `npm run verify:all`

### Available Commands
```bash
# Daily workflow
npm run docs:status-report        # Check current status
# Task completion commands updated for Architecture Remediation

# Verification 
npm run docs:verify-sync          # Check documentation consistency
npm run docs:test                 # Test automation system
npm run verify:all               # Full verification (includes docs)

# One-time setup
npm run docs:init                 # Initialize automation (already done)
```

### Streamlined Workflow
**Old Workflow** (Manual, Error-Prone):
1. Complete implementation work
2. Manually update multiple documentation files
3. Hope everything stays consistent

**New Workflow** (Automated, Reliable):
1. Complete implementation work
2. Run: `npm run docs:task-complete <task-id>`
3. **Everything updates automatically!**

### Benefits
- ✅ **Zero manual documentation updates required**
- ✅ **Consistent status across all files**
- ✅ **Real-time progress tracking**
- ✅ **Automatic verification integration**
- ✅ **Developer-friendly workflow**

### Technical Details
**Template Markers**:
```markdown
<!-- AUTO:CURRENT_TASK -->Architecture Remediation Phase 1 – Stabilization<!-- /AUTO:CURRENT_TASK -->
<!-- AUTO:PROGRESS -->10/11<!-- /AUTO:PROGRESS -->
<!-- AUTO:LAST_COMPLETED -->Documentation Cleanup (January 2025)<!-- /AUTO:LAST_COMPLETED -->
```

**Integration Points**:
- **TodoWrite**: Task progress tracking
- **Verification System**: Consistency checks
- **NPM Scripts**: Simple command interface
- **CLAUDE.md**: Streamlined workflow guide

**Result**: Future developers can focus entirely on implementation while documentation stays perfectly synchronized and up-to-date automatically.

---

## 📊 Documentation Authority System

### Overview
When documentation conflicts arise or questions about authority emerge, consult the [AUTHORITY_MATRIX.md](./AUTHORITY_MATRIX.md) for definitive guidance. This system prevents the confusion that previously plagued the project.

### Quick Reference: 6-Tier Hierarchy
1. **Code & Database** (Ultimate truth - what the system actually does)
2. **PRD & Notion** (Strategic direction - what we're building toward)  
3. **README & PLAYBOOK** (Operational guides - current work)
4. **Migrations & Tests** (Technical specs - how it's built)
5. **Archives & History** (Context - why decisions were made)
6. **CLAUDE & Guides** (Onboarding - how to get started)

### Training Resources
For comprehensive understanding of our documentation system:
- **[Developer Quick Start Guide](./docs/DEVELOPER_QUICK_START.md)** - Quick onboarding and common scenarios
- **[Claude Code Guide](./docs/CLAUDE_CODE_GUIDE.md)** - Claude Code best practices
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions

### Key Principle
**"When documentation and implementation disagree, implementation is correct. Update the docs, not the code."**

### Common Authority Questions

**Q: "The schema guide says one thing but the database shows another"**
- A: Database (Tier 1) wins. Update the schema guide.

**Q: "Documentation seems inconsistent with actual capabilities"**  
- A: Code (Tier 1) wins. Update documentation to match reality.

**Q: "PRD requires X but implementation does Y"**
- A: Implementation (Tier 1) reflects reality. Document the gap.

**Q: "Which document should I update when I change code?"**
- A: Check [AUTHORITY_MATRIX.md](./AUTHORITY_MATRIX.md) → Update Triggers section

---

This playbook is the single source of truth. If it's not here, ask before implementing.
