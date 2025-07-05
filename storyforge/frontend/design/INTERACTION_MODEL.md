# Interaction Model: Entity-Level Design Intelligence
**Date**: January 10, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Status**: Day 4 Morning - Interaction Design  
**Principle**: Enhance existing patterns, don't replace

---

## Executive Summary

The interaction model defines how designers select entities and receive intelligence without losing context. We enhance the existing journeyStore selection pattern to trigger intelligent view adaptations based on entity type and design task.

**Core Concept**: Selection drives intelligence, not navigation.

---

## Selection Behavior Specification

### Current State (What We Keep)
```javascript
// journeyStore.js already has:
selectedNode: null,
setSelectedNode: (node) => set({ selectedNode: node })
```

### Enhanced Selection Pattern
```javascript
// Minimal enhancement to journeyStore
selectedEntity: {
  id: null,
  type: null,        // character | element | puzzle | timeline_event
  source: null,      // graph | search | breadcrumb | intelligence_panel
  timestamp: null,
  previousContext: null  // For breadcrumb navigation
},

selectionHistory: [],    // Max 5 items for breadcrumbs
activeIntelligence: ['story', 'social'],  // Currently active layers
```

### Selection Sources & Behaviors

#### 1. Graph Selection (Primary)
- **Trigger**: Click on node in ReactFlow canvas
- **Behavior**: Immediate focus transition with intelligence calculation
- **Visual**: Selected node highlighted, related nodes emphasized
- **Context**: Preserves zoom/pan position

#### 2. Search Selection
- **Trigger**: Select from search results overlay
- **Behavior**: Graph centers on entity, triggers intelligence
- **Visual**: Smooth pan/zoom to entity location
- **Context**: Adds to selection history

#### 3. Intelligence Panel Selection  
- **Trigger**: Click related entity in intelligence analysis
- **Behavior**: Contextual transition maintaining analysis thread
- **Visual**: Breadcrumb shows relationship path
- **Context**: Preserves previous entity in history

#### 4. Breadcrumb Selection
- **Trigger**: Click previous entity in breadcrumb trail
- **Behavior**: Returns to exact previous state
- **Visual**: Reverses any view adaptations
- **Context**: Pops from history stack

---

## Context Switching Patterns

### Entity Type → View Adaptation Rules

```javascript
const entityViewAdaptations = {
  character: {
    primaryFocus: 'journey_timeline',
    visibleElements: 'owned_and_accessible',
    nodeEmphasis: ['timeline_events', 'puzzles', 'elements'],
    maxNodes: 40,
    defaultIntelligence: ['story', 'social'],
    contextPanel: 'character_analysis'
  },
  
  element: {
    primaryFocus: 'impact_web', 
    visibleElements: 'usage_and_dependencies',
    nodeEmphasis: ['owning_character', 'containing_puzzle', 'revealing_timeline'],
    maxNodes: 30,
    defaultIntelligence: ['story', 'economic'],
    contextPanel: 'element_impact'
  },
  
  puzzle: {
    primaryFocus: 'social_choreography',
    visibleElements: 'participants_and_requirements',
    nodeEmphasis: ['required_elements', 'participating_characters', 'rewards'],
    maxNodes: 35,
    defaultIntelligence: ['social', 'production'],
    contextPanel: 'puzzle_design'
  },
  
  timeline_event: {
    primaryFocus: 'narrative_connections',
    visibleElements: 'evidence_and_discovery',
    nodeEmphasis: ['revealing_elements', 'discovering_characters', 'related_events'],
    maxNodes: 30,
    defaultIntelligence: ['story', 'gaps'],
    contextPanel: 'timeline_analysis'
  }
};
```

### Context Preservation Strategy

#### What We Preserve
1. **Graph State** (via existing WorkflowContext)
   - Zoom level and center position
   - Active filters
   - Collapsed/expanded node groups
   
2. **Selection State** (enhanced journeyStore)
   - Current entity and its type
   - Active intelligence layers
   - Selection history (max 5)
   
3. **Intelligence State** (React Query cache)
   - Calculated intelligence data
   - Related entity analysis
   - Performance metrics

#### Context Switching Flow
```
1. User selects new entity
2. Store previous context in history
3. Determine view adaptation based on entity type
4. Trigger intelligence calculation (React Query)
5. Adapt graph view (node visibility, emphasis)
6. Update intelligence panel
7. Maintain visual continuity (smooth transitions)
```

