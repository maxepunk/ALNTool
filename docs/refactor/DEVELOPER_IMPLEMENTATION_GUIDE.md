# ALNTool/StoryForge Developer Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the unified architecture refactoring. Each section includes before/after code examples, testing requirements, and verification steps.

## Refactoring Pattern 1: State Management Migration

### Pattern: Local State → Zustand Store

#### Before (Local State)
```javascript
// components/JourneyIntelligenceView.jsx
const JourneyIntelligenceView = () => {
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [activeIntelligence, setActiveIntelligence] = useState(['economic', 'story']);
  const [isEntityPanelOpen, setIsEntityPanelOpen] = useState(false);
  
  const handleEntitySelect = (entity) => {
    setSelectedEntityId(entity.id);
    setIsEntityPanelOpen(true);
  };
  
  const toggleIntelligence = (layer) => {
    setActiveIntelligence(prev => 
      prev.includes(layer) 
        ? prev.filter(l => l !== layer)
        : [...prev, layer]
    );
  };
  
  // Component continues...
};
```

#### After (Zustand Store)
```javascript
// stores/journeyStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useJourneyStore = create(
  persist(
    (set, get) => ({
      // State
      selectedEntityId: null,
      viewMode: 'overview',
      activeIntelligence: ['economic', 'story'],
      isEntityPanelOpen: false,
      
      // Actions
      selectEntity: (entity) => set({
        selectedEntityId: entity?.id,
        isEntityPanelOpen: true
      }),
      
      clearSelection: () => set({
        selectedEntityId: null,
        isEntityPanelOpen: false
      }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      toggleIntelligence: (layer) => set(state => ({
        activeIntelligence: state.activeIntelligence.includes(layer)
          ? state.activeIntelligence.filter(l => l !== layer)
          : [...state.activeIntelligence, layer]
      })),
      
      // Computed values
      isIntelligenceActive: (layer) => get().activeIntelligence.includes(layer)
    }),
    {
      name: 'journey-storage',
      version: 1
    }
  )
);

// components/JourneyIntelligenceView.jsx (refactored)
const JourneyIntelligenceView = () => {
  const { 
    selectedEntityId, 
    viewMode,
    selectEntity,
    clearSelection 
  } = useJourneyStore();
  
  // Cleaner component with externalized state
};
```

#### Testing Requirements
```javascript
// tests/stores/journeyStore.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useJourneyStore } from '@/stores/journeyStore';

describe('Journey Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useJourneyStore.getState().clearSelection();
  });
  
  it('selects entity correctly', () => {
    const { result } = renderHook(() => useJourneyStore());
    
    act(() => {
      result.current.selectEntity({ id: '123', name: 'Test Entity' });
    });
    
    expect(result.current.selectedEntityId).toBe('123');
    expect(result.current.isEntityPanelOpen).toBe(true);
  });
  
  it('toggles intelligence layers', () => {
    const { result } = renderHook(() => useJourneyStore());
    
    // Economic is active by default
    expect(result.current.isIntelligenceActive('economic')).toBe(true);
    
    act(() => {
      result.current.toggleIntelligence('economic');
    });
    
    expect(result.current.isIntelligenceActive('economic')).toBe(false);
  });
  
  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useJourneyStore());
    
    act(() => {
      result.current.setViewMode('focus');
    });
    
    // Check localStorage
    const stored = JSON.parse(localStorage.getItem('journey-storage'));
    expect(stored.state.viewMode).toBe('focus');
  });
});
```

#### Verification Steps
```bash
# 1. Run store tests
npm test stores/journeyStore

# 2. Check component still works
npm run dev
# - Select an entity
# - Toggle intelligence layers
# - Refresh page (state should persist)

# 3. Verify no console errors
# 4. Check React DevTools for proper store updates
```

## Refactoring Pattern 2: Server State Migration

### Pattern: useEffect + fetch → React Query

