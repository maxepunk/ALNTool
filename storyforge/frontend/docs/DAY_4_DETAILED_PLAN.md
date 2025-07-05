# Day 4 Detailed Plan: Interaction Model & State Management

**Date**: January 10, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Focus**: Design patterns that leverage existing architecture without overengineering

---

## Architecture Review Summary

### What We're Building On (Not Replacing)
- **journeyStore.js**: Minimal Zustand store for UI state
- **React Query**: Handles all data fetching with 5-min cache
- **WorkflowContext**: Cross-page entity persistence
- **JourneyGraphView + RelationshipMapper**: Existing ReactFlow implementations
- **Custom Nodes**: EntityNode, ActivityNode already built

### What We're NOT Doing
- ❌ Creating new state management system
- ❌ Replacing React Query patterns
- ❌ Building graph components from scratch
- ❌ Creating new API layer
- ❌ Duplicating existing analysis features

---

## Task 1: Design Selection and Context Switching

### WHY This Task?
Users need to select entities and see immediate intelligence without losing context. Current implementation has selection but no intelligent response.

### HOW We'll Approach It

**Subtask 1.1: Enhance Existing Selection Pattern**
```javascript
// Current: journeyStore has basic selection
selectedNode: null,
setSelectedNode: (node) => set({ selectedNode: node })

// Enhancement: Add selection context
selectedEntity: {
  id: null,
  type: null, // character | element | puzzle | timeline
  context: null, // journey | relationship | production
  timestamp: null
},
lastSelections: [], // History for breadcrumbs
```

**Subtask 1.2: Define Selection Response Rules**
```javascript
// Selection triggers view adaptation
const selectionRules = {
  character: {
    primaryView: 'journey',
    availableIntelligence: ['story', 'social', 'economic', 'production', 'gaps'],
    defaultIntelligence: ['story', 'social']
  },
  element: {
    primaryView: 'impact',
    availableIntelligence: ['story', 'accessibility', 'economic', 'production'],
    defaultIntelligence: ['story', 'economic']
  }
  // ... other entity types
};
```

**Subtask 1.3: Context Preservation Strategy**
- Extend WorkflowContext to track view state
- Store active intelligence layers
- Maintain zoom/pan position
- Preserve filters

### Action Items
1. Document selection behavior in INTERACTION_MODEL.md
2. Define entity → view transformation rules
3. Specify context preservation requirements
4. Create selection state transition diagram

---

## Task 2: Create Navigation Patterns for Hybrid Views

### WHY This Task?
Hybrid views must feel predictable despite being dynamic. Users need clear wayfinding.

### HOW We'll Approach It

**Subtask 2.1: Unify Existing Graph Components**
```javascript
// Instead of separate JourneyGraphView and RelationshipMapper
// Create unified JourneyIntelligenceView that uses both
<JourneyIntelligenceView>
  <AdaptiveGraphCanvas>
    {viewMode === 'journey' && <JourneyGraphCore />}
    {viewMode === 'relationship' && <RelationshipCore />}
    {/* Smooth transitions between modes */}
  </AdaptiveGraphCanvas>
</JourneyIntelligenceView>
```

**Subtask 2.2: Navigation State Machine**
```javascript
// Define clear state transitions
const navigationStates = {
  OVERVIEW: { // Initial state
    showsNodes: 'all-characters',
    maxNodes: 20,
    intelligence: 'summary'
  },
  ENTITY_FOCUS: { // After selection
    showsNodes: 'selected-entity-context',
    maxNodes: 50,
    intelligence: 'detailed'
  },
  INTELLIGENCE_DEEP_DIVE: { // Layer activated
    showsNodes: 'filtered-by-intelligence',
    maxNodes: 30,
    intelligence: 'specialized'
  }
};
```

**Subtask 2.3: Breadcrumb System**
- Visual breadcrumbs showing navigation path
- Click to return to previous context
- Maximum 5 levels deep

### Action Items
1. Map current navigation patterns in both components
2. Design unified navigation flow
3. Create state transition diagram
4. Define breadcrumb behavior

---

## Task 3: Define Performance Boundaries

### WHY This Task?
Must guarantee <50 nodes visible and <500ms transitions even with complex data.

### HOW We'll Approach It

