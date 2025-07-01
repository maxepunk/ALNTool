# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ALNTool - About Last Night Production Intelligence

**Generated**: 2025-07-01
**v1.0 Target Date**: 2025-07-21 (3-week sprint)

## What This Tool Does
About Last Night Production Intelligence Tool - an immersive murder mystery game production system. Built on a **dual-lens UX paradigm**:
- **MICRO VIEW**: Individual character journey design (JourneyGraphView)
- **MACRO VIEW**: System-wide balance and production analysis (Dashboard/Analytics)

**Primary User Workflow**: Design character journeys → Validate production readiness → Balance system

## Scale & Context
- **Tool Type**: Internal production tool (not public-facing)
- **Users**: 2-3 game designers
- **Database Scale**: ~500 total items across all tables
- **Character Journeys**: 10-30 nodes typical, 80 nodes maximum
- **Performance Target**: <2s load time for expected scale

## Tech Stack
- Frontend: React 18 + Vite + Material-UI + Zustand + React Query v4
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Data: Notion API → SQLite sync pipeline
- Testing: Jest + React Testing Library + MSW + Playwright (E2E)
- Journey Visualization: ReactFlow + Dagre layout

## Project Structure
This is a monorepo with two main packages:
- `storyforge/frontend/` - React application (port 3000)
- `storyforge/backend/` - Express API server (port 3001)

## Essential Commands

### Quick Start
```bash
# Always use tmux to start servers

# Terminal 1 - Backend
cd storyforge/backend
cp .env.example .env    # First time only
npm install             # First time only
npm run dev            # Starts on port 3001

# Terminal 2 - Frontend  
cd storyforge/frontend
npm install             # First time only
npm run dev            # Starts on port 3000, proxies API to :3001
```

### Development Commands

#### Frontend
```bash
cd storyforge/frontend
npm run dev                  # Start dev server
npm run build               # Production build
npm test                    # Jest tests
npm test -- --watch         # TDD mode
npm test -- --coverage      # Coverage report
npm test JourneyGraphView   # Test specific component
npm run test:e2e            # Playwright E2E tests
npm run test:architecture   # Verify code quality metrics
npm run verify:all          # Run all verifications
npm run lint                # Run ESLint
```

#### Backend
```bash
cd storyforge/backend
npm start                   # Production server
npm run dev                # Development with nodemon
npm test                   # Jest tests
npm run verify:all         # Run ALL verifications
npm run docs:verify-sync   # Verify documentation alignment
npm run lint               # ESLint (enforces no-console)
npm run lint:fix          # Auto-fix ESLint issues
node scripts/sync-data.js  # Manual Notion sync
```

#### Root-Level Verification
```bash
# From project root
npm run verify:all          # Comprehensive verification
npm run verify:console      # Check for console.log statements
npm run verify:boundaries   # Check error boundary count
```

### Testing Commands
```bash
# Run all tests with memory constraints
npm test -- --maxWorkers=2

# Test specific features
npm test JourneyGraphView.performance -- --verbose
npm test RelationshipMapper -- --watch

# E2E Performance Test (requires servers running)
cd storyforge/frontend
npm run test:e2e -- journey-graph-performance.spec.js
```

### Verification Commands
```bash
# Count console logs (should be 0) - EXCLUDES logger.js and tests
grep -r "console\." src --include="*.js" --include="*.jsx" | grep -v "test" | grep -v "setupTests" | grep -v "logger.js" | wc -l

# Count error boundaries (should be 25+) - EXCLUDES test files
grep -r "ErrorBoundary" src --include="*.jsx" | grep -v test | wc -l

# Find components >500 lines
find src -name "*.jsx" -exec wc -l {} + | sort -n | tail -10

# Check for TODO/FIXME comments
grep -r "TODO\|FIXME" src --include="*.js" --include="*.jsx"
```

## Architecture Overview

