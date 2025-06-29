<!-- CONFIG SCOPE: PROJECT-LOCAL -->
<!-- This file applies to: ALNTool - About Last Night Production Intelligence Tool -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📊 Quick Status Summary

**Current State** (January 2025):
- ✅ App runs and builds successfully
- ✅ All UI features accessible via navigation
- ✅ Error boundaries at app/route levels (9 usages)
- ✅ React Query v4 migration complete
- 🚧 27 console.log statements remain
- 🚧 6 components over 500 lines need refactoring
- 🚧 Test suite has mixed pass/fail status
- 🚧 Active refactoring of NarrativeThreadTrackerPage

**Current Branch**: ux-redesign (uncommitted changes)

## Project Overview

**About Last Night - Production Intelligence Tool** - A comprehensive journey management and production tool for an immersive murder mystery game. The tool provides both micro (individual character paths) and macro (system-wide balance) perspectives to production teams.

**Tech Stack:**
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Frontend: React 18 + Vite + Material-UI + Zustand + React Query v4
- Data Source: Notion API integration
- Testing: Jest + Playwright + MSW

## Current Refactor Status

### 🚧 Architecture Remediation Phase 1 - Stabilization (IN PROGRESS)
**Goal**: Complete technical debt cleanup and achieve production-ready stability

**Verified Current State** (as of January 2025):
- **Error boundaries**: App-level implemented in main.jsx, route-level in App.jsx
- **Console logs**: 27 remaining
- **Component sizes**: Largest is RelationshipMapper.jsx at 806 lines
- **Active refactoring**: NarrativeThreadTrackerPage being decomposed into smaller components
- **Test status**: Mixed pass/fail, unable to determine coverage percentage
- **React Query**: Using v4 (@tanstack/react-query 4.36.1)
- **All UI features**: Accessible via navigation menu (no hidden features)

**Components Over 500 Lines**:
- RelationshipMapper.jsx: 806 lines
- ResolutionPathAnalyzerPage.jsx: 751 lines  
- EntityNode.jsx: 619 lines
- Characters.jsx: 586 lines
- Elements.jsx: 580 lines
- MemoryEconomyPage.jsx: 553 lines

**Next Priorities**: 
1. Complete component refactoring (target: <300 lines each)
2. Eliminate remaining 27 console.log statements
3. Fix failing tests to establish coverage baseline
4. Verify error boundary coverage at component level

## High-Level Architecture

### Backend Architecture (`storyforge/backend/`)

**Layered Structure:**
```
src/
├── controllers/     # HTTP request handlers
├── routes/          # API endpoint definitions  
├── services/        # Business logic layer
│   ├── sync/        # Notion → SQLite sync (2-phase process)
│   └── compute/     # Derived field computation
├── db/              # Database layer (migrations, queries)
└── utils/           # Shared utilities
```

**Key Patterns:**
- **Singleton Pattern**: SyncOrchestrator coordinates sync operations
- **Template Method Pattern**: BaseSyncer abstract class for entity sync workflow
- **Orchestrator Pattern**: SyncOrchestrator & ComputeOrchestrator manage multi-step operations
- **Repository Pattern**: queries.js centralizes database operations

**Data Sync Architecture:**
1. **Entity Sync Phase**: Characters, Elements, Puzzles, Timeline Events
2. **Compute Phase**: Cross-entity relationships, derived fields (act focus, memory values)

Each entity syncer follows: Fetch from Notion → Transform → Transaction → Clear old → Insert new → Post-process

### Frontend Architecture (`storyforge/frontend/`)

**Component Structure:**
```
src/
├── pages/           # Route-level components
├── components/      # Reusable UI components
│   ├── RelationshipMapper/  # Complex graph visualization
│   └── PlayerJourney/       # Journey flow visualization
├── services/        # API integration
├── stores/          # Zustand state management
├── hooks/           # Custom React hooks
└── contexts/        # React contexts
```

**State Management:**
- **Zustand**: Global application state (journeyStore)
- **React Query**: Server state caching & synchronization
- **Custom Hooks**: Component-specific UI state

**Advanced Features:**
- Multiple graph layout algorithms (radial, force-directed, hierarchical)
- Memory economy system with pattern-based extraction
- Journey graph generation with gap detection
- Dual-lens view for micro/macro perspectives