---

## View Transformation Rules

### Transformation Triggers
1. **Entity Selection**: Primary trigger for view adaptation
2. **Intelligence Toggle**: Overlays additional analysis
3. **Performance Threshold**: Reduces nodes if >50 visible
4. **User Override**: Manual view mode selection

### Visual Adaptation Principles

#### Node Visibility Rules
```javascript
function calculateVisibleNodes(selectedEntity, viewMode, allNodes) {
  const rules = entityViewAdaptations[selectedEntity.type];
  
  // 1. Always show selected entity
  const visible = new Set([selectedEntity.id]);
  
  // 2. Add directly connected entities
  const connected = getDirectlyConnected(selectedEntity, rules.nodeEmphasis);
  connected.forEach(id => visible.add(id));
  
  // 3. Add contextually relevant entities
  if (visible.size < rules.maxNodes) {
    const relevant = getRelevantByIntelligence(selectedEntity, activeIntelligence);
    relevant.forEach(id => {
      if (visible.size < rules.maxNodes) visible.add(id);
    });
  }
  
  // 4. Apply aggregation if still over limit
  if (visible.size > rules.maxNodes) {
    return applyAggregation(visible, selectedEntity);
  }
  
  return visible;
}
```

#### Visual Emphasis Hierarchy
1. **Selected Entity**: 100% opacity, larger size, highlight color
2. **Directly Connected**: 90% opacity, normal size, themed color
3. **Intelligence Relevant**: 80% opacity, normal size
4. **Context Nodes**: 60% opacity, smaller size
5. **Aggregated Groups**: 40% opacity, cluster visualization

### Smooth Transition Patterns

#### Transition Timing
- Node visibility changes: 300ms fade
- Graph pan/zoom: 500ms ease-in-out  
- Intelligence panel update: 200ms after selection
- Breadcrumb update: Immediate

#### Transition Coordination
```javascript
async function handleEntitySelection(entity) {
  // 1. Immediate: Update selection state
  setSelectedEntity(entity);
  
  // 2. Quick: Start intelligence calculation
  const intelligencePromise = queryClient.fetchQuery({
    queryKey: ['intelligence', entity.id, activeIntelligence],
    queryFn: () => calculateIntelligence(entity, activeIntelligence)
  });
  
  // 3. Smooth: Adapt view with transitions
  await adaptGraphView(entity, {
    duration: 500,
    easing: 'ease-in-out'
  });
  
  // 4. Update: Intelligence panel when ready
  const intelligence = await intelligencePromise;
  updateIntelligencePanel(intelligence);
}
```

---

## Navigation State Machine

### States
```javascript
const NavigationStates = {
  OVERVIEW: {
    description: 'Initial state showing all characters',
    visibleNodes: 'all_characters',
    maxNodes: 20,
    intelligence: 'summary',
    transitions: ['ENTITY_FOCUS', 'SEARCH']
  },
  
  ENTITY_FOCUS: {
    description: 'Entity selected with contextual visibility',
    visibleNodes: 'selected_plus_context',
    maxNodes: 50,
    intelligence: 'detailed',
    transitions: ['ENTITY_FOCUS', 'INTELLIGENCE_DEEP', 'OVERVIEW']
  },
  
  INTELLIGENCE_DEEP: {
    description: 'Specific intelligence layer activated',
    visibleNodes: 'filtered_by_intelligence',
    maxNodes: 30,
    intelligence: 'specialized',
    transitions: ['ENTITY_FOCUS', 'INTELLIGENCE_DEEP', 'OVERVIEW']
  },
  
  SEARCH: {
    description: 'Search overlay active',
    visibleNodes: 'current_plus_results',
    maxNodes: 40,
    intelligence: 'current',
    transitions: ['ENTITY_FOCUS', 'OVERVIEW']
  }
};
```

### State Transitions
```javascript
const stateTransitions = {
  selectEntity: (currentState, entity) => {
    // Any state can transition to ENTITY_FOCUS
    return {
      nextState: 'ENTITY_FOCUS',
      context: { selectedEntity: entity }
    };
  },
  
  activateIntelligence: (currentState, layer) => {
    // Only from ENTITY_FOCUS
    if (currentState === 'ENTITY_FOCUS') {
      return {
        nextState: 'INTELLIGENCE_DEEP',
        context: { intelligenceLayer: layer }
      };
    }
    return null;
  },
  
  clearSelection: (currentState) => {
    // Return to OVERVIEW from any state
    return {
      nextState: 'OVERVIEW',
      context: { selectedEntity: null }
    };
  }
};
```

