# Element Visibility Strategy

**Date**: January 9, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Purpose**: Define when elements appear as nodes vs details to maintain performance while preserving their critical role

---

## Executive Summary

Elements are the fundamental communication medium between designers and players - the physical and digital artifacts that carry story, enable puzzles, and create the memory token economy. With 100+ elements touching every aspect of the game, we must carefully orchestrate their visibility to provide complete design intelligence without overwhelming the 50-node performance boundary.

---

## Element Types & Characteristics

### Basic Types (from Notion)
1. **Set Dressing** - Environmental elements that create atmosphere
2. **Prop** - Physical items players can interact with
3. **Memory Token Video** - Digital video content with RFID
4. **Memory Token Audio** - Digital audio content with RFID
5. **Memory Token Image** - Digital image content with RFID
6. **Memory Token Audio + Image** - Combined media with RFID

### Key Element Attributes
- **Story Connection**: Links to timeline events via `timeline_event_id`
- **Ownership**: Character who starts with element via `owner_id`
- **Container**: Where element is found via `container_id`
- **Economic Value**: Memory tokens have `calculated_memory_value`
- **Production Status**: Ready/In Development/Idea
- **RFID Status**: For memory tokens

---

## Core Visibility Principles

### 1. Context Determines Visibility
Elements transform between nodes and details based on the current view context and user task.

### 2. Information Density Management
Never show all 100+ elements as nodes. Maximum 50 total nodes including all entity types.

### 3. Progressive Disclosure
Start with aggregated views, expand to individual elements on demand.

### 4. Task-Oriented Display
Show elements as nodes when they're central to the current design task.

---

## Visibility Rules by Context

### Character Journey Context
**When viewing a character's complete journey:**

**Elements as Nodes**:
- Elements the character owns (starting inventory)
- Elements the character must acquire (puzzle requirements)
- High-value memory tokens that affect path choices
- Elements revealing critical timeline events

**Elements as Details**:
- Complete element list in character inventory panel
- Elements mentioned in timeline events
- Potential elements the character could access

**Aggregation Strategy**:
```javascript
// Group by element type when >10 elements
{
  nodeType: 'element-group',
  label: 'Memory Tokens (12)',
  children: ['element_1', 'element_2', ...],
  aggregatedValue: 15000,
  expandable: true
}
```

### Puzzle Workspace Context
**When designing or analyzing puzzles:**

**Elements as Nodes**:
- Required input elements (what players need)
- Reward elements (what players get)
- Container elements (where rewards are stored)
- Key collaborative elements (shared between characters)

**Elements as Details**:
- Alternative elements that could work
- Production notes for physical props
- RFID programming status

**Visual Distinction**:
```javascript
// Different node styles for element roles
const elementNodeStyles = {
  required: { 
    border: '2px dashed #ff9800', 
    icon: 'input' 
  },
  reward: { 
    border: '2px solid #4caf50', 
    icon: 'output',
    showValue: true 
  },
  container: { 
    border: '2px solid #2196f3', 
    icon: 'inventory' 
  }
};
```

### Timeline Event Context
**When working with narrative elements:**

**Elements as Nodes**:
- Elements that reveal this timeline event
- Memory tokens containing related evidence
- Critical props for the scene

**Elements as Details**:
- All elements referenced in event description
- Production requirements
- Token values and economic impact

**Revelation Mapping**:
```javascript
// Show which elements reveal which events
{
  timelineEvent: 'Victoria records voice memo',
  revealingElements: [
    { 
      id: 'element_voice_recorder',
      type: 'Memory Token Audio',
      value: 3000,
      currentLocation: 'Sarah\'s jewelry box'
    }
  ]
}
```

### Economic Analysis Context
**When balancing token economy:**

**Elements as Nodes**:
- High-value tokens (>3000 value)
- Set completion tokens
- Path-critical tokens
- Corrupted memory tokens

**Elements as Details**:
- Complete token inventory by character
- Value calculations and multipliers
- Group bonus potential

