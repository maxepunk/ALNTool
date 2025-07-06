# Module Boundaries and Responsibilities

## Overview

This document defines clear module boundaries and responsibilities for the ALNTool/StoryForge refactoring, ensuring proper separation of concerns and preventing architectural drift.

## Frontend Module Structure

```
storyforge/frontend/src/
├── views/                      # Container components (<150 LOC each)
│   ├── JourneyIntelligenceView/
│   │   ├── index.jsx          # Main container
│   │   ├── hooks/             # View-specific hooks
│   │   └── utils/             # View-specific utilities
│   └── [OtherViews]/
│
├── components/                 # Reusable UI components (<100 LOC each)
│   ├── common/                # Shared across views
│   │   ├── EntitySelector/
│   │   ├── LoadingStates/
│   │   └── ErrorBoundaries/
│   ├── graph/                 # Graph-specific components
│   │   ├── nodes/
│   │   ├── edges/
│   │   └── controls/
│   └── intelligence/          # Intelligence layer components
│       ├── EconomicAnalysis/
│       ├── StoryAnalysis/
│       └── SocialAnalysis/
│
├── hooks/                     # Custom hooks (<80 LOC each)
│   ├── data/                  # Data fetching hooks
│   │   ├── useCharacters.js
│   │   ├── useElements.js
│   │   └── useRelationships.js
│   ├── ui/                    # UI state hooks
│   │   ├── useGraphLayout.js
│   │   ├── useEntitySelection.js
│   │   └── useViewMode.js
│   └── shared/                # Utility hooks
│       ├── useDebounce.js
│       └── useLocalStorage.js
│
├── services/                  # Business logic (<200 LOC each)
│   ├── api/                   # API communication
│   │   ├── client.js          # Axios instance
│   │   ├── endpoints.js       # Endpoint definitions
│   │   └── transformers.js    # Response transformers
│   ├── compute/               # Computations
│   │   ├── graphLayout.js
│   │   ├── aggregation.js
│   │   └── intelligence.js
│   └── cache/                 # Cache strategies
│       └── queryKeys.js
│
├── stores/                    # State management
│   ├── ui/                    # UI state (Zustand)
│   │   ├── journeyStore.js
│   │   └── preferencesStore.js
│   └── server/                # Server state (React Query)
│       └── queryClient.js
│
├── utils/                     # Pure utilities (<50 LOC each)
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
│
└── types/                     # TypeScript definitions
    ├── entities.ts
    ├── api.ts
    └── ui.ts
```

## Backend Module Structure

```
storyforge/backend/src/
├── controllers/               # Request handlers (<200 LOC each)
│   ├── entities/             # Entity-specific controllers
│   │   ├── characterController.js
│   │   ├── elementController.js
│   │   ├── puzzleController.js
│   │   └── timelineController.js
│   ├── analysis/             # Analysis endpoints
│   │   ├── intelligenceController.js
│   │   └── journeyController.js
│   └── shared/               # Shared controllers
│       └── healthController.js
│
├── services/                  # Business logic
│   ├── sync/                 # Notion sync services
│   │   ├── orchestrator/
│   │   ├── entitySyncers/
│   │   └── relationshipSyncer/
│   ├── compute/              # Computation services
│   │   ├── actFocusComputer.js
│   │   ├── memoryValueComputer.js
│   │   └── narrativeThreadComputer.js
│   └── cache/                # Caching services
│       ├── cacheManager.js
│       └── cacheStrategies.js
│
├── models/                   # Data models
│   ├── entities/
│   ├── relationships/
│   └── computed/
│
├── db/                       # Database layer
│   ├── connection.js         # SQLite connection
│   ├── queries/              # SQL queries by domain
│   │   ├── characters.js
│   │   ├── elements.js
│   │   └── relationships.js
│   └── migrations/           # Database migrations
│
├── middleware/               # Express middleware
│   ├── auth.js
│   ├── validation.js
│   ├── errorHandler.js
│   └── responseWrapper.js
│
├── routes/                   # Route definitions
│   ├── v1/                   # API version 1
│   │   ├── entities.js
│   │   ├── analysis.js
│   │   └── index.js
│   └── index.js
│
└── utils/                    # Utilities
    ├── logger.js
    ├── validators.js
    └── constants.js
```

## Module Responsibilities

### Frontend Modules

#### Views (Container Components)
**Responsibility**: Orchestrate components and connect to state
- Compose multiple components
- Connect to stores (Zustand/React Query)
- Handle routing and navigation
- Manage view-level error boundaries

**NOT Responsible For**:
- Direct API calls
- Complex computations
- Detailed UI rendering
- Business logic

#### Components (Presentational)
**Responsibility**: Pure UI rendering
- Render based on props
- Handle local UI state only
- Emit events to parent
- Provide accessible markup

**NOT Responsible For**:
- Data fetching
- Global state management
- Business logic
- Side effects

#### Hooks
**Responsibility**: Encapsulate reusable logic
- Abstract complex operations
- Manage side effects
- Bridge UI and state
- Compose other hooks

**NOT Responsible For**:
- UI rendering
- Direct component coupling
- Global state mutations
- API endpoint definitions

#### Services
**Responsibility**: Business logic and external communication
- API communication
- Data transformations
- Complex computations
- Cross-cutting concerns

**NOT Responsible For**:
- UI concerns
- Component state
- Direct DOM manipulation
- Routing logic

#### Stores
**Responsibility**: State management
- **Zustand**: UI state (selections, modes, preferences)
- **React Query**: Server state (entities, relationships)
- **LocalStorage**: Persistence layer

