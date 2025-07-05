# ALNTool TDD Test Suite Design

**Version**: 1.0  
**Date**: January 15, 2025  
**Purpose**: Comprehensive test-driven development plan for ALNTool rebuild  

---

## Test Philosophy

### Core Principles
1. **Behavior over Implementation**: Test what the tool does, not how
2. **Resilience over Perfection**: Handle incomplete/invalid data gracefully
3. **Patterns over Counts**: Don't test for "exactly 22 characters"
4. **User Journeys over Units**: Focus on complete workflows
5. **Progressive Enhancement**: Each phase's tests must pass independently

### Design Tool Testing Approach
```javascript
// DON'T: Test for specific data
expect(characters.length).toBe(22);

// DO: Test for behavior patterns
expect(renderer.canHandleEntityCount(characters.length)).toBe(true);
expect(selection.worksWithAnyEntity(characters[0])).toBe(true);
```

---

## Test Suite Organization

```
storyforge/
├── frontend/
│   ├── src/
│   │   ├── behaviors/__tests__/          # Core behavior tests
│   │   ├── workflows/__tests__/          # User journey tests
│   │   ├── components/__tests__/         # Component integration
│   │   ├── intelligence/__tests__/       # Intelligence calculations
│   │   ├── visual/__tests__/            # Visual hierarchy system
│   │   └── phases/__tests__/            # Phase-specific features
│   └── e2e/
│       ├── designer-workflows/          # Complete user scenarios
│       └── performance/                 # Scale testing
└── backend/
    ├── src/
    │   ├── api/__tests__/              # Endpoint contracts
    │   ├── relationships/__tests__/     # Edge generation
    │   ├── sync/__tests__/             # Notion integration
    │   └── transformers/__tests__/     # Data transformation
    └── integration/
        └── system/__tests__/           # Full stack tests
```

---

## Frontend Test Files

### 1. Core Behaviors (`behaviors/__tests__/`)

#### `entitySelection.test.js`
```javascript
describe('Entity Selection Behavior', () => {
  describe('Resilient Selection', () => {
    test('preserves entity ID through selection cycle');
    test('handles selection of any entity type');
    test('recovers from corrupted selection state');
    test('maintains selection through re-renders');
  });

  describe('Selection State Management', () => {
    test('updates store with complete entity data');
    test('triggers intelligence panel update');
    test('highlights connected entities');
    test('clears selection on background click');
  });
});
```

#### `dataResilience.test.js`
```javascript
describe('Design Tool Data Resilience', () => {
  describe('Incomplete Data Handling', () => {
    test('renders entities with missing relationships');
    test('shows partial information clearly');
    test('indicates data gaps without breaking');
    test('handles null/undefined gracefully');
  });

  describe('Evolving Data Support', () => {
    test('adapts to new entity types');
    test('preserves unknown fields');
    test('handles schema changes');
    test('works with minimal required fields');
  });
});
```

#### `visualHierarchy.test.js`
```javascript
describe('Visual Hierarchy System', () => {
  describe('No Aggregation Approach', () => {
    test('renders all entities without grouping');
    test('applies opacity based on selection state');
    test('scales nodes by relationship distance');
    test('transitions smoothly between states');
  });

  describe('Performance at Scale', () => {
    test('maintains 60fps with 400+ nodes');
    test('applies visual hierarchy efficiently');
    test('handles rapid selection changes');
    test('optimizes render cycles');
  });
});
```

### 2. Relationship Visualization (`visual/__tests__/`)

#### `edgeGeneration.test.js`
```javascript
describe('Comprehensive Edge Generation', () => {
  describe('All Relationship Types', () => {
    test('creates character-character edges from links');
    test('creates ownership edges when owner exists');
    test('creates container hierarchy edges');
    test('creates puzzle requirement edges');
    test('creates puzzle reward edges');
    test('creates timeline revelation edges');
  });

  describe('Edge Resilience', () => {
    test('skips edges with missing endpoints');
    test('handles circular references');
    test('deduplicates redundant edges');
    test('validates edge data before rendering');
  });
});
```

#### `edgeVisualization.test.js`
```javascript
describe('Edge Visual Design', () => {
  describe('Relationship Type Styling', () => {
    test('styles ownership edges distinctly');
    test('shows edge strength through opacity');
    test('uses appropriate edge routing');
    test('handles edge bundling for clarity');
  });

  describe('Interactive Edge Behavior', () => {
    test('highlights edges on hover');
    test('shows edge details on click');
    test('animates edge state changes');
    test('maintains performance with many edges');
  });
});
```

### 3. Intelligence Calculations (`intelligence/__tests__/`)

#### `economicIntelligence.test.js`
```javascript
describe('Economic Intelligence Layer', () => {
  describe('Token Value Calculations', () => {
    test('sums accessible token values correctly');
    test('applies group multipliers when complete');
    test('calculates path balance percentages');
    test('identifies economic pressure points');
  });

  describe('Impact Analysis', () => {
    test('shows value changes on token modification');
    test('calculates ripple effects through ownership');
    test('identifies balance warnings');
    test('suggests economic adjustments');
  });
});
```