**Economic Aggregation**:
```javascript
// Group by value tiers
const valueGroups = {
  highValue: { // >3000
    nodes: ['element_1', 'element_2'],
    totalValue: 12000,
    pathImpact: 'High pressure on Black Market'
  },
  mediumValue: { // 1000-3000
    nodes: ['element_3', 'element_4'],
    totalValue: 8000
  },
  lowValue: { // <1000
    count: 23,
    totalValue: 5000,
    showAsAggregate: true
  }
};
```

### Production Planning Context
**When preparing for playtest:**

**Elements as Nodes**:
- Elements missing physical props
- Elements with RFID issues
- Elements blocking character journeys
- Shared collaborative props

**Elements as Details**:
- Complete prop manifest
- RFID programming checklist
- Backup prop suggestions

**Production Criticality**:
```javascript
// Highlight by production status
const productionPriority = {
  critical: {
    color: '#f44336',
    elements: elementsBlockingMultipleJourneys
  },
  important: {
    color: '#ff9800',
    elements: elementsForKeyPuzzles
  },
  standard: {
    color: '#4caf50',
    elements: elementsReady
  }
};
```

---

## Interaction Patterns

### Element Selection
**Click element node** → Entity Intelligence Panel shows:
- Complete timeline connections
- Character accessibility analysis
- Economic impact breakdown
- Production requirements

**Hover element node** → Quick preview shows:
- Name and type
- Current value (if memory token)
- Owner/location
- Production status

### Element Filtering
**Global filters affect all contexts**:
```javascript
const elementFilters = {
  byType: ['Prop', 'Memory Token Video', ...],
  byStatus: ['Ready', 'In Development', 'Idea'],
  byValue: { min: 0, max: 10000 },
  byOwner: characterList,
  byRFID: ['Programmed', 'Pending', 'Not Needed']
};
```

### Element Grouping
**Automatic grouping when element count exceeds thresholds**:
- >10 elements of same type → Type group
- >15 elements for character → Inventory summary
- >20 elements in view → Smart clustering

**User-controlled grouping**:
- Group by timeline event
- Group by container
- Group by value tier
- Group by production status

---

## Performance Optimization

### Visibility Calculation
```javascript
function calculateElementVisibility(context, elements, currentNodeCount) {
  const maxElements = 50 - currentNodeCount;
  
  // Priority 1: Task-critical elements
  const critical = elements.filter(e => 
    isTaskCritical(e, context)
  ).slice(0, maxElements * 0.6);
  
  // Priority 2: High-value elements
  const highValue = elements.filter(e => 
    e.calculated_memory_value > 3000
  ).slice(0, maxElements * 0.3);
  
  // Priority 3: Recently modified
  const recent = elements.filter(e => 
    wasRecentlyModified(e)
  ).slice(0, maxElements * 0.1);
  
  return [...critical, ...highValue, ...recent];
}
```

### Progressive Loading
```javascript
// Load element details on demand
const useElementDetails = (elementId, detailLevel) => {
  return useQuery(
    ['element', elementId, detailLevel],
    () => api.getElementDetails(elementId, detailLevel),
    {
      enabled: detailLevel > 'basic',
      staleTime: 5 * 60 * 1000
    }
  );
};
```

### Aggregation Performance
```javascript
// Pre-compute common aggregations
const elementAggregations = {
  byType: groupBy(elements, 'type'),
  byOwner: groupBy(elements, 'owner_id'),
  byValue: groupBy(elements, e => getValueTier(e.calculated_memory_value)),
  byStatus: groupBy(elements, 'status')
};
```

---

## Visual Design Language

### Element Node Variations
```javascript
const ElementNode = ({ element, context, role }) => {
  const baseStyle = {
    shape: 'diamond', // Distinct from character circles
    size: getNodeSize(element.calculated_memory_value),
    color: getElementColor(element.type)
  };
  
  const contextStyle = getContextStyle(context, role);
  const statusStyle = getStatusStyle(element.status);
  
  return (
    <Node 
      style={{...baseStyle, ...contextStyle, ...statusStyle}}
      icon={getElementIcon(element.type)}
      badge={element.rfid_tag ? 'RFID' : null}
    />
  );
};
```