**Subtask 3.1: Node Budget System**
```javascript
const NodeBudget = {
  TOTAL_MAX: 50,
  PRIMARY_ENTITIES: 20, // Main focus
  SECONDARY_ENTITIES: 20, // Related
  UI_ELEMENTS: 10, // Aggregates, labels
  
  calculateVisible(entities, context) {
    // Smart filtering based on relevance
    const scored = entities.map(e => ({
      ...e,
      relevanceScore: calculateRelevance(e, context)
    }));
    return scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.TOTAL_MAX);
  }
};
```

**Subtask 3.2: Progressive Loading Strategy**
```javascript
// Load in stages
const loadingStages = {
  IMMEDIATE: { // <100ms
    data: 'cached-base-entities',
    nodes: 20
  },
  QUICK: { // <500ms
    data: 'related-entities',
    nodes: 30
  },
  BACKGROUND: { // <2s
    data: 'intelligence-calculations',
    nodes: 50
  }
};
```

**Subtask 3.3: Transition Performance**
- Use React.memo for node components
- Implement windowing for large lists
- CSS transforms for smooth animations
- Debounce intelligence calculations

### Action Items
1. Profile current ReactFlow performance
2. Set specific performance budgets
3. Design progressive loading stages
4. Create performance monitoring hooks

---

## Task 4: Design Unified Zustand Store Structure

### WHY This Task?
Current journeyStore is minimal. Need to enhance for hybrid views WITHOUT storing server data.

### HOW We'll Approach It

**Subtask 4.1: Enhance Existing Store**
```javascript
// Keep it focused on UI state only
const useJourneyIntelligenceStore = create(
  subscribeWithSelector((set, get) => ({
    // Selection state
    selectedEntity: null,
    selectionHistory: [],
    
    // View state
    viewMode: 'overview', // overview | entity-focus | intelligence
    activeIntelligence: ['story', 'social'],
    
    // UI state
    graphConfig: {
      zoom: 1,
      center: { x: 0, y: 0 },
      nodeVisibility: {},
      edgeVisibility: {}
    },
    
    // Performance state
    performanceMode: 'auto', // auto | quality | performance
    visibleNodeCount: 0,
    
    // Actions
    selectEntity: (entity) => {
      const history = [...get().selectionHistory, get().selectedEntity];
      set({
        selectedEntity: entity,
        selectionHistory: history.filter(Boolean).slice(-5),
        viewMode: 'entity-focus'
      });
    },
    
    toggleIntelligence: (layer) => {
      const active = get().activeIntelligence;
      set({
        activeIntelligence: active.includes(layer)
          ? active.filter(l => l !== layer)
          : [...active, layer]
      });
    }
  }))
);
```

**Subtask 4.2: Keep React Query for Data**
```javascript
// All data still comes from React Query
const useEntityIntelligence = (entityId, layers) => {
  // Multiple queries composed together
  const baseData = useEntityData(entityId);
  const graphData = useEntityGraph(entityId);
  const intelligence = useIntelligenceCalculation(baseData, graphData, layers);
  
  return { baseData, graphData, intelligence };
};
```

### Action Items
1. Extend journeyStore with new UI state
2. Document what stays in Zustand vs React Query
3. Design subscription patterns for performance
4. Create TypeScript interfaces

---

## Task 5: Create React Query Integration Patterns

### WHY This Task?
Need to efficiently compose multiple data sources for intelligence without overloading API.

### HOW We'll Approach It

**Subtask 5.1: Intelligent Query Composition**
```javascript
// Compose queries based on active intelligence
const useComposedIntelligence = (entity, activeLayers) => {
  // Base data always needed
  const base = useEntityData(entity.id);
  
  // Conditional queries based on layers
  const storyQueries = useQueries({
    queries: activeLayers.includes('story') 
      ? [
          { queryKey: ['timeline-events', entity.id], ... },
          { queryKey: ['element-connections', entity.id], ... }
        ]
      : []
  });
  
  // Combine for intelligence
  return useMemo(() => 
    calculateIntelligence(base.data, storyQueries),
    [base.data, storyQueries]
  );
};
```

**Subtask 5.2: Caching Strategy**
```javascript
// Leverage existing 5-min staleTime
const intelligenceCacheStrategy = {
  // Raw data - use default 5 min
  entities: { staleTime: 5 * 60 * 1000 },
  
  // Computed intelligence - shorter cache
  intelligence: { staleTime: 2 * 60 * 1000 },
  
  // UI preferences - infinite
  viewState: { staleTime: Infinity }
};
```

