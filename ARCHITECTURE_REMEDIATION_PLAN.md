# Detailed Architecture Remediation Plan

## Immediate Stabilization (Day 1)

### 1. Three-Tier Error Boundary Implementation

#### App-Level (main.jsx)
- Wrap entire app in ErrorBoundary component
- Catch catastrophic failures
- Show full-page error with refresh option

```javascript
// main.jsx - Add after imports
import ErrorBoundary from './components/ErrorBoundary';

// Wrap App component
<ErrorBoundary level="app">
  <App />
</ErrorBoundary>
```

#### Route-Level (App.jsx)
- Wrap each route in RouteErrorBoundary
- Isolate page-level failures
- Allow navigation to other pages

```javascript
// App.jsx - Import
import RouteErrorBoundary from './components/RouteErrorBoundary';

// Wrap routes
<Route path="/characters" element={
  <RouteErrorBoundary>
    <Characters />
  </RouteErrorBoundary>
} />
```

#### Component-Level
- Priority components: RelationshipMapper, NarrativeThreadTracker
- Prevent complex visualizations from crashing pages

```javascript
// In complex components
<ErrorBoundary level="component">
  <ComplexVisualization />
</ErrorBoundary>
```

### 2. Production Logger Implementation

#### Step 1: Create src/utils/logger.js
```javascript
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args) => isDev && console.log('[DEBUG]', ...args),
  info: (...args) => isDev && console.info('[INFO]', ...args),
  warn: (...args) => {
    if (isDev) console.warn('[WARN]', ...args);
    // Production: Send to monitoring service
    if (!isDev && window.errorReporting) {
      window.errorReporting.logWarning(args);
    }
  },
  error: (...args) => {
    if (isDev) console.error('[ERROR]', ...args);
    // Production: Send to error tracking service
    if (!isDev && window.errorReporting) {
      window.errorReporting.logError(args);
    }
  },
  // Special method for performance tracking
  perf: (label, fn) => {
    if (isDev) {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  }
};
```

#### Step 2: Replace All console.* Calls
```bash
# Find all console statements
find src -name "*.jsx" -o -name "*.js" | xargs grep -l "console\."

# Use this script to replace them
node scripts/replace-console-logs.js
```

Replace patterns:
- `console.log` → `logger.debug`
- `console.error` → `logger.error`
- `console.warn` → `logger.warn`
- Remove `console.info` or replace with `logger.info`

### 3. Fix Player Journey (Week 1.3 Task)

#### Current Issue
- journeyEngine not generating proper graph structure
- Missing nodes/edges for character paths

#### Implementation with New Patterns
```javascript
// PlayerJourneyPage.jsx
import ErrorBoundary from '../components/ErrorBoundary';
import { useEntityData } from '../hooks/useEntityData';
import { UnifiedLoadingState } from '../components/UnifiedLoadingState';
import { UnifiedErrorState } from '../components/UnifiedErrorState';

export default function PlayerJourneyPage() {
  return (
    <ErrorBoundary level="page">
      <PlayerJourneyContent />
    </ErrorBoundary>
  );
}

function PlayerJourneyContent() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  // Use standardized data hook
  const { data, isLoading, error } = useEntityData('playerJourney', {
    characterId: selectedCharacter,
    queryOptions: {
      enabled: !!selectedCharacter
    }
  });
  
  // Consistent loading/error states
  if (isLoading) return <UnifiedLoadingState />;
  if (error) return <UnifiedErrorState error={error} />;
  
  return <JourneyVisualization data={data} />;
}
```

#### Debug Steps for journeyEngine.js
1. Check line 145-267 for graph generation logic
2. Verify character data structure matches expected format
3. Add logging to track node/edge creation
4. Test with known good character data

## Standardization Phase (Days 2-3)

### 1. God Component Refactoring Plan

#### NarrativeThreadTrackerPage (1,065 → 300 lines each)
```
NarrativeThreadTrackerPage/
├── index.jsx (main container, ~100 lines)
├── ThreadList.jsx (thread selection UI, ~200 lines)
├── ThreadAnalysis.jsx (analysis logic, ~300 lines)
├── ThreadMetrics.jsx (metrics display, ~200 lines)
├── hooks/useThreadData.js (data fetching, ~100 lines)
└── constants.js (thread categories, ~100 lines)
```

#### Refactoring Strategy
1. **Extract Constants First**
   ```javascript
   // constants.js
   export const NARRATIVE_THREADS = {
     'Marcus Investigation': {
       color: 'error',
       icon: '🕵️',
       description: 'Central murder mystery investigation',
       priority: 'critical'
     },
     // ... more threads
   };
   ```