#### `socialIntelligence.test.js`
```javascript
describe('Social Intelligence Layer', () => {
  describe('Interaction Requirements', () => {
    test('identifies required collaborations');
    test('maps element dependencies between characters');
    test('calculates social load per character');
    test('finds interaction bottlenecks');
  });

  describe('Choreography Analysis', () => {
    test('visualizes forced interactions');
    test('shows collaboration patterns');
    test('identifies isolated characters');
    test('suggests social rebalancing');
  });
});
```

#### `contentGaps.test.js`
```javascript
describe('Content Gap Intelligence', () => {
  describe('Gap Identification', () => {
    test('finds characters without backstory');
    test('identifies unconnected timeline events');
    test('locates orphaned elements');
    test('discovers missing revelations');
  });

  describe('Integration Opportunities', () => {
    test('suggests element connections');
    test('proposes timeline linkages');
    test('recommends puzzle placements');
    test('prioritizes gap filling');
  });
});
```

### 4. User Workflows (`workflows/__tests__/`)

#### `searchSelectAnalyze.test.js`
```javascript
describe('Primary Designer Workflow', () => {
  describe('Search → Select → Analyze', () => {
    test('searches any entity in <100ms');
    test('autocomplete shows grouped results');
    test('selection updates graph immediately');
    test('intelligence panel shows impact');
  });

  describe('Complete Journey', () => {
    test('user can make design decision in <2min');
    test('workflow handles interruptions');
    test('state persists through refresh');
    test('provides clear next actions');
  });
});
```

#### `progressiveExploration.test.js`
```javascript
describe('Progressive Loading Workflow', () => {
  describe('Gradual Complexity', () => {
    test('starts with character-only view');
    test('loads entity types on demand');
    test('maintains performance throughout');
    test('shows clear loading states');
  });

  describe('Entity Type Management', () => {
    test('toggles element visibility correctly');
    test('preserves selections during load');
    test('updates counts accurately');
    test('handles rapid toggling');
  });
});
```

### 5. Phase-Specific Features (`phases/__tests__/`)

#### `phase1-readOnly.test.js`
```javascript
describe('Phase 1: Read-Only Intelligence', () => {
  test('all intelligence layers show real data');
  test('no editing capabilities present');
  test('complete edge visualization working');
  test('search and selection fully functional');
  test('visual hierarchy system complete');
});
```

#### `phase2-preview.test.js`
```javascript
describe('Phase 2: Creation Preview', () => {
  test('can create draft entities locally');
  test('preview shows impact without saving');
  test('validates balance before commit');
  test('exports to Notion format correctly');
  test('maintains read-only features');
});
```

#### `phase3-editing.test.js`
```javascript
describe('Phase 3: Full Editing', () => {
  test('edit mode toggle works correctly');
  test('inline editing updates immediately');
  test('changes queue for Notion sync');
  test('conflict resolution handles edge cases');
  test('version history tracks all changes');
});
```

#### `phase4-collaboration.test.js`
```javascript
describe('Phase 4: Real-Time Collaboration', () => {
  test('shows other users cursors');
  test('prevents simultaneous edits');
  test('broadcasts changes <100ms');
  test('handles connection drops gracefully');
  test('merges concurrent modifications');
});
```

---

## Backend Test Files

### 1. API Contracts (`api/__tests__/`)

#### `relationshipEndpoints.test.js`
```javascript
describe('Relationship API Endpoints', () => {
  describe('GET /api/elements/relationships', () => {
    test('returns ownership relationships');
    test('includes container hierarchies');
    test('handles missing relationships');
    test('uses consistent ID format');
  });

  describe('GET /api/puzzles/dependencies', () => {
    test('returns requirement edges');
    test('includes reward connections');
    test('validates edge endpoints exist');
    test('formats for frontend consumption');
  });
});
```

#### `entityTransformation.test.js`
```javascript
describe('Entity Data Transformation', () => {
  describe('Notion to API Format', () => {
    test('flattens nested owner arrays');
    test('preserves all relationship IDs');
    test('adds entityCategory field');
    test('handles missing fields gracefully');
  });

  describe('Consistency Guarantees', () => {
    test('maintains ID integrity');
    test('uses consistent field names');
    test('preserves unknown fields');
    test('validates data types');
  });
});
```

### 2. Edge Generation (`relationships/__tests__/`)

#### `comprehensiveEdges.test.js`
```javascript
describe('Complete Edge Generation', () => {
  describe('All Relationship Types', () => {
    test('generates ownership edges from character_elements');
    test('creates container edges from element hierarchy');
    test('builds puzzle dependencies from requirements');
    test('connects timeline events to revealing elements');
  });

  describe('Edge Validation', () => {
    test('only creates edges with valid endpoints');
    test('handles circular dependencies');
    test('prevents duplicate edges');
    test('maintains referential integrity');
  });
});
```

### 3. Integration Tests (`integration/system/__tests__/`)

#### `fullStackFlow.test.js`
```javascript
describe('Full Stack Data Flow', () => {
  describe('Notion → Frontend Journey', () => {
    test('syncs data from Notion correctly');
    test('transforms through API layer');
    test('renders in frontend accurately');
    test('maintains relationships throughout');
  });

  describe('User Action → Notion Update', () => {
    test('captures frontend changes');
    test('queues for backend sync');
    test('updates Notion correctly');
    test('handles sync conflicts');
  });
});
```