### Color Coding
```javascript
const elementColors = {
  // By type
  'Set Dressing': '#9e9e9e',
  'Prop': '#795548',
  'Memory Token Video': '#9c27b0',
  'Memory Token Audio': '#673ab7',
  'Memory Token Image': '#3f51b5',
  'Memory Token Audio + Image': '#7b1fa2',
  
  // By status overlay
  'Ready': { opacity: 1.0 },
  'In Development': { opacity: 0.7, pattern: 'stripes' },
  'Idea': { opacity: 0.5, pattern: 'dots' }
};
```

### Size Encoding
```javascript
// Node size represents value/importance
const getNodeSize = (value) => {
  if (!value) return 'small';
  if (value > 5000) return 'large';
  if (value > 1000) return 'medium';
  return 'small';
};
```

---

## Implementation Strategy

### Phase 1: Basic Visibility Rules
```javascript
// Start with simple context-based filtering
const getVisibleElements = (context, elements) => {
  switch(context.type) {
    case 'character-journey':
      return elements.filter(e => 
        e.owner_id === context.characterId ||
        context.requiredElements.includes(e.id)
      );
    case 'puzzle-workspace':
      return elements.filter(e =>
        context.puzzle.required_elements.includes(e.id) ||
        context.puzzle.reward_ids.includes(e.id)
      );
    // ... other contexts
  }
};
```

### Phase 2: Smart Aggregation
```javascript
// Add intelligent grouping
const aggregateElements = (elements, threshold = 10) => {
  if (elements.length <= threshold) return elements;
  
  return Object.entries(groupBy(elements, 'type'))
    .map(([type, items]) => ({
      type: 'element-aggregate',
      elementType: type,
      count: items.length,
      totalValue: sum(items.map(i => i.calculated_memory_value)),
      items: items.map(i => i.id)
    }));
};
```

### Phase 3: Progressive Enhancement
```javascript
// Add progressive disclosure
const ElementAggregate = ({ aggregate, onExpand }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!expanded) {
    return (
      <AggregateNode 
        label={`${aggregate.elementType} (${aggregate.count})`}
        value={aggregate.totalValue}
        onClick={() => setExpanded(true)}
      />
    );
  }
  
  return (
    <ExpandedGroup>
      {aggregate.items.map(id => 
        <ElementNode key={id} elementId={id} />
      )}
    </ExpandedGroup>
  );
};
```

---

## Success Metrics

### Performance Metrics
- Never exceed 50 total nodes
- Element filtering <100ms
- Aggregation calculation <50ms
- Progressive expansion <200ms

### Usability Metrics
- Designers find needed elements in <10 seconds
- Context switches preserve element selection
- Aggregations reduce visual complexity by 70%
- Critical elements always visible

### Design Confidence
- "I can see all elements affecting this decision"
- "I understand element dependencies instantly"
- "I know which elements need production work"
- "I can balance token economy effectively"

---

## Edge Cases & Solutions

### Sparse Data
**Problem**: Character with no elements  
**Solution**: Show "No elements" state with creation prompts

### Dense Relationships
**Problem**: Element connected to everything  
**Solution**: Prioritize by current context, aggregate others

### Mixed Element Types
**Problem**: Puzzle requiring 20 different elements  
**Solution**: Group by availability, show critical path

### Production Chaos
**Problem**: 50 elements need props  
**Solution**: Priority matrix view with filters

---

## Future Considerations

### Phase 2: Creation Mode
- Element creation appears inline
- Templates for common element types
- Auto-calculation of values
- Production requirement generator

### Phase 3: Real-time Sync
- Live element status updates
- Collaborative prop tracking
- RFID programming queue

### Phase 4: Multi-user
- See who's working on which elements
- Lock elements during editing
- Conflict resolution for values

---

## Conclusion

Elements must be first-class citizens in our interface while respecting performance boundaries. By implementing context-aware visibility, progressive disclosure, and intelligent aggregation, we can show designers exactly the elements they need for any design decision without overwhelming the interface.

The key insight: **Elements should appear as nodes when they're the subject of design decisions, and as details when they're supporting information.**

---

*"Elements are the atoms of our game universe. Like atoms, they're everywhere but only visible when you're looking at the right scale."*  
— Sarah Chen