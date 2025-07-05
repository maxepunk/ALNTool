# TDD Actionable Task Breakdown

**Version**: 1.0  
**Date**: January 15, 2025  
**Purpose**: Concrete TDD tasks developers can start immediately

---

## Task Execution Format

Each task follows this pattern:
1. **Create test file** with failing tests
2. **Run tests** to confirm they fail
3. **Implement code** to make tests pass
4. **Refactor** if needed
5. **Verify** all tests still pass

---

## Critical Path Tasks (Must Do First)

### Task 1: Fix Entity Selection Bug
**File**: `frontend/src/behaviors/__tests__/entitySelection.test.js`
**Time**: 2 hours
**Blocker for**: Everything else

```javascript
// Write these failing tests first:
describe('Entity Selection ID Preservation', () => {
  test('preserves original entity ID when node clicked', () => {
    const entity = { id: 'elem-123', name: 'Test Element' };
    const node = { id: 'node-elem-123', data: entity };
    
    const selected = handleNodeClick(node);
    expect(selected.id).toBe('elem-123'); // NOT 'node-elem-123'
  });

  test('removes graph-specific fields from selection', () => {
    const entity = { 
      id: 'char-456', 
      name: 'Sarah',
      className: 'selected', // graph field
      isConnected: true,     // graph field
      size: 50               // graph field
    };
    
    const selected = cleanEntityData(entity);
    expect(selected.className).toBeUndefined();
    expect(selected.isConnected).toBeUndefined();
    expect(selected.size).toBeUndefined();
  });
});
```

**Implementation needed**:
- Fix `AdaptiveGraphCanvas.onNodeClick` to preserve entity IDs
- Remove graph-specific fields before storing selection
- Update selection handler in line 856-877

---

### Task 2: Add Missing Edge Generation
**File**: `frontend/src/visual/__tests__/edgeGeneration.test.js`
**Time**: 4 hours
**Blocker for**: Complete visualization

```javascript
// Write these failing tests first:
describe('Comprehensive Edge Generation', () => {
  test('generates ownership edges from element data', () => {
    const elements = [
      { id: 'elem-1', owner_character_id: 'char-1' }
    ];
    const characters = [
      { id: 'char-1', name: 'Sarah' }
    ];
    
    const edges = generateAllEdges(elements, characters);
    expect(edges).toContainEqual({
      id: expect.any(String),
      source: 'char-1',
      target: 'elem-1',
      type: 'character-owns-element'
    });
  });

  test('generates puzzle requirement edges', () => {
    const puzzles = [{
      id: 'puzzle-1',
      required_elements: ['elem-1', 'elem-2']
    }];
    const elements = [
      { id: 'elem-1' },
      { id: 'elem-2' }
    ];
    
    const edges = generatePuzzleEdges(puzzles, elements);
    expect(edges).toHaveLength(2);
    expect(edges[0].type).toBe('puzzle-requires-element');
  });
});
```

**Implementation needed**:
- Create `generateAllEdges` function that calls all edge generators
- Implement edge generation for each relationship type
- Update `JourneyIntelligenceView` to use complete edge set

**Backend work required**:
```javascript
// New API endpoints needed:
GET /api/elements/relationships
GET /api/puzzles/dependencies
GET /api/timeline/connections
```

---

### Task 3: Entity Search Functionality
**File**: `frontend/src/components/__tests__/EntitySearch.test.js`
**Time**: 3 hours
**Blocker for**: Usability

```javascript
// Write these failing tests first:
describe('Entity Search Autocomplete', () => {
  test('searches across all entity types', async () => {
    const entities = [
      { id: 'char-1', name: 'Victoria Chen', entityCategory: 'character' },
      { id: 'elem-1', name: 'Voice Memo', entityCategory: 'element' },
      { id: 'puzzle-1', name: 'Jewelry Box', entityCategory: 'puzzle' }
    ];
    
    const results = await searchEntities('vic', entities);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Victoria Chen');
  });

  test('groups results by entity type', () => {
    const results = [
      { entityCategory: 'character', name: 'Sarah' },
      { entityCategory: 'character', name: 'Marcus' },
      { entityCategory: 'element', name: 'Safe Key' }
    ];
    
    const grouped = groupSearchResults(results);
    expect(grouped.character).toHaveLength(2);
    expect(grouped.element).toHaveLength(1);
  });

  test('limits results for performance', () => {
    const manyEntities = Array(100).fill().map((_, i) => ({
      id: `elem-${i}`,
      name: `Element ${i}`
    }));
    
    const results = searchEntities('Element', manyEntities);
    expect(results.length).toBeLessThanOrEqual(50);
  });
});
```

**Implementation needed**:
- Create search component with Material-UI Autocomplete
- Implement fuzzy search across name/type/description
- Add keyboard navigation (arrow keys, enter, escape)

---

## Week 1 Tasks (Core Functionality)

### Task 4: Visual Hierarchy System
**File**: `frontend/src/visual/__tests__/visualHierarchy.test.js`
**Time**: 3 hours
**Depends on**: Task 1