## Common Development Commands

### Backend Development (`cd storyforge/backend`)

**Build & Run:**
```bash
npm install              # Install dependencies
npm run dev              # Development server with hot reload (port 3001)
npm start                # Production server
```

**Testing & Coverage:**
```bash
npm test                 # Run all tests
npm test -- --coverage   # Run with coverage report (current: 15%)
npm test CharacterSyncer # Test specific file
npm test -- --watch      # Run tests in watch mode
npm test -- --runInBand  # Run tests sequentially (fixes DB issues)
```

**Verification & Health Checks:**
```bash
npm run verify:all       # Run ALL verification checks (always run first!)
npm run verify:migrations # Verify database migrations
npm run verify:pre-deploy # Pre-deployment checks
npm run lint             # ESLint with max-warnings 0
npm run lint:fix         # Auto-fix linting issues
```

**Data Sync:**
```bash
node scripts/sync-data.js          # Full sync from Notion
node scripts/sync-data.js --status # Check sync status
```

**Database Inspection:**
```bash
sqlite3 data/production.db  # Open SQLite CLI
# Common queries:
.tables                     # List all tables  
.schema characters          # Show table schema
SELECT COUNT(*) FROM character_links;
SELECT COUNT(*) FROM timeline_events WHERE act_focus IS NOT NULL;
```

### Frontend Development (`cd storyforge/frontend`)

**Build & Run:**
```bash
npm install         # Install dependencies
npm run dev         # Start Vite dev server (port 3000/3001/3002...)
npm run build       # Production build
npm run preview     # Preview production build
```

**Testing:**
```bash
npm test                    # Run Jest tests
npm run test:e2e            # Run Playwright E2E tests
npm run test:e2e:headed     # Run E2E tests with browser UI
npm run test:e2e:debug      # Debug E2E tests
npm run test:architecture   # Run architecture quality checks
```

**Architecture Quality Checks:**
```bash
npm run lint:console        # Count console.* statements (should be 0)
npm run analyze:components  # Find largest components (target: <300 lines)
npm run check:error-boundaries  # Verify error boundary coverage
npm run check:hardcoded     # Find hardcoded values that should use GameConstants
```

### Documentation Commands (`cd storyforge/backend`)

```bash
npm run docs:verify-sync        # Check doc consistency
npm run docs:status-report      # Documentation health check
npm run docs:task-complete <id> # Mark task complete & update docs
npm run docs:health             # Show health dashboard with metrics
```

## Key Current State & Critical Findings

### Current Phase
**Architecture Remediation Phase 1 - Stabilization** (January 2025)
- **Last Commit**: "feat: complete Architecture Remediation Phase 1 with critical fixes"
- **Active Work**: Component refactoring (NarrativeThreadTrackerPage being decomposed)
- **Reference**: [PHASE_TRACKER.md](docs/PHASE_TRACKER.md) for phase tracking

### Verified Progress
1. **React Query v4**: Migration complete (@tanstack/react-query 4.36.1)
2. **Error Boundaries**: Implemented at app-level (main.jsx) and route-level (App.jsx) - 9 total usages
3. **Console Logs**: 27 remaining in frontend source
4. **Component Refactoring**: NarrativeThreadTrackerPage now 290 lines with extracted components
5. **Production Logger**: Implemented at src/utils/logger.js

### Remaining Technical Debt (Verified)
1. **Components Over 500 Lines**: 
   - RelationshipMapper.jsx: 806 lines
   - ResolutionPathAnalyzerPage.jsx: 751 lines
   - EntityNode.jsx: 619 lines
   - Characters.jsx: 586 lines
   - Elements.jsx: 580 lines
   - MemoryEconomyPage.jsx: 553 lines
2. **Test Suite**: Mixed pass/fail status preventing coverage measurement
3. **Console Statements**: 27 remaining (target: 0)
4. **Navigation**: All features accessible (none hidden)

### Architecture Improvements Completed
- **Production Logger**: Created at src/utils/logger.js (27 console.* still need replacement)
- **Component Decomposition**: NarrativeThreadTrackerPage refactored into smaller components
- **Error Boundaries**: App and route-level implementation complete
- **Unified Loading State**: UnifiedLoadingState.jsx component created

