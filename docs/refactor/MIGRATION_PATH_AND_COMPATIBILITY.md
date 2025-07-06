# ALNTool/StoryForge Migration Path and Compatibility Guide

## Overview

Since ALNTool/StoryForge is not yet in production, we can take a direct refactoring approach without complex migration strategies. This document outlines a straightforward path to implement the new architecture.

## Migration Principles

1. **Direct Refactoring** - Replace old code with new implementations
2. **Test-Driven** - Write tests before refactoring
3. **Incremental Progress** - Complete one component at a time
4. **Maintain Functionality** - Ensure all features work after each change

## Simple Migration Strategy

### No Need For:
- ❌ Feature flags
- ❌ Parallel infrastructure  
- ❌ A/B testing
- ❌ Complex rollback procedures
- ❌ Compatibility layers

### What We Actually Need:
- ✅ Git branches for changes
- ✅ Comprehensive tests
- ✅ Code reviews
- ✅ Simple verification steps

## Migration Phases

### Phase 1: Fix Critical Issues (Days 1-3)

#### Day 1: Dependencies and Security
```bash
# Simple and direct - just update packages
cd storyforge/frontend
npm install @tanstack/react-query@^4.36.1 d3-force@^3.0.0 vite@^6.3.5

cd ../backend
npm install better-sqlite3@^9.0.0 node-cache@^5.1.2

# Run tests to ensure nothing broke
npm test
```

#### Day 2: Fix Bugs
1. Fix entity selection bug in `AdaptiveGraphCanvas.jsx`
2. Fix aggregation logic 
3. Test thoroughly
4. Commit changes

#### Day 3: Split Large Files
1. Break up the 1055-line `notionController.js`
2. Create separate controller files
3. Update imports
4. Test all endpoints

### Phase 2: Implement New Architecture (Days 4-8)

#### Component Refactoring Approach
```javascript
// Old component structure (before)
// components/JourneyIntelligenceView.jsx (638 lines)

// New component structure (after)
// components/JourneyIntelligenceView/
//   ├── index.jsx (150 lines)
//   ├── hooks/useGraphData.js (80 lines)
//   ├── components/EntityManager.jsx (100 lines)
//   ├── components/GraphManager.jsx (100 lines)
//   └── components/IntelligenceManager.jsx (100 lines)
```

#### State Management Migration
```javascript
// Step 1: Install Zustand
npm install zustand

// Step 2: Create new store
// stores/journeyStore.js
import { create } from 'zustand';

export const useJourneyStore = create((set) => ({
  selectedEntity: null,
  viewMode: 'overview',
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  setViewMode: (mode) => set({ viewMode: mode })
}));

// Step 3: Replace local state in components
// Before:
const [selectedEntity, setSelectedEntity] = useState(null);

// After:
const { selectedEntity, setSelectedEntity } = useJourneyStore();

// Step 4: Test everything still works
```

#### API Layer Simplification
```javascript
// Step 1: Create unified API service
// services/api/index.js
const createCrudEndpoints = (resource) => ({
  getAll: () => apiClient.get(`/${resource}`),
  getById: (id) => apiClient.get(`/${resource}/${id}`),
  create: (data) => apiClient.post(`/${resource}`, data),
  update: (id, data) => apiClient.put(`/${resource}/${id}`, data),
  delete: (id) => apiClient.delete(`/${resource}/${id}`)
});

export const api = {
  characters: createCrudEndpoints('characters'),
  elements: createCrudEndpoints('elements'),
  puzzles: createCrudEndpoints('puzzles'),
  timeline: createCrudEndpoints('timeline-events')
};

// Step 2: Replace all direct API calls
// Step 3: Delete old API code
// Step 4: Test all endpoints
```

### Phase 3: Add React Query (Days 9-10)

#### Simple Integration
```javascript
// Step 1: Setup QueryClient
// App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}

// Step 2: Replace data fetching
// Before:
useEffect(() => {
  fetchCharacters().then(setCharacters);
}, []);

// After:
const { data: characters, isLoading } = useQuery({
  queryKey: ['characters'],
  queryFn: api.characters.getAll
});

// Step 3: Remove old useEffect calls
// Step 4: Test data loading
```

### Phase 4: Performance Optimization (Day 11)

#### Simple Optimizations
```javascript
// Add React.memo to expensive components
export const GraphCanvas = React.memo(({ entities, selectedId }) => {
  // Component logic
});

// Add useMemo for expensive calculations
const graphData = useMemo(() => {
  return processEntities(entities);
}, [entities]);

// Add lazy loading for heavy components
const IntelligencePanel = lazy(() => import('./IntelligencePanel'));
```

## Testing Strategy

### Before Each Refactor:
1. Write tests for existing functionality
2. Ensure tests pass with old code
3. Refactor
4. Ensure tests still pass

### Test Example:
```javascript
// Before refactoring JourneyIntelligenceView
describe('JourneyIntelligenceView', () => {
  it('selects entity when clicked', async () => {
    render(<JourneyIntelligenceView />);
    
    const entityCard = await screen.findByText('Test Character');
    fireEvent.click(entityCard);
    
    expect(screen.getByTestId('intelligence-panel')).toBeVisible();
  });
});
```

## Git Workflow

### Branch Strategy
```bash
# Create feature branch for each major change
git checkout -b refactor/extract-business-logic
git checkout -b refactor/component-decomposition
git checkout -b refactor/api-consolidation
git checkout -b refactor/add-react-query

# Regular commits with clear messages
git add .
git commit -m "refactor: extract graphData logic to useGraphData hook"

# Merge to main after review
git checkout main
git merge refactor/extract-business-logic
```

### Code Review Checklist
- [ ] All tests pass
- [ ] No console.log statements
- [ ] Components under size limits
- [ ] New code follows patterns
- [ ] Documentation updated

## Verification Steps

### After Each Phase:
```bash
# 1. Run all tests
npm test

# 2. Check for console.logs
npm run verify:console

# 3. Check component sizes
npm run verify:components

# 4. Run the app and test manually
npm run dev

# 5. Run E2E tests
npm run test:e2e
```

## Common Refactoring Patterns

### Extracting Logic to Hooks
```javascript
// Before: Logic mixed in component
const JourneyView = () => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchEntities().then(data => {
      setEntities(processEntities(data));
      setLoading(false);
    });
  }, []);
  
  // 200 more lines...
};

// After: Logic in custom hook
const useProcessedEntities = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: fetchEntities
  });
  
  const processedEntities = useMemo(() => {
    return data ? processEntities(data) : [];
  }, [data]);
  
  return { entities: processedEntities, loading: isLoading };
};

const JourneyView = () => {
  const { entities, loading } = useProcessedEntities();
  // Clean component logic
};
```

### Breaking Up Large Components
```javascript
// Before: One large component
const IntelligencePanel = ({ entity }) => {
  // 500 lines of mixed concerns
};

// After: Focused components
const IntelligencePanel = ({ entity }) => {
  if (!entity) return null;
  
  return (
    <Panel>
      <PanelHeader entity={entity} />
      <PanelTabs>
        <Tab label="Economic">
          <EconomicAnalysis entity={entity} />
        </Tab>
        <Tab label="Story">
          <StoryAnalysis entity={entity} />
        </Tab>
        <Tab label="Social">
          <SocialAnalysis entity={entity} />
        </Tab>
      </PanelTabs>
    </Panel>
  );
};
```

## Timeline Summary

### Week 1
- Days 1-3: Fix critical issues
- Days 4-6: Component refactoring
- Code reviews and testing

### Week 2  
- Days 7-8: API consolidation
- Days 9-10: Add React Query
- Day 11: Performance optimization

## Success Criteria

### Must Have:
- ✅ All tests passing
- ✅ No components over 500 lines
- ✅ Entity selection working
- ✅ Clean API patterns
- ✅ Proper state management

### Nice to Have:
- ✅ Components under 150 lines
- ✅ 80%+ test coverage
- ✅ Performance improvements
- ✅ Complete documentation

## Conclusion

This straightforward migration approach is appropriate for a pre-production codebase. By focusing on direct refactoring with proper testing, we can achieve the new architecture efficiently without the overhead of complex migration strategies.