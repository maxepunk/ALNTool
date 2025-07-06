# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ALNTool - About Last Night Production Intelligence

A design decision support system for the "About Last Night" murder mystery game. Transforms 18 separate database views into a unified interface where game designers can select any entity (character, element, puzzle, timeline event) and instantly see complete impact analysis across story, social, economic, and production dimensions.

**Current Phase**: Phase 1 implementation - COMPLETE (All 11 days finished)
**Architecture**: Single-page React app with Node.js/Express backend

## Quick Start

```bash
# Start both servers using tmux (recommended)
tmux new-session -d -s backend 'cd storyforge/backend && npm run dev'
tmux new-session -d -s frontend 'cd storyforge/frontend && npm run dev'

# Or from root with concurrently
npm run dev

# Backend runs on port 3001, Frontend on port 3000
```

## Development Commands

### Frontend (React + Vite)
```bash
cd storyforge/frontend

# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # ESLint check

# Testing
npm test                       # Run all tests
npm test JourneyIntelligence   # Test specific component
npm test -- --watch            # TDD mode
npm run test:memory            # Test with memory monitoring
npm run test:e2e               # Playwright E2E tests
npm run test:e2e:headed        # E2E with browser visible

# Code quality verification
npm run verify:console         # Check for console.log (should be 0)
npm run verify:components      # Check component sizes (<500 lines)
npm run verify:boundaries      # Count error boundaries (79+)
npm run verify:all             # Run all verifications
```

### Backend (Node.js + Express)
```bash
cd storyforge/backend

# Development
npm run dev                    # Start with nodemon
npm start                      # Production mode
node scripts/sync-data.js      # Manual Notion sync

# Testing
npm test                       # Run all tests
npm test:watch                 # Watch mode
npm test -- ActFocusComputer   # Test specific module

# Verification
npm run verify:migrations      # Check migration consistency
npm run verify:pre-deploy      # Pre-deployment checks
npm run verify:all             # All verifications
npm run lint                   # ESLint check
```

### Database Operations
```bash
cd storyforge/backend

# Direct SQLite access
sqlite3 data/production.db

# Common debugging queries
sqlite3 data/production.db "SELECT COUNT(*) FROM elements WHERE memory_type IS NOT NULL;"
sqlite3 data/production.db "SELECT name, type, calculated_memory_value FROM elements WHERE type = 'Memory Token';"
sqlite3 data/production.db "SELECT * FROM sync_log ORDER BY created_at DESC LIMIT 10;"
```

## Architecture Overview

### Frontend Architecture
```
storyforge/frontend/src/
├── components/
│   ├── JourneyIntelligenceView.jsx      # Main unified interface
│   └── JourneyIntelligence/
│       ├── AdaptiveGraphCanvas.jsx      # ReactFlow graph (50-node aggregation)
│       ├── IntelligencePanel.jsx        # Entity detail analysis
│       ├── EntitySelector.jsx           # Search & selection
│       ├── IntelligenceToggles.jsx      # Layer controls
│       ├── nodes/                       # Custom node components
│       │   ├── CharacterNode.jsx        # Circle shape
│       │   ├── ElementNode.jsx          # Diamond shape
│       │   ├── PuzzleNode.jsx           # Square shape
│       │   └── TimelineEventNode.jsx    # Dashed border
│       └── layers/                      # 5 intelligence layers
│           ├── EconomicLayer.jsx
│           ├── StoryIntelligenceLayer.jsx
│           ├── SocialIntelligenceLayer.jsx
│           ├── ProductionIntelligenceLayer.jsx
│           └── ContentGapsLayer.jsx
├── stores/
│   └── journeyIntelligenceStore.js      # Zustand store (UI state only)
├── hooks/
│   ├── usePerformanceElements.js        # Performance path data
│   ├── useFreshElements.js              # Fresh path data
│   └── useCharacterJourney.js           # Character-specific data
└── services/
    └── api.js                           # Unified API service
```

### Backend Architecture
```
storyforge/backend/src/
├── routes/                              # API endpoints
├── controllers/                         # Request handlers
├── services/
│   ├── sync/                           # 4-phase Notion sync
│   │   ├── syncOrchestrator.js
│   │   ├── entitySyncers/              # Character, Element, Puzzle, Timeline
│   │   └── relationshipSyncer.js
│   └── compute/                        # Cross-entity calculations
│       ├── actFocusComputer.js
│       ├── memoryValueComputer.js
│       └── narrativeThreadComputer.js
├── db/
│   ├── database.js                     # SQLite connection
│   ├── queries.js                      # SQL queries
│   └── migration-scripts/              # 11 migration files
└── utils/
    └── responseWrapper.js              # Standardized API responses
```

## Key Architectural Patterns

