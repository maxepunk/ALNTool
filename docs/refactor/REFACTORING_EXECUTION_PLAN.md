# ALNTool Refactoring Execution Plan

## Overview

This tactical 11-day execution plan provides specific daily tasks, files to change, and verification steps for the ALNTool/StoryForge refactoring.

## Git Branch Strategy

```bash
# Main refactoring branch
git checkout -b refactor/unified-architecture

# Daily feature branches
git checkout -b refactor/day-1-dependencies
git checkout -b refactor/day-2-bug-fixes
# ... etc
```

## Day 1: Dependencies and Security

### Morning (4 hours)

#### Task 1: Update Frontend Dependencies
```bash
cd storyforge/frontend
git checkout -b refactor/day-1-dependencies

# Install missing dependencies
npm install @tanstack/react-query@^4.36.1 d3-force@^3.0.0

# Fix security vulnerability
npm install vite@^6.3.5

# Verify
npm audit
npm test
```

#### Task 2: Update Backend Dependencies
```bash
cd ../backend

# Install missing dependencies
npm install better-sqlite3@^9.0.0 node-cache@^5.1.2

# Verify
npm test
```

#### Task 3: Fix Database Console.log
```javascript
// File: storyforge/backend/src/db/database.js
// Line 42: Replace
verbose: console.log

// With:
const logger = require('../utils/logger');
verbose: logger.db
```

### Afternoon (4 hours)

#### Task 4: Extract GraphData Logic
```javascript
// Create: storyforge/frontend/src/hooks/useGraphData.js
import { useMemo } from 'react';

export const useGraphData = (
  characters,
  elements,
  puzzles,
  timelineEvents,
  relationships,
  viewMode,
  selectedEntityId
) => {
  return useMemo(() => {
    // Move lines 183-411 from JourneyIntelligenceView.jsx here
    // Refactor into smaller functions:
    
    const createCharacterNodes = (characters) => {
      // Extract character node creation logic
    };
    
    const createElementNodes = (elements) => {
      // Extract element node creation logic
    };
    
    const createRelationshipEdges = (relationships) => {
      // Extract edge creation logic
    };
    
    // Return structured data
    return {
      nodes: [...characterNodes, ...elementNodes, ...puzzleNodes],
      edges: relationshipEdges
    };
  }, [characters, elements, puzzles, timelineEvents, relationships, viewMode, selectedEntityId]);
};
```

#### Commit Checkpoint
```bash
# Test everything
npm test
npm run verify:console

# Commit
git add .
git commit -m "refactor: fix dependencies and extract graphData logic

- Updated to latest secure versions
- Fixed console.log violation in database.js  
- Extracted 229-line graphData logic to useGraphData hook
- All tests passing"

git checkout refactor/unified-architecture
git merge refactor/day-1-dependencies
```

## Day 2: Fix Entity Selection Bug

### Morning (4 hours)

#### Task 1: Debug ID Issue
```javascript
// File: storyforge/frontend/src/components/JourneyIntelligence/AdaptiveGraphCanvas.jsx
// Problem: IDs getting modified during aggregation

// Add ID preservation (line ~180)
const aggregateNodes = (nodes) => {
  return nodes.map(node => ({
    ...node,
    originalId: node.id,  // Preserve original ID
    id: node.aggregatedId || node.id
  }));
};

// Fix onNodeClick handler (line ~250)
const onNodeClick = useCallback((event, node) => {
  const entityId = node.data.originalId || node.id;
  const entity = findEntityById(entityId);
  
  if (entity) {
    onEntitySelect(entity);
  }
}, [onEntitySelect, findEntityById]);
```

#### Task 2: Fix Aggregation Logic
```javascript
// Replace nonsensical grouping (line ~200)
// Before: "Sarah's Elements" 
// After: Type-based grouping

const createAggregateGroups = (entities) => {
  const groups = {
    'Memory Tokens': [],
    'Props': [],
    'Clues': [],
    'Social Puzzles': [],
    'Timeline Events': []
  };
  
  entities.forEach(entity => {
    const type = getEntityType(entity);
    const group = getGroupForType(type);
    if (groups[group]) {
      groups[group].push(entity);
    }
  });
  
  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([groupName, items]) => ({
      id: `group-${groupName}`,
      type: 'aggregate',
      label: `${groupName} (${items.length})`,
      children: items
    }));
};
```