```javascript
describe('Visual Hierarchy Without Aggregation', () => {
  test('applies opacity based on selection distance', () => {
    const selected = 'char-1';
    const connected = new Set(['elem-1', 'elem-2']);
    const secondary = new Set(['char-2']);
    
    const styles = calculateNodeStyles(nodes, selected, connected, secondary);
    
    expect(styles['char-1'].opacity).toBe(1);
    expect(styles['elem-1'].opacity).toBe(0.9);
    expect(styles['char-2'].opacity).toBe(0.6);
    expect(styles['char-99'].opacity).toBe(0.3); // background
  });

  test('scales nodes by relationship importance', () => {
    const styles = calculateNodeStyles(nodes, selected);
    
    expect(styles[selected].scale).toBe(1.2);
    expect(styles[connected].scale).toBe(1.0);
    expect(styles[background].scale).toBe(0.8);
  });
});
```

**Implementation needed**:
- Update `AdaptiveGraphCanvas` to apply visual hierarchy
- Remove all aggregation logic (already done)
- Add smooth CSS transitions

---

### Task 5: Force-Directed Layout
**File**: `frontend/src/utils/__tests__/forceLayout.test.js`
**Time**: 4 hours
**Depends on**: Task 2

```javascript
describe('Force-Directed Graph Layout', () => {
  test('positions characters with proper spacing', () => {
    const nodes = createTestCharacters(22);
    const simulation = createForceSimulation(nodes, []);
    
    simulation.tick(300); // run simulation
    
    const positions = nodes.map(n => ({ x: n.x, y: n.y }));
    const minDistance = calculateMinDistance(positions);
    
    expect(minDistance).toBeGreaterThan(50); // no overlap
  });

  test('clusters elements by ownership', () => {
    const sarah = { id: 'char-1', entityCategory: 'character' };
    const elem1 = { id: 'elem-1', owner_character_id: 'char-1' };
    const elem2 = { id: 'elem-2', owner_character_id: 'char-1' };
    
    const simulation = createForceSimulation([sarah, elem1, elem2]);
    simulation.tick(300);
    
    const dist1 = distance(sarah, elem1);
    const dist2 = distance(sarah, elem2);
    
    expect(dist1).toBeLessThan(100); // clustered
    expect(dist2).toBeLessThan(100);
  });
});
```

**Implementation needed**:
- Fix D3 force simulation in `layoutUtils.js`
- Implement ownership clustering
- Add collision detection
- Prevent character overlap

---

### Task 6: Progressive Entity Loading
**File**: `frontend/src/workflows/__tests__/progressiveLoading.test.js`
**Time**: 2 hours
**Depends on**: Tasks 1-3

```javascript
describe('Progressive Entity Loading', () => {
  test('initially shows only characters', () => {
    const { nodes } = renderGraph(allEntities, { progressive: true });
    
    const visibleTypes = nodes.map(n => n.entityCategory);
    expect(new Set(visibleTypes)).toEqual(new Set(['character']));
  });

  test('loads entity types on demand', async () => {
    const { toggleEntityType, getVisibleNodes } = renderGraph(allEntities);
    
    await toggleEntityType('element');
    
    const visible = getVisibleNodes();
    const types = visible.map(n => n.entityCategory);
    expect(types).toContain('element');
    expect(types).toContain('character');
  });

  test('shows accurate hidden counts', () => {
    const { getHiddenCounts } = renderGraph(allEntities);
    
    const counts = getHiddenCounts();
    expect(counts.elements).toBe(totalElements);
    expect(counts.puzzles).toBe(totalPuzzles);
    expect(counts.timeline).toBe(totalTimeline);
  });
});
```

**Implementation needed**:
- Update `EntityTypeLoader` component
- Track loaded vs hidden entities
- Update counts dynamically

---

## Week 2 Tasks (Intelligence & Polish)

### Task 7: Economic Intelligence
**File**: `frontend/src/intelligence/__tests__/economicIntelligence.test.js`
**Time**: 3 hours
**Depends on**: Tasks 1-6

```javascript
describe('Economic Intelligence Calculations', () => {
  test('calculates total accessible value', () => {
    const character = { id: 'char-1' };
    const elements = [
      { id: 'elem-1', owner_character_id: 'char-1', value: 5000 },
      { id: 'elem-2', owner_character_id: 'char-1', value: 3000 },
      { id: 'elem-3', owner_character_id: 'char-2', value: 1000 }
    ];
    
    const value = calculateAccessibleValue(character, elements);
    expect(value).toBe(8000); // only owned elements
  });

  test('identifies path balance', () => {
    const values = {
      blackMarket: 25000,
      detective: 20000,
      thirdPath: 23000
    };
    
    const balance = analyzePathBalance(values);
    expect(balance.imbalanced).toBe(true);
    expect(balance.ratio).toBeCloseTo(1.25); // 25k/20k
  });
});
```

---

### Task 8: Social Intelligence
**File**: `frontend/src/intelligence/__tests__/socialIntelligence.test.js`
**Time**: 3 hours