### Architecture Improvements Needed
- **Standardized Data Hook**: Create useEntityData pattern (currently proposed, not implemented)
- **Unified Error State**: Create consistent error display component
- **Component-Level Error Boundaries**: Add to complex visualization components
- **Complete Console Replacement**: Remove remaining 27 console.* statements

### Key Learnings
- **Vite Errors**: Compilation errors appear as HTTP 500s in browser console
- **React Hooks**: Must be called before ANY conditional returns
- **Error Boundaries**: Critical for preventing cascade failures
- **Data vs Technical Bugs**: Always check Notion as source of truth first

## Development Best Practices

1. **Always Run Verification First**: Start every session with `npm run verify:all`
2. **Use TodoWrite Religiously**: Track all tasks and subtasks meticulously
3. **Check Notion for Data Issues**: Validate against source before assuming bugs
4. **Prefer Editing Over Creating**: Modify existing files rather than creating new ones
5. **No Comments**: Unless explicitly requested by the user

## Core Documentation

**Essential Documents:**
1. **[README.md](README.md)** - Current status and project overview
2. **[DEVELOPMENT_PLAYBOOK.md](DEVELOPMENT_PLAYBOOK.md)** - Implementation details and task specifics
3. **[SCHEMA_MAPPING_GUIDE.md](SCHEMA_MAPPING_GUIDE.md)** - Data model and Notion→SQL mappings
4. **[AUTHORITY_MATRIX.md](AUTHORITY_MATRIX.md)** - Conflict resolution when docs disagree
5. **[ARCHITECTURE_PATTERNS.md](ARCHITECTURE_PATTERNS.md)** - Code patterns and architectural solutions
6. **[ARCHITECTURE_REMEDIATION_PLAN.md](ARCHITECTURE_REMEDIATION_PLAN.md)** - Implementation roadmap for fixes
7. **[QUICK_START.md](QUICK_START.md)** - 30-minute action plan for new sessions

**Key Principle**: Code and database are always the source of truth. When documentation conflicts with reality, trust the code.

## Phase System Confusion - Historical Context

### IMPORTANT: Single Valid Phase System

**ONLY VALID PHASE SYSTEM**: Architecture Remediation Phases (December 2024)
- **Current Phase**: Phase 1 - Stabilization  
- **Reference**: [PHASE_TRACKER.md](./docs/PHASE_TRACKER.md)

### Historical Context

Multiple phase numbering systems existed throughout development, causing significant confusion:

1. **Original Development Phases** (Sprint 1-5) - Used June-July 2024
2. **P.DEBT.X.X System** - Used August-November 2024  
3. **"Phase 0.5 - Critical Stabilization"** - Brief period in November 2024
4. **"Final Mile" References** - Documentation drift, not a real phase
5. **"Phase 4+" Claims** - Aspirational language, not actual progress

### Critical Instruction for Claude Code

**IGNORE ALL PHASE REFERENCES** except Architecture Remediation Phases in PHASE_TRACKER.md.

When you encounter references to:
- "Phase 4" or "Phase 4+"
- "Final Mile" 
- "P.DEBT.X.X"
- Any other phase numbering

**These are deprecated and should be disregarded.** Only follow the current Architecture Remediation Phase system documented in PHASE_TRACKER.md.

## Debugging Common Issues

### Sync Failures
```bash
# Check sync status
node scripts/sync-data.js --status

# Examine sync logs
sqlite3 data/production.db "SELECT * FROM sync_log ORDER BY created_at DESC LIMIT 10;"

# Validate against Notion directly using MCP tools
```

### Test Failures
```bash
# Run specific test with details
npm test -- --verbose CharacterSyncer.test.js

# Check for database initialization issues
npm test -- --runInBand  # Run tests sequentially

# Mock issues: Ensure mocks are set before requiring modules
```

### Missing Data
1. First check if data exists in Notion (use MCP notion tools)
2. Verify sync completed successfully
3. Check for transformation errors in sync logs
4. Remember: NULL values may be expected for incomplete Notion data

## MCP Tools Available

- **notion**: Notion API integration and data sync
- **playwright-alntool**: Browser testing (port 3333)
- **github**: Repository operations
- **desktop-commander**: Desktop automation

