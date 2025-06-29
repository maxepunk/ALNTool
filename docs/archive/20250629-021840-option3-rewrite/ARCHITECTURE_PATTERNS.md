# Architectural Patterns & Best Practices

## Data Fetching Pattern

### ❌ OLD: Inconsistent patterns across 21 components
```javascript
// Different patterns found in codebase:
const { data } = useQuery(['key'], () => fetch('/api/data'));
const { data } = useQuery('key', fetchData);
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: (
  }) => api.getData(),  // Malformed
  onSuccess: (data) => {} // v3 callback
});
```

### ✅ NEW: Standardized hook pattern
```javascript
// hooks/useEntityData.js
export function useEntityData(entityType, options = {}) {
  const { data: gameConstants } = useGameConstants();
  const api = useApi();
  
  return useQuery({
    queryKey: [entityType, options],
    queryFn: () => api[`get${capitalize(entityType)}`](options),
    staleTime: gameConstants?.CACHE_TIMES?.[entityType] || 5 * 60 * 1000,
    ...options.queryOptions
  });
}

// Usage in components
const { data, isLoading, error } = useEntityData('characters', {
  limit: 100,
  includeRelationships: true
});
```

## Error Boundary Pattern

### ❌ OLD: No error handling
```javascript
export default function MyPage() {
  const { data } = useQuery(...);
  
  // If this throws, entire app crashes
  return <ComplexComponent data={data} />;
}
```

### ✅ NEW: Protected components
```javascript
import ErrorBoundary from '../components/ErrorBoundary';

export default function MyPage() {
  return (
    <ErrorBoundary level="page">
      <MyPageContent />
    </ErrorBoundary>
  );
}

function MyPageContent() {
  const { data, isLoading, error } = useEntityData('myData');
  
  if (isLoading) return <UnifiedLoadingState />;
  if (error) return <UnifiedErrorState error={error} />;
  
  return <ComplexComponent data={data} />;
}
```

## Component Size Pattern

### ❌ OLD: 1000+ line god components
```javascript
// NarrativeThreadTrackerPage.jsx - 1,065 lines!
export default function GiantComponent() {
  // 50 lines of imports
  // 100 lines of state
  // 200 lines of data fetching
  // 300 lines of business logic
  // 400 lines of render methods
  // Everything mixed together!
}
```

### ✅ NEW: Focused components via composition
```javascript
// NarrativeThreadTrackerPage/index.jsx - 100 lines
export default function NarrativeThreadTrackerPage() {
  return (
    <ErrorBoundary level="page">
      <ThreadProvider>
        <ThreadHeader />
        <ThreadContent />
        <ThreadFooter />
      </ThreadProvider>
    </ErrorBoundary>
  );
}

// ThreadList.jsx - 200 lines (just list UI)
export function ThreadList({ threads, onSelect }) {
  return threads.map(thread => (
    <ThreadItem key={thread.id} thread={thread} onClick={onSelect} />
  ));
}

// useThreadData.js - 100 lines (just data logic)
export function useThreadData(filters) {
  return useEntityData('threads', { filters });
}
```

## State Management Pattern

### ❌ OLD: Mixed state everywhere
```javascript
function MyComponent() {
  // Local state mixed with server state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  useEffect(() => {
    setLoading(true);
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filter, sortBy]);
  
  // 100 more lines...
}
```

### ✅ NEW: Separation of concerns
```javascript
// Server state via React Query
function MyComponent() {
  const { filter, sortBy } = useFilterStore();
  const { data, isLoading, error } = useEntityData('items', {
    filter,
    sortBy
  });
  
  if (isLoading) return <UnifiedLoadingState />;
  if (error) return <UnifiedErrorState error={error} />;
  
  return <ItemList items={data} />;
}

// UI state via Zustand
const useFilterStore = create((set) => ({
  filter: 'all',
  sortBy: 'name',
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy })
}));
```

## Loading State Pattern

### ❌ OLD: 21 different loading implementations
```javascript
// Version 1
if (loading) return <div>Loading...</div>;

// Version 2
if (isLoading) return <CircularProgress />;

// Version 3
if (!data) return <Spinner size="large" />;

// Version 4
return loading ? <Skeleton /> : <Content />;
```

### ✅ NEW: Unified loading component
```javascript
// components/UnifiedLoadingState.jsx
export function UnifiedLoadingState({ message = 'Loading...' }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
      <CircularProgress size={40} />
      <Typography sx={{ mt: 2 }}>{message}</Typography>
    </Box>
  );
}

// Usage
if (isLoading) return <UnifiedLoadingState message="Loading characters..." />;
```

## Console Logging Pattern

### ❌ OLD: console.* everywhere
```javascript
function processData(data) {
  console.log('Processing data:', data);
  
  try {
    const result = transform(data);
    console.log('Result:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### ✅ NEW: Production-safe logger
```javascript
import { logger } from '../utils/logger';

function processData(data) {
  logger.debug('Processing data:', data);
  
  try {
    const result = transform(data);
    logger.debug('Result:', result);
    return result;
  } catch (error) {
    logger.error('Error processing data:', error);
    throw error;
  }
}
```

## API Integration Pattern

### ❌ OLD: Direct API calls in components
```javascript
function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/characters')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{data?.name}</div>;
}
```

### ✅ NEW: Centralized API service
```javascript
// services/api.js
export const api = {
  getCharacters: (params) => client.get('/characters', { params }),
  getCharacter: (id) => client.get(`/characters/${id}`),
  updateCharacter: (id, data) => client.put(`/characters/${id}`, data)
};

// In component
function MyComponent() {
  const { data } = useQuery({
    queryKey: ['characters'],
    queryFn: () => api.getCharacters()
  });
  
  return <CharacterList characters={data} />;
}
```

## Testing Pattern

### ❌ OLD: No tests or inconsistent testing
```javascript
// No tests found for NarrativeThreadTrackerPage
// Some components have outdated enzyme tests
// Mocking is inconsistent
```

### ✅ NEW: Comprehensive testing strategy
```javascript
// __tests__/ThreadList.test.jsx
import { render, screen } from '@testing-library/react';
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
  it('renders threads correctly', () => {
    const threads = [
      { id: '1', name: 'Thread 1' },
      { id: '2', name: 'Thread 2' }
    ];
    
    render(<ThreadList threads={threads} />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Thread 1')).toBeInTheDocument();
    expect(screen.getByText('Thread 2')).toBeInTheDocument();
  });
});
```

## Performance Pattern

### ❌ OLD: Unnecessary re-renders
```javascript
function ExpensiveComponent({ data }) {
  // Re-renders on every parent update
  const processedData = data.map(item => ({
    ...item,
    computed: expensiveCalculation(item)
  }));
  
  return <DataGrid data={processedData} />;
}
```

### ✅ NEW: Optimized with memoization
```javascript
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => 
    data.map(item => ({
      ...item,
      computed: expensiveCalculation(item)
    })),
    [data]
  );
  
  return <DataGrid data={processedData} />;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.length === nextProps.data.length &&
         prevProps.data[0]?.id === nextProps.data[0]?.id;
});
```

## File Organization Pattern

### ❌ OLD: Flat structure, mixed concerns
```
src/
├── components/
│   ├── NarrativeThreadTracker.jsx (1065 lines)
│   ├── ThreadItem.jsx
│   ├── ThreadList.jsx
│   └── ... 50 more components
```

### ✅ NEW: Feature-based organization
```
src/
├── features/
│   ├── narrative-threads/
│   │   ├── components/
│   │   │   ├── ThreadList.jsx
│   │   │   ├── ThreadItem.jsx
│   │   │   └── ThreadMetrics.jsx
│   │   ├── hooks/
│   │   │   ├── useThreadData.js
│   │   │   └── useThreadFilters.js
│   │   ├── constants.js
│   │   └── index.jsx
│   └── memory-economy/
│       ├── components/
│       ├── hooks/
│       └── index.jsx
```

## Constants Pattern

### ❌ OLD: Hardcoded values
```javascript
function MemoryValue({ rating }) {
  // Hardcoded business logic!
  const baseValue = rating === 1 ? 100 : 
                   rating === 2 ? 500 : 
                   rating === 3 ? 1000 : 0;
  
  return <div>${baseValue}</div>;
}
```

### ✅ NEW: Centralized constants
```javascript
import { useGameConstants, getConstant } from '../hooks/useGameConstants';

function MemoryValue({ rating }) {
  const { data: constants } = useGameConstants();
  const baseValue = getConstant(constants, 'MEMORY_VALUE.BASE_VALUES', {})[rating] || 0;
  
  return <div>${baseValue}</div>;
}
```

## Type Safety Pattern (Future)

### ❌ OLD: No type checking
```javascript
function processCharacter(character) {
  // What properties does character have?
  // What if character is null?
  return character.name.toUpperCase();
}
```

### ✅ NEW: TypeScript interfaces
```typescript
interface Character {
  id: string;
  name: string;
  tier: 'Core' | 'Secondary' | 'Tertiary';
  resolutionPaths: string[];
}

function processCharacter(character: Character | null): string {
  if (!character) return 'Unknown';
  return character.name.toUpperCase();
}
```

## Migration Strategy

### Phase 1: Critical Patterns (Day 1)
1. Error Boundaries - Prevent crashes
2. Production Logger - Remove console.*
3. Unified Loading/Error - Consistency

### Phase 2: Standardization (Days 2-3)
1. useEntityData hook - Data fetching
2. Component splitting - Max 300 lines
3. Test patterns - Coverage increase

### Phase 3: Optimization (Days 4-5)
1. Memoization - Performance
2. Code splitting - Bundle size
3. TypeScript prep - Type safety

## ESLint Rules to Enforce Patterns

```javascript
// .eslintrc.js additions
module.exports = {
  rules: {
    // Prevent console usage
    'no-console': 'error',
    
    // Enforce hooks naming
    'react-hooks/rules-of-hooks': 'error',
    
    // Max file length
    'max-lines': ['error', { max: 300 }],
    
    // Require error boundaries
    'local-rules/require-error-boundary': 'error',
    
    // Prevent hardcoded values
    'local-rules/no-hardcoded-constants': 'error'
  }
};
```

## Quick Reference Checklist

Before committing any component:
- [ ] Has error boundary protection?
- [ ] Uses standardized data hooks?
- [ ] No console.* statements?
- [ ] Under 300 lines?
- [ ] Has tests?
- [ ] Uses GameConstants for business values?
- [ ] Follows file organization pattern?