**NOT Responsible For**:
- Business logic
- API calls
- UI rendering
- Data validation

### Backend Modules

#### Controllers
**Responsibility**: HTTP request handling
- Validate input
- Call appropriate services
- Format responses
- Handle HTTP-specific logic

**NOT Responsible For**:
- Business logic
- Database queries
- Complex computations
- External API calls

#### Services
**Responsibility**: Business logic implementation
- Orchestrate operations
- Implement business rules
- Handle transactions
- Manage external integrations

**NOT Responsible For**:
- HTTP concerns
- Direct database access
- Response formatting
- Route definitions

#### Models
**Responsibility**: Data structure definitions
- Define entity schemas
- Validate data integrity
- Provide data access methods
- Handle relationships

**NOT Responsible For**:
- Business logic
- HTTP handling
- External API calls
- UI concerns

#### Database Layer
**Responsibility**: Data persistence
- Execute queries
- Manage connections
- Handle transactions
- Run migrations

**NOT Responsible For**:
- Business logic
- HTTP concerns
- Data transformation
- External APIs

## Dependency Rules

### Allowed Dependencies

```
Views → Components, Hooks, Stores
Components → Utils, Types
Hooks → Services, Stores, Utils
Services → Utils, Types
Stores → Services, Utils
Utils → Types

Controllers → Services, Middleware
Services → Models, DB, Utils
Models → DB, Utils
DB → Utils
Middleware → Utils
Routes → Controllers, Middleware
```

### Forbidden Dependencies

❌ Components → Services (use Hooks instead)
❌ Components → Stores (use props/callbacks)
❌ Utils → Any other module (must be pure)
❌ Models → Services (inversion of control)
❌ DB → Services (keep data layer pure)
❌ Any Frontend → Any Backend (except via API)

## Communication Patterns

### Frontend Communication Flow
```
User Action → View → Hook → Store/Service → API → Backend
                ↓
           Component ← Props ← State ← Response
```

### Backend Communication Flow
```
Request → Route → Middleware → Controller → Service → Model → DB
                                    ↓
Response ← Middleware ← Controller ← Service Result
```

### Cross-Module Communication

#### Frontend to Backend
- Always through defined API endpoints
- Use standardized request/response formats
- Handle errors at boundary (API service)
- Transform data in service layer

#### Between Frontend Modules
- Views communicate via routing
- Components communicate via props/events
- Shared state through stores
- Side effects through hooks

#### Between Backend Modules
- Controllers call services
- Services orchestrate models
- Models access DB layer
- Middleware wraps all routes

## Testing Boundaries

### Unit Testing Boundaries
- **Components**: Test with props, mock hooks
- **Hooks**: Test with renderHook, mock services
- **Services**: Test with mocked dependencies
- **Utils**: Test pure functions directly

### Integration Testing Boundaries
- **Views**: Test with mocked API responses
- **API Services**: Test with MSW mocks
- **Controllers**: Test with supertest
- **Services**: Test with test database

### E2E Testing Boundaries
- Full user flows through the application
- Real backend with test data
- No mocking except external services

## Module Size Limits

### Strict Limits
- **Views**: 150 LOC maximum
- **Components**: 100 LOC maximum
- **Hooks**: 80 LOC maximum
- **Utils**: 50 LOC maximum
- **Services**: 200 LOC maximum
- **Controllers**: 200 LOC maximum

### Decomposition Triggers
When approaching limits:
1. Extract helper functions
2. Create sub-modules
3. Split responsibilities
4. Use composition

## Enforcement

### Automated Checks
```json
{
  "scripts": {
    "verify:boundaries": "node scripts/check-boundaries.js",
    "verify:sizes": "node scripts/check-module-sizes.js",
    "verify:deps": "node scripts/check-dependencies.js"
  }
}
```

### Pre-commit Hooks
- Check module sizes
- Verify dependency rules
- Ensure proper imports
- Validate module structure

### Code Review Checklist
- [ ] Module under size limit?
- [ ] Dependencies follow rules?
- [ ] Responsibilities clear?
- [ ] Tests at right boundary?
- [ ] Communication patterns followed?

## Migration Guide

### Identifying Violations
1. Run size checks: `npm run verify:sizes`
2. Run dependency checks: `npm run verify:deps`
3. Review module responsibilities
4. Identify split points

### Refactoring Process
1. Create new module structure
2. Move code incrementally
3. Update imports
4. Verify tests pass
5. Remove old code

### Common Patterns

#### Extracting from Large Component
```javascript
// Before: 300 LOC component
const LargeComponent = () => {
  // 100 lines of state logic
  // 100 lines of render helpers
  // 100 lines of JSX
}

// After: Split into modules
// hooks/useLargeComponent.js (80 LOC)
const useLargeComponent = () => {
  // State logic
}

// components/LargeComponent/helpers.js (50 LOC)
export const renderHelpers = {
  // Render logic
}

// components/LargeComponent/index.jsx (70 LOC)
const LargeComponent = () => {
  const state = useLargeComponent();
  // Simplified JSX
}
```

## Success Criteria

### Measurable Outcomes
- 100% modules within size limits
- 0 circular dependencies
- 100% test coverage at boundaries
- <5% code duplication

### Quality Indicators
- Clear module purposes
- Consistent patterns
- Easy to test
- Simple to extend

## Conclusion

These module boundaries ensure a maintainable, scalable architecture. By enforcing clear responsibilities and communication patterns, we create a system that's easy to understand, test, and evolve.