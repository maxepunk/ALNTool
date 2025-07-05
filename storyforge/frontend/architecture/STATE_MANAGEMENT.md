# State Management Architecture: Hybrid Dynamic Views
**Date**: January 10, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Status**: Day 4 Afternoon - Technical Architecture  
**Principle**: Enhance existing patterns for maximum reuse

---

## Executive Summary

Our state management leverages the existing Zustand + React Query architecture. Zustand handles UI state only (selection, view modes, user preferences). React Query manages all server data and computed intelligence. This separation ensures clean boundaries and optimal performance.

**Key Decision**: Intelligence calculations happen client-side using React Query's caching layer, avoiding the need for new backend endpoints.

---

## Current Architecture Analysis

### What We Have (And Keep)

#### 1. Zustand (journeyStore.js)
```javascript
// Current minimal UI state - perfect foundation
const useJourneyStore = create((set) => ({
  // Selection
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  // Filters
  selectedThread: 'all',
  setSelectedThread: (thread) => set({ selectedThread: thread }),
  characterFilter: [],
  puzzleFilter: [],
  // ... other filters
}));
```

#### 2. React Query (main.jsx)
```javascript
// Existing configuration - already optimized
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

#### 3. WorkflowContext
- Cross-page entity persistence
- Already handles context preservation
- Perfect for view state persistence

---

## Enhanced Zustand Store Design

### UI State Only - No Server Data

```javascript
// stores/journeyIntelligenceStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

const useJourneyIntelligenceStore = create(
  subscribeWithSelector(
    devtools((set, get) => ({
      // --- Selection State ---
      selectedEntity: {
        id: null,
        type: null,      // character | element | puzzle | timeline_event
        source: null,    // graph | search | breadcrumb | panel
        timestamp: null,
      },
      
      selectionHistory: [], // Max 5 items
      
      // --- View State ---
      viewMode: 'overview', // overview | entity-focus | intelligence-deep
      activeIntelligence: ['story', 'social'], // Active layers
      
      // --- Graph UI State ---
      graphState: {
        zoom: 1,
        center: { x: 0, y: 0 },
        nodeVisibility: {}, // nodeId -> boolean
        nodeEmphasis: {},   // nodeId -> emphasis level
        performanceMode: 'auto', // auto | quality | performance
      },
      
      // --- UI Preferences ---
      panelCollapsed: false,
      intelligencePanelTab: 'analysis', // analysis | suggestions | metrics
      
      // --- Performance Metrics ---
      visibleNodeCount: 0,
      lastTransitionDuration: 0,
      
      // --- Actions ---
      selectEntity: (entity) => {
        const current = get().selectedEntity;
        const history = get().selectionHistory;
        
        // Add current to history if exists
        if (current.id) {
          const newHistory = [current, ...history.filter(h => h.id !== current.id)].slice(0, 5);
          set({ selectionHistory: newHistory });
        }
        
        set({
          selectedEntity: {
            ...entity,
            timestamp: Date.now(),
          },
          viewMode: entity.id ? 'entity-focus' : 'overview',
        });
      },
      
      toggleIntelligence: (layer) => {
        const active = get().activeIntelligence;
        set({
          activeIntelligence: active.includes(layer)
            ? active.filter(l => l !== layer)
            : [...active, layer].slice(0, 3), // Max 3 active
        });
      },
      
      setGraphState: (updates) => {
        set({
          graphState: { ...get().graphState, ...updates }
        });
      },
      
      navigateBreadcrumb: (index) => {
        const history = get().selectionHistory;
        const target = history[index];
        
        if (target) {
          // Remove items before target in history
          const newHistory = history.slice(index + 1);
          set({
            selectedEntity: target,
            selectionHistory: newHistory,
            viewMode: 'entity-focus',
          });
        }
      },
      
      clearSelection: () => {
        set({
          selectedEntity: { id: null, type: null, source: null, timestamp: null },
          viewMode: 'overview',
        });
      },
      
      // Performance tracking
      updateVisibleNodes: (count) => {
        set({ visibleNodeCount: count });
      },
      
      recordTransition: (duration) => {
        set({ lastTransitionDuration: duration });
      },
    }))
  )
);