2. **Create Custom Hook**
   ```javascript
   // hooks/useThreadData.js
   export function useThreadData(selectedThread) {
     const { data: gameConstants } = useGameConstants();
     
     return useQuery({
       queryKey: ['narrativeThread', selectedThread],
       queryFn: () => api.getThreadData(selectedThread),
       staleTime: gameConstants?.CACHE_TIMES?.threads || 5 * 60 * 1000
     });
   }
   ```

3. **Split UI Components**
   ```javascript
   // ThreadList.jsx
   export function ThreadList({ threads, selectedThread, onThreadSelect }) {
     return (
       <List>
         {threads.map(thread => (
           <ThreadListItem
             key={thread.id}
             thread={thread}
             selected={thread.id === selectedThread}
             onClick={() => onThreadSelect(thread.id)}
           />
         ))}
       </List>
     );
   }
   ```

### 2. Standardized Data Patterns

#### Custom Hooks Suite
```javascript
// hooks/useEntityData.js - Generic data fetching
export function useEntityData(entityType, options = {}) {
  const { data: gameConstants } = useGameConstants();
  const api = useApi();
  
  return useQuery({
    queryKey: [entityType, options],
    queryFn: async () => {
      const methodName = `get${capitalize(entityType)}`;
      if (!api[methodName]) {
        throw new Error(`No API method for entity type: ${entityType}`);
      }
      return api[methodName](options);
    },
    staleTime: gameConstants?.CACHE_TIMES?.[entityType] || 5 * 60 * 1000,
    ...options.queryOptions
  });
}

// hooks/useEntityMutation.js - Generic mutations
export function useEntityMutation(entityType, action = 'update') {
  const queryClient = useQueryClient();
  const api = useApi();
  
  return useMutation({
    mutationFn: async (data) => {
      const methodName = `${action}${capitalize(entityType)}`;
      if (!api[methodName]) {
        throw new Error(`No API method: ${methodName}`);
      }
      return api[methodName](data);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [entityType] });
    }
  });
}

// hooks/useLoadingState.js - Consistent loading
export function useLoadingState(isLoading, message = 'Loading...') {
  if (!isLoading) return null;
  
  return <UnifiedLoadingState message={message} />;
}

// hooks/useErrorHandler.js - Centralized errors
export function useErrorHandler() {
  return useCallback((error, context) => {
    logger.error(`Error in ${context}:`, error);
    
    // Show user-friendly message
    const message = error.response?.data?.message || 
                   error.message || 
                   'An unexpected error occurred';
    
    // Could integrate with toast/snackbar system
    return { message, code: error.code };
  }, []);
}
```

#### Implementation Priority
1. Start with useEntityData (most reused)
2. Convert these 5 components first:
   - CharacterList
   - ElementList
   - PuzzleList
   - TimelineList
   - MemoryEconomyPage
3. Document patterns in PATTERNS.md
4. Add ESLint rule to enforce usage

## Testing Strategy

### E2E Tests for Critical Paths
```javascript
// tests/e2e/criticalPaths.spec.js
import { test, expect } from '@playwright/test';

test.describe('Critical User Paths', () => {
  test('Memory Economy displays token values', async ({ page }) => {
    await page.goto('/memory-economy');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="token-count"]');
    
    // Verify token count
    await expect(page.locator('[data-testid="token-count"]')).toHaveText('55');
    
    // Verify specific token (Howie's $200)
    await expect(page.locator('[data-testid="howie-token"]')).toContainText('$200');
    
    // Verify value calculations
    await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
  });
  
  test('Character Sociogram shows relationships', async ({ page }) => {
    await page.goto('/character-sociogram');
    
    // Wait for graph to render
    await page.waitForSelector('[data-testid="relationship-graph"]');
    
    // Verify relationship count
    await expect(page.locator('[data-testid="relationship-count"]')).toHaveText('60');
    
    // Verify nodes are interactive
    await page.locator('[data-testid="character-node-alex"]').click();
    await expect(page.locator('[data-testid="character-details"]')).toBeVisible();
  });
  
  test('Error boundaries prevent app crashes', async ({ page }) => {
    // Navigate to page with intentional error
    await page.goto('/test/error-boundary');
    
    // Verify error boundary caught it
    await expect(page.locator('[data-testid="error-boundary-message"]')).toBeVisible();
    
    // Verify can still navigate
    await page.locator('[data-testid="go-home-button"]').click();
    await expect(page).toHaveURL('/');
  });
});
```

### Component Testing Patterns
```javascript
// Example: Testing refactored components
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThreadList } from '../ThreadList';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ThreadList', () => {
  it('renders thread items correctly', () => {
    const threads = [
      { id: '1', name: 'Marcus Investigation', color: 'error' },
      { id: '2', name: 'Corporate Intrigue', color: 'warning' }
    ];
    
    render(
      <ThreadList 
        threads={threads}
        selectedThread="1"
        onThreadSelect={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Marcus Investigation')).toBeInTheDocument();
    expect(screen.getByText('Corporate Intrigue')).toBeInTheDocument();
  });
});
```

## Regression Prevention

### 1. Test-First Refactoring
- Write tests for current behavior BEFORE changes
- Use tests as safety net during refactoring
- Verify no functionality lost

```javascript
// Before refactoring, capture current behavior
test('NarrativeThreadTracker current behavior', async () => {
  const { container } = render(<NarrativeThreadTrackerPage />);
  
  // Capture current DOM structure
  expect(container).toMatchSnapshot();
  
  // Verify specific functionality
  await waitFor(() => {
    expect(screen.getByText('Narrative Thread Tracker')).toBeInTheDocument();
  });
});
```

### 2. Feature Flags
```javascript
// config/features.js
export const FEATURES = {
  NEW_ERROR_BOUNDARIES: true,
  GOD_COMPONENT_REFACTOR: process.env.NODE_ENV === 'development',
  PRODUCTION_LOGGER: true,
  STANDARDIZED_HOOKS: false
};

// Usage
import { FEATURES } from '../config/features';

if (FEATURES.NEW_ERROR_BOUNDARIES) {
  return <ErrorBoundary><Component /></ErrorBoundary>;
} else {
  return <Component />;
}
```

### 3. Incremental Rollout
- Deploy one change at a time
- Monitor error rates after each deployment
- Quick rollback capability via feature flags
- A/B test new patterns with subset of users

## Performance Optimizations

### React.memo Usage
```javascript
// For expensive components
export const ExpensiveVisualization = React.memo(({ data }) => {
  // Complex rendering logic
  return <ComplexGraph data={data} />;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

### useMemo/useCallback Patterns
```javascript
// In refactored components
function ThreadAnalysis({ threads, filters }) {
  // Memoize expensive calculations
  const analysisResults = useMemo(() => {
    return threads
      .filter(thread => matchesFilters(thread, filters))
      .map(thread => analyzeThread(thread));
  }, [threads, filters]);
  
  // Memoize callbacks passed to children
  const handleThreadSelect = useCallback((threadId) => {
    logger.debug('Thread selected:', threadId);
    setSelectedThread(threadId);
  }, []);
  
  return <AnalysisDisplay results={analysisResults} onSelect={handleThreadSelect} />;
}
```

### Virtual Scrolling
```javascript
// For large lists
import { VariableSizeList } from 'react-window';

function LargeThreadList({ threads }) {
  const getItemSize = (index) => {
    // Variable heights based on content
    return threads[index].expanded ? 200 : 80;
  };
  
  return (
    <VariableSizeList
      height={600}
      itemCount={threads.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <ThreadListItem
          thread={threads[index]}
          style={style}
        />
      )}
    </VariableSizeList>
  );
}
```

## Monitoring & Observability

### Error Tracking Integration
```javascript
// utils/errorTracking.js
export function initErrorTracking() {
  if (import.meta.env.PROD) {
    // Initialize Sentry or similar
    window.errorReporting = {
      logError: (error) => {
        // Send to error tracking service
      },
      logWarning: (warning) => {
        // Send warning to monitoring
      }
    };
  }
}
```

### Performance Monitoring
```javascript
// utils/performance.js
export function trackComponentPerformance(componentName) {
  return function measurePerformance(WrappedComponent) {
    return function MeasuredComponent(props) {
      useEffect(() => {
        // Track render time
        performance.mark(`${componentName}-start`);
        
        return () => {
          performance.mark(`${componentName}-end`);
          performance.measure(
            componentName,
            `${componentName}-start`,
            `${componentName}-end`
          );
          
          // Send to analytics
          const measure = performance.getEntriesByName(componentName)[0];
          logger.perf(`${componentName} render time: ${measure.duration}ms`);
        };
      }, []);
      
      return <WrappedComponent {...props} />;
    };
  };
}
```

## Success Metrics

### Technical Metrics
- Error Boundary Coverage: 0% → 100%
- Console Logs in Production: 96 → 0
- Largest Component Size: 1,065 → 300 lines
- Test Coverage: 63.68% → 80%
- Page Load Time: Track baseline → 20% improvement
- Error Rate: Track baseline → 50% reduction

### Quality Metrics
- Code Duplication: Reduce by 60%
- Cyclomatic Complexity: Max 10 per function
- Bundle Size: Monitor for increases
- Accessibility Score: Maintain 90+

### Development Velocity
- Time to implement new features: -30%
- Bug fix time: -40%
- Onboarding time for new devs: -50%