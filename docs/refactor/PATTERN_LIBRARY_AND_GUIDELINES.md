# ALNTool/StoryForge Pattern Library and Guidelines

## Overview

This document establishes consistent patterns for common operations across the ALNTool/StoryForge codebase, ensuring maintainability and reducing cognitive load.

## Component Patterns

### Atomic Design Hierarchy

#### Atoms (Smallest Components)
```javascript
// components/atoms/Button.jsx (<30 LOC)
export const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  children, 
  disabled = false,
  loading = false 
}) => {
  const className = clsx(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    { 'btn-loading': loading }
  );

  return (
    <button 
      className={className} 
      onClick={onClick} 
      disabled={disabled || loading}
    >
      {loading ? <Spinner size="small" /> : children}
    </button>
  );
};
```

#### Molecules (Composed Atoms)
```javascript
// components/molecules/EntityCard.jsx (<50 LOC)
export const EntityCard = ({ entity, onSelect, isSelected }) => {
  const typeIcon = getEntityIcon(entity.type);
  
  return (
    <Card 
      className={clsx('entity-card', { 'selected': isSelected })}
      onClick={() => onSelect(entity)}
    >
      <CardHeader>
        <Icon name={typeIcon} />
        <Typography variant="h6">{entity.name}</Typography>
      </CardHeader>
      <CardContent>
        <EntityBadges badges={entity.badges} />
        <Typography variant="body2">{entity.description}</Typography>
      </CardContent>
    </Card>
  );
};
```

#### Organisms (Complex Components)
```javascript
// components/organisms/EntitySelector.jsx (<100 LOC)
export const EntitySelector = ({ onSelect, selectedId }) => {
  const { entities, loading, error } = useEntities();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredEntities = useFilteredEntities(entities, searchTerm);
  
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div className="entity-selector">
      <SearchInput 
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search entities..."
      />
      <EntityGrid>
        {filteredEntities.map(entity => (
          <EntityCard
            key={entity.id}
            entity={entity}
            onSelect={onSelect}
            isSelected={entity.id === selectedId}
          />
        ))}
      </EntityGrid>
    </div>
  );
};
```

### Loading State Patterns

```javascript
// components/atoms/LoadingStates.jsx
export const LoadingState = ({ size = 'medium', message }) => (
  <div className={`loading-state loading-${size}`}>
    <Spinner size={size} />
    {message && <Typography>{message}</Typography>}
  </div>
);

export const SkeletonCard = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-header" />
        <div className="skeleton-body" />
      </div>
    ))}
  </>
);

export const InlineLoader = ({ loading, children }) => (
  <div className="inline-loader">
    {loading && <Spinner size="tiny" />}
    <span className={loading ? 'loading' : ''}>{children}</span>
  </div>
);
```

### Error Boundary Patterns

```javascript
// components/atoms/ErrorBoundary.jsx
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    logger.error('Component Error:', { error, info });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}

// Usage: Wrap at multiple levels
<ErrorBoundary>
  <JourneyIntelligenceView />
</ErrorBoundary>
```

## Hook Patterns

### Data Fetching Hook Pattern
```javascript
// hooks/data/useEntityData.js
export const useEntityData = (entityType, entityId) => {
  return useQuery({
    queryKey: ['entity', entityType, entityId],
    queryFn: () => api[entityType].getById(entityId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      logger.error(`Failed to fetch ${entityType}:`, error);
    }
  });
};

// Usage
const { data: character, loading, error } = useEntityData('characters', characterId);
```