### Afternoon (4 hours)

#### Task 3: Test Entity Selection
```javascript
// Create: storyforge/frontend/src/components/JourneyIntelligence/__tests__/EntitySelection.test.jsx
describe('Entity Selection', () => {
  it('preserves entity IDs through aggregation', () => {
    const { getByTestId } = render(<AdaptiveGraphCanvas {...props} />);
    
    // Test with 100+ entities to trigger aggregation
    const node = getByTestId('entity-node-char123');
    fireEvent.click(node);
    
    expect(mockOnEntitySelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'char123' })
    );
  });
});
```

#### Task 4: E2E Test
```javascript
// Create: storyforge/frontend/tests/e2e/entity-selection.spec.js
test('entity selection flow', async ({ page }) => {
  await page.goto('/');
  
  // Search for entity
  await page.fill('[data-testid="entity-search"]', 'Sarah Chen');
  await page.click('[data-testid="search-result-sarah"]');
  
  // Verify selection
  await expect(page.locator('[data-testid="intelligence-panel"]')).toContainText('Sarah Chen');
  
  // Click on graph node
  await page.click('[data-testid="graph-node-sarah"]');
  
  // Should maintain selection
  await expect(page.locator('[data-testid="selected-entity"]')).toContainText('Sarah Chen');
});
```

## Day 3: Controller Decomposition

### Morning (4 hours)

#### Task 1: Create Controller Structure
```bash
cd storyforge/backend/src/controllers
mkdir notion
```

#### Task 2: Split Character Controller
```javascript
// Create: notion/characterController.js
const { validateCharacter } = require('./validation');
const { transformCharacterResponse } = require('./transforms');
const characterService = require('../../services/characterService');

exports.getCharacters = async (req, res, next) => {
  try {
    const characters = await characterService.getAllCharacters();
    res.json(transformCharacterResponse(characters));
  } catch (error) {
    next(error);
  }
};

exports.getCharacterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await characterService.getCharacterById(id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(transformCharacterResponse(character));
  } catch (error) {
    next(error);
  }
};

// ... other character methods (max 150 lines)
```

### Afternoon (4 hours)

#### Task 3: Add Database Transactions
```javascript
// File: storyforge/backend/src/services/characterService.js
const db = require('../db/database');

exports.createCharacterWithRelations = async (characterData) => {
  return db.transaction(async (trx) => {
    // Insert character
    const character = await trx('characters').insert({
      id: characterData.id,
      name: characterData.name,
      // ... other fields
    }).returning('*');
    
    // Insert elements
    if (characterData.elements?.length) {
      await trx('character_elements').insert(
        characterData.elements.map(elementId => ({
          character_id: character.id,
          element_id: elementId
        }))
      );
    }
    
    // Insert relationships
    if (characterData.relationships?.length) {
      await trx('character_relationships').insert(
        characterData.relationships
      );
    }
    
    return character;
  });
};
```

## Day 4: JourneyIntelligenceView Refactor

### Morning (4 hours)

#### Task 1: Create Component Structure
```bash
cd storyforge/frontend/src/components
mkdir JourneyIntelligenceView
cd JourneyIntelligenceView
touch index.jsx EntityManager.jsx GraphManager.jsx IntelligenceManager.jsx
```

#### Task 2: Extract EntityManager
```javascript
// Create: EntityManager.jsx
import { EntitySelector } from '../EntitySelector';
import { useJourneyStore } from '@/stores/journeyStore';

export const EntityManager = ({ entities }) => {
  const { selectedEntity, selectEntity, clearSelection } = useJourneyStore();
  
  return (
    <div className="entity-manager">
      <EntitySelector
        entities={entities}
        selectedId={selectedEntity?.id}
        onSelect={selectEntity}
        onClear={clearSelection}
      />
      {selectedEntity && (
        <SelectedEntityCard entity={selectedEntity} />
      )}
    </div>
  );
};
```