---

## E2E Test Scenarios

### 1. Designer Workflows (`e2e/designer-workflows/`)

#### `experienceDesigner.spec.js`
```javascript
describe('Experience Designer Complete Workflow', () => {
  test('Sarah designs character journey', async () => {
    // Search for Victoria
    await searchEntity('Victoria');
    await selectCharacter('Victoria Chen');
    
    // Analyze current state
    await viewIntelligenceLayer('Story');
    await identifyContentGaps();
    
    // Create new content (Phase 2+)
    await createTimelineEvent({
      name: 'Victoria discovers affair',
      reveals: 'Marcus relationship'
    });
    
    // Preview impact
    await previewEconomicImpact();
    await validateSocialBalance();
    
    // Save changes
    await exportToNotion();
  });
});
```

#### `puzzleDesigner.spec.js`
```javascript
describe('Puzzle Designer Balancing Workflow', () => {
  test('Marcus rebalances puzzle rewards', async () => {
    // Find problematic puzzle
    await searchEntity('Jewelry Box');
    await selectPuzzle('Sarah\'s Jewelry Box');
    
    // Check current impact
    await viewIntelligenceLayer('Economic');
    await identifyImbalance();
    
    // Modify reward values
    await adjustRewardValue(3000);
    await previewPathBalance();
    
    // Verify social impact
    await checkRequiredInteractions();
    await validateAccessibility();
  });
});
```

### 2. Performance Tests (`e2e/performance/`)

#### `scaleTest.spec.js`
```javascript
describe('Performance at Scale', () => {
  test('handles 400+ entities smoothly', async () => {
    // Load all entity types
    await loadAllCharacters();
    await progressiveLoad('elements');
    await progressiveLoad('puzzles');
    await progressiveLoad('timeline');
    
    // Measure performance
    expect(await getFPS()).toBeGreaterThan(30);
    expect(await getMemoryUsage()).toBeLessThan(200);
    
    // Test interactions
    await rapidSelection(10);
    expect(await getResponseTime()).toBeLessThan(100);
  });
});
```

---

## Test Implementation Priority

### Week 1: Foundation Tests (Phase 1 Critical Path)
1. `entitySelection.test.js` - Fix selection bug
2. `edgeGeneration.test.js` - Add missing edges
3. `searchSelectAnalyze.test.js` - Core workflow
4. `visualHierarchy.test.js` - No aggregation approach
5. `relationshipEndpoints.test.js` - API contracts

### Week 2: Intelligence & Performance
1. `economicIntelligence.test.js` - Real calculations
2. `socialIntelligence.test.js` - Interaction mapping
3. `contentGaps.test.js` - Gap identification
4. `scaleTest.spec.js` - 400+ entity handling
5. `dataResilience.test.js` - Incomplete data

### Week 3: Polish & Preparation
1. `progressiveExploration.test.js` - Loading UX
2. `phase1-readOnly.test.js` - Complete Phase 1
3. `experienceDesigner.spec.js` - E2E workflow
4. `fullStackFlow.test.js` - Integration
5. `phase2-preview.test.js` - Next phase prep

### Ongoing: Phase 2-4 Tests
- Write as features are implemented
- Each phase maintains previous tests
- New capabilities don't break existing

---

## Test Data Strategy

### Fixtures
```javascript
// test-utils/fixtures/entities.js
export const createTestCharacter = (overrides = {}) => ({
  id: `char-${Date.now()}`,
  name: 'Test Character',
  entityCategory: 'character',
  tier: 'Major',
  ...overrides
});

// Don't use static counts
export const createVariableDataset = (size = 'small') => {
  const counts = {
    small: { characters: 5, elements: 10 },
    medium: { characters: 22, elements: 100 },
    large: { characters: 40, elements: 400 }
  };
  return generateDataset(counts[size]);
};
```

### Builders
```javascript
// test-utils/builders/graphBuilder.js
export class GraphBuilder {
  addCharactersWithRelationships(count) { }
  addElementsWithOwners(distribution) { }
  addPuzzlesWithDependencies(complexity) { }
  addTimelineWithRevelations(density) { }
  build() { return { nodes: [], edges: [] }; }
}
```

---

## Success Criteria

### Test Suite Health
- ✓ All tests pass before deployment
- ✓ No skipped tests in critical paths
- ✓ <5 minute total test runtime
- ✓ 90%+ code coverage (meaningful)
- ✓ Tests document behavior clearly

### TDD Process
- ✓ Write failing test first
- ✓ Implement minimum to pass
- ✓ Refactor with confidence
- ✓ Tests drive architecture
- ✓ Behaviors over implementation

---

## Next Steps

1. **Create test file structure** (30 min)
2. **Write first failing test** for entity selection (15 min)
3. **Fix entity selection bug** to make test pass (1 hour)
4. **Continue with critical path tests** in priority order

---

*"Tests aren't just validation. They're the specification, documentation, and safety net all in one."*