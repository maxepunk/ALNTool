# API Endpoint Matrix

## Overview
This document maps all API endpoints discovered across the 6 analyzed pages, showing which features use which endpoints and identifying gaps for the unified journey view.

## Endpoint Usage by Page

### Characters Page
- `GET /api/characters` - List all characters with filters
  - Query params: type, tier, resolution_path, search
  - Returns: Character data with computed fields (act_focus, memory_value, etc.)
- `GET /api/characters/analytics` - Path balance and production metrics
- `GET /api/characters/:id` - Character details (referenced but not used on this page)

### Timeline Events Page  
- `GET /api/timeline-events` - List all timeline events with filters
  - Query params: act, theme, character_id, search
- `GET /api/timeline-events/:id` - Timeline event details
- `GET /api/timeline-events/:id/graph` - Event relationship graph
- `GET /api/timeline-events/dashboard` - Timeline analytics

### Puzzles Page
- `GET /api/puzzles` - List all puzzles with filters
  - Query params: act, themes, narrative_threads, search
- `GET /api/puzzles/:id` - Puzzle details
- `GET /api/puzzles/:id/graph` - Puzzle dependency graph
- `GET /api/game-constants` - Configuration for thresholds
- `GET /api/narrative-threads` - Unique narrative thread list

### Elements Page
- `GET /api/elements` - List all elements with filters
  - Query params: type, status, first_available, search
  - Client filters: act_focus, themes, memory_set
- `GET /api/elements/:id` - Element details with relationships
- `GET /api/elements/:id/graph` - Element connection graph
- `GET /api/elements/memory-tokens` - Memory token specific analytics

### Player Journey Page (Current)
- `GET /api/journeys/:characterId` - Complete journey graph data
  - Returns: Character info + graph (nodes, edges)
  - Includes: Activities, discoveries, lore, dependencies

### Memory Economy Page
- `GET /api/elements` - Filtered for memory tokens
- `GET /api/characters` - For path distribution
- `GET /api/puzzles` - For puzzle analytics
- `GET /api/game-constants` - For thresholds and configuration

## Consolidated Endpoint List

### Core Entity Endpoints
1. **Characters**: `/api/characters`, `/api/characters/:id`, `/api/characters/analytics`
2. **Timeline Events**: `/api/timeline-events`, `/api/timeline-events/:id`, `/api/timeline-events/:id/graph`, `/api/timeline-events/dashboard`
3. **Puzzles**: `/api/puzzles`, `/api/puzzles/:id`, `/api/puzzles/:id/graph`
4. **Elements**: `/api/elements`, `/api/elements/:id`, `/api/elements/:id/graph`, `/api/elements/memory-tokens`

### Journey-Specific
5. **Journeys**: `/api/journeys/:characterId` ⭐ PRIMARY FOR UNIFIED VIEW

### Supporting Data
6. **Game Constants**: `/api/game-constants`
7. **Narrative Threads**: `/api/narrative-threads`

## Gap Analysis for Journey Intelligence View

### ✅ What We Have (Can Display)
- Complete journey graph structure
- All node and edge data
- Character relationships
- Timeline connections
- Puzzle dependencies
- Element flows
- Memory token values
- Production metrics

### ❌ What's Missing (Cannot Edit)
- No write endpoints for any entity
- No position save endpoint
- No edge creation/modification
- No bulk update operations
- No real-time sync endpoints

### 🔧 Endpoints Needed for Phase 2+
```
# Phase 2: Local Editing + Validation
POST /api/journeys/:characterId/validate
POST /api/scenarios
GET /api/scenarios/:scenarioId

# Phase 3: Persistent Editing
PUT /api/nodes/:nodeId
POST /api/connections
DELETE /api/connections/:connectionId
PATCH /api/journeys/:characterId

# Phase 4: Real-time Collaboration
WS /api/collaborate/join
WS /api/collaborate/update
WS /api/collaborate/leave
```

## Optimization Opportunities

### Single Journey View Data Fetching
Instead of 6 separate pages making individual API calls, the unified journey view can:

1. **Primary Load**: `/api/journeys/:characterId` (includes most data)
2. **Supplementary**: Parallel fetch only what's missing:
   - `/api/game-constants` (for thresholds)
   - `/api/characters/analytics` (for path balance)
   - `/api/timeline-events/dashboard` (for timing insights)

### Caching Strategy
- All endpoints use 5-minute stale time
- React Query handles deduplication
- Consider increasing cache time for static data (game constants)

## Conclusion
The existing read-only endpoints provide sufficient data for Phase 1's Journey Intelligence Layer. The primary `/api/journeys/:characterId` endpoint already aggregates most needed information, with only minor supplementary calls required for complete intelligence overlays.