---

## Performance Boundaries

### Hard Limits
- **Maximum Visible Nodes**: 50 (ReactFlow performance threshold)
- **Selection Response**: <100ms for state update
- **View Transition**: <500ms for completion
- **Intelligence Calculation**: <200ms for initial display
- **Total Interaction**: <1 second from click to intelligence

### Performance Optimization Strategies

#### 1. Progressive Intelligence Loading
```javascript
// Immediate: Basic entity data
const quickIntelligence = getBasicIntelligence(entity); // <50ms

// Fast: Directly connected analysis  
const connectedIntelligence = await getConnectedAnalysis(entity); // <200ms

// Background: Deep intelligence calculation
const deepIntelligence = await getDeepAnalysis(entity); // <2s
```

#### 2. Node Visibility Optimization
- Use CSS transforms for show/hide (GPU accelerated)
- Batch DOM updates in single frame
- Virtualize nodes outside viewport
- Aggregate similar nodes into groups

#### 3. Interaction Debouncing
- Selection: Immediate (no debounce)
- Intelligence toggle: 150ms debounce
- Search: 300ms debounce
- Zoom/pan: Throttle to 60fps

---

## Multi-Select Considerations

### When Multi-Select is Enabled
- Comparing entities (side-by-side intelligence)
- Bulk operations (future phases)
- Relationship analysis between specific entities

### Multi-Select Behavior
```javascript
multiSelectMode: {
  enabled: false,  // Default single-select
  maxSelections: 3,  // Performance limit
  behavior: 'comparative',  // How intelligence adapts
  
  handleSelection: (entity) => {
    if (selectedEntities.length < maxSelections) {
      addToSelection(entity);
      showComparativeIntelligence(selectedEntities);
    } else {
      replaceOldestSelection(entity);
    }
  }
}
```

---

## Keyboard Shortcuts

### Navigation
- `Tab`: Cycle through visible nodes
- `Enter`: Select focused node
- `Esc`: Clear selection / Exit mode
- `Backspace`: Navigate breadcrumb back

### Intelligence Control  
- `1-5`: Toggle intelligence layers
- `Space`: Show/hide intelligence panel
- `I`: Focus intelligence panel
- `S`: Focus search

### View Control
- `F`: Fit view to visible nodes
- `O`: Return to overview
- `+/-`: Zoom in/out

---

## Error States & Recovery

### Selection Errors
```javascript
const selectionErrorHandling = {
  entityNotFound: {
    behavior: 'Show error toast, maintain current state',
    recovery: 'Clear invalid selection from history'
  },
  
  intelligenceTimeout: {
    behavior: 'Show partial data with loading indicator',
    recovery: 'Retry in background, update when ready'
  },
  
  performanceThreshold: {
    behavior: 'Auto-aggregate nodes, show notice',
    recovery: 'Provide manual override option'
  }
};
```

---

## Interaction Metrics

### What We Track
1. **Selection Patterns**
   - Most selected entity types
   - Selection source distribution
   - Context switching frequency
   
2. **Performance Metrics**
   - Selection response times
   - View adaptation duration
   - Intelligence calculation time
   
3. **User Behavior**
   - Intelligence layer usage
   - Breadcrumb navigation depth
   - Search vs direct selection ratio

### Success Indicators
- Average selection → intelligence: <1 second
- Context switches per session: <10
- Breadcrumb usage: >30% of navigations
- Performance warnings: <5% of interactions

---

## Implementation Priority

### Phase 1 (Day 4)
1. ✓ Enhanced selection state in journeyStore
2. ✓ Entity type → view adaptation rules
3. ✓ Basic context preservation
4. ✓ Performance boundaries

### Phase 2 (Week 2)
1. Navigation state machine
2. Smooth transitions
3. Keyboard shortcuts
4. Multi-select mode

### Phase 3 (Week 3)
1. Advanced aggregation
2. Interaction metrics
3. Performance optimization
4. Error recovery

---

*"Selection is a question. Intelligence is the answer. The interaction model is the conversation."*  
— Sarah Chen