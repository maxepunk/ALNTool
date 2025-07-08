# ALNTool Architecture

> **Last Updated**: 2025-01-07  
> **Status**: Generated from actual code inspection  
> **Purpose**: Document the real, working architecture

## Overview

ALNTool is a single-page React application with a Node.js/Express backend that transforms 18 separate Notion database views into unified design intelligence for the "About Last Night" murder mystery game.

```
Notion (Source of Truth)
    ↓ [4-Phase Sync Pipeline]
SQLite Database (Computed Data)
    ↓ [Dual API Layer]
React Frontend (Unified Interface)
```

## Frontend Architecture

### Technology Stack
- **React 18.3** with Vite build system
- **ReactFlow** for graph visualization  
- **Zustand** for UI state management
- **React Query v5** for server state
- **Axios** for API communication

### Component Structure
```
src/
├── components/               # 127 total components
│   ├── JourneyIntelligenceView.jsx    # Main unified interface
│   └── JourneyIntelligence/
│       ├── AdaptiveGraphCanvas.jsx    # ReactFlow with force layout
│       ├── IntelligencePanel.jsx      # Entity analysis display
│       ├── EntitySelector.jsx         # Search & selection
│       ├── layers/                    # 5 intelligence layers
│       │   ├── EconomicLayer.jsx
│       │   ├── StoryIntelligenceLayer.jsx
│       │   ├── SocialIntelligenceLayer.jsx
│       │   ├── ProductionIntelligenceLayer.jsx
│       │   └── ContentGapsLayer.jsx
│       └── nodes/                     # Custom node components
│           ├── CharacterNode.jsx      # Circle shape
│           ├── ElementNode.jsx        # Diamond shape
│           ├── PuzzleNode.jsx         # Square shape
│           └── TimelineEventNode.jsx  # Dashed border
├── stores/
│   └── journeyIntelligenceStore.js    # UI state only (Zustand)
├── hooks/                             # Data fetching & logic
└── services/
    └── api.js                        # Consolidated API client
```

### State Management Strategy
- **Zustand**: UI-only state (selectedEntity, activeIntelligence, viewMode)
- **React Query**: All server state with 5min stale time, 10min cache time
- **localStorage**: UI preference persistence via Zustand middleware

### Performance Optimizations
1. **Viewport Culling**: Only render 100 visible nodes (MAX_VISIBLE_NODES)
2. **Progressive Loading**: Characters first, others on-demand via EntityTypeLoader
3. **Level of Detail**: Hide labels when zoomed out
4. **Lazy Loading**: Heavy components loaded on demand
5. **Throttled Updates**: 100ms throttle on graph calculations

### Key Features Implemented
- ✅ Unified interface replacing 18 database views
- ✅ Force-directed graph layout with D3 simulation
- ✅ 5 working intelligence layers providing entity analysis
- ✅ Entity search with autocomplete
- ✅ Visual hierarchy (opacity/scale) instead of aggregation
- ✅ Custom node shapes by entity type
- ✅ Relationship edges visualization

### Current Issues
- 10 console.log statements (violates zero-log policy)
- Debug panel visible in production (bottom-left)
- Bundle size 770KB (exceeds 500KB target)

## Backend Architecture

### Technology Stack
- **Node.js** with Express 4.21
- **SQLite** via better-sqlite3
- **Notion API** for data source
- **express-validator** for input validation
- **NodeCache** for API response caching

### Service Architecture
```
src/
├── controllers/          # Request handlers (<150 lines each)
│   ├── notionCharacterController.js
│   ├── notionElementController.js
│   ├── notionPuzzleController.js
│   ├── notionTimelineController.js
│   └── notionGeneralController.js
├── routes/              # API endpoint definitions
│   ├── apiV1.js        # Legacy endpoints
│   ├── apiV2.js        # Modern REST API
│   └── genericRouter.js # CRUD operations
├── services/
│   ├── sync/           # 4-phase sync pipeline
│   │   ├── SyncOrchestrator.js
│   │   ├── entitySyncers/
│   │   │   ├── CharacterSyncer.js
│   │   │   ├── ElementSyncer.js
│   │   │   ├── PuzzleSyncer.js
│   │   │   └── TimelineEventSyncer.js
│   │   └── RelationshipSyncer.js
│   └── compute/        # Derived field calculators
│       ├── ActFocusComputer.js
│       ├── MemoryValueComputer.js
│       ├── NarrativeThreadComputer.js
│       └── ResolutionPathComputer.js
├── db/
│   ├── database.js     # SQLite connection
│   ├── queries.js      # SQL query definitions
│   └── migration-scripts/ # 11 migrations
└── middleware/
    └── responseWrapper.js # Standardized responses
```