```javascript
describe('Social Choreography Analysis', () => {
  test('identifies required interactions', () => {
    const puzzle = {
      id: 'puzzle-1',
      owner_character_id: 'char-1',
      required_elements: ['elem-1', 'elem-2']
    };
    const elements = [
      { id: 'elem-1', owner_character_id: 'char-2' },
      { id: 'elem-2', owner_character_id: 'char-3' }
    ];
    
    const interactions = findRequiredInteractions(puzzle, elements);
    expect(interactions).toContain('char-1 → char-2');
    expect(interactions).toContain('char-1 → char-3');
  });
});
```

---

### Task 9: Content Gap Detection
**File**: `frontend/src/intelligence/__tests__/contentGaps.test.js`
**Time**: 2 hours

```javascript
describe('Content Gap Identification', () => {
  test('finds characters without backstory', () => {
    const characters = [
      { id: 'char-1', timeline_events: ['event-1'] },
      { id: 'char-2', timeline_events: [] } // no backstory
    ];
    
    const gaps = findCharacterGaps(characters);
    expect(gaps).toContain('char-2: No timeline events');
  });
});
```

---

## Backend Tasks (Parallel Track)

### Task B1: Relationship Endpoints
**File**: `backend/src/api/__tests__/relationshipEndpoints.test.js`
**Time**: 4 hours
**Critical for**: Frontend edge visualization

```javascript
describe('GET /api/elements/relationships', () => {
  test('returns all element relationships', async () => {
    const response = await request(app)
      .get('/api/elements/relationships')
      .expect(200);
    
    expect(response.body).toMatchObject({
      ownership: expect.arrayContaining([{
        element_id: expect.any(String),
        owner_character_id: expect.any(String)
      }]),
      containers: expect.arrayContaining([{
        element_id: expect.any(String),
        container_id: expect.any(String)
      }])
    });
  });
});
```

**Implementation needed**:
- Create new route handler
- Query relationship tables
- Format for frontend consumption

---

### Task B2: Data Transformation
**File**: `backend/src/transformers/__tests__/entityTransform.test.js`
**Time**: 3 hours

```javascript
describe('Entity Data Transformation', () => {
  test('flattens nested owner structure', () => {
    const apiElement = {
      id: 'elem-1',
      owner: [{ id: 'char-1', name: 'Sarah' }]
    };
    
    const transformed = transformElement(apiElement);
    expect(transformed.owner_character_id).toBe('char-1');
    expect(transformed.owner).toBeUndefined();
  });
});
```

---

## E2E Tasks (Week 3)

### Task E1: Complete Designer Workflow
**File**: `e2e/designer-workflows/searchSelectAnalyze.spec.js`
**Time**: 2 hours
**Depends on**: All frontend tasks

```javascript
test('designer can search, select, and analyze', async ({ page }) => {
  await page.goto('/');
  
  // Search for entity
  await page.click('[data-testid="entity-search"]');
  await page.type('[data-testid="entity-search"]', 'Victoria');
  await page.click('[data-testid="search-result-0"]');
  
  // Verify selection
  await expect(page.locator('[data-testid="selected-entity"]'))
    .toContainText('Victoria Chen');
  
  // Check intelligence
  await page.click('[data-testid="economic-intelligence"]');
  await expect(page.locator('[data-testid="token-value"]'))
    .toContainText('$5,000');
});
```

---

## Execution Schedule

### Day 1 (Critical Fixes)
- [ ] Task 1: Entity Selection Bug (2h)
- [ ] Task 2: Edge Generation (4h)
- [ ] Task B1: Backend Endpoints (parallel, 4h)

### Day 2 (Core Features)
- [ ] Task 3: Search Functionality (3h)
- [ ] Task 4: Visual Hierarchy (3h)

### Day 3 (Layout & Loading)
- [ ] Task 5: Force Layout (4h)
- [ ] Task 6: Progressive Loading (2h)

### Week 2 (Intelligence)
- [ ] Tasks 7-9: All intelligence layers
- [ ] Task B2: Data transformation
- [ ] Performance optimization

### Week 3 (Polish & E2E)
- [ ] Task E1: E2E workflows
- [ ] Bug fixes from testing
- [ ] Documentation updates

---

## Definition of Done

Each task is complete when:
1. ✅ All tests pass
2. ✅ Code review approved
3. ✅ No console.log statements
4. ✅ Performance benchmarks met
5. ✅ Documentation updated

---

## Quick Start Commands

```bash
# Create test structure
mkdir -p frontend/src/{behaviors,visual,intelligence,workflows,phases}/__tests__
mkdir -p backend/src/{api,relationships,transformers}/__tests__
mkdir -p e2e/{designer-workflows,performance}

# Run specific test file
npm test -- entitySelection.test.js --watch

# Run with coverage
npm test -- --coverage entitySelection.test.js

# Run e2e test
npm run test:e2e -- searchSelectAnalyze.spec.js
```

---

*Pick a task, write a failing test, make it pass. Repeat.*