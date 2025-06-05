# Product Requirements Document
## About Last Night - Production Intelligence Tool
### Evolution from StoryForge Foundation

**Version**: 1.0  
**Date**: June 5, 2025  
**Status**: ACTIVE DEVELOPMENT DOCUMENT  
**Purpose**: Transform the existing StoryForge tool into a comprehensive Production Intelligence Tool that enables efficient game design and production management for "About Last Night"

---

## Development Progress Tracker

### Current Phase: Phase 1 Delivery - Journey Infrastructure
### Last Updated: 2024-07-27
### Phase Completion Status:
- [X] Phase 1: Foundation - Journey Infrastructure (Core Backend Logic, API Endpoints including Gap Resolution, Journey Engine with Caching, SQLite DB with Migrations, and Frontend State Foundation all complete)
- [ ] Phase 2: Core Views - Journey & System Lenses (Player Journey Timeline basics implemented, Gap Resolution workflow initiated)
- [ ] Phase 3: System Intelligence
- [ ] Phase 4: Content Creation Tools
- [ ] Phase 5: Advanced Features & Polish
- [ ] Phase 6: Write Operations & Version Control

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Game Context: About Last Night](#2-game-context-about-last-night)
3. [Current State: StoryForge](#3-current-state-storyforge)
4. [Notion Database Structure](#4-notion-database-structure)
5. [Target Architecture](#5-target-architecture)
6. [User Experience Architecture](#6-user-experience-architecture)
7. [Integrated Feature Set](#7-integrated-feature-set)
8. [Design System](#8-design-system)
9. [Development Phases](#9-development-phases)
10. [Technical Implementation Details](#10-technical-implementation-details)
11. [Migration Strategy](#11-migration-strategy)
12. [Success Criteria](#12-success-criteria)
13. [Key Discoveries & Insights](#13-key-discoveries--insights)
14. [Appendix: Current Codebase Structure](#14-appendix-current-codebase-structure)

---

## 1. Executive Summary

This document defines the requirements for evolving StoryForge—an existing Notion-integrated visualization tool—into a Production Intelligence Tool that addresses the core challenge of managing complex, interconnected game design elements while maintaining focus on individual player experiences.

### Core Vision
**"See the Journey, Shape the System"**

The tool must operate at two synchronized levels:
1. **Journey Level**: Track and optimize what each player experiences minute-by-minute
2. **System Level**: Understand and balance how all elements interconnect

### Key Innovation
The bidirectional workflow where users can:
- Start with a character journey → Identify gaps → Create content → See system impact
- OR Start with system imbalance → Find affected journeys → Make targeted fixes

### Design Philosophy
**"See the Journey, Shape the System"**

The tool provides two synchronized lenses:
1. **Journey Lens**: What each player experiences moment-by-moment
2. **System Lens**: How all elements interconnect to create emergence

---

## 2. Game Context: About Last Night

### Overview
"About Last Night" is a 90-minute immersive murder mystery experience for 5-20 players that critiques surveillance capitalism through innovative gameplay mechanics.

### Core Structure
- **Act 1 (60 minutes)**: Murder mystery investigation, evidence gathering
- **Act 2 (30 minutes)**: Memory trading phase with RFID-enabled tokens
- **Three Resolution Paths**: 
  - Black Market (accumulate wealth through memory trading)
  - Detective (pursue truth and justice)
  - Third Path (community-focused recovery)

### Character System
- **19 Total Characters** (5 Core, 9 Secondary, 5 Tertiary)
- **Three-Tier Design**: Ensures scalability from 5-20 players
- Each character has a complete 90-minute journey with activities, discoveries, and interactions

### Critical Game Elements
- **50-55 Memory Tokens**: Physical RFID objects representing tradeable memories
- **Puzzles**: Gate progress and reveal information
- **Elements**: Physical props, documents, and digital content
- **Timeline Events**: 19-year backstory that surfaces through gameplay

---

## 3. Current State: StoryForge

### What Exists
StoryForge is a React-based tool with Node.js backend that:

#### Backend (Node.js/Express)
- Connects to Notion API with proper authentication
- Maps Notion data to frontend-consumable format
- Provides RESTful endpoints for all four databases
- Includes caching layer using `node-cache`
- Generates graph data for relationship visualization

#### Frontend (React/Vite)
- **Technology Stack**:
  - React 18.2 with React Router
  - Zustand for state management
  - React Query for data fetching
  - Material UI with dark theme
  - @xyflow/react for graph visualizations
  
- **Current Views**:
  - Dashboard with statistics and attention items
  - List views for Characters, Elements, Puzzles, Timeline
  - Detail pages for each entity type
  - Relationship Mapper for visualizing connections
  - Memory Economy view (basic)
  - Puzzle Flow visualization
  - Narrative Thread Tracker

#### Key Strengths
- Working Notion integration
- Entity relationship visualization
- Domain knowledge encoded
- Modern tech stack aligned with target architecture

#### Critical Limitations
- No journey/timeline view for characters
- No gap detection or resolution workflow
- No local database for offline work
- Entity-centric rather than journey-centric design
- Limited production workflow support

---

## 4. Notion Database Structure

The tool reads from and writes to four Notion databases:

### Characters Database
**Database ID**: `18c2f33d583f8060a6abde32ff06bca2`
- Name (Title)
- Type (Player/NPC)
- Tier (Core/Secondary/Tertiary)
- Character Logline
- Events (Relation to Timeline)
- Character Puzzles (Relation to Puzzles)
- Owned Elements (Relation to Elements)
- Associated Elements (Relation to Elements)

### Timeline Database
**Database ID**: `1b52f33d583f80deae5ad20c120dd`
- Description (Title)
- Date
- Characters Involved (Relation to Characters)
- Memory/Evidence (Relation to Elements)
- Notes

### Puzzles Database
**Database ID**: `1b62f33d583f80cc87cfd7d6c4b0b265`
- Puzzle (Title)
- Owner (Relation to Characters)
- Locked Item (Relation to Elements)
- Puzzle Elements (Required items)
- Rewards (Output items)
- Timing (Act 1/Act 2)
- Parent/Sub-Puzzles (Self-relations)

### Elements Database
**Database ID**: `18c2f33d583f802091bcd84c7dd94306`
- Name (Title)
- Basic Type (Prop/Memory Token/Document/etc.)
- Description/Text (Contains structured data for memories)
- Container/Contents (Self-relations)
- Status (Ready/To Design/To Build/etc.)
- Various puzzle and character relations

### Memory-Specific Data Strategy
Memory tokens embed additional data in Description field:
- `SF_RFID: [value]`
- `SF_ValueRating: [1-5]`
- `SF_MemoryType: [Personal|Business|Technical]`

---

## 5. Target Architecture

### Three-Layer State Architecture

```typescript
interface AppState {
  // UI State (Zustand) - Ephemeral
  ui: {
    activeView: 'journey' | 'system'
    selectedCharacter: CharacterID
    timeRange: [number, number]
    filters: FilterState
  }
  
  // Working State (SQLite + React Query) - Persistent
  data: {
    journeys: Map<CharacterID, Journey>
    gaps: Map<CharacterID, Gap[]>
    interactions: InteractionMatrix
    balance: PathBalance
  }
  
  // Sync State (Queue System) - Reliable
  sync: {
    pendingChanges: Change[]
    conflicts: Conflict[]
    lastSync: Date
  }
}
```

### Local Database Schema (SQLite)

```sql
-- Journey-specific tables
CREATE TABLE journey_segments (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  activities TEXT, -- JSON array
  interactions TEXT, -- JSON array
  discoveries TEXT, -- JSON array
  gap_status TEXT,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE TABLE gaps (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  severity TEXT,
  suggested_solutions TEXT, -- JSON
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Cached Notion data
CREATE TABLE characters (/* mapped from Notion */);
CREATE TABLE elements (/* mapped from Notion */);
CREATE TABLE puzzles (/* mapped from Notion */);
CREATE TABLE timeline_events (/* mapped from Notion */);

-- Computed/derived data
CREATE TABLE interactions (
  id TEXT PRIMARY KEY,
  character_a_id TEXT,
  character_b_id TEXT,
  minute INTEGER,
  type TEXT,
  element_id TEXT
);

CREATE TABLE path_metrics (
  timestamp INTEGER,
  black_market_value INTEGER,
  detective_progress INTEGER,
  third_path_engagement INTEGER
);
```

### Architectural Overview
```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│   React UI      │────▶│  Local Database  │────▶│   Notion API   │
│                 │◀────│    (SQLite)      │◀────│                │
└─────────────────┘     └──────────────────┘     └────────────────┘
         │                       │                         │
         ▼                       ▼                         ▼
   [Optimistic UI]      [Complex Queries]         [Rate Limited]
   [Instant Updates]    [Offline Work]            [Batch Updates]
```

---

## 6. User Experience Architecture

### 6.1 Mental Model
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

### 6.2 Navigation Principles

**1. Persistent Context**
- Selected character/element stays active across views
- Breadcrumb trail: Game > Act 1 > Sarah > Minute 15-20
- Related information follows you

**2. Fluid Transitions**
- Click any element to zoom into its context
- Smooth animations show relationships
- Esc key always zooms out one level

**3. Smart Workspace**
- Bottom panel adapts to current task
- Relevant tools appear automatically
- Recent actions easily accessible

### 6.3 Core User Flows

**Flow 1: Morning Production Session**
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

**Flow 2: Balance Check**
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

---

## 7. Integrated Feature Set

### 7.1 Journey Space (Left Side)

#### Player Journey Timeline™
**Purpose**: Primary view for understanding character experiences

**Enhanced Design**:
```
┌─ Journey Toolbar ──────────────────────────────────────────┐
│ Character: [Sarah ▼] View: [Timeline|Graph|Checklist]      │
│ Filters: [✓Activities ✓Interactions ✓Discoveries ✓Gaps]   │
└────────────────────────────────────────────────────────────┘

Sarah Chang - Tier 1 - Startup CEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Act 1]                    [Act 2]
0    15    30    45    60    75    90 min

▼ 0-5: AWAKENING
  ◆ Find: Wallet, phone (locked), keys
  ↳ "I'm Sarah, a CEO"
  ⚡ Depends on: Starting props placement

▼ 10-15: IDENTITY CRISIS
  ◆ Discover threatening note from Marcus
  ◆ Try phone - need birthday (234####)
  ⚡ Ask others for birthday info
  ! Potential bottleneck if isolated

[Hovering shows connections to other journeys]
[Clicking opens detailed view/editor]
[Gaps highlighted in red with quick-fix options]
```

**Key Innovation**: Timeline can switch between multiple views:
- **Timeline View**: Chronological activities
- **Graph View**: Network of discoveries and dependencies
- **Checklist View**: Production status for this character

#### Interaction Matrix™
**Purpose**: Ensure character interactions align

**Enhanced Design**: 
- Heat map showing interaction density
- Time-based filtering (show only Act 1)
- Click intersection for bi-directional journey view
- Warning icons for unbalanced interactions

### 7.2 System Space (Right Side)

#### Balance Dashboard™
**Purpose**: Monitor three-path equilibrium

**Visual Design**:
```
┌─ Three Paths Balance ─────────────────────────────────────┐
│                                                           │
│  BLACK MARKET      DETECTIVE        THIRD PATH           │
│  ████████ $97K    ██████ 47 pcs    ████ 23 acts        │
│                                                           │
│  [Detailed View]  [Run Simulation]  [Get Suggestions]    │
└───────────────────────────────────────────────────────────┘

! Warning: Tier 3 characters have 40% less earning potential
```

#### Timeline Archaeology™
**Purpose**: See how hidden history surfaces

**Enhanced Design**:
- Vertical timeline with depth layers
- Filter by: Discovered/Undiscovered/Critical
- Click event to see all gameplay manifestations
- "Coverage report" shows what players typically find

#### Discovery Flow Map™
**Purpose**: Track information revelation patterns

**New Insight**: This view can show ALL characters simultaneously:
```
        0 min   15 min   30 min   45 min   60 min   75 min
Sarah:  Name → CEO → Threat → Anger → Choice → Values
Alex:   Name → CTO → Competition → Secret → Choice → Ethics  
Marcus: Name → Dead → Timeline → Motive → (memories only)
[All 18 characters shown in parallel]
```

### 7.3 Context Workspace (Bottom Panel)

#### Smart Creation Tools
**Adaptive Interface**: Changes based on what you're creating

**Creating a Memory Token**:
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

**Creating a Puzzle**:
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

### 7.4 Command Bar (Top)

#### Universal Search
- Search any character, element, puzzle, memory, timeline event
- Natural language: "Show me all UV light dependencies"
- Recent searches saved

#### Quick Create Menu
- Context-aware options based on current view
- Keyboard shortcuts for power users
- Templates for common patterns

#### Sync Status
- Real-time Notion connection indicator
- Queue for pending changes
- Conflict resolution for simultaneous edits

---

## 8. Design System

### 8.1 Visual Language

**Color Coding**:
- **Journey Space**: Character-based colors (Sarah = Blue, Alex = Green, etc.)
- **System Space**: Path-based colors (Black Market = Gold, Detective = Red, Third Path = Purple)
- **Gaps/Issues**: Red highlights with severity gradients
- **Interactions**: Connecting lines in participant colors

**Information Density**:
- **Overview Mode**: High-level patterns visible
- **Standard Mode**: Balanced detail/overview
- **Detail Mode**: All information accessible

### 8.2 Interaction Patterns

**Progressive Disclosure**:
1. Hover: Quick preview
2. Click: Expand in place
3. Double-click: Open in workspace
4. Right-click: Context menu

**Drag and Drop**:
- Reorder timeline events
- Connect elements to characters
- Move tokens between paths

### 8.3 Responsive Design

**Screen Adaptations**:
- **Wide (1920px+)**: Full three-panel layout
- **Standard (1280px)**: Tabbed Journey/System spaces
- **Narrow (<1280px)**: Stacked layout with navigation

---

## 9. Development Phases

### Phase 1: Foundation - Journey Infrastructure

**Objective**: Establish the journey-centric data layer and basic timeline visualization

#### Technical Tasks

1. **SQLite Integration**
   - Add `better-sqlite3` to backend dependencies
   - Create database initialization service
   - Design and implement schema for journeys, gaps, and computed data
   - Build migration system for schema updates

2. **Journey Engine Development**
   ```javascript
   // New service: backend/src/services/journeyEngine.js
   class JourneyEngine {
     buildCharacterJourney(characterId) // Includes caching
     computeJourneySegments(character, events, puzzles, elements)
     detectGaps(segments)
     suggestGapSolutions(gap, allElements, allPuzzles)
     getInteractionWindows(characterA, characterB)
   }
   ```

3. **Enhanced Backend API**
   - `/api/journeys/:characterId` - Get complete journey with gaps
   - `/api/journeys/:characterId/gaps` - Get just gaps
   - `/api/gaps/all` - All gaps across all characters
   - `/api/gaps/:gapId/resolve` - POST to update gap status (pending)
   - `/api/sync/status` - Sync queue status
   - Modify existing endpoints to include journey context

4. **State Architecture Setup**
   - Extend Zustand stores for journey state
   - Implement sync queue with conflict detection
   - Create optimistic update system
   - Add offline detection and handling

#### Key Deliverables
- [X] Working local database with journey data (schema created, all initial tables present, robust migration system in place and utilized for schema updates)
- [X] Journey Engine Development (core computation, gap detection, and journey caching in database implemented)
- [X] Enhanced Backend API (includes GET routes for journeys and gaps, and POST route for gap resolution; all related controller and database query logic implemented and tested)
- [X] State Architecture Setup (Frontend state store `journeyStore.js` capable of fetching and managing journey/gap data from backend)
- [ ] Sync system foundation (mock API endpoint for status exists - *No change here, as this was not part of P1.M3.2*)

### Phase 2: Core Views - Journey & System Lenses

**Objective**: Build the dual-lens interface with Player Journey Timeline as the centerpiece

#### Technical Tasks

1. **Player Journey Timeline Component**
   ```jsx
   // New component: frontend/src/components/PlayerJourney/TimelineView.jsx
   - 90-minute timeline with 5-minute segments
   - Visual gap indicators
   - Activity/interaction/discovery icons
   - Zoom and pan controls
   - Time-based filtering
   ```

2. **Layout Restructuring**
   - Create new dual-pane layout component
   - Journey Space (left) - character-focused views
   - System Space (right) - game-wide analytics
   - Context Workspace (bottom) - adaptive to current task
   - Persistent command bar (top)

3. **Journey-System Synchronization**
   - Shared time selection across views
   - Highlight related items in both spaces
   - Breadcrumb navigation system
   - Cross-view data flow

4. **Gap Resolution Workflow**
   - Click gap → context panel shows details
   - Smart suggestions based on:
     - Time slot availability
     - Nearby character activities
     - Unused elements/puzzles
     - Theme consistency
   - Preview impact before creating

#### Key Deliverables
- [PARTIAL] Functional Player Journey Timeline (renders activities, interactions, discoveries, and gaps; basic time-filtering implemented; zoom/pan pending)
- [ ] Dual-lens layout implemented
- [PARTIAL] Basic gap resolution workflow (gap selection and mock suggestions implemented in store; UI context panel and backend integration pending)
- [ ] Views are synchronized

### Phase 3: System Intelligence

**Objective**: Add system-wide analytics and balance monitoring

#### Technical Tasks

1. **Balance Dashboard**
   - Refactor existing dashboard to focus on three paths
   - Real-time value calculations:
     - Black Market: Total monetary value
     - Detective: Evidence pieces collected
     - Third Path: Community actions
   - Visual comparison and trending
   - Imbalance detection algorithms

2. **Interaction Matrix**
   - Heat map visualization of character interactions
   - Time-based filtering
   - Identify isolation issues
   - Suggest interaction opportunities

3. **Timeline Archaeology View**
   - Visualize how past events surface in gameplay
   - Coverage analysis (what % typically discovered)
   - Identify underutilized timeline events
   - Connect events to memory tokens

4. **Smart Suggestion Engine**
   ```javascript
   // Enhance backend with intelligence
   class SuggestionEngine {
     suggestContentForGap(gap, context)
     analyzePathBalance(currentState)
     recommendRebalancing(imbalance)
     findInteractionOpportunities(timeSlot)
   }
   ```

#### Key Deliverables
- [ ] Balance monitoring functional
- [ ] Interaction patterns visible
- [ ] System-wide intelligence operational
- [ ] Suggestion engine providing value

### Phase 4: Content Creation Tools

**Objective**: Enable rapid content creation within context

#### Technical Tasks

1. **Memory Token Workshop**
   - Integrate with existing Elements creation
   - Pre-populate based on gap context
   - Include RFID assignment
   - Value/type selection with impact preview
   - Auto-link to relevant timeline events

2. **Puzzle Architect**
   - Visual puzzle builder
   - Drag-drop for requirements/rewards
   - Dependency validation
   - Time estimate calculator
   - Integration preview

3. **Smart Auto-Linking**
   - Detect entity mentions in descriptions
   - Suggest relationship creation
   - Bulk relationship management
   - Validation for circular dependencies

4. **Impact Preview System**
   - Show how new content affects:
     - Character journeys
     - Path balance
     - Interaction density
     - Gap resolution
   - Before/after visualization

#### Key Deliverables
- [ ] Context-aware creation tools
- [ ] Auto-linking system
- [ ] Impact preview functional
- [ ] Creation 5x faster than Notion

### Phase 5: Advanced Features & Polish

**Objective**: Add power features and refine user experience

#### Technical Tasks

1. **Bulk Operations**
   - Multi-select in journey timeline
   - Batch gap resolution
   - Mass status updates
   - Bulk relationship creation

2. **Advanced Filtering & Search**
   - Natural language search
   - Complex filter combinations
   - Save filter presets
   - Quick filter buttons

3. **Data Import/Export**
   - Enhanced Notion sync strategies
   - Export journey reports
   - Import content templates
   - Backup/restore functionality

4. **Performance Optimization**
   - Virtual scrolling for timeline
   - Progressive data loading
   - Optimistic UI everywhere
   - Background sync improvements

5. **Polish & Refinement**
   - Keyboard shortcuts throughout
   - Refined animations
   - Enhanced tooltips
   - Onboarding flow
   - Error recovery

#### Key Deliverables
- [ ] Power user features complete
- [ ] Performance optimized
- [ ] Polished user experience
- [ ] Production ready

### Phase 6: Write Operations & Version Control

**Objective**: Enable full CRUD operations on Notion data with safety

#### Technical Tasks

1. **Notion Write Integration**
   - Implement create/update/delete for all entities
   - Handle Notion API limitations
   - Queue write operations
   - Conflict resolution UI

2. **Version Control System**
   - Change history tracking
   - Undo/redo support
   - Named checkpoints
   - Rollback capabilities

3. **Validation & Safety**
   - Pre-write validation rules
   - Referential integrity checks
   - Bulk operation warnings
   - "Dry run" mode

4. **Collaborative Features**
   - Change attribution
   - Activity feed
   - Conflict detection
   - Merge strategies

#### Key Deliverables
- [ ] Full CRUD operations
- [ ] Version history
- [ ] Safe write operations
- [ ] Basic collaboration support

---

## 10. Technical Implementation Details

### Frontend Modifications

#### Transform Existing Components

1. **RelationshipMapper Enhancement**
   - Add time-based filtering
   - Integrate with journey timeline
   - Show journey context on nodes
   - Highlight gaps in visualization

2. **Dashboard → Balance Dashboard**
   - Remove general stats
   - Focus on three-path metrics
   - Add simulation controls
   - Real-time recalculation

3. **List Views Enhancement**
   - Add journey progress indicators
   - Show gap counts
   - Enable bulk selection
   - Add quick actions

#### New Components Required

```
frontend/src/components/
├── PlayerJourney/
│   ├── TimelineView.jsx
│   ├── GapIndicator.jsx
│   ├── ActivityBlock.jsx
│   └── InteractionLine.jsx
├── SystemViews/
│   ├── BalanceDashboard.jsx
│   ├── InteractionMatrix.jsx
│   └── TimelineArchaeology.jsx
├── CreationTools/
│   ├── MemoryTokenWorkshop.jsx
│   ├── PuzzleArchitect.jsx
│   └── ImpactPreview.jsx
└── Layout/
    ├── DualLensLayout.jsx
    ├── CommandBar.jsx
    └── ContextWorkspace.jsx
```

### Backend Enhancements

#### New Services

```
backend/src/services/
├── journeyEngine.js       # Journey computation
├── gapDetection.js        # Gap analysis
├── suggestionEngine.js    # Smart suggestions
├── syncManager.js         # Notion sync orchestration
├── conflictResolver.js    # Sync conflict handling
└── sqlite/
    ├── database.js        # SQLite connection
    ├── migrations.js      # Schema management
    └── queries.js         # Prepared statements
```

#### Extended API Routes

```javascript
// backend/src/routes/api.js additions
router.get('/journeys/:characterId', journeyController.getJourney);
router.get('/gaps', gapController.getAllGaps);
router.post('/gaps/:gapId/resolve', gapController.resolveGap);
router.get('/balance', balanceController.getCurrentBalance);
router.post('/simulate', balanceController.simulateChange);
router.get('/suggestions/gap/:gapId', suggestionController.forGap);
```

### State Management Strategy

```javascript
// frontend/src/stores/journeyStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useJourneyStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    activeCharacterId: null,
    journeyData: new Map(),
    gaps: new Map(),
    selectedTimeRange: [0, 90],
    
    // Actions
    loadJourney: async (characterId) => {
      const data = await api.getJourney(characterId);
      set(state => ({
        journeyData: new Map(state.journeyData).set(characterId, data),
        gaps: new Map(state.gaps).set(characterId, data.gaps)
      }));
    },
    
    // Computed
    get activeJourney() {
      return get().journeyData.get(get().activeCharacterId);
    }
  }))
);
```

### Performance Optimization Strategy

#### Rendering Performance
```typescript
// Virtual scrolling for timeline views
const TimelineView = () => {
  // Only render visible time segments
  const visibleSegments = useVirtualScroll({
    totalItems: 90, // minutes
    itemHeight: 80, // pixels per minute
    containerHeight: windowHeight
  })
  
  // Canvas rendering for complex visualizations
  const InteractionMatrix = () => {
    // Use Canvas/WebGL for 18x18 matrix
    // DOM only for interactions
  }
}
```

#### Data Performance
- **Pagination**: Load journey segments in 15-minute chunks
- **Lazy Loading**: Fetch detailed info only on expansion
- **Memoization**: Cache expensive computations
- **Web Workers**: Background processing for gap detection

### Notion API Integration

#### Rate Limit Management
```typescript
class NotionSyncManager {
  private queue: PriorityQueue<NotionRequest>
  private rateLimiter: RateLimiter
  
  constructor() {
    this.rateLimiter = new RateLimiter({
      maxRequests: 3, // Notion's limit
      perMilliseconds: 1000,
      maxRetries: 3,
      backoffMultiplier: 2
    })
  }
  
  async sync() {
    // Batch similar operations
    const batches = this.queue.getBatches()
    
    for (const batch of batches) {
      await this.rateLimiter.execute(async () => {
        try {
          await this.sendBatch(batch)
          await this.updateLocalCache(batch)
        } catch (error) {
          await this.handleSyncError(error, batch)
        }
      })
    }
  }
}
```

#### Conflict Resolution
```typescript
interface ConflictResolver {
  // Detect conflicts during sync
  detectConflicts(local: Change, remote: Change): Conflict[]
  
  // Resolution strategies
  strategies: {
    // Last write wins (default)
    lastWriteWins: (conflict: Conflict) => Resolution
    
    // Merge changes (for compatible edits)
    mergeChanges: (conflict: Conflict) => Resolution
    
    // User chooses (for complex conflicts)
    userChoice: (conflict: Conflict) => Promise<Resolution>
  }
  
  // UI for conflict resolution
  showConflictUI(conflicts: Conflict[]): Promise<Resolution[]>
}
```

### Data Consistency Strategy

#### Referential Integrity
```typescript
class DataIntegrityManager {
  // Validate before any write
  validateChange(change: Change): ValidationResult {
    // Check all relationships remain valid
    // Ensure no orphaned elements
    // Verify timeline consistency
  }
  
  // Transaction support
  async transaction(operations: Operation[]) {
    const backup = await this.createSnapshot()
    try {
      for (const op of operations) {
        await this.apply(op)
      }
      await this.commit()
    } catch (error) {
      await this.rollback(backup)
      throw error
    }
  }
}
```

#### Bidirectional Sync
```typescript
// Careful order of operations
const syncFlow = {
  1: "Pull remote changes",
  2: "Detect conflicts",
  3: "Resolve conflicts",
  4: "Apply to local cache",
  5: "Update UI optimistically",
  6: "Push local changes",
  7: "Confirm remote acceptance",
  8: "Finalize local state"
}
```

### Error Handling & Recovery

#### Graceful Degradation
- **Offline Mode**: Full functionality with local database
- **Sync Failures**: Queue changes for later retry
- **Partial Data**: Show what's available with loading states
- **Corruption Recovery**: Automatic backup restoration

#### User Communication
```typescript
interface SyncStatus {
  state: 'synced' | 'syncing' | 'error' | 'offline'
  pendingChanges: number
  lastSuccessfulSync: Date
  nextRetry?: Date
  errorMessage?: string
}

// Visual indicators
<SyncIndicator status={syncStatus} />
// Green: Synced
// Yellow: Syncing/Pending
// Red: Error (with retry timer)
// Gray: Offline mode
```

### Security Considerations
- **API Key Storage**: Environment variables only
- **Local Encryption**: SQLite database encrypted at rest
- **Audit Trail**: All changes logged with timestamps
- **Access Control**: Read-only mode for shared viewing

---

## 11. Migration Strategy

### Preserve Working Features
1. Keep all existing API endpoints functional
2. Maintain current views during transition
3. Use feature flags for new functionality
4. Gradual rollout of new features

### Data Migration
1. Initial sync populates SQLite from Notion
2. Compute journeys and gaps on first run
3. Cache computations for performance
4. Incremental updates going forward

### Code Organization
```
storyforge/
├── backend/
│   ├── src/
│   │   ├── services/          # Add new services here
│   │   ├── controllers/       # Extend existing
│   │   └── db/               # New SQLite layer
└── frontend/
    ├── src/
    │   ├── components/       # New components
    │   ├── stores/          # New Zustand stores
    │   └── features/        # Feature-based organization

### Migration Path

#### Week 1-2: Parallel Development
- New features built alongside existing
- No disruption to current workflow
- Feature flags control visibility

#### Week 3-4: Integration
- Connect new views to existing data
- Test journey computation accuracy
- Validate gap detection algorithms

#### Week 5-6: Transition
- Gradually move users to new views
- Gather feedback and iterate
- Keep old views as fallback

#### Week 7-8: Optimization
- Remove deprecated code
- Optimize performance
- Polish user experience

---

## 12. Success Criteria

### Functionality
- [ ] Can view any character's 90-minute journey
- [ ] Gaps are automatically detected and highlighted
- [ ] Can create content directly from gap context
- [ ] Three paths are balanced within 20%
- [ ] All features work offline with sync queue

### Performance
- [ ] Journey loads in <2 seconds
- [ ] Gap detection runs in <500ms
- [ ] Smooth 60fps timeline scrolling
- [ ] Sync completes in background

### User Experience
- [ ] Gap to resolution in <2 minutes
- [ ] 5x faster than creating in Notion
- [ ] Intuitive without documentation
- [ ] No data loss or corruption

### Quality Metrics
- [ ] 95% test coverage for critical paths
- [ ] Zero critical bugs in production
- [ ] <5% error rate for sync operations
- [ ] 99.9% uptime for core features

---

## 13. Key Discoveries & Insights

### The Power of Parallel Views
Showing all 18 character journeys simultaneously reveals patterns invisible when viewing individually:
- Synchronized dead zones across multiple characters
- Natural interaction clusters
- Systemic content gaps

### Context is Everything
Every creation decision needs surrounding information:
- What gap am I filling?
- Who else does this affect?
- What themes does this reinforce?
- How does this impact balance?

### Bidirectional Workflow
Users need to fluidly move between:
- Character-specific → System-wide
- Problem identification → Solution creation
- Detail work → Impact assessment

### Time as the Universal Connector
Using time as the x-axis across views creates intuitive relationships:
- Character journeys align temporally
- Interactions show when they're possible
- Gaps become visually obvious

### Key Insight from Synthesis
The tool succeeds when it makes the **invisible visible** and the **complex manageable**. By maintaining dual focus on individual journeys and systemic patterns, it transforms overwhelming complexity into clear, actionable workflows. The unified time-based visualization creates an intuitive mental model where everything connects naturally.

The ultimate test: Can you see at a glance what any character experiences AND understand why?

---

## 14. Appendix: Current Codebase Structure

### Key Files to Modify

```
backend/
├── src/
│   ├── controllers/notionController.js    # Extend for journeys
│   ├── services/notionService.js          # Add write operations
│   ├── utils/notionPropertyMapper.js      # Enhanced mapping
│   └── index.js                           # Add SQLite init

frontend/
├── src/
│   ├── App.jsx                            # New routing structure
│   ├── components/RelationshipMapper/     # Enhance for journeys
│   ├── pages/Dashboard.jsx                # Transform to Balance
│   ├── services/api.js                    # New endpoints
│   └── theme.js                          # Maintain dark theme
```

### Dependencies to Add

```json
// backend/package.json
{
  "dependencies": {
    "better-sqlite3": "^9.0.0",
    "node-cron": "^3.0.0"  // For sync scheduling
  }
}

// frontend/package.json
{
  "dependencies": {
    "date-fns": "^2.30.0",  // Timeline helpers
    "@tanstack/react-virtual": "^3.0.0"  // Virtual scrolling
  }
}
```

### Environment Variables

```bash
# .env additions
DATABASE_PATH=./data/production.db
SYNC_INTERVAL_MINUTES=5
ENABLE_OFFLINE_MODE=true
ENCRYPT_LOCAL_DB=true
```

---

## Developer Notes

### Getting Started
1. Review this PRD thoroughly
2. Check existing StoryForge code in `/storyforge`
3. Start with Phase 1 - Journey Infrastructure
4. Update this document's progress tracker as you complete tasks
5. Commit progress regularly with clear commit messages

### Key Decisions Made
- Using SQLite for local database (not IndexedDB)
- Zustand over Redux for state management
- React Query for server state
- Keeping existing Notion integration
- Building new features alongside old ones

### Open Questions
- Exact gap detection algorithm parameters
- Memory token value calculation formulas
- Specific keyboard shortcuts to implement
- Detailed permission model for future multi-user support

### Resources
- Game design documents in `/Documents/About Last Night/`
- Notion API documentation: https://developers.notion.com/
- React Flow examples: https://reactflow.dev/examples
- SQLite with Node.js: https://github.com/WiseLibs/better-sqlite3

---

This PRD is a living document. Update it as the project evolves.