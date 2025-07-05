# Day 6 Test-Driven Development Plan

**Date**: January 12, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Focus**: Technical foundation with TDD approach

---

## Existing Testing Infrastructure Analysis

### What We Have

#### Testing Framework
- **Jest + React Testing Library**: Modern testing stack
- **MSW (Mock Service Worker)**: API mocking (currently disabled due to Node.js issues)
- **Playwright**: E2E testing (separate from unit tests)
- **@testing-library/user-event**: User interaction simulation

#### Test Configuration
```javascript
// jest.config.cjs
- jsdom environment for React components
- CSS modules mocked with identity-obj-proxy
- Transform ignores for d3/dagre libraries
- MSW polyfills configured
```

#### Test Utilities
```javascript
// test-utils.js
- createTestQueryClient() - React Query client for tests
- renderWithQuery() - Custom render with QueryClient
- mockGameConstants - Comprehensive mock data
- waitForQueriesToSettle() - Async test helper
```

#### Mock Infrastructure
```javascript
// test-utils/mocks/handlers.js
- API endpoint mocks for all entities
- Error state handlers
- Empty state handlers
- Follows responseWrapper format
```

### Current Test Coverage
- Basic component tests (PageHeader.test.jsx)
- Page-level tests (Elements.test.jsx, PuzzleFlowPage.test.jsx)
- Logger globally mocked to prevent console noise
- MSW temporarily disabled - using manual mocks

---

## TDD Strategy for Day 6

### Core TDD Principles
1. **Red-Green-Refactor**: Write failing test → Make it pass → Improve code
2. **Test Behavior, Not Implementation**: Focus on user outcomes
3. **Integration Over Unit**: Test components as users interact with them
4. **Progressive Enhancement**: Start simple, add complexity gradually

### Testing Levels

#### 1. Store Tests (Zustand Enhancement)
```javascript
// Enhanced journeyStore tests
describe('JourneyIntelligenceStore', () => {
  describe('Selection Management', () => {
    it('should select entity and update view mode');
    it('should maintain selection history (max 5)');
    it('should trigger view adaptation on selection');
  });
  
  describe('Intelligence Layer Management', () => {
    it('should toggle intelligence layers');
    it('should enforce max 3 active layers');
    it('should preserve layer state across selections');
  });
  
  describe('Performance Mode', () => {
    it('should auto-switch at 40 nodes');
    it('should track visible node count');
    it('should preserve user override');
  });
});
```

#### 2. Component Integration Tests
```javascript
describe('JourneyIntelligenceView', () => {
  describe('Initial Render', () => {
    it('should show overview with all characters');
    it('should limit to 20 nodes initially');
    it('should show entity selector');
  });
  
  describe('Entity Selection Flow', () => {
    it('should adapt view on character selection');
    it('should show intelligence panel');
    it('should highlight connections');
  });
  
  describe('Intelligence Activation', () => {
    it('should overlay story intelligence');
    it('should combine multiple layers');
    it('should update node appearances');
  });
});
```

#### 3. Performance Tests
```javascript
describe('Performance Boundaries', () => {
  it('should render 50 nodes without lag');
  it('should complete transitions in <500ms');
  it('should calculate intelligence in <200ms');
  it('should aggregate nodes beyond 50');
});
```

#### 4. React Query Integration Tests
```javascript
describe('Intelligence Data Loading', () => {
  it('should load critical data immediately');
  it('should progressively enhance with details');
  it('should handle loading states gracefully');
  it('should cache intelligence calculations');
});
```

---

## Day 6 Implementation Plan

### Task 1: Testing Infrastructure Setup (1 hour)

#### WHY
Need solid testing foundation before writing any production code.

#### HOW
```javascript
// 1.1 Create test helpers for intelligence
// src/test-utils/intelligence-test-utils.js
export const createMockEntity = (type, overrides = {}) => {
  const defaults = {
    character: { id: 'c1', name: 'Sarah', type: 'character' },
    element: { id: 'e1', name: 'Voice Memo', type: 'element' },
    puzzle: { id: 'p1', name: 'Jewelry Box', type: 'puzzle' },
    timeline: { id: 't1', name: 'Affair Event', type: 'timeline' }
  };
  return { ...defaults[type], ...overrides };
};

// 1.2 Create mock intelligence data
export const mockIntelligenceData = {
  story: { /* mock story intelligence */ },
  social: { /* mock social data */ },
  economic: { /* mock economic data */ }
};

// 1.3 Setup MSW handlers for new endpoints
const intelligenceHandlers = [
  http.get('/api/intelligence/:entityId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: generateMockIntelligence(params.entityId)
    });
  })
];
```

### Task 2: Enhanced Store Tests & Implementation (2 hours)

#### Test First
```javascript
// src/stores/__tests__/journeyIntelligenceStore.test.js
import { renderHook, act } from '@testing-library/react';
import { useJourneyIntelligenceStore } from '../journeyIntelligenceStore';

describe('Journey Intelligence Store', () => {
  beforeEach(() => {
    useJourneyIntelligenceStore.setState({
      selectedEntity: null,
      selectionHistory: [],
      viewMode: 'overview',
      activeIntelligence: ['story', 'social']
    });
  });

  it('should select entity and transition view mode', () => {
    const { result } = renderHook(() => useJourneyIntelligenceStore());
    
    act(() => {
      result.current.selectEntity({ id: 'c1', type: 'character' });
    });
    
    expect(result.current.selectedEntity).toEqual({ id: 'c1', type: 'character' });
    expect(result.current.viewMode).toBe('entity-focus');
    expect(result.current.selectionHistory).toHaveLength(0); // First selection
  });
});
```