### Frontend Structure
```
storyforge/frontend/src/
├── pages/              # Route components
├── components/         # Reusable UI components
│   ├── RelationshipMapper/  # Graph visualization
│   ├── PlayerJourney/       # CORE journey design components
│   ├── Characters/          # Character management
│   ├── Elements/            # Element management
│   ├── MemoryEconomy/       # Memory system
│   └── common/              # Shared components
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── services/           # API client (axios)
├── utils/              # Shared utilities
└── contexts/           # React contexts
```

### Backend Structure
```
storyforge/backend/src/
├── routes/             # Express route handlers
├── controllers/        # Route controllers
├── services/           # Business logic
│   ├── sync/          # Notion sync orchestration
│   └── compute/       # Cross-entity calculations
├── db/                # Database layer
│   ├── database.js    # SQLite connection
│   ├── queries.js     # SQL queries
│   └── migration-scripts/  # 11 migration files
└── utils/             # Shared utilities
```

### Key Patterns
- **Component Size**: All components <500 lines (enforced via tests)
- **Error Boundaries**: 79 error boundaries for comprehensive error handling
- **Console Logging**: 0 console.log statements (replaced with logger utility)
- **State Management**: Zustand for global state, React Query for server state
- **Testing**: TDD approach with Jest + React Testing Library
- **Database**: SQLite with transaction-based testing

## Database & Sync System

### Multi-Phase Sync Pattern
1. **Entity Phase**: Sync base entities from Notion
2. **Relationship Phase**: Sync relationships between entities
3. **Compute Phase**: Calculate derived fields
4. **Cache Phase**: Generate optimized views

### Entity Syncers
All syncers extend `BaseSyncer` and implement:
- `fetchFromNotion()` - Retrieve data from Notion API
- `transformData()` - Convert to internal format
- `saveToDatabase()` - Persist to SQLite

## Performance Targets & Metrics

### v1.0 Success Metrics (✅ = Complete)
- ✅ Zero console.log statements
- ✅ <2 second JourneyGraphView load time (actual: 13ms)
- ✅ <3 second Dashboard load time (actual: 3.5ms)
- ✅ <2 second Entity List load times (actual: <10ms)
- ✅ 25+ error boundaries (actual: 79)
- ✅ All components <500 lines (largest: 421 lines)

## CI/CD Pipeline
GitHub Actions workflow (`.github/workflows/documentation-check.yml`):
- Runs on push to main branch
- Verifies documentation sync
- Runs comprehensive verification suite
- Checks for untracked TODOs/FIXMEs

## Development Principles

### Code Quality Rules
1. **Journey-First UX** - JourneyGraphView is the primary workspace
2. **Verify Everything** - Use actual commands, not memory
3. **Test First** - Write failing test before implementation
4. **Track Progress** - Use TodoWrite for all tasks
5. **Performance Matters** - Measure, optimize, verify
6. **No Console Logs** - Use logger utility instead

### TDD Workflow
1. Write failing test
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Verify with `npm test -- --watch`

### Component Guidelines
- Maximum 500 lines per component
- Error boundary for each major component
- Accessibility-first design
- Performance monitoring for data-heavy components

## Common Tasks

### Adding a New Feature
1. Create feature branch from `ux-redesign`
2. Write tests first (TDD)
3. Implement feature
4. Run verification suite: `npm run verify:all`
5. Ensure no console.logs: `npm run verify:console`
6. Check component sizes
7. Submit PR

### Debugging Performance
1. Check React DevTools Profiler
2. Run performance tests: `npm test -- performance`
3. Check API response times in Network tab
4. Use React.memo for expensive components
5. Verify with E2E performance test

### Syncing from Notion
```bash
cd storyforge/backend
node scripts/sync-data.js
# Check logs in backend.log
# Verify in SQLite: data/production.db
```

## Additional Resources
- **Architecture Decisions**: See `.cursorrules` for detailed context
- **Developer Context**: `storyforge/frontend/docs/DEVELOPER_CONTEXT.md`
- **API Documentation**: Run backend and visit `/api-docs`

---
*Single source of truth for ALNTool development*
*Generated: 2025-07-01*