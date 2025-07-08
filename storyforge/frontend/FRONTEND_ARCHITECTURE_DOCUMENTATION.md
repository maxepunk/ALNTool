# Frontend Architecture Documentation

## Overview
The frontend is a single-page React application built with Vite. The architecture centers around a unified Journey Intelligence interface that consolidates all entity management and analysis into one powerful view.

## Component Architecture

### Main Components

COMPONENT: JourneyIntelligenceView
  PATH: src/components/JourneyIntelligenceView.jsx
  PURPOSE: Main container for unified intelligence interface
  DEPENDENCIES: ReactFlow, MUI, Zustand store, React Query
  STATE: Progressive entity loading, view mode, selected entity
  
COMPONENT: AdaptiveGraphCanvas  
  PATH: src/components/JourneyIntelligence/AdaptiveGraphCanvas.jsx
  PURPOSE: ReactFlow graph with 50-node aggregation and visual hierarchy
  DEPENDENCIES: ReactFlow, d3-force, custom nodes/edges
  STATE: Node positions, zoom level, viewport culling
  
COMPONENT: IntelligencePanel
  PATH: src/components/JourneyIntelligence/IntelligencePanel.jsx  
  PURPOSE: Context-sensitive analysis panel for selected entities
  DEPENDENCIES: Custom analysis components, React Query hooks
  STATE: Entity data, loading states

COMPONENT: EntitySelector
  PATH: src/components/JourneyIntelligence/EntitySelector.jsx
  PURPOSE: Search and selection interface with autocomplete
  DEPENDENCIES: MUI Autocomplete, React Query
  STATE: Search query, filtered results

### Node Components (4 types)
- CharacterNode (circle shape)
- ElementNode (diamond shape)  
- PuzzleNode (square shape)
- TimelineEventNode (dashed border)

### Intelligence Layers (5 types)
- EconomicLayer
- StoryIntelligenceLayer
- SocialIntelligenceLayer
- ProductionIntelligenceLayer
- ContentGapsLayer

### Total Component Count
- 127 JSX components in src/components/
- Pattern library with 19 reusable UI components
- 79+ error boundaries for resilience

## State Management

PATTERN: Zustand + React Query Split
  IMPLEMENTATION: Zustand for UI state, React Query for server state
  FILES: src/stores/journeyIntelligenceStore.js, all API calls via React Query

### Zustand Store Structure
```javascript
{
  // Selection state
  selectedEntity: null,
  selectionHistory: [],
  
  // View state
  viewMode: 'overview', // overview | entity-focus | intelligence-deep-dive
  activeIntelligence: ['story', 'social'], // Max 3 active layers
  focusMode: 'overview', // overview | focused | performance
  
  // UI state
  graphConfig: {
    zoom: 1,
    center: { x: 0, y: 0 },
    nodeVisibility: {},
    edgeVisibility: {}
  },
  
  // Performance state
  performanceMode: 'auto', // auto | quality | performance
  visibleNodeCount: 0
}
```

### React Query Configuration
- Version: 5.67.2 (upgraded from v4)
- Stale time: 5 minutes
- Cache time: 10 minutes
- Retry: 1 attempt only
- No refetch on window focus

## Routing Structure

PATTERN: Single-Page Application with Legacy Redirects
  IMPLEMENTATION: React Router v6, all routes redirect to Journey Intelligence
  FILES: src/App.jsx

Routes:
- `/` - Main Journey Intelligence view
- `/test-graph` - Debug route for testing
- All legacy routes redirect to `/`

## API Integration

PATTERN: Consolidated API Service
  IMPLEMENTATION: Axios with interceptors for standard response handling
  FILES: src/services/api.js

### API Structure
- 5 Generic entity operations (list, get, create, update, delete)
- 10 Specialized endpoints (sync, journey data, performance, etc.)
- Legacy compatibility layer maintained

API_FUNCTION: entities.list
  PURPOSE: List entities with filters
  ENDPOINT: /{entityType}

API_FUNCTION: syncNotionData  
  PURPOSE: Trigger Notion sync
  ENDPOINT: /sync/data

API_FUNCTION: getJourneyData
  PURPOSE: Get character journey data
  ENDPOINT: /journeys/{characterId}

API_FUNCTION: getEntityGraph
  PURPOSE: Get entity relationship graph
  ENDPOINT: /{entityType}/{id}/graph

API_FUNCTION: getCharacterLinks
  PURPOSE: Get all character relationships
  ENDPOINT: /character-links

## Styling Approach

PATTERN: Material-UI Dark Theme
  IMPLEMENTATION: Custom MUI theme with dark palette
  FILES: src/theme.js, src/index.css

- CSS approach: MUI styled components + minimal global CSS
- Dark theme with custom color palette
- Component-level styling via sx prop
- No CSS modules or styled-components

## Performance Optimizations

PATTERN: Progressive Loading + Viewport Culling
  IMPLEMENTATION: Lazy loading, React.memo, viewport-based rendering
  FILES: AdaptiveGraphCanvas.jsx, JourneyIntelligenceView.jsx

Optimizations:
- Lazy loading for heavy components (6 instances found)
- React.memo usage (18 instances)
- Viewport culling for graph nodes
- 50-node aggregation limit
- Progressive entity type loading
- Throttled updates (100ms delay)
- Level of detail rendering (hide labels when zoomed out)

## Dependencies

Major Libraries:
- React: 18.2.0
- Material-UI: 5.14.20
- ReactFlow (@xyflow/react): 12.6.0
- Zustand: 4.4.7
- React Query (@tanstack/react-query): 5.67.2
- React Router: 6.20.1
- Axios: 1.6.2
- D3-force: 3.0.0
- Lodash (throttle/debounce only)

Build Tools:
- Vite: 6.3.5
- Jest: 29.7.0
- Playwright: 1.52.0

## Code Quality

### Console.log Usage
- 10 instances found (should be 0 per policy)
- Located in App.jsx and pattern library examples

### Component Size
- Target: All components <500 lines
- Largest components properly decomposed

### Error Boundaries
- 79+ error boundaries implemented
- Exceeds minimum requirement of 25+

## Verification Status

✅ Component hierarchy mapped
✅ State management documented
✅ Routing structure identified
✅ API integration patterns documented
✅ Styling approach identified
✅ Performance optimizations found
✅ Dependencies listed

## Notable Findings

1. **Debug Panel**: Live debug panel in JourneyIntelligenceView showing graph stats (should be removed for production)

2. **Console.log Violations**: 10 instances violating zero console.log policy

3. **Force-Directed Layout**: Implemented with d3-force for entity clustering

4. **Relationship Types**: All 7 relationship types visualized:
   - Character-Character (via shared entities)
   - Character-Element Ownership
   - Character-Element Association
   - Element-Element Container
   - Puzzle-Element Reward
   - Element-Puzzle Requirement
   - Character-Timeline Event

5. **Bundle Size**: 770KB (exceeds 500KB target but deemed acceptable)