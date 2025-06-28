<!-- CONFIG SCOPE: PROJECT-LOCAL -->
<!-- This file applies to: ALNTool - About Last Night Production Intelligence Tool -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**About Last Night - Production Intelligence Tool** - A comprehensive journey management and production tool for an immersive murder mystery game. The tool provides both micro (individual character paths) and macro (system-wide balance) perspectives to production teams.

**Tech Stack:**
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Frontend: React 18 + Vite + Material-UI + Zustand + React Query
- Data Source: Notion API integration
- Testing: Jest + Playwright

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
- **Singleton Pattern**: DataSyncService coordinates sync operations
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
npm run dev              # Development server with hot reload
npm start                # Production server
```

**Testing:**
```bash
npm test                 # Run all tests
npm test -- --coverage   # Run with coverage report
npm test CharacterSyncer # Test specific file
npm test -- --watch      # Run tests in watch mode
```

**Verification & Health Checks:**
```bash
npm run verify:all       # Run ALL verification checks (always run first!)
npm run verify:migrations # Verify database migrations
npm run verify:pre-deploy # Pre-deployment checks
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

```bash
npm install         # Install dependencies
npm run dev         # Start Vite dev server
npm run build       # Production build
npm test            # Run Jest tests
npm run test:e2e    # Run Playwright E2E tests
```

### Documentation Commands (`cd storyforge/backend`)

```bash
npm run docs:verify-sync        # Check doc consistency
npm run docs:status-report      # Documentation health check
npm run docs:task-complete <id> # Mark task complete & update docs
```

## Key Current State & Critical Findings

### Current Phase
**Phase 4+ Features Already Built** - Despite documentation claiming "Phase 1", sophisticated features exist (ExperienceFlowAnalyzer, MemoryEconomyWorkshop, DualLensLayout) but are inaccessible due to data pipeline issues. The "Final Mile" requires connecting existing features, not building new ones.

### Critical Known Issues
1. **Test Suite Failures**: Database initialization issues in tests
2. **Foreign Key Violations**: Missing validation for entity references
3. **Incomplete Implementations**: Some compute services not fully integrated
4. **UI Features Hidden**: Advanced components exist but aren't accessible

### Key Learnings
- **Data vs Technical Bugs**: Always check Notion as source of truth before assuming technical issues. Example: Missing act_focus values often due to incomplete Notion data, not sync failures.
- **Clean Architecture**: When encountering deprecated code, remove it rather than maintaining backward compatibility
- **Testing Best Practices**: Mock before requiring modules with instantiation, use focused test runs for accurate coverage
- **Authority Hierarchy**: Code/DB > PRD/Notion > README/PLAYBOOK > Migrations/Tests > Archives > Guides

### Recent Progress
- Test coverage improved from 13.7% to 63.68%
- Character links working (60 relationships)
- MemoryValueExtractor integrated
- Documentation consolidated from 20 docs to 5 core docs

## Development Best Practices

1. **Always Run Verification First**: Start every session with `npm run verify:all`
2. **Use TodoWrite Religiously**: Track all tasks and subtasks meticulously
3. **Check Notion for Data Issues**: Validate against source before assuming bugs
4. **Prefer Editing Over Creating**: Modify existing files rather than creating new ones
5. **No Comments**: Unless explicitly requested by the user

## Core Documentation

**Essential Documents:**
1. **README.md** - Current status and project overview
2. **DEVELOPMENT_PLAYBOOK.md** - Implementation details and task specifics
3. **SCHEMA_MAPPING_GUIDE.md** - Data model and Notion→SQL mappings
4. **AUTHORITY_MATRIX.md** - Conflict resolution when docs disagree

**Key Principle**: Code and database are always the source of truth. When documentation conflicts with reality, trust the code.

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

For detailed MCP documentation, see [MCP_GUIDE.md](./MCP_GUIDE.md)

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
- **Full Guide**: See [WSL2_DEV_BEST_PRACTICES.md](./WSL2_DEV_BEST_PRACTICES.md)

### Common WSL2 Fixes
```bash
# Port conflicts
lsof -i :3001 && kill -9 [PID]

# Restart WSL2 (from PowerShell)
wsl --shutdown && wsl

# Network issues
curl http://localhost:3001  # Test from WSL2
```