### 4-Phase Sync Pipeline

**Phase 1: Entity Sync**
- Fetches from Notion API (5-minute cache)
- Maps properties to SQL schema
- Upserts to SQLite in transactions

**Phase 2: Relationship Sync**
- Builds junction tables for many-to-many relationships
- Calculates character_links with strength scores
- Creates dependency mappings

**Phase 3: Compute Phase**
- ActFocusComputer: Determines which act timeline events belong to
- MemoryValueComputer: Extracts token values from descriptions
- NarrativeThreadComputer: Identifies story threads
- ResolutionPathComputer: Maps puzzle solution paths

**Phase 4: Cache Management**
- Invalidates cached_journey_graphs
- Refreshes computed views
- Updates sync_log table

### API Structure

**V1 API (Legacy, Deprecated)**
```
GET  /api/metadata          # Database metadata
GET  /api/characters        # All characters
GET  /api/elements          # Elements with computed 'type'
GET  /api/puzzles          # All puzzles
GET  /api/timeline         # Timeline events
POST /api/sync/data        # Trigger sync
```

**V2 API (Current)**
```
# Generic CRUD
GET/POST/PUT/DELETE /api/v2/entities/:entityType[/:id]

# Specialized Endpoints
GET  /api/v2/journey/:characterId      # Character journey
GET  /api/v2/elements/performance      # Computed elements
GET  /api/v2/characters/links          # All relationships
GET  /api/v2/relationships/:type/:id   # Entity graph
POST /api/v2/sync/notion              # Trigger sync
```

### Database Schema

**Core Tables**:
- characters (with total_memory_value computed)
- elements (with memory_value fields)
- puzzles (with resolution_path)
- timeline_events (with act_focus, narrative_threads)

**Relationship Tables**:
- character_elements (ownership)
- character_associated_elements
- element_puzzles (requirements/rewards)
- character_timeline_events
- character_links (computed strength 0-100)

**System Tables**:
- cached_journey_graphs (performance cache)
- sync_log (sync history)
- game_constants (configuration)

## Data Flow

### 1. Notion → Database
```
Notion API
  ↓ (5-min cache)
Entity Syncers
  ↓ (property mapping)
SQLite Tables
  ↓ (relationships)
Junction Tables
  ↓ (computations)
Derived Fields
  ↓ (caching)
Journey Graphs
```

### 2. Database → Frontend
```
API Request
  ↓ (query builder)
SQL Query
  ↓ (row mapping)
JSON Response
  ↓ (response wrapper)
HTTP Response
  ↓ (axios interceptor)
React Query Cache
  ↓ (5min/10min)
React Components
```

### 3. User Interaction Flow
```
User Clicks Entity
  ↓ (ReactFlow event)
Extract Entity Data
  ↓ (Zustand update)
Intelligence Layers Activate
  ↓ (React Query fetch)
Related Data Loaded
  ↓ (transformation)
Analysis Displayed
```

## Performance Boundaries

| Boundary | Value | Implementation | Reason |
|----------|-------|----------------|---------|
| Viewport Nodes | 100 max | AdaptiveGraphCanvas culling | Performance |
| Initial Load | Characters only | Progressive EntityTypeLoader | UX clarity |
| API Cache | 5 minutes | NodeCache in notionService | Rate limits |
| React Query | 5min stale, 10min cache | Query options | Smooth UX |
| Sync Lock | Single instance | SyncOrchestrator | Data integrity |

## Security & Standards

- **Input Validation**: express-validator on all endpoints
- **SQL Injection**: Parameterized queries via better-sqlite3
- **Response Format**: Standardized via responseWrapper
- **Error Handling**: Centralized error middleware
- **CORS**: Enabled for development
- **Rate Limiting**: 100 requests/15min (production)

## Deployment Architecture

```
Production:
├── Frontend (Vite build)
│   └── Static files served by web server
└── Backend (Node.js)
    ├── Express server on port 3001
    └── SQLite database file
```

## Key Architectural Decisions

1. **Zustand + React Query Split**: Clear separation of concerns between UI and server state
2. **SQLite Over PostgreSQL**: Simplified deployment, sufficient for use case
3. **Sync Pipeline Design**: Sequential phases prevent data inconsistencies
4. **Dual API Versions**: Smooth migration path from v1 to v2
5. **No Direct Notion Writes**: Maintains Notion as source of truth
6. **Visual Hierarchy Over Aggregation**: Better UX for large datasets

## What's NOT Implemented

- WebSocket real-time updates
- Direct Notion write operations
- Multi-user collaboration features
- Automated sync scheduling
- Full-text search indexing

---

*This architecture successfully delivers Phase 1: Design Decision Support as specified in the vision.*