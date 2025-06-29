# ALNTool Architecture Guide

> **Executive Summary**: Technical architecture documentation for the About Last Night Production Intelligence Tool. Describes the Single Source of Truth pattern, data flow architecture, testing infrastructure, and implementation patterns that ensure consistency and maintainability.

## Table of Contents
1. [Core Architecture Principles](#core-architecture-principles)
2. [Single Source of Truth Pattern](#single-source-of-truth-pattern)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Testing Architecture](#testing-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Common Patterns](#common-patterns)
8. [Migration Guide](#migration-guide)

## Core Architecture Principles

### 1. Single Source of Truth
- **ALL** business logic lives in `backend/src/config/GameConstants.js`
- **NEVER** hardcode values - always reference GameConstants
- Frontend fetches constants via API, never duplicates them
- Tests use real constants, not mocked values

### 2. Clean Separation of Concerns
```
Backend:
├── config/          # Business rules (GameConstants)
├── controllers/     # HTTP handlers (thin layer)
├── services/        # Business logic
│   ├── sync/        # Notion sync (2-phase)
│   └── compute/     # Derived calculations
├── db/              # Data access layer
└── utils/           # Shared utilities

Frontend:
├── hooks/           # Custom hooks (useGameConstants)
├── pages/           # Route components
├── components/      # Reusable UI
├── services/        # API clients
└── stores/          # Zustand state
```

### 3. Immutable Configuration
- Backend: `Object.freeze(GameConstants)` prevents mutations
- Frontend: 24-hour cache with stale-while-revalidate
- Tests: Direct imports ensure consistency

## Single Source of Truth Pattern

### GameConstants Structure
```javascript
// backend/src/config/GameConstants.js
const GameConstants = {
  MEMORY_VALUE: {
    BASE_VALUES: { 1: 100, 2: 500, 3: 1000, 4: 5000, 5: 10000 },
    TYPE_MULTIPLIERS: { 
      'Personal': 2.0,    // Was inconsistent: 1, 2, 2.0
      'Business': 5.0,    // Was inconsistent: 3, 5, 5.0
      'Technical': 10.0   // Was inconsistent: 5, 10, 10.0
    },
    GROUP_COMPLETION_MULTIPLIER: 10.0,
    TARGET_TOKEN_COUNT: 55,
    // ... more constants
  },
  RESOLUTION_PATHS: {
    TYPES: ['Black Market', 'Detective', 'Third Path'],
    DEFAULT: 'Unassigned',
    THEMES: { /* UI theming */ }
  },
  // ... 9 more categories
};

module.exports = Object.freeze(GameConstants);
```

### Backend Usage
```javascript
// Direct import for services
const GameConstants = require('../config/GameConstants');

class MemoryValueExtractor {
  getBaseValue(rating) {
    return GameConstants.MEMORY_VALUE.BASE_VALUES[rating] || 0;
  }
  
  getTypeMultiplier(type) {
    return GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS[type] || 1.0;
  }
}

// API endpoint exposes to frontend
router.get('/api/game-constants', (req, res) => {
  res.json(GameConstants);
});
```

### Frontend Usage
```javascript
// hooks/useGameConstants.js
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/apiService';

export function useGameConstants() {
  return useQuery({
    queryKey: ['gameConstants'],
    queryFn: async () => {
      const response = await apiService.get('/game-constants');
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000,      // 24 hours
    cacheTime: 24 * 60 * 60 * 1000,      // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Component usage with safe access
function MemoryTokenCard({ token }) {
  const { data: constants } = useGameConstants();
  
  const multiplier = constants?.MEMORY_VALUE?.TYPE_MULTIPLIERS?.[token.type] || 1;
  const baseValue = constants?.MEMORY_VALUE?.BASE_VALUES?.[token.rating] || 0;
  const finalValue = baseValue * multiplier;
  
  return <div>Value: ${finalValue}</div>;
}
```

## Data Flow Architecture

### 1. Notion → Database Sync
```
Notion API → SyncOrchestrator → Entity Syncers → SQLite Database
                                       ↓
                              BaseSyncer Pattern:
                              - Fetch from Notion
                              - Transform data
                              - Begin transaction
                              - Clear old records
                              - Insert new records
                              - Update relationships
                              - Commit transaction
```

### 2. Compute Phase
```
Database → ComputeOrchestrator → Compute Services → Updated Database
                                        ↓
                              Services include:
                              - MemoryValueExtractor (uses GameConstants)
                              - ActFocusComputer
                              - ResolutionPathComputer
                              - NarrativeThreadComputer
```

### 3. Frontend Data Flow
```
useQuery → API Request → Backend Controller → Service → Database
    ↓                                             ↓
Cache (24hr)                              GameConstants
    ↓
Component → useGameConstants → Safe Access Pattern
```

## Testing Architecture

### Test Infrastructure
```javascript
// Test setup with MSW v2
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/game-constants', () => {
    return HttpResponse.json(mockGameConstants);
  })
);

// QueryClient for tests
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      }
    }
  });
}
```

### Testing Patterns
```javascript
// Backend: Direct GameConstants usage
const GameConstants = require('../config/GameConstants');

test('calculates memory value correctly', () => {
  const expected = GameConstants.MEMORY_VALUE.BASE_VALUES[3] * 
                  GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS['Technical'];
  expect(calculator.getValue(3, 'Technical')).toBe(expected);
});

// Frontend: Mock the API response
const mockGameConstants = {
  MEMORY_VALUE: {
    BASE_VALUES: { 1: 100, 2: 500, 3: 1000 },
    TYPE_MULTIPLIERS: { Personal: 2.0, Business: 5.0 }
  }
};

renderWithQuery(<MemoryEconomyPage />, { 
  queryClient: createTestQueryClient() 
});
```

## Frontend Architecture

### Key Libraries
- **React 18**: UI framework
- **TanStack Query v4**: Server state management (NOT react-query v3)
- **Material-UI v5**: Component library
- **Zustand**: Client state management
- **React Flow**: Graph visualizations

### State Management Strategy
```javascript
// Server state: TanStack Query
const { data: characters } = useQuery({
  queryKey: ['characters'],
  queryFn: fetchCharacters
});

// Client state: Zustand
const useJourneyStore = create((set) => ({
  selectedCharacter: null,
  setSelectedCharacter: (char) => set({ selectedCharacter: char })
}));

// Constants: Always from API
const { data: constants } = useGameConstants();
```

### Component Patterns
```javascript
// Page component pattern
export default function MemoryEconomyPage() {
  const { data: elements, isLoading } = useElements();
  const { data: constants } = useGameConstants();
  
  if (isLoading || !constants) return <LoadingState />;
  
  const processedTokens = useMemo(() => 
    processMemoryTokens(elements, constants),
    [elements, constants]
  );
  
  return <MemoryEconomyDashboard tokens={processedTokens} />;
}
```

## Backend Architecture

### Service Layer Patterns
```javascript
// Singleton service pattern
class DataSyncService {
  constructor() {
    if (DataSyncService.instance) {
      return DataSyncService.instance;
    }
    this.orchestrator = new SyncOrchestrator(/* deps */);
    DataSyncService.instance = this;
  }
  
  async syncAll() {
    return this.orchestrator.syncAll();
  }
}

// Template method pattern for syncers
class CharacterSyncer extends BaseSyncer {
  async fetchFromNotion() { /* implementation */ }
  async transformData(notionData) { /* implementation */ }
  async syncRelationships(tx) { /* implementation */ }
}
```

### Database Patterns
```javascript
// Repository pattern with better-sqlite3
class CharacterRepository {
  constructor(db) {
    this.db = db;
    this.statements = {
      findAll: db.prepare('SELECT * FROM characters'),
      findById: db.prepare('SELECT * FROM characters WHERE id = ?'),
      insert: db.prepare('INSERT INTO characters (...) VALUES (...)')
    };
  }
  
  findAll() {
    return this.statements.findAll.all();
  }
}
```

## Common Patterns

### Safe Property Access
```javascript
// Frontend pattern for nested access
const value = constants?.MEMORY_VALUE?.BASE_VALUES?.[rating] || defaultValue;

// Backend pattern with helper
function getConstant(path, defaultValue = null) {
  return path.split('.').reduce((obj, key) => 
    obj?.[key], GameConstants) ?? defaultValue;
}
```

### Error Boundaries
```javascript
class ServiceErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Migration Guide

### From Hardcoded Values to GameConstants

❌ **Before (Anti-pattern)**:
```javascript
// Frontend
const TYPE_MULTIPLIERS = { Personal: 1, Business: 3, Technical: 5 };
const value = baseValue * TYPE_MULTIPLIERS[type];

// Backend
const MEMORY_VALUE_MAP = { 1: 100, 2: 500, 3: 1000 };
```

✅ **After (Correct pattern)**:
```javascript
// Frontend
const { data: constants } = useGameConstants();
const multiplier = constants?.MEMORY_VALUE?.TYPE_MULTIPLIERS?.[type] || 1;
const value = baseValue * multiplier;

// Backend
const GameConstants = require('./config/GameConstants');
const value = GameConstants.MEMORY_VALUE.BASE_VALUES[rating] || 0;
```

### Testing Migration

❌ **Before**:
```javascript
test('memory value calculation', () => {
  const result = calculateValue(3, 'Technical');
  expect(result).toBe(5000); // Hardcoded expectation
});
```

✅ **After**:
```javascript
test('memory value calculation', () => {
  const expected = GameConstants.MEMORY_VALUE.BASE_VALUES[3] * 
                  GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS['Technical'];
  const result = calculateValue(3, 'Technical');
  expect(result).toBe(expected); // Dynamic expectation
});
```

## Best Practices

1. **Never hardcode business values** - Always use GameConstants
2. **Test with real values** - Import GameConstants in tests
3. **Safe property access** - Use optional chaining in frontend
4. **Cache appropriately** - 24-hour cache for constants
5. **Document constants** - Explain what each constant controls
6. **Version carefully** - Constants changes affect all users
7. **Validate early** - Check constant existence at startup

## Future Considerations

### TypeScript Migration
```typescript
// Future: Type-safe constants
interface GameConstants {
  MEMORY_VALUE: {
    BASE_VALUES: Record<number, number>;
    TYPE_MULTIPLIERS: Record<'Personal' | 'Business' | 'Technical', number>;
  };
  // ... rest of structure
}

// Future: Typed hook
function useGameConstants(): UseQueryResult<GameConstants, Error> {
  // implementation
}
```

### Environment-Specific Constants
```javascript
// Future: Different constants per environment
const constants = process.env.NODE_ENV === 'production' 
  ? ProductionConstants 
  : DevelopmentConstants;
```

### Constant Versioning
```javascript
// Future: API versioning for mobile apps
router.get('/api/v2/game-constants', (req, res) => {
  res.json(GameConstantsV2);
});
```