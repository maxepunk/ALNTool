# Quick Start: ALNTool Refactoring Guide

## 🎯 Understand the Architecture in 5 Minutes

### Current Problems
- **6 components over 500 lines** (one is 1055 lines!)
- **35+ duplicate API endpoints**
- **Mixed concerns** everywhere
- **Entity selection bug** breaking user experience

### New Architecture

```
┌─────────────────┐
│   Components    │  <100 lines, pure UI
├─────────────────┤
│     Hooks       │  <80 lines, reusable logic
├─────────────────┤
│     Stores      │  Zustand (UI), React Query (server)
├─────────────────┤
│    Services     │  Business logic, API calls
└─────────────────┘
```

### Key Decisions
- **Zustand** for UI state (selected entity, view mode)
- **React Query** for server state (data fetching, caching)
- **Component size limits** enforced by tooling
- **Generic patterns** to eliminate duplication

## 🚀 Start Your First Refactoring Task

### Step 1: Pick a Task
```bash
# Check what needs refactoring
npm run verify:components

# Output shows:
# ❌ JourneyIntelligenceView.jsx: 638 lines (138 over limit)
# ❌ IntelligencePanel.jsx: 528 lines (28 over limit)
# ...
```

### Step 2: Create a Branch
```bash
git checkout -b refactor/journey-intelligence-view
```

### Step 3: Write Tests First
```javascript
// Write test for current behavior
describe('JourneyIntelligenceView', () => {
  it('selects entity when clicked', () => {
    // Test current functionality
  });
});

# Run test to ensure it passes with current code
npm test JourneyIntelligenceView
```

### Step 4: Refactor
Extract logic to hooks:
```javascript
// Before: 229 lines of logic in component
const graphData = useMemo(() => {
  // Massive calculation...
}, [dependencies]);

// After: Clean hook
const graphData = useGraphData(entities, relationships);
```

### Step 5: Verify
```bash
npm test                    # All tests pass
npm run verify:components   # Under size limit
npm run dev                # Manual testing
```

## 🚫 Common Pitfalls to Avoid

### ❌ DON'T: Mix UI and Logic
```javascript
// Bad: Logic in component
const Component = () => {
  const data = rawData.map(item => ({
    ...item,
    computed: item.value * 2
  }));
  
  return <div>{/* UI */}</div>;
};
```

### ✅ DO: Separate Concerns
```javascript
// Good: Logic in hook
const useProcessedData = (rawData) => {
  return useMemo(() => 
    rawData.map(item => ({
      ...item,
      computed: item.value * 2
    })), [rawData]
  );
};

const Component = () => {
  const data = useProcessedData(rawData);
  return <div>{/* UI */}</div>;
};
```

### ❌ DON'T: Direct API Calls
```javascript
// Bad: API call in component
useEffect(() => {
  fetch('/api/characters')
    .then(res => res.json())
    .then(setCharacters);
}, []);
```

### ✅ DO: Use React Query
```javascript
// Good: Declarative data fetching
const { data: characters } = useQuery({
  queryKey: ['characters'],
  queryFn: api.characters.getAll
});
```

### ❌ DON'T: Scatter State
```javascript
// Bad: Local state everywhere
const [selected, setSelected] = useState();
const [viewMode, setViewMode] = useState();
const [filters, setFilters] = useState();
```

### ✅ DO: Centralize State
```javascript
// Good: Zustand store
const { selected, viewMode, filters } = useJourneyStore();
```

## ✅ Refactoring Checklist

Before starting:
- [ ] Identify component/issue to fix
- [ ] Create feature branch
- [ ] Write tests for current behavior

During refactoring:
- [ ] Extract business logic to hooks/services
- [ ] Keep components under size limits
- [ ] Use established patterns
- [ ] Maintain all functionality

After refactoring:
- [ ] All tests pass
- [ ] Run verification scripts
- [ ] No console errors
- [ ] Manual testing complete
- [ ] Code reviewed

## 📊 Quick Reference

### State Management Decision Tree
```
Is it server data? → React Query
Is it UI state? → Zustand  
Is it form state? → Local state (or React Hook Form)
Is it derived? → useMemo
```

### File Organization
```
src/
├── components/           # <100 LOC
│   └── EntityCard/
│       ├── index.jsx    # Main component
│       ├── styles.css   # Styles
│       └── utils.js     # Component-specific utils
├── hooks/               # <80 LOC
│   ├── useEntities.js   # Data hooks
│   └── useDebounce.js   # Utility hooks
├── services/            # <200 LOC
│   └── api/            # API layer
└── stores/             # State management
    └── journeyStore.js
```

### Component Patterns
```javascript
// 1. Container/Presenter
<EntityListContainer>         // Data fetching
  <EntityList items={data} /> // Pure UI
</EntityListContainer>

// 2. Compound Components
<IntelligencePanel>
  <IntelligencePanel.Header />
  <IntelligencePanel.Body />
  <IntelligencePanel.Footer />
</IntelligencePanel>

// 3. Render Props
<DataProvider
  render={({ data, loading }) => 
    loading ? <Spinner /> : <List data={data} />
  }
/>
```

## 🎉 You're Ready!

1. Run `npm run verify:components` to find issues
2. Pick the smallest violation to start
3. Follow the checklist
4. Celebrate small wins!

Remember: **One refactor at a time**. Don't try to fix everything at once.