#### Then Implement
```javascript
// src/stores/journeyIntelligenceStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useJourneyIntelligenceStore = create(
  subscribeWithSelector((set, get) => ({
    // Selection state
    selectedEntity: null,
    selectionHistory: [],
    
    // View state  
    viewMode: 'overview',
    activeIntelligence: ['story', 'social'],
    
    // Actions
    selectEntity: (entity) => {
      const history = [...get().selectionHistory, get().selectedEntity];
      set({
        selectedEntity: entity,
        selectionHistory: history.filter(Boolean).slice(-5),
        viewMode: entity ? 'entity-focus' : 'overview'
      });
    }
  }))
);
```

### Task 3: Base Component Tests & Implementation (2 hours)

#### Test First
```javascript
// src/components/__tests__/JourneyIntelligenceView.test.jsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '../../test-utils/test-utils';
import JourneyIntelligenceView from '../JourneyIntelligenceView';

describe('JourneyIntelligenceView', () => {
  it('should render overview mode initially', () => {
    renderWithQuery(<JourneyIntelligenceView />);
    
    expect(screen.getByText(/Select Entity/i)).toBeInTheDocument();
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('intelligence-panel')).not.toBeInTheDocument();
  });
  
  it('should show intelligence panel on entity selection', async () => {
    const user = userEvent.setup();
    renderWithQuery(<JourneyIntelligenceView />);
    
    const sarahNode = screen.getByTestId('node-sarah');
    await user.click(sarahNode);
    
    expect(screen.getByTestId('intelligence-panel')).toBeInTheDocument();
    expect(screen.getByText(/Sarah Mitchell/i)).toBeInTheDocument();
  });
});
```

### Task 4: Selection → Intelligence Flow (2 hours)

#### Test First
```javascript
describe('Selection Intelligence Flow', () => {
  it('should load intelligence data on entity selection', async () => {
    const { queryClient } = renderWithQuery(<JourneyIntelligenceView />);
    
    // Select entity
    const sarahNode = screen.getByTestId('node-sarah');
    await userEvent.click(sarahNode);
    
    // Wait for intelligence to load
    await screen.findByText(/Story Intelligence/i);
    
    // Verify queries were made
    const queries = queryClient.getQueryCache().findAll();
    expect(queries).toContainEqual(
      expect.objectContaining({
        queryKey: ['entity-intelligence', 'sarah']
      })
    );
  });
});
```

### Task 5: Performance Monitoring Implementation (1 hour)

#### Test First
```javascript
describe('Performance Monitoring', () => {
  it('should track render performance', () => {
    const onPerformanceReport = jest.fn();
    renderWithQuery(
      <JourneyIntelligenceView onPerformanceReport={onPerformanceReport} />
    );
    
    // After render completes
    expect(onPerformanceReport).toHaveBeenCalledWith(
      expect.objectContaining({
        renderTime: expect.any(Number),
        nodeCount: expect.any(Number),
        fps: expect.any(Number)
      })
    );
  });
  
  it('should switch to performance mode at 40 nodes', async () => {
    renderWithQuery(<JourneyIntelligenceView initialNodes={45} />);
    
    const performanceIndicator = screen.getByTestId('performance-mode');
    expect(performanceIndicator).toHaveTextContent('Performance Mode');
  });
});
```

---

## Day 6 Success Criteria

### TDD Process
- [ ] Every feature has test written first
- [ ] All tests pass before moving to next feature
- [ ] No implementation without failing test
- [ ] Refactor only with green tests

### Technical Milestones
- [ ] Enhanced store with full test coverage
- [ ] Base component rendering with tests
- [ ] Selection flow working end-to-end
- [ ] Performance monitoring active

### Code Quality
- [ ] TypeScript types for all new code
- [ ] Accessibility tests included
- [ ] Error boundaries tested
- [ ] Loading states handled

---

## Anti-Patterns to Avoid

1. **Testing Implementation Details**
   ```javascript
   // Bad - tests internal state
   expect(store.getState()._internalFlag).toBe(true);
   
   // Good - tests behavior
   expect(screen.getByRole('button')).toBeEnabled();
   ```

2. **Overmocking**
   ```javascript
   // Bad - mocks everything
   jest.mock('../entire-module');
   
   // Good - mocks only external dependencies
   jest.mock('../../services/api');
   ```

3. **Brittle Selectors**
   ```javascript
   // Bad - relies on implementation
   screen.getByClassName('MuiButton-root');
   
   // Good - semantic queries
   screen.getByRole('button', { name: /submit/i });
   ```

---

## Day 7 Preview

With solid TDD foundation from Day 6:
- Integration tests for complete flows
- Performance optimization with benchmarks  
- Error boundary implementation
- Production build configuration

---

*"Tests are the first users of your code. Make them happy."*  
— Sarah Chen