### 1. State Management Split
- **Zustand**: UI state only (selectedEntity, viewMode, activeIntelligence, etc.)
- **React Query**: All server state (data fetching, caching, synchronization)
- **localStorage**: Persistence via Zustand middleware

### 2. Dual-Path API Architecture
```javascript
// Performance Path - Pre-computed values from SQLite
GET /api/elements?filterGroup=memoryTypes
→ Returns 'type' field with computed values

// Fresh Path - Real-time from Notion
GET /api/elements
→ Returns 'basicType' field with latest data

// Helper utility for compatibility
export const getElementType = (element) => {
  return element.type || element.basicType || 'Unknown';
};
```

### 3. Standardized API Responses
```javascript
// All responses use responseWrapper middleware
// Success
{ success: true, data: {...}, message: "optional" }

// Error
{ success: false, error: { message: "...", code: "ERROR_CODE", details: {...} } }
```

### 4. 4-Phase Sync Pipeline
1. **Entity Sync**: Fetch from Notion (characters, elements, puzzles, timeline events)
2. **Relationship Sync**: Build cross-entity relationships
3. **Compute Phase**: Calculate derived fields (act focus, memory values, narrative threads)
4. **Cache Phase**: Generate optimized views and character links

### 5. Performance Boundaries
- **50-node limit**: AdaptiveGraphCanvas aggregates when >50 nodes visible
- **Progressive loading**: Initial load shows characters only, others load on demand
- **React Query caching**: Aggressive caching with stale-while-revalidate

## Critical Implementation Details

### Intelligence Layer System
When an entity is selected, 5 intelligence layers provide analysis:
1. **Economic**: Token values, path balance, choice pressure
2. **Story**: Timeline connections, narrative gaps, revelation flow  
3. **Social**: Collaboration requirements, interaction choreography
4. **Production**: Props, RFID status, physical dependencies
5. **Content Gaps**: Missing story elements, integration opportunities

### Social Choreography Through Dependencies
- Players start with individual puzzles requiring elements from other players
- Forces collaboration through cross-dependencies
- Example: Alex needs Derek's business card → must interact → creates story discovery

### Memory Token Economy
- Two-act structure with mid-game transformation
- Act 1: Investigation and social puzzles
- Revelation Scene: Memory tokens discovered, economy game begins
- Act 2: Three-way choice (Black Market cash, Detective story, Return to owner)

## Testing Strategy

### Frontend Testing
- **Unit tests**: Jest + React Testing Library
- **Integration tests**: Component interactions with MSW mocking
- **E2E tests**: Playwright for critical user flows
- **Memory tests**: Monitor for leaks with --logHeapUsage

### Backend Testing  
- **Transaction-based**: All DB tests use transactions with rollback
- **Service isolation**: Mock external dependencies
- **Sync pipeline**: Test each phase independently

## Current Implementation Status

### Completed (Days 1-9)
- ✅ Unified JourneyIntelligenceView interface
- ✅ All 5 intelligence layers implemented
- ✅ Entity search with autocomplete
- ✅ State persistence with localStorage
- ✅ Progressive entity loading
- ✅ Character relationship edges
- ✅ Custom node shapes (circle/diamond/square/dashed)

### Critical Issues (Must Fix First)
- ✅ **Entity Selection Bug**: Fixed ID preservation in AdaptiveGraphCanvas.onNodeClick - no longer overwrites entity ID (2025-01-15)
- ✅ **Aggregation Logic**: Removed aggregation entirely, replaced with visual hierarchy using opacity/scale (2025-01-15)
- ✅ **Progressive Loading**: Fixed viewport zoom issue - removed automatic fitView on re-renders, now only fits on initial load and focus mode changes (2025-01-15)
- ✅ **API Field Mismatch**: Fixed type/basicType field inconsistency with compatibility helper (2025-01-15)

### Completed Fixes (Day 10 - 2025-01-15)
- ✅ Entity selection now preserves correct IDs
- ✅ Aggregation replaced with visual hierarchy (no more confusing groupings)
- ✅ Force-directed layout implemented with ownership clustering
- ✅ All 7 relationship types now visualized:
  - Character-Character (via shared entities)
  - Character-Element Ownership
  - Character-Element Association (purple dotted)
  - Element-Element Container
  - Puzzle-Element Reward
  - Element-Puzzle Requirement
  - Character-Timeline Event (blue animated)
- ✅ React Query upgraded to v5 (5.67.2)
- ✅ JourneyIntelligenceView reduced to 425 lines
- ✅ Extracted graphDataProcessor utility

### Completed Fixes (Days 3-4 - 2025-01-15)
- ✅ Backend controller decomposition: notionController.js split into 5 modules <150 lines each
- ✅ Database transactions implemented with rollback support
- ✅ Express-validator integrated for input validation
- ✅ Frontend component decomposition:
  - JourneyIntelligenceView: 273 lines
  - IntelligencePanel: 148 lines  
  - AdaptiveGraphCanvas: 236 lines