#### Task 3: Create Zustand Store
```javascript
// Create: storyforge/frontend/src/stores/journeyStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useJourneyStore = create(
  persist(
    (set, get) => ({
      // State
      selectedEntity: null,
      viewMode: 'overview',
      activeIntelligence: ['economic', 'story'],
      
      // Actions
      selectEntity: (entity) => set({ 
        selectedEntity: entity,
        viewMode: entity ? 'focus' : 'overview'
      }),
      
      clearSelection: () => set({ 
        selectedEntity: null,
        viewMode: 'overview'
      }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      toggleIntelligence: (layer) => set(state => ({
        activeIntelligence: state.activeIntelligence.includes(layer)
          ? state.activeIntelligence.filter(l => l !== layer)
          : [...state.activeIntelligence, layer]
      }))
    }),
    {
      name: 'journey-storage'
    }
  )
);
```

### Afternoon (4 hours)

#### Task 4: Refactor Main Component
```javascript
// Update: index.jsx
import { EntityManager } from './EntityManager';
import { GraphManager } from './GraphManager';
import { IntelligenceManager } from './IntelligenceManager';
import { useEntities } from '@/hooks/queries/useEntities';
import { useJourneyStore } from '@/stores/journeyStore';

export const JourneyIntelligenceView = () => {
  const { data: entities, isLoading } = useEntities();
  const viewMode = useJourneyStore(state => state.viewMode);
  
  if (isLoading) return <LoadingState />;
  
  return (
    <div className="journey-intelligence-view">
      <ViewModeToggle mode={viewMode} />
      
      <div className="journey-content">
        <EntityManager entities={entities} />
        <GraphManager entities={entities} viewMode={viewMode} />
        <IntelligenceManager />
      </div>
    </div>
  );
};

// Component is now ~50 lines!
```

## Day 5-6: Continue Component Decomposition

### Detailed breakdowns for remaining components...

## Daily Standup Template

```markdown
## Day [N] Standup

### Yesterday's Progress
- ✅ Completed: [List completed tasks]
- ⚠️ Blocked: [Any blockers]

### Today's Goals
- [ ] Morning: [Specific tasks]
- [ ] Afternoon: [Specific tasks]

### Metrics
- Components over 500 lines: [X]
- Test coverage: [X]%
- Bundle size: [X]KB

### Notes
[Any important observations]
```

## Code Review Checkpoints

### Day 3 Review
- Focus: Dependencies, bug fixes, controller split
- Reviewers: Senior developers
- Key questions:
  - Are all security vulnerabilities addressed?
  - Does entity selection work correctly?
  - Are transactions properly implemented?

### Day 5 Review  
- Focus: Component architecture
- Reviewers: Frontend team
- Key questions:
  - Are components properly decomposed?
  - Is state management clean?
  - Do tests cover critical paths?

### Day 8 Review
- Focus: API consolidation
- Reviewers: Full stack team
- Key questions:
  - Is API pattern consistent?
  - Are there any missing endpoints?
  - Is error handling comprehensive?

### Day 11 Review
- Focus: Overall architecture
- Reviewers: Tech lead + team
- Key questions:
  - Do all components meet size limits?
  - Is performance improved?
  - Is code maintainable?

## Rollback Procedures

### Component Rollback
```bash
# If a refactored component breaks
git checkout main -- path/to/component
git commit -m "rollback: revert component due to [issue]"
```

### Dependency Rollback
```bash
# If new dependencies cause issues
git checkout main -- package.json package-lock.json
npm install
npm test
```

### Full Day Rollback
```bash
# If entire day's work needs reverting
git log --oneline
git revert [commit-hash]
```

## Success Metrics

### Daily Metrics
```bash
# Run at end of each day
npm run metrics:daily

# Outputs:
# - Components over limit: X
# - Test coverage: X%
# - Bundle size: XKB
# - Console.log count: X
# - API endpoints: X
```

### Progress Tracking
| Day | Goal | Status | Notes |
|-----|------|--------|--------|
| 1 | Fix dependencies | ✅ | All security issues resolved |
| 2 | Fix bugs | ✅ | Entity selection working |
| 3 | Split controller | ⏳ | In progress |
| ... | ... | ... | ... |

## Final Checklist

Before marking refactoring complete:

- [ ] All components under 500 lines
- [ ] No console.log violations
- [ ] Entity selection working
- [ ] All tests passing
- [ ] Bundle size reduced
- [ ] Documentation updated
- [ ] Team trained on new patterns
- [ ] Monitoring in place

## Conclusion

This execution plan provides a day-by-day roadmap for the refactoring. Follow the daily tasks, use the verification steps, and maintain communication through standups and reviews for successful completion.