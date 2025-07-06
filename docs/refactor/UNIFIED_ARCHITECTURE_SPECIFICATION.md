# ALNTool/StoryForge Unified Architecture Specification

## Executive Summary

This document defines the unified architecture for ALNTool/StoryForge, addressing critical technical debt while establishing sustainable patterns for future development.

### Key Principles
1. **Separation of Concerns** - Clear boundaries between UI, state, business logic, and data access
2. **Component Size Limits** - Strict LOC limits to ensure maintainability
3. **Consistent Patterns** - Unified approaches to common operations
4. **Progressive Enhancement** - Gradual migration without breaking changes

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │    Views    │  │  Components  │  │    Custom Hooks        │ │
│  │  (<150 LOC) │  │  (<100 LOC)  │  │     (<80 LOC)         │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬─────────────┘ │
└─────────┼─────────────────┼────────────────────┼───────────────┘
          │                 │                    │
┌─────────▼─────────────────▼────────────────────▼───────────────┐
│                      State Management Layer                      │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Zustand Store │  │   React Query   │  │  Local Storage  │ │
│  │   (UI State)   │  │ (Server State)  │  │  (Persistence)  │ │
│  └────────┬───────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼───────────────────┼─────────────────────┼──────────┘
            │                   │                     │
┌───────────▼───────────────────▼─────────────────────▼──────────┐
│                      Business Logic Layer                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Service Layer  │  │  Domain Services  │  │   Utilities   │ │
│  │  (API Clients)  │  │  (Computations)   │  │   (<50 LOC)   │ │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬───────┘ │
└───────────┼────────────────────┼─────────────────────┼─────────┘
            │                    │                     │
┌───────────▼────────────────────▼─────────────────────▼─────────┐
│                        Data Access Layer                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │   HTTP Client   │  │  Cache Strategy  │  │ Error Handler │ │
│  │    (Axios)      │  │  (React Query)   │  │  (Boundary)   │ │
│  └─────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Size Limits

### Strict Line of Code (LOC) Limits
- **Views**: Maximum 150 LOC
- **Components**: Maximum 100 LOC  
- **Hooks**: Maximum 80 LOC
- **Utilities**: Maximum 50 LOC
- **Services**: Maximum 200 LOC

### Decomposition Strategy
When a component exceeds its limit:
1. Extract custom hooks for logic
2. Create sub-components for UI sections
3. Move computations to services
4. Extract constants and types

## Layer Responsibilities

### 1. Presentation Layer
**Purpose**: User interface and interaction handling

**Views** (Container Components)
- Compose multiple components
- Connect to state management
- Handle routing logic
- No direct API calls

**Components** (Presentational)
- Pure UI rendering
- Props-based data flow
- No business logic
- Fully testable in isolation

**Custom Hooks**
- Encapsulate reusable logic
- Bridge UI and state layers
- Handle side effects
- Compose other hooks

### 2. State Management Layer
**Purpose**: Application state coordination

**Zustand (UI State)**
- Selected entities
- View modes
- UI preferences
- Temporary UI state

**React Query (Server State)**
- Data fetching
- Cache management
- Background refetching
- Optimistic updates

**Local Storage**
- User preferences
- Session persistence
- Offline capability

### 3. Business Logic Layer
**Purpose**: Core application logic and rules

**Service Layer**
- API communication
- Data transformation
- Business rules
- Cross-cutting concerns

**Domain Services**
- Entity computations
- Relationship mapping
- Intelligence calculations
- Data aggregation

**Utilities**
- Pure functions
- No side effects
- Highly reusable
- Well-tested

### 4. Data Access Layer
**Purpose**: External communication and persistence

**HTTP Client**
- Request/response handling
- Authentication
- Error transformation
- Request queuing

**Cache Strategy**
- Stale-while-revalidate
- Cache invalidation
- Offline support
- Data synchronization

## Migration Strategy

### Phase 1: Extract Business Logic (Days 1-3)
- Move computations to services
- Extract data fetching to React Query
- Create custom hooks for complex logic

### Phase 2: Component Decomposition (Days 4-6)
- Break down oversized components
- Extract sub-components
- Implement composition patterns

### Phase 3: API Consolidation (Days 7-8)
- Unify API endpoints
- Implement generic CRUD
- Reduce code duplication

### Phase 4: Pattern Implementation (Days 9-10)
- Apply consistent patterns
- Create reusable utilities
- Standardize naming

### Phase 5: Performance Optimization (Day 11)
- Implement memoization
- Add lazy loading
- Optimize bundle size

## Success Metrics

### Code Quality
- **Component Size**: 100% compliance with LOC limits
- **Test Coverage**: >80% for critical paths
- **Code Duplication**: <5% across codebase
- **Complexity**: Cyclomatic complexity <10 per function

### Performance
- **Bundle Size**: <500KB gzipped
- **Initial Load**: <3s on 3G
- **Time to Interactive**: <5s
- **Memory Usage**: <100MB baseline

### Developer Experience
- **Build Time**: <30s full build
- **Test Suite**: <2min full run
- **Hot Reload**: <500ms
- **Type Safety**: 100% typed

## Architectural Decisions

### 1. State Management Split
**Decision**: Zustand for UI, React Query for server state
**Rationale**: Clear separation, optimal caching, reduced complexity

### 2. Component Boundaries  
**Decision**: Strict LOC limits with automated checking
**Rationale**: Maintainability, testability, cognitive load reduction

### 3. Service Layer Pattern
**Decision**: Centralized business logic in services
**Rationale**: Reusability, testability, separation of concerns

### 4. Progressive Migration
**Decision**: Feature flags and parallel infrastructure
**Rationale**: Zero downtime, gradual rollout, easy rollback

## Implementation Guidelines

### Component Creation
1. Start with <50 LOC target
2. Extract hooks early
3. Use composition over inheritance
4. Props over internal state

### State Management
1. UI state → Zustand
2. Server state → React Query
3. Form state → React Hook Form
4. Navigation state → React Router

### Error Handling
1. Error boundaries at view level
2. Fallback UI for all states
3. Retry logic in React Query
4. User-friendly error messages

### Testing Strategy
1. Unit tests for utilities
2. Integration tests for hooks
3. Component tests with RTL
4. E2E tests for critical paths

## Deliverables

### Week 1
- [ ] Business logic extraction complete
- [ ] All components <500 LOC
- [ ] React Query implementation

### Week 2  
- [ ] Component decomposition complete
- [ ] API consolidation done
- [ ] Pattern library created

### Week 3
- [ ] Performance optimization
- [ ] Documentation complete
- [ ] Team training conducted

## Conclusion

This unified architecture provides a clear path from the current technical debt to a maintainable, scalable system. By enforcing strict boundaries and consistent patterns, we ensure long-term sustainability while enabling rapid feature development.