- ✅ All components now under 500-line limit
- ✅ Test coverage: Backend 88.26%, Frontend components refactored

### Completed Fixes (Days 5-6 - 2025-01-15)
- ✅ IntelligencePanel decomposition: 72 lines (exceeded target of 100)
- ✅ JourneyIntelligenceView refinement: 175 lines (close to target of 150)
- ✅ AdaptiveGraphCanvas cleanup: 127 lines (exceeded target of 150)
- ✅ Extracted reusable components: LoadingStates, ErrorManager, EmptyStateManager
- ✅ Created utility modules: graphProcessingUtils, visualHierarchyUtils
- ✅ Performance optimizations: React.memo, proper memoization patterns

### Completed Fixes (Days 7-8 - 2025-01-15)
- ✅ Frontend API consolidation: 30 endpoints → 15 (5 generic + 10 specialized)
- ✅ Backend API consolidation: 31 endpoints → 15 with v2 API structure
- ✅ Generic CRUD router implemented for all entity types
- ✅ Backward compatibility maintained with deprecation warnings
- ✅ API documentation and migration guides created
- ✅ Test coverage: Frontend maintained, Backend 91.54% for new routes

### Completed Fixes (Days 9-10 - 2025-01-15)
- ✅ Pattern library created: 19 UI components, 5 hooks, 4 utility modules
- ✅ Form components: TextInput, Select, Checkbox, RadioGroup, FormField
- ✅ Layout components: Grid, Stack, Container, Card, Divider
- ✅ Feedback components: Alert, Toast, Badge, Progress
- ✅ Comprehensive PATTERN_LIBRARY.md documentation created
- ✅ All patterns have PropTypes and JSDoc documentation

### Completed Fixes (Day 11 - 2025-01-15)
- ✅ Performance optimization for 400+ entities (achieved <3s load time)
- ✅ Virtualization implemented for EntitySelector
- ✅ Viewport culling for ReactFlow (only renders visible nodes)
- ✅ Level of detail rendering (hides labels when zoomed out)
- ✅ Progressive loading strategy (characters first, others on demand)
- ✅ Lazy loading implementation for heavy components
- ✅ React.memo strategic placement with custom comparisons
- ✅ API pagination added to all entity endpoints
- ✅ Throttled updates for large datasets
- ✅ Hover states (tooltips implemented for all node types)
- ⚠️ Bundle size: 770KB (target was 500KB, but acceptable)
- ❌ Intelligence layer data visualization (deferred to Phase 2)
- ❌ Keyboard shortcuts (deferred to Phase 2)

## Important Notes

1. **Zero console.log policy**: Use logger utility instead
2. **Component size limit**: All components must be <500 lines
3. **Error boundaries**: 79+ boundaries for resilience
4. **Test-first development**: Write failing test before implementation
5. **No direct Notion writes**: Currently read-only, writes planned for Phase 3
6. **Entity Selection Issues**: See `ENTITY_SELECTION_AND_AGGREGATION_ISSUES.md` for critical bugs
7. **Aggregation Strategy**: Type-based in overview mode, connection-based in focus mode

## Documentation Structure

- **Main docs**: This file for daily essentials
- **Technical details**: `@docs/developer-technical.md`
- **User workflows**: `@docs/game-designer-guides.md`
- **Analysis/context**: `@docs/analysis.md`
- **Progress tracking**: `@storyforge/frontend/docs/PHASE_1_ACTION_PLAN.md`
- **Critical bugs**: `ENTITY_SELECTION_AND_AGGREGATION_ISSUES.md`

## Maintenance Instructions

### When Fixing Issues
1. Fix the code issue following the guidance in `ENTITY_SELECTION_AND_AGGREGATION_ISSUES.md`
2. Update the "Critical Issues" section above to mark the issue as ✅ completed
3. Add a brief note about what was fixed (e.g., "✅ Entity Selection Bug - Fixed ID preservation in onNodeClick")
4. Update the "Remaining" section to remove completed work
5. If new issues are discovered, add them to both this file and the issues document

### Example Update Format
```markdown
### Critical Issues (Must Fix First)
- ✅ **Entity Selection Bug**: Fixed ID preservation in AdaptiveGraphCanvas.onNodeClick (2025-01-15)
- 🔴 **Aggregation Logic**: Creates nonsensical groupings (IN PROGRESS - simplified logic implemented)
- 🔴 **Progressive Loading**: Incorrect counts and confusing aggregation behavior
```

---
*For detailed architectural diagrams and data flow, see ARCHITECTURE_DEEP_DIVE.md*