### UI State Hook Pattern
```javascript
// hooks/ui/useToggle.js
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return { value, toggle, setTrue, setFalse };
};

// hooks/ui/useDebounce.js
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### Composition Hook Pattern
```javascript
// hooks/composite/useEntitySelection.js
export const useEntitySelection = () => {
  const { selectedEntityId, setSelectedEntity } = useJourneyStore();
  const { data: entity, loading } = useEntityData(selectedEntityId?.type, selectedEntityId?.id);
  const { showPanel, hidePanel } = useUIControls();
  
  const selectEntity = useCallback((entity) => {
    setSelectedEntity(entity);
    showPanel('intelligence');
  }, [setSelectedEntity, showPanel]);
  
  const clearSelection = useCallback(() => {
    setSelectedEntity(null);
    hidePanel('intelligence');
  }, [setSelectedEntity, hidePanel]);
  
  return {
    selectedEntity: entity,
    loading,
    selectEntity,
    clearSelection
  };
};
```

## State Management Patterns

### Zustand Store Pattern
```javascript
// stores/ui/journeyStore.js
export const useJourneyStore = create(
  persist(
    (set, get) => ({
      // State
      selectedEntityId: null,
      viewMode: 'overview',
      activeIntelligence: ['economic', 'story'],
      
      // Actions
      setSelectedEntity: (entity) => set({ 
        selectedEntityId: entity ? { type: entity.type, id: entity.id } : null 
      }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      toggleIntelligence: (layer) => set(state => ({
        activeIntelligence: state.activeIntelligence.includes(layer)
          ? state.activeIntelligence.filter(l => l !== layer)
          : [...state.activeIntelligence, layer]
      })),
      
      // Computed
      isIntelligenceActive: (layer) => get().activeIntelligence.includes(layer),
      
      // Reset
      reset: () => set({
        selectedEntityId: null,
        viewMode: 'overview',
        activeIntelligence: ['economic', 'story']
      })
    }),
    {
      name: 'journey-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
        activeIntelligence: state.activeIntelligence
      })
    }
  )
);
```

### React Query Pattern
```javascript
// stores/server/queryClient.js
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnMount: true
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        toast.error(error.message || 'An error occurred');
      }
    }
  }
});

// hooks/data/useCharacters.js
export const useCharacters = (options = {}) => {
  return useQuery({
    queryKey: ['characters', options],
    queryFn: () => api.characters.getAll(options),
    ...options.queryOptions
  });
};

export const useUpdateCharacter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => api.characters.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries(['characters']);
      queryClient.setQueryData(['characters', id], data);
      toast.success('Character updated successfully');
    }
  });
};
```

## API Integration Patterns

### API Client Configuration
```javascript
// services/api/client.js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data.data || response.data,
  (error) => {
    const message = error.response?.data?.error?.message || error.message;
    logger.error('API Error:', { error, message });
    return Promise.reject(new Error(message));
  }
);
```

### Generic CRUD Pattern
```javascript
// services/api/createCrudEndpoints.js
export const createCrudEndpoints = (resource) => ({
  getAll: (params) => apiClient.get(`/${resource}`, { params }),
  getById: (id) => apiClient.get(`/${resource}/${id}`),
  create: (data) => apiClient.post(`/${resource}`, data),
  update: (id, data) => apiClient.put(`/${resource}/${id}`, data),
  delete: (id) => apiClient.delete(`/${resource}/${id}`),
  
  // Batch operations
  batchCreate: (items) => apiClient.post(`/${resource}/batch`, { items }),
  batchUpdate: (updates) => apiClient.put(`/${resource}/batch`, { updates }),
  batchDelete: (ids) => apiClient.delete(`/${resource}/batch`, { data: { ids } })
});
```

## Utility Patterns

### Type-Safe Utilities
```javascript
// utils/entityUtils.js
export const getEntityType = (entity) => {
  return entity?.type || entity?.basicType || 'Unknown';
};

export const isValidEntityId = (id) => {
  return typeof id === 'string' && id.length > 0;
};

export const normalizeEntity = (entity) => ({
  id: entity.id,
  name: entity.name || 'Unnamed',
  type: getEntityType(entity),
  description: entity.description || '',
  metadata: entity.metadata || {}
});
```

### Formatting Utilities
```javascript
// utils/formatters.js
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

export const formatDate = (date, format = 'short') => {
  const options = {
    short: { month: 'short', day: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: 'numeric', minute: 'numeric' }
  };
  
  return new Intl.DateTimeFormat('en-US', options[format]).format(new Date(date));
};

export const truncate = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};
```

## Testing Patterns

### Component Testing Pattern
```javascript
// tests/components/EntityCard.test.jsx
describe('EntityCard', () => {
  const mockEntity = {
    id: '123',
    name: 'Test Character',
    type: 'character',
    description: 'Test description'
  };
  
  it('renders entity information', () => {
    render(<EntityCard entity={mockEntity} />);
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
  
  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<EntityCard entity={mockEntity} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('article'));
    expect(onSelect).toHaveBeenCalledWith(mockEntity);
  });
  
  it('applies selected styles', () => {
    const { container } = render(
      <EntityCard entity={mockEntity} isSelected={true} />
    );
    
    expect(container.firstChild).toHaveClass('selected');
  });
});
```

### Hook Testing Pattern
```javascript
// tests/hooks/useDebounce.test.js
describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });
  
  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );
    
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');
    
    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe('updated');
  });
});
```

## Error Handling Patterns

### Try-Catch with Context
```javascript
// services/errorHandler.js
export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const handleError = (error, context) => {
  logger.error(`Error in ${context}:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    details: error.details
  });
  
  // User-friendly error messages
  const userMessage = ERROR_MESSAGES[error.code] || 'An unexpected error occurred';
  
  return {
    success: false,
    error: {
      message: userMessage,
      code: error.code,
      timestamp: error.timestamp
    }
  };
};
```

### Async Error Boundaries
```javascript
// hooks/useAsyncError.js
export const useAsyncError = () => {
  const [, setError] = useState();
  
  return useCallback(
    (error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
};

// Usage in async operations
const throwError = useAsyncError();

const fetchData = async () => {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    throwError(new AppError('Failed to fetch data', 'FETCH_ERROR', { error }));
  }
};
```

## Performance Patterns

### Memoization Pattern
```javascript
// components/ExpensiveComponent.jsx
export const ExpensiveComponent = memo(({ data, options }) => {
  const processedData = useMemo(
    () => expensiveProcessing(data, options),
    [data, options]
  );
  
  const handleClick = useCallback(
    (item) => {
      console.log('Clicked:', item);
    },
    []
  );
  
  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
});

// Only re-render if props actually changed
ExpensiveComponent.displayName = 'ExpensiveComponent';
```

### Virtualization Pattern
```javascript
// components/VirtualizedList.jsx
import { FixedSizeList } from 'react-window';

export const VirtualizedEntityList = ({ entities, onSelect }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <EntityCard
        entity={entities[index]}
        onSelect={onSelect}
      />
    </div>
  );
  
  return (
    <AutoSizer>
      {({ height, width }) => (
        <FixedSizeList
          height={height}
          width={width}
          itemCount={entities.length}
          itemSize={120}
        >
          {Row}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};
```

## Code Style Guidelines

### Naming Conventions
- **Components**: PascalCase (`EntityCard`, `JourneyView`)
- **Hooks**: camelCase with 'use' prefix (`useEntities`, `useDebounce`)
- **Utilities**: camelCase (`formatDate`, `validateEntity`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_ENTITIES`, `API_TIMEOUT`)
- **Files**: Match export name (`EntityCard.jsx`, `useEntities.js`)

### Import Order
```javascript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

// 2. Internal dependencies - absolute paths
import { api } from '@/services/api';
import { useJourneyStore } from '@/stores/journeyStore';

// 3. Internal dependencies - relative paths
import { EntityCard } from './components/EntityCard';
import { useEntityData } from './hooks/useEntityData';

// 4. Styles
import styles from './EntitySelector.module.css';
```

### Export Patterns
```javascript
// Named exports for utilities and hooks
export const formatDate = (date) => { /* ... */ };
export const useDebounce = (value, delay) => { /* ... */ };

// Default export for components
const EntityCard = ({ entity }) => { /* ... */ };
export default EntityCard;

// Re-export pattern for indexes
// components/index.js
export { default as EntityCard } from './EntityCard';
export { default as EntityGrid } from './EntityGrid';
export * from './LoadingStates';
```

## Conclusion

These patterns provide a consistent foundation for ALNTool/StoryForge development. By following these guidelines, developers can create maintainable, performant code that scales with the application's growth.