**Subtask 5.3: Progressive Data Loading**
```javascript
// Load critical data first
const useProgressiveEntityData = (entityId) => {
  // Critical - load immediately
  const critical = useQuery({
    queryKey: ['entity-critical', entityId],
    queryFn: () => api.getEntity(entityId)
  });
  
  // Enhanced - load after critical
  const enhanced = useQuery({
    queryKey: ['entity-enhanced', entityId],
    queryFn: () => api.getEntityGraph(entityId),
    enabled: !!critical.data
  });
  
  // Intelligence - compute after data loaded
  const intelligence = useQuery({
    queryKey: ['entity-intelligence', entityId],
    queryFn: () => computeIntelligence(critical.data, enhanced.data),
    enabled: !!enhanced.data
  });
  
  return { critical, enhanced, intelligence };
};
```

### Action Items
1. Design query composition patterns
2. Document caching strategy
3. Create progressive loading hooks
4. Define error handling patterns

---

## Task 6: Define Component Hierarchy for Hybrid Views

### WHY This Task?
Need clear component structure that supports dynamic views without spaghetti code.

### HOW We'll Approach It

**Subtask 6.1: Top-Level Architecture**
```
<JourneyIntelligenceView>
  <IntelligenceProvider>
    <ViewportProvider>
      <SelectionProvider>
        
        <ControlBar>
          <EntitySelector />
          <IntelligenceToggles />
          <ViewModeSelector />
          <PerformanceIndicator />
        </ControlBar>
        
        <AdaptiveGraphCanvas>
          <GraphProvider>
            <NodeRenderer />
            <EdgeRenderer />
            <OverlayRenderer />
          </GraphProvider>
        </AdaptiveGraphCanvas>
        
        <IntelligencePanel>
          <EntityDetails />
          <IntelligenceLayers />
          <ActionSuggestions />
        </IntelligencePanel>
        
      </SelectionProvider>
    </ViewportProvider>
  </IntelligenceProvider>
</JourneyIntelligenceView>
```

**Subtask 6.2: Reuse Existing Components**
```javascript
// Map existing to new architecture
const componentMapping = {
  // Existing → New Role
  'EntityNode': 'Universal node component',
  'RelationshipMapper': 'Relationship view mode',
  'JourneyGraphView': 'Journey view mode',
  'DependencyChoreographer': 'Production intelligence overlay',
  'WorkflowContext': 'Cross-session persistence'
};
```

**Subtask 6.3: New Components Needed**
```javascript
// Minimal new components
const newComponents = {
  'AdaptiveGraphCanvas': 'Switches between view modes',
  'IntelligencePanel': 'Shows contextual analysis',
  'IntelligenceToggles': 'Layer activation UI',
  'PerformanceIndicator': 'Node count and performance'
};
```

### Action Items
1. Create component hierarchy diagram
2. Map existing components to new roles
3. Identify minimal new components needed
4. Define prop interfaces

---

## Anti-Overengineering Checklist

Before implementing anything, ask:

1. **Does this already exist?** Check RelationshipMapper and JourneyGraphView
2. **Can we extend instead of replace?** Enhance journeyStore vs new store
3. **Is this complexity necessary?** Start simple, add intelligence gradually
4. **Are we storing derived data?** Keep calculations in React Query
5. **Can existing patterns work?** Use current API and caching patterns

---

## Day 4 Deliverables

### Morning Output
1. **INTERACTION_MODEL.md** - How users interact with hybrid views
   - Selection behavior specification
   - Context switching patterns
   - Navigation state machine
   - Performance boundaries

### Afternoon Output
2. **STATE_MANAGEMENT.md** - Technical architecture for hybrid views
   - Enhanced Zustand store design
   - React Query composition patterns
   - Component hierarchy
   - Data flow diagrams

---

## Success Criteria

1. **Simplicity**: Solutions use existing patterns wherever possible
2. **Performance**: Clear budgets for nodes, transitions, and loading
3. **Clarity**: Other developers can understand and extend
4. **Reusability**: Maximize use of existing components
5. **Testability**: Clear boundaries between UI state and data

---

*"The best architecture is invisible - it just works."*  
— Sarah Chen