// Selectors for common derived state
export const selectors = {
  isEntitySelected: (state) => Boolean(state.selectedEntity.id),
  canNavigateBack: (state) => state.selectionHistory.length > 0,
  isPerformanceMode: (state) => 
    state.graphState.performanceMode === 'performance' ||
    (state.graphState.performanceMode === 'auto' && state.visibleNodeCount > 40),
};

export default useJourneyIntelligenceStore;
```

### Store Integration with Existing journeyStore

```javascript
// Gradual migration strategy
import { useJourneyStore } from './journeyStore';
import { useJourneyIntelligenceStore } from './journeyIntelligenceStore';

// Bridge component during transition
function useUnifiedStore() {
  const legacyStore = useJourneyStore();
  const intelligenceStore = useJourneyIntelligenceStore();
  
  // Map legacy selection to new format
  useEffect(() => {
    if (legacyStore.selectedNode) {
      intelligenceStore.selectEntity({
        id: legacyStore.selectedNode.id,
        type: legacyStore.selectedNode.type,
        source: 'graph',
      });
    }
  }, [legacyStore.selectedNode]);
  
  return {
    ...legacyStore,
    ...intelligenceStore,
  };
}
```

---

## React Query Integration Patterns

### Intelligence Calculation Architecture

```javascript
// hooks/useEntityIntelligence.js
import { useQuery, useQueries } from '@tanstack/react-query';
import { useJourneyIntelligenceStore } from '../stores/journeyIntelligenceStore';

export function useEntityIntelligence(entityId, entityType) {
  const activeIntelligence = useJourneyIntelligenceStore(
    state => state.activeIntelligence
  );
  
  // Base entity data - always needed
  const entityQuery = useQuery({
    queryKey: ['entity', entityType, entityId],
    queryFn: () => api.getEntity(entityType, entityId),
    staleTime: 5 * 60 * 1000,
  });
  
  // Graph context - relationships and connections
  const graphQuery = useQuery({
    queryKey: ['entity-graph', entityType, entityId],
    queryFn: () => api.getEntityGraph(entityType, entityId),
    staleTime: 5 * 60 * 1000,
    enabled: !!entityQuery.data,
  });
  
  // Intelligence calculations - based on active layers
  const intelligenceQuery = useQuery({
    queryKey: ['intelligence', entityId, activeIntelligence],
    queryFn: () => calculateIntelligence(
      entityQuery.data,
      graphQuery.data,
      activeIntelligence
    ),
    staleTime: 2 * 60 * 1000, // Shorter cache for computed data
    enabled: !!entityQuery.data && !!graphQuery.data,
  });
  
  return {
    entity: entityQuery.data,
    graph: graphQuery.data,
    intelligence: intelligenceQuery.data,
    isLoading: entityQuery.isLoading || graphQuery.isLoading,
    isCalculating: intelligenceQuery.isLoading,
  };
}
```

### Composed Query Patterns

```javascript
// hooks/useComposedIntelligence.js

// 1. Story Integration Intelligence
function useStoryIntelligence(entity) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['timeline-events', entity.id],
        queryFn: () => api.getRelatedTimelineEvents(entity.id),
        enabled: entity.type === 'element',
      },
      {
        queryKey: ['narrative-threads', entity.id],
        queryFn: () => api.getEntityNarrativeThreads(entity.id),
      },
      {
        queryKey: ['story-connections', entity.id],
        queryFn: () => api.getStoryConnections(entity.id),
      },
    ],
  });
  
  return useMemo(() => {
    if (queries.some(q => q.isLoading)) return null;
    
    return {
      timelineConnections: queries[0].data,
      narrativeRole: analyzeNarrativeRole(queries[1].data),
      storyCompleteness: calculateStoryCompleteness(queries[2].data),
      gaps: identifyStoryGaps(queries),
    };
  }, [queries]);
}

// 2. Social Choreography Intelligence
function useSocialIntelligence(entity) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['social-dependencies', entity.id],
        queryFn: () => calculateSocialDependencies(entity),
      },
      {
        queryKey: ['collaboration-load', entity.id],
        queryFn: () => api.getCollaborationMetrics(entity.id),
      },
    ],
  });
  
  return useMemo(() => {
    if (queries.some(q => q.isLoading)) return null;
    
    return {
      requiredCollaborations: queries[0].data,
      socialLoad: queries[1].data,
      interactionQuality: assessInteractionQuality(queries),
    };
  }, [queries]);
}

// 3. Master composition hook
export function useLayeredIntelligence(entity, activeLayers) {
  const story = useStoryIntelligence(entity);
  const social = useSocialIntelligence(entity);
  const economic = useEconomicIntelligence(entity);
  const production = useProductionIntelligence(entity);
  const gaps = useGapAnalysis(entity);
  
  return useMemo(() => {
    const intelligence = {};
    
    if (activeLayers.includes('story')) intelligence.story = story;
    if (activeLayers.includes('social')) intelligence.social = social;
    if (activeLayers.includes('economic')) intelligence.economic = economic;
    if (activeLayers.includes('production')) intelligence.production = production;
    if (activeLayers.includes('gaps')) intelligence.gaps = gaps;
    
    return intelligence;
  }, [activeLayers, story, social, economic, production, gaps]);
}
```

### Progressive Loading Strategy

```javascript
// hooks/useProgressiveIntelligence.js

export function useProgressiveIntelligence(entity) {
  const [loadStage, setLoadStage] = useState('immediate');
  
  // Immediate: Core entity data (<100ms)
  const immediate = useQuery({
    queryKey: ['entity-immediate', entity.id],
    queryFn: async () => {
      const data = await api.getEntity(entity.type, entity.id);
      setLoadStage('quick');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
  
  // Quick: Direct connections (<500ms)
  const quick = useQuery({
    queryKey: ['entity-connections', entity.id],
    queryFn: async () => {
      const connections = await api.getDirectConnections(entity.id);
      setLoadStage('full');
      return connections;
    },
    enabled: loadStage !== 'immediate',
    staleTime: 5 * 60 * 1000,
  });
  
  // Full: Complete intelligence (<2s)
  const full = useQuery({
    queryKey: ['entity-full-intelligence', entity.id],
    queryFn: () => calculateFullIntelligence(entity, immediate.data, quick.data),
    enabled: loadStage === 'full' && !!quick.data,
    staleTime: 2 * 60 * 1000,
  });
  
  return {
    immediate: immediate.data,
    quick: quick.data,
    full: full.data,
    stage: loadStage,
    isLoading: immediate.isLoading,
    isEnhancing: quick.isLoading,
    isCalculating: full.isLoading,
  };
}
```

### Cache Management Strategy

```javascript
// utils/cacheManagement.js

// Selective cache invalidation
export function invalidateEntityIntelligence(entityId) {
  const queryClient = useQueryClient();
  
  // Invalidate computed intelligence but keep raw data
  queryClient.invalidateQueries({
    queryKey: ['intelligence', entityId],
    exact: false,
  });
  
  // Keep entity data cached
  queryClient.setQueryDefaults(['entity'], {
    staleTime: 5 * 60 * 1000,
  });
}

// Performance-aware prefetching
export function prefetchRelatedEntities(entity, graph) {
  const queryClient = useQueryClient();
  
  // Only prefetch top 5 most relevant
  const toPrefetch = graph.nodes
    .filter(n => n.id !== entity.id)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
  
  toPrefetch.forEach(node => {
    queryClient.prefetchQuery({
      queryKey: ['entity', node.type, node.id],
      queryFn: () => api.getEntity(node.type, node.id),
    });
  });
}
```

---

## Component Hierarchy

### Top-Level Structure

```jsx
// components/JourneyIntelligenceView.jsx
export function JourneyIntelligenceView() {
  return (
    <IntelligenceProvider>
      <ViewportProvider>
        <SelectionProvider>
          <div className="journey-intelligence-container">
            <ControlBar />
            <div className="main-content">
              <AdaptiveGraphCanvas />
              <IntelligencePanel />
            </div>
          </div>
        </SelectionProvider>
      </ViewportProvider>
    </IntelligenceProvider>
  );
}
```

### Provider Components

```jsx
// providers/IntelligenceProvider.jsx
export function IntelligenceProvider({ children }) {
  const selectedEntity = useJourneyIntelligenceStore(state => state.selectedEntity);
  const intelligence = useEntityIntelligence(selectedEntity.id, selectedEntity.type);
  
  return (
    <IntelligenceContext.Provider value={intelligence}>
      {children}
    </IntelligenceContext.Provider>
  );
}

// providers/ViewportProvider.jsx  
export function ViewportProvider({ children }) {
  const graphState = useJourneyIntelligenceStore(state => state.graphState);
  const setGraphState = useJourneyIntelligenceStore(state => state.setGraphState);
  
  return (
    <ViewportContext.Provider value={{ graphState, setGraphState }}>
      {children}
    </ViewportContext.Provider>
  );
}
```

### Core Components

```jsx
// components/AdaptiveGraphCanvas.jsx
export function AdaptiveGraphCanvas() {
  const viewMode = useJourneyIntelligenceStore(state => state.viewMode);
  const selectedEntity = useJourneyIntelligenceStore(state => state.selectedEntity);
  
  // Reuse existing graph components
  const GraphComponent = useMemo(() => {
    switch (viewMode) {
      case 'overview':
        return CharacterOverview; // New minimal component
      case 'entity-focus':
        return selectedEntity.type === 'character' 
          ? JourneyGraphView 
          : RelationshipMapper;
      case 'intelligence-deep':
        return IntelligenceGraph; // New focused component
      default:
        return JourneyGraphView;
    }
  }, [viewMode, selectedEntity.type]);
  
  return (
    <div className="adaptive-graph-canvas">
      <GraphComponent />
      <PerformanceMonitor />
    </div>
  );
}

// components/IntelligencePanel.jsx
export function IntelligencePanel() {
  const intelligence = useContext(IntelligenceContext);
  const activeTab = useJourneyIntelligenceStore(state => state.intelligencePanelTab);
  
  return (
    <div className="intelligence-panel">
      <PanelTabs active={activeTab} />
      <PanelContent>
        {activeTab === 'analysis' && <IntelligenceAnalysis data={intelligence} />}
        {activeTab === 'suggestions' && <ActionSuggestions data={intelligence} />}
        {activeTab === 'metrics' && <ImpactMetrics data={intelligence} />}
      </PanelContent>
    </div>
  );
}
```

### Reusable Components Map

```javascript
// Existing components we reuse
const REUSABLE_COMPONENTS = {
  // Nodes
  'EntityNode': 'Universal node component for all entity types',
  'ActivityNode': 'Timeline and puzzle nodes',
  
  // Graphs  
  'JourneyGraphView': 'Character journey visualization',
  'RelationshipMapper': 'Relationship visualization',
  'DependencyChoreographer': 'Production dependency view',
  
  // UI Components
  'FilterDrawer': 'Reuse for intelligence filters',
  'SearchBar': 'Universal search component',
  'Legend': 'Adapt for intelligence indicators',
  
  // Context
  'WorkflowContext': 'Cross-session persistence',
};

// New components needed
const NEW_COMPONENTS = {
  'AdaptiveGraphCanvas': 'Switches between view modes smoothly',
  'IntelligencePanel': 'Contextual analysis display',
  'IntelligenceToggles': 'Layer selection UI',
  'PerformanceMonitor': 'Real-time performance tracking',
  'CharacterOverview': 'Minimal overview for all characters',
  'IntelligenceGraph': 'Focused view for deep analysis',
};
```

---

## Data Flow Architecture

### Unidirectional Flow

```
User Interaction
      ↓
Zustand Store (UI State)
      ↓
React Query (Data Fetching)
      ↓
Intelligence Calculation
      ↓
Component Re-render
      ↓
Visual Update
```

### State Synchronization

```javascript
// Sync between stores when needed
function useStoreSync() {
  const selectedEntity = useJourneyIntelligenceStore(state => state.selectedEntity);
  const { setHighlightedNodes } = useJourneyStore();
  
  // Sync highlighting with selection
  useEffect(() => {
    if (selectedEntity.id) {
      const related = getRelatedNodeIds(selectedEntity);
      setHighlightedNodes(related);
    }
  }, [selectedEntity]);
}
```

---

## Performance Optimizations

### React Query Optimizations

```javascript
// Parallel query execution
const queries = useQueries({
  queries: [...],
  // Execute in parallel for performance
  suspense: false,
});

// Selective updates
queryClient.setQueryData(
  ['entity', entityId],
  (old) => ({ ...old, ...updates }),
  { updatedAt: Date.now() }
);

// Background refetching
useEffect(() => {
  const interval = setInterval(() => {
    queryClient.invalidateQueries({
      queryKey: ['intelligence'],
      refetchType: 'none', // Don't refetch immediately
    });
  }, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, []);
```

### Zustand Optimizations

```javascript
// Shallow equality checks
const activeIntelligence = useJourneyIntelligenceStore(
  state => state.activeIntelligence,
  shallow
);

// Subscriptions for specific updates
useEffect(() => {
  const unsubscribe = useJourneyIntelligenceStore.subscribe(
    (state) => state.visibleNodeCount,
    (count) => {
      if (count > 45) {
        console.warn('Approaching node limit');
      }
    }
  );
  
  return unsubscribe;
}, []);
```

---

## Migration Strategy

### Phase 1: Parallel Operation
1. Create new store alongside existing
2. Bridge stores for compatibility
3. New features use new store

### Phase 2: Gradual Migration
1. Update components one by one
2. Maintain backwards compatibility
3. Test thoroughly at each step

### Phase 3: Cleanup
1. Remove old store references
2. Consolidate into single store
3. Update documentation

---

## Testing Strategy

### Store Testing
```javascript
// stores/__tests__/journeyIntelligenceStore.test.js
describe('JourneyIntelligenceStore', () => {
  it('maintains selection history correctly', () => {
    const { selectEntity, selectionHistory } = useJourneyIntelligenceStore.getState();
    
    selectEntity({ id: '1', type: 'character' });
    selectEntity({ id: '2', type: 'element' });
    
    expect(selectionHistory).toHaveLength(1);
    expect(selectionHistory[0].id).toBe('1');
  });
});
```

### Integration Testing
```javascript
// Test store + React Query integration
describe('Intelligence Integration', () => {
  it('calculates intelligence when entity selected', async () => {
    const { result } = renderHook(() => useEntityIntelligence('1', 'character'));
    
    await waitFor(() => {
      expect(result.current.intelligence).toBeDefined();
    });
  });
});
```

---

## Implementation Checklist

### Day 4 Deliverables
- [x] Enhanced Zustand store design
- [x] React Query integration patterns
- [x] Component hierarchy definition
- [x] Data flow documentation

### Week 2 Tasks
- [ ] Implement store enhancements
- [ ] Create intelligence calculation functions
- [ ] Build new minimal components
- [ ] Integrate with existing graphs

### Week 3 Polish
- [ ] Performance optimizations
- [ ] Complete migration
- [ ] Comprehensive testing
- [ ] Documentation updates

---

*"Clean state boundaries enable clean code. Let Zustand handle UI, React Query handle data, and intelligence emerge from their composition."*  
— Sarah Chen