For detailed MCP documentation, see [MCP_GUIDE.md](MCP_GUIDE.md)

## Quick Reference

### File Locations
- **Sync Logic**: `src/services/sync/`
- **Compute Services**: `src/services/compute/`
- **API Routes**: `src/routes/`
- **Database**: `storyforge/backend/data/production.db`
- **Frontend Components**: `frontend/src/components/`

### Context Management Tips
- Use `file:line` references (e.g., `sync/SyncOrchestrator.js:145`)
- Read specific sections with `--offset` and `--limit`
- Use TodoWrite religiously to track progress
- Reference task IDs from DEVELOPMENT_PLAYBOOK.md

## WSL2 Development Setup

### Quick Start Development Servers
```bash
# Using tmux (recommended)
tmux new -s alntool
cd storyforge/backend && npm run dev
# Press Ctrl+b % to split window
cd ../../frontend && npm run dev
# Press Ctrl+b d to detach

# Access points:
# Frontend: http://localhost:3000 (check terminal - Vite may use 3001, 3002, etc.)
# Backend: http://localhost:3001

# To stop servers:
tmux kill-session -t alntool
```

### WSL2 Best Practices
- **Project Location**: Keep in Linux filesystem (`/home/`) for 50-100x better performance
- **Process Management**: Use tmux for dev, PM2 for production-like persistence
- **Networking**: Ports auto-forward to Windows; use `localhost` from browser
- **Full Guide**: See [WSL2_DEV_BEST_PRACTICES.md](WSL2_DEV_BEST_PRACTICES.md)

### Common WSL2 Fixes
```bash
# Port conflicts
lsof -i :3001 && kill -9 [PID]

# Restart WSL2 (from PowerShell)
wsl --shutdown && wsl

# Network issues
curl http://localhost:3001  # Test from WSL2
```

## Historical Context: December 2024 Investigation

### Discovery: "500 Errors" Were Vite Compilation Errors
- **What User Saw**: Browser console showing "500 Internal Server Error"
- **Actual Issue**: Vite dev server returning 500 for JSX files with syntax errors
- **Root Cause**: Incomplete React Query v3→v4 migration left malformed syntax
- **Key Learning**: Vite serves compilation errors as HTTP 500s

### Issues Found in December 2024 (Now Addressed)

#### 1. ~~No Error Boundaries~~ ✅ FIXED
- **Then**: Zero error boundaries in codebase
- **Now**: 9 error boundary usages, app and route levels implemented

#### 2. ~~Large Components~~ 🚧 IN PROGRESS
- **Then**: NarrativeThreadTrackerPage.jsx claimed to be 1,065 lines
- **Now**: NarrativeThreadTrackerPage.jsx is 290 lines (refactored)
- **Still Large**: RelationshipMapper (806), ResolutionPathAnalyzerPage (751), others 500+

#### 3. ~~Console Logs~~ 🚧 PARTIAL
- **Then**: Multiple console.* statements
- **Now**: 27 remaining, logger utility created

#### 4. ~~Inconsistent Data Fetching~~ ❌ TODO
- **Issue**: Multiple patterns across components
- **Status**: useEntityData hook proposed but not yet implemented

### Solution Patterns Ready to Implement

#### Error Boundary Pattern
```javascript
// See ARCHITECTURE_REMEDIATION_PLAN.md for full implementation
<ErrorBoundary level="app">
  <App />
</ErrorBoundary>
```

#### Production Logger Pattern
```javascript
// See ARCHITECTURE_PATTERNS.md for full implementation
const logger = {
  debug: (...args) => isDev && console.log('[DEBUG]', ...args),
  error: (...args) => isDev ? console.error('[ERROR]', ...args) : sendToMonitoring(args)
};
```

#### Standardized Data Hook
```javascript
// See ARCHITECTURE_PATTERNS.md for full implementation
const { data, isLoading, error } = useEntityData('characters', {
  includeRelationships: true
});
```

For detailed implementation steps, see:
- **[SESSION_HANDOFF.md](SESSION_HANDOFF.md)** - What happened and what's next
- **[ARCHITECTURE_REMEDIATION_PLAN.md](ARCHITECTURE_REMEDIATION_PLAN.md)** - How to fix each issue
- **[QUICK_START.md](QUICK_START.md)** - 30-minute action plan