#### Before (useEffect)
```javascript
// components/EntitySelector.jsx
const EntitySelector = ({ onSelect }) => {
  const [characters, setCharacters] = useState([]);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [charResponse, elemResponse] = await Promise.all([
          fetch('/api/characters'),
          fetch('/api/elements')
        ]);
        
        if (!charResponse.ok || !elemResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const charData = await charResponse.json();
        const elemData = await elemResponse.json();
        
        setCharacters(charData.data);
        setElements(elemData.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // Component continues...
};
```

#### After (React Query)
```javascript
// hooks/queries/useEntities.js
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useCharacters = () => {
  return useQuery({
    queryKey: ['characters'],
    queryFn: api.characters.getAll,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  });
};

export const useElements = () => {
  return useQuery({
    queryKey: ['elements'],
    queryFn: api.elements.getAll,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });
};

export const useEntities = () => {
  const charactersQuery = useCharacters();
  const elementsQuery = useElements();
  
  return {
    characters: charactersQuery.data || [],
    elements: elementsQuery.data || [],
    isLoading: charactersQuery.isLoading || elementsQuery.isLoading,
    error: charactersQuery.error || elementsQuery.error
  };
};

// components/EntitySelector.jsx (refactored)
import { useEntities } from '@/hooks/queries/useEntities';

const EntitySelector = ({ onSelect }) => {
  const { characters, elements, isLoading, error } = useEntities();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // Component continues with same JSX
};
```

#### Testing Requirements
```javascript
// tests/hooks/useEntities.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEntities } from '@/hooks/queries/useEntities';
import { server } from '@/tests/mocks/server';
import { rest } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useEntities', () => {
  it('fetches characters and elements', async () => {
    const { result } = renderHook(() => useEntities(), {
      wrapper: createWrapper()
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.characters).toHaveLength(10);
    expect(result.current.elements).toHaveLength(20);
  });
  
  it('handles errors gracefully', async () => {
    server.use(
      rest.get('/api/characters', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );
    
    const { result } = renderHook(() => useEntities(), {
      wrapper: createWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

#### Verification Steps
```bash
# 1. Test the hook
npm test hooks/useEntities

# 2. Check network tab in browser
# - Should see initial fetch
# - Refresh page - should use cache (no new request)
# - Wait 5 minutes - should see background refetch

# 3. Test error states
# - Stop backend server
# - Should see error UI
# - Start server
# - Should recover automatically
```

## Refactoring Pattern 3: Service Layer Consolidation

### Pattern: Scattered API Calls → Unified Service

#### Before (Scattered)
```javascript
// Multiple files with direct API calls
// components/CharacterList.jsx
const fetchCharacters = async () => {
  const response = await fetch('/api/characters');
  return response.json();
};

// components/ElementGrid.jsx
const fetchElements = async (params) => {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/elements?${query}`);
  return response.json();
};

// components/PuzzleManager.jsx
const createPuzzle = async (data) => {
  const response = await fetch('/api/puzzles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

#### After (Unified Service)
```javascript
// services/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.error?.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

// services/api/endpoints.js
import apiClient from './client';

const createCrudEndpoints = (resource) => ({
  getAll: (params) => apiClient.get(`/${resource}`, { params }),
  getById: (id) => apiClient.get(`/${resource}/${id}`),
  create: (data) => apiClient.post(`/${resource}`, data),
  update: (id, data) => apiClient.put(`/${resource}/${id}`, data),
  delete: (id) => apiClient.delete(`/${resource}/${id}`)
});

export const api = {
  characters: createCrudEndpoints('characters'),
  elements: createCrudEndpoints('elements'),
  puzzles: createCrudEndpoints('puzzles'),
  timeline: createCrudEndpoints('timeline-events'),
  
  // Special endpoints
  journey: {
    getAnalysis: (characterId) => 
      apiClient.get(`/journey/${characterId}/analysis`),
    getIntelligence: (entityId, layer) => 
      apiClient.get(`/intelligence/${entityId}/${layer}`)
  }
};

// Usage in components (refactored)
import { api } from '@/services/api';

// In React Query hooks
const { data } = useQuery({
  queryKey: ['characters'],
  queryFn: () => api.characters.getAll()
});

// In mutations
const createPuzzle = useMutation({
  mutationFn: api.puzzles.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['puzzles']);
  }
});
```

#### Testing Requirements
```javascript
// tests/services/api.test.js
import { api } from '@/services/api';
import { server } from '@/tests/mocks/server';
import { rest } from 'msw';

describe('API Service', () => {
  describe('CRUD operations', () => {
    it('fetches all characters', async () => {
      const characters = await api.characters.getAll();
      expect(characters).toHaveLength(10);
      expect(characters[0]).toHaveProperty('id');
      expect(characters[0]).toHaveProperty('name');
    });
    
    it('creates a new element', async () => {
      const newElement = {
        name: 'Test Element',
        type: 'prop',
        description: 'Test description'
      };
      
      const created = await api.elements.create(newElement);
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Test Element');
    });
    
    it('handles errors with user-friendly messages', async () => {
      server.use(
        rest.get('/api/characters', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ 
              error: { 
                message: 'Database connection failed' 
              }
            })
          );
        })
      );
      
      await expect(api.characters.getAll()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
```

#### Verification Steps
```bash
# 1. Run API tests
npm test services/api

# 2. Check all endpoints work
npm run test:api:endpoints

# 3. Verify error handling
# - Disconnect from network
# - Should see user-friendly error messages
# - No raw error objects in UI
```

## Refactoring Pattern 4: Component Decomposition

### Pattern: Monolithic Component → Modular Structure

#### Before (Monolithic - 500+ lines)
```javascript
// components/IntelligencePanel.jsx
const IntelligencePanel = ({ entity }) => {
  const [activeTab, setActiveTab] = useState('economic');
  const [economicData, setEconomicData] = useState(null);
  const [storyData, setStoryData] = useState(null);
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 50 lines of data fetching logic
  useEffect(() => {
    // Fetch economic data
    // Fetch story data  
    // Fetch social data
  }, [entity]);
  
  // 100 lines of economic analysis rendering
  const renderEconomicAnalysis = () => {
    // Complex rendering logic
  };
  
  // 100 lines of story analysis rendering
  const renderStoryAnalysis = () => {
    // Complex rendering logic
  };
  
  // 100 lines of social analysis rendering
  const renderSocialAnalysis = () => {
    // Complex rendering logic
  };
  
  // 50 lines of utility functions
  
  return (
    <div className="intelligence-panel">
      {/* 100 lines of JSX */}
    </div>
  );
};
```

#### After (Modular - <100 lines each)
```javascript
// components/IntelligencePanel/index.jsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { EconomicAnalysis } from './EconomicAnalysis';
import { StoryAnalysis } from './StoryAnalysis';
import { SocialAnalysis } from './SocialAnalysis';
import { useIntelligenceData } from './hooks/useIntelligenceData';

export const IntelligencePanel = ({ entity }) => {
  const [activeTab, setActiveTab] = useState('economic');
  
  if (!entity) return null;
  
  return (
    <div className="intelligence-panel">
      <h2>{entity.name} - Intelligence Analysis</h2>
      
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab value="economic">Economic</Tab>
          <Tab value="story">Story</Tab>
          <Tab value="social">Social</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel value="economic">
            <EconomicAnalysis entity={entity} />
          </TabPanel>
          <TabPanel value="story">
            <StoryAnalysis entity={entity} />
          </TabPanel>
          <TabPanel value="social">
            <SocialAnalysis entity={entity} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

// components/IntelligencePanel/EconomicAnalysis.jsx
export const EconomicAnalysis = ({ entity }) => {
  const { data, isLoading, error } = useEconomicData(entity.id);
  
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div className="economic-analysis">
      <MetricCard
        title="Token Value"
        value={data.tokenValue}
        change={data.tokenChange}
      />
      <MetricCard
        title="Path Balance"
        value={data.pathBalance}
        status={data.balanceStatus}
      />
      <ChoicePressureChart data={data.choicePressure} />
    </div>
  );
};

// hooks/useIntelligenceData.js
export const useEconomicData = (entityId) => {
  return useQuery({
    queryKey: ['intelligence', 'economic', entityId],
    queryFn: () => api.journey.getIntelligence(entityId, 'economic'),
    enabled: !!entityId
  });
};
```

#### Testing Requirements
```javascript
// tests/components/IntelligencePanel.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { IntelligencePanel } from '@/components/IntelligencePanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('IntelligencePanel', () => {
  const mockEntity = {
    id: '123',
    name: 'Test Character',
    type: 'character'
  };
  
  it('renders all analysis tabs', () => {
    renderWithProviders(<IntelligencePanel entity={mockEntity} />);
    
    expect(screen.getByText('Economic')).toBeInTheDocument();
    expect(screen.getByText('Story')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
  });
  
  it('switches between tabs', async () => {
    renderWithProviders(<IntelligencePanel entity={mockEntity} />);
    
    // Economic tab is active by default
    expect(await screen.findByText('Token Value')).toBeInTheDocument();
    
    // Switch to Story tab
    fireEvent.click(screen.getByText('Story'));
    expect(await screen.findByText('Timeline Connections')).toBeInTheDocument();
  });
  
  it('handles null entity gracefully', () => {
    const { container } = renderWithProviders(
      <IntelligencePanel entity={null} />
    );
    
    expect(container.firstChild).toBeNull();
  });
});
```

#### Verification Steps
```bash
# 1. Check component sizes
npm run verify:components

# 2. Run component tests
npm test IntelligencePanel

# 3. Visual testing
npm run dev
# - Open Intelligence Panel
# - Switch between tabs
# - Verify all data loads correctly
# - Check loading states

# 4. Performance check
# - Open React DevTools Profiler
# - Record tab switching
# - Should see improved render times
```

## Refactoring Pattern 5: Intelligence Layer Implementation

### Pattern: Ad-hoc Analysis → Structured Intelligence System

#### Before (Ad-hoc)
```javascript
// Scattered analysis logic across components
const CharacterView = ({ character }) => {
  // Inline economic calculations
  const totalValue = character.elements.reduce((sum, el) => 
    sum + (el.value || 0), 0
  );
  
  // Mixed concerns
  const storyConnections = character.timeline_events.filter(event => 
    event.type === 'revelation'
  ).length;
  
  // Hardcoded analysis
  return (
    <div>
      <p>Total Value: {totalValue}</p>
      <p>Story Points: {storyConnections}</p>
    </div>
  );
};
```

#### After (Structured System)
```javascript
// services/intelligence/economicIntelligence.js
export class EconomicIntelligence {
  analyze(entity) {
    return {
      tokenValue: this.calculateTokenValue(entity),
      pathBalance: this.analyzePathBalance(entity),
      choicePressure: this.calculateChoicePressure(entity),
      recommendations: this.generateRecommendations(entity)
    };
  }
  
  calculateTokenValue(entity) {
    if (entity.type === 'character') {
      return this.calculateCharacterValue(entity);
    }
    return entity.calculated_memory_value || 0;
  }
  
  calculateCharacterValue(character) {
    const elementValues = character.elements
      .map(el => el.calculated_memory_value || 0)
      .reduce((sum, val) => sum + val, 0);
    
    const puzzleValues = character.puzzles
      .map(p => p.memory_reward || 0)
      .reduce((sum, val) => sum + val, 0);
    
    return {
      total: elementValues + puzzleValues,
      breakdown: {
        elements: elementValues,
        puzzles: puzzleValues
      }
    };
  }
  
  analyzePathBalance(entity) {
    const paths = {
      blackMarket: this.calculateBlackMarketPotential(entity),
      detective: this.calculateDetectiveProgress(entity),
      return: this.calculateReturnValue(entity)
    };
    
    const maxValue = Math.max(...Object.values(paths));
    const minValue = Math.min(...Object.values(paths));
    const balance = 1 - (maxValue - minValue) / maxValue;
    
    return {
      paths,
      balance,
      status: balance > 0.7 ? 'balanced' : 'imbalanced',
      recommendation: this.recommendBalance(paths)
    };
  }
}

// components/IntelligencePanel/EconomicAnalysis.jsx
import { useIntelligence } from '@/hooks/useIntelligence';

export const EconomicAnalysis = ({ entity }) => {
  const { data, isLoading } = useIntelligence(entity, 'economic');
  
  if (isLoading) return <LoadingState />;
  
  return (
    <div className="economic-analysis">
      <ValueBreakdown data={data.tokenValue} />
      <PathBalanceChart data={data.pathBalance} />
      <ChoicePressureGauge value={data.choicePressure} />
      <Recommendations items={data.recommendations} />
    </div>
  );
};

// hooks/useIntelligence.js
export const useIntelligence = (entity, layer) => {
  return useQuery({
    queryKey: ['intelligence', layer, entity.id],
    queryFn: async () => {
      const service = intelligenceServices[layer];
      return service.analyze(entity);
    },
    enabled: !!entity && !!layer
  });
};
```

#### Testing Requirements
```javascript
// tests/services/intelligence/economicIntelligence.test.js
import { EconomicIntelligence } from '@/services/intelligence/economicIntelligence';

describe('EconomicIntelligence', () => {
  const service = new EconomicIntelligence();
  
  describe('calculateTokenValue', () => {
    it('calculates character value correctly', () => {
      const character = {
        type: 'character',
        elements: [
          { calculated_memory_value: 10 },
          { calculated_memory_value: 15 }
        ],
        puzzles: [
          { memory_reward: 5 },
          { memory_reward: 8 }
        ]
      };
      
      const result = service.calculateTokenValue(character);
      expect(result.total).toBe(38);
      expect(result.breakdown.elements).toBe(25);
      expect(result.breakdown.puzzles).toBe(13);
    });
    
    it('handles missing values gracefully', () => {
      const character = {
        type: 'character',
        elements: [{ name: 'No value' }],
        puzzles: []
      };
      
      const result = service.calculateTokenValue(character);
      expect(result.total).toBe(0);
    });
  });
  
  describe('analyzePathBalance', () => {
    it('identifies balanced paths', () => {
      const entity = {
        // Mock data that results in balanced paths
      };
      
      const result = service.analyzePathBalance(entity);
      expect(result.status).toBe('balanced');
      expect(result.balance).toBeGreaterThan(0.7);
    });
  });
});
```

#### Verification Steps
```bash
# 1. Run intelligence tests
npm test services/intelligence

# 2. Check calculations
npm run dev
# - Select different entities
# - Verify economic values match expectations
# - Check path balance visualizations

# 3. Performance testing
# - Monitor calculation time
# - Should be <100ms per analysis

# 4. Cross-reference with backend
# - Compare frontend calculations with backend
# - Should match within rounding errors
```

## Common Issues and Solutions

### Issue 1: State Not Updating
```javascript
// Problem: Direct state mutation
const toggleItem = (item) => {
  state.items.push(item); // Wrong!
  setState(state);
};

// Solution: Create new state
const toggleItem = (item) => {
  setState(prev => ({
    ...prev,
    items: [...prev.items, item]
  }));
};
```

### Issue 2: Memory Leaks
```javascript
// Problem: Missing cleanup
useEffect(() => {
  const timer = setInterval(fetchData, 5000);
  // No cleanup!
}, []);

// Solution: Return cleanup function
useEffect(() => {
  const timer = setInterval(fetchData, 5000);
  return () => clearInterval(timer);
}, []);
```

### Issue 3: Over-fetching
```javascript
// Problem: Fetching on every render
const Component = () => {
  const data = fetchData(); // Called every render!
};

// Solution: Use React Query
const Component = () => {
  const { data } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    staleTime: 5 * 60 * 1000
  });
};
```

## Verification Checklist

After each refactoring:

- [ ] All tests pass
- [ ] No console errors
- [ ] Component under size limit
- [ ] No performance regression
- [ ] Code follows patterns
- [ ] Documentation updated
- [ ] Peer review completed

## Next Steps

1. Start with Pattern 1 (State Management)
2. Move through patterns sequentially
3. Test thoroughly after each change
4. Document any deviations
5. Share learnings with team

Remember: The goal is maintainable, testable code that's easy to understand and extend.