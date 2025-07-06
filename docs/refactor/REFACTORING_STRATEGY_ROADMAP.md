# ALNTool/StoryForge Refactoring Strategy Roadmap

## Executive Summary

This 11-day roadmap prioritizes refactoring efforts by impact, addressing critical issues first while maintaining system stability. Each phase builds upon the previous, ensuring continuous improvement without breaking functionality.

## Priority Matrix

### Critical (Days 1-3)
- 🔴 Security vulnerabilities
- 🔴 Missing dependencies
- 🔴 Entity selection bug
- 🔴 1055-line controller

### High (Days 4-6)
- 🟡 Component size violations
- 🟡 Complex graphData logic
- 🟡 Aggregation issues

### Medium (Days 7-8)
- 🟢 API duplication (35+ endpoints)
- 🟢 Code patterns

### Low (Days 9-11)
- 🔵 Performance optimization
- 🔵 Documentation
- 🔵 Nice-to-haves

## Phase 1: Critical Fixes & Logic Extraction (Days 1-3)

### Day 1: Security & Dependencies
**Morning (4 hours)**
```bash
# Fix missing dependencies
cd storyforge/frontend
npm install @tanstack/react-query@^4.36.1 d3-force@^3.0.0

cd ../backend
npm install better-sqlite3@^9.0.0 node-cache@^5.1.2

# Fix security vulnerability
cd ../frontend
npm install vite@^6.3.5
```

**Afternoon (4 hours)**
- Extract business logic from JourneyIntelligenceView
- Create `hooks/useGraphData.js` (target: 80 LOC)
- Move 229-line graphData logic
- Add comprehensive tests

**Deliverables**:
- ✅ All dependencies installed
- ✅ Security vulnerabilities fixed
- ✅ GraphData logic extracted
- ✅ Tests passing

### Day 2: Fix Entity Selection Bug
**Morning (4 hours)**
- Debug ID preservation in AdaptiveGraphCanvas
- Implement consistent ID handling
- Fix `onNodeClick` handler
- Add ID validation tests

**Afternoon (4 hours)**
- Refactor aggregation logic
- Implement type-based grouping
- Remove nonsensical "Sarah's Elements"
- Test with 400+ entities

**Deliverables**:
- ✅ Entity selection working
- ✅ Aggregation logic fixed
- ✅ Progressive loading stable
- ✅ E2E tests passing

### Day 3: Controller Decomposition
**Morning (4 hours)**
- Split 1055-line notionController.js:
  ```
  controllers/
  ├── notion/
  │   ├── characterController.js (150 LOC)
  │   ├── elementController.js (150 LOC)
  │   ├── puzzleController.js (150 LOC)
  │   ├── timelineController.js (150 LOC)
  │   └── shared/
  │       ├── validation.js (100 LOC)
  │       └── transforms.js (100 LOC)
  ```

**Afternoon (4 hours)**
- Add database transactions
- Implement proper error handling
- Create controller tests
- Verify API compatibility

**Deliverables**:
- ✅ Controller under 200 LOC each
- ✅ Database transactions added
- ✅ All endpoints tested
- ✅ Zero breaking changes

## Phase 2: Component Decomposition (Days 4-6)

### Day 4: JourneyIntelligenceView Refactor
**Target**: 638 → 150 LOC

**Morning (4 hours)**
- Extract EntityManager component
- Extract GraphManager component
- Extract IntelligenceManager component
- Move state logic to Zustand

**Afternoon (4 hours)**
- Create tests for each component
- Verify integration
- Update imports
- Performance testing

**Deliverables**:
- ✅ View under 150 LOC
- ✅ 3 new focused components
- ✅ State management clean
- ✅ Tests comprehensive

### Day 5: IntelligencePanel Decomposition
**Target**: 528 → 100 LOC

**Morning (4 hours)**
- Extract 4 embedded components:
  ```
  components/intelligence/
  ├── EconomicAnalysis.jsx (80 LOC)
  ├── StoryAnalysis.jsx (80 LOC)
  ├── SocialAnalysis.jsx (80 LOC)
  └── ProductionAnalysis.jsx (80 LOC)
  ```

**Afternoon (4 hours)**
- Create shared analysis utilities
- Implement consistent styling
- Add loading states
- Test each component

**Deliverables**:
- ✅ Panel under 100 LOC
- ✅ 4 reusable analysis components
- ✅ Consistent UI patterns
- ✅ Improved performance

### Day 6: AdaptiveGraphCanvas Cleanup
**Target**: 521 → 150 LOC

**Morning (4 hours)**
- Extract layout algorithms:
  ```
  services/compute/
  ├── forceLayout.js (80 LOC)
  ├── radialLayout.js (80 LOC)
  └── gridLayout.js (80 LOC)
  ```

**Afternoon (4 hours)**
- Create useGraphLayout hook
- Extract node/edge utilities
- Simplify event handlers
- Add layout tests

**Deliverables**:
- ✅ Canvas under 150 LOC
- ✅ Layout algorithms reusable
- ✅ Clear separation of concerns
- ✅ Better testability

## Phase 3: API Consolidation (Days 7-8)

### Day 7: Frontend API Service
**Goal**: Reduce 35+ endpoints to 5 generic + 10 specific

**Morning (4 hours)**
```javascript
// services/api/endpoints.js
const createEntityEndpoints = (resource) => ({
  getAll: (params) => client.get(`/${resource}`, { params }),
  getById: (id) => client.get(`/${resource}/${id}`),
  create: (data) => client.post(`/${resource}`, data),
  update: (id, data) => client.put(`/${resource}/${id}`, data),
  delete: (id) => client.delete(`/${resource}/${id}`)
});

// Auto-generate for all entities
export const api = {
  characters: createEntityEndpoints('characters'),
  elements: createEntityEndpoints('elements'),
  puzzles: createEntityEndpoints('puzzles'),
  timeline: createEntityEndpoints('timeline-events'),
  // Special endpoints
  journey: {
    getAnalysis: (characterId) => client.get(`/journey/${characterId}/analysis`),
    getIntelligence: (params) => client.get('/intelligence', { params })
  }
};
```

**Afternoon (4 hours)**
- Migrate all API calls
- Update React Query hooks
- Test each endpoint
- Remove old code

**Deliverables**:
- ✅ 60% code reduction in API service
- ✅ Consistent error handling
- ✅ Type-safe responses
- ✅ All tests passing

### Day 8: Backend Route Consolidation
**Morning (4 hours)**
- Create generic CRUD router
- Implement middleware pipeline
- Standardize response format
- Add request validation

**Afternoon (4 hours)**
- Migrate all routes
- Test with frontend
- Update API documentation
- Performance testing

**Deliverables**:
- ✅ Routes consolidated
- ✅ Consistent patterns
- ✅ Better maintainability
- ✅ API docs updated

## Phase 4: Pattern Library (Days 9-10)

### Day 9: Component Patterns
**Morning (4 hours)**
- Create LoadingStates component set
- Create ErrorBoundary hierarchy
- Create EmptyStates library
- Document usage patterns

**Afternoon (4 hours)**
- Create form components
- Create data display patterns
- Create layout components
- Add Storybook stories

**Deliverables**:
- ✅ 15+ reusable components
- ✅ Consistent UI language
- ✅ Storybook documentation
- ✅ Usage guidelines

### Day 10: Hook & Utility Patterns
**Morning (4 hours)**
```javascript
// hooks/patterns/
├── useAsyncData.js      // Generic data fetching
├── useDebounced.js      // Input debouncing
├── useLocalStorage.js   // Persistent state
├── usePrevious.js       // Previous value tracking
└── useOnClickOutside.js // Click outside detection
```

**Afternoon (4 hours)**
- Create utility library
- Add TypeScript definitions
- Create test utilities
- Document patterns

**Deliverables**:
- ✅ 10+ reusable hooks
- ✅ 20+ utility functions
- ✅ Type definitions
- ✅ 90%+ test coverage

## Phase 5: Performance & Polish (Day 11)

### Day 11: Optimization
**Morning (4 hours)**
- Implement React.memo strategically
- Add useMemo/useCallback
- Optimize re-renders
- Bundle size analysis

**Afternoon (4 hours)**
- Add lazy loading
- Implement virtualization
- Optimize images
- Performance testing

**Deliverables**:
- ✅ 50% render reduction
- ✅ 30% bundle size reduction
- ✅ <3s initial load
- ✅ Smooth interactions

## Success Metrics

### Week 1 Targets
- ✅ 0 security vulnerabilities
- ✅ 0 console.log violations
- ✅ Entity selection fixed
- ✅ All components <500 LOC

### Week 2 Targets
- ✅ All components <150 LOC
- ✅ 60% API code reduction
- ✅ Pattern library complete
- ✅ 80%+ test coverage

### Final Targets
- ✅ <10 cyclomatic complexity
- ✅ <5% code duplication
- ✅ <500KB bundle size
- ✅ <3s load time

## Risk Mitigation

### Rollback Strategy
1. Feature flags for all changes
2. Parallel infrastructure
3. Incremental deployment
4. A/B testing

### Testing Strategy
1. Test before refactoring
2. Test after each change
3. E2E tests for workflows
4. Performance benchmarks

### Communication Plan
1. Daily standups
2. PR reviews required
3. Documentation updates
4. Team knowledge sharing

## Tools & Scripts

### Verification Commands
```bash
# Check progress
npm run verify:all

# Specific checks
npm run verify:sizes
npm run verify:console
npm run verify:deps
npm run verify:security

# Performance
npm run analyze:bundle
npm run test:performance
```

### Migration Helpers
```bash
# Generate component from template
npm run generate:component

# Extract logic to hook
npm run refactor:extract-hook

# Check for duplicates
npm run analyze:duplication
```

## Conclusion

This roadmap transforms ALNTool/StoryForge from a technical debt-laden codebase to a maintainable, performant application. By prioritizing critical issues and following a systematic approach, we achieve significant improvements while maintaining stability.