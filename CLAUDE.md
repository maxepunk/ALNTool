# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Before Starting ANY Task

You MUST complete this onboarding protocol:

1. **Read Core Documentation (in order)**
   ```bash
   # Read these files in this exact sequence:
   README.md          # Project overview & current state
   QUICK_STATUS.md    # Today's task & priorities
   DEVELOPMENT_PLAYBOOK.md  # Detailed implementation instructions
   ```

2. **Run Verification Protocol**
   ```bash
   cd storyforge/backend
   npm run verify:all
   
   # Expected output:
   # ✅ 8 migrations applied
   # ✅ Critical tables and columns present
   # ✅ Computed fields populated
   # ⚠️ Known warnings (non-blocking):
   #    - Characters with no links: Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling
   #    - 42 timeline_events missing act_focus computed field
   ```

3. **Check Current Task**
   - Current Task: **P.DEBT.3.8 - Fix Migration System**
   - Status: Technical Debt Repayment Phase
   - Feature development: PAUSED

## Project Overview

This is the **About Last Night - Production Intelligence Tool**, a comprehensive journey management and production tool for an immersive murder mystery game. The tool provides both micro (individual character paths) and macro (system-wide balance) perspectives to production teams.

**Current Status**: Technical Debt Repayment Phase - All feature development is paused until critical architectural issues are resolved.

## Essential Commands

### Backend (Node.js/Express API)
```bash
cd storyforge/backend

# Development
npm install              # Install dependencies
npm run dev             # Start development server (port 3001)

# Testing
npm test                # Run all tests
npm test -- --watch     # Run tests in watch mode
npm test src/services/compute/__tests__/NarrativeThreadComputer.test.js  # Run specific test

# Verification
npm run verify:all      # Run comprehensive verification (migrations + pre-deploy)
npm run verify:migrations  # Check migration status
npm run verify:migrations:fix  # Auto-fix migration issues
npm run verify:pre-deploy  # Check system readiness

# Data Sync
node scripts/sync-data.js         # Sync all data from Notion
node scripts/sync-data.js --status # Check database status
```

### Frontend (React/Vite)
```bash
cd storyforge/frontend

# Development
npm install              # Install dependencies
npm run dev             # Start development server (port 3000)
npm run build           # Build for production
npm run lint            # Run ESLint

# Testing
npm test                # Run Jest tests
```

## Architecture & Key Concepts

### Data Flow Architecture
1. **Notion** → Source of truth for raw game data
2. **SQLite** → Local cache with computed fields, single source for all API endpoints
3. **Frontend** → React app consuming backend API only (no direct Notion access)

### Computed Fields (Critical)
The system computes several fields not present in Notion that are essential for core features:

1. **Act Focus** (Timeline Events) - Aggregate from related elements
2. **Resolution Paths** (All Entities) - Based on ownership patterns and game logic
3. **Narrative Threads** (Puzzles) - Rollup from reward elements
4. **Character Links** - Computed from shared experiences (events, puzzles, elements)

Without these computed fields, core features like the Balance Dashboard cannot function.

### Sync Architecture
```
storyforge/backend/src/services/
├── sync/                      # Data synchronization
│   ├── SyncOrchestrator.js    # Coordinates sync phases
│   ├── entitySyncers/         # Entity-specific sync logic
│   └── RelationshipSyncer.js  # Cross-entity relationships
├── compute/                   # Derived field computation
│   └── *Computer.js           # Individual compute services
└── dataSyncService.js         # Legacy monolith (being refactored)
```

The sync process follows a multi-phase approach:
- Phase 1: Base entities (characters, elements, puzzles, timeline)
- Phase 2: Relationships and character links
- Phase 3: Compute derived fields
- Phase 4: Cache maintenance

### Critical Implementation Details

1. **Two-Phase Sync**: Prevents foreign key violations by syncing entities before relationships
2. **Transaction Management**: All sync operations wrapped in transactions with rollback
3. **Template Method Pattern**: BaseSyncer provides consistent workflow for all entity syncers
4. **Performance Targets**: Each compute service has specific performance requirements (< 2s)
5. **Cache Management**: Journey graphs cached with 24-hour TTL, invalidated on sync

## Development Workflow

### Before Starting ANY Task

1. **Run Verification Protocol**
   ```bash
   cd storyforge/backend
   npm run verify:all
   ```
   Expected: 8 migrations applied, critical tables present, known warnings documented

2. **Review Documentation in Order**
   - README.md → Current project state
   - QUICK_STATUS.md → Today's task and priorities
   - DEVELOPMENT_PLAYBOOK.md → Implementation details for current task

3. **Check Task Prerequisites**
   - Verify affected files exist
   - Confirm dependencies available
   - Review acceptance criteria

### When Working on Data Sync/Database

Always consult **SCHEMA_MAPPING_GUIDE.md** for:
- Notion → SQL field mappings
- Computed field calculations
- Data transformation rules
- Junction table relationships

### Testing Approach

- Unit tests for individual components
- Integration tests for sync operations
- Performance tests for compute services
- All tests must pass before task completion

### Key Principles from Cursor Rules

1. **Documentation First**: Update docs at every checkpoint, flag discrepancies
2. **Systematic Approach**: Follow DEVELOPMENT_PLAYBOOK.md step-by-step
3. **"See the Journey, Shape the System"**: Balance micro and macro perspectives
4. **Never ignore acceptance criteria**: Task only complete when all criteria met

## Current Technical Debt Focus

The project is in **Technical Debt Repayment** mode. Current priorities:

1. **P.DEBT.3.8** - Fix Migration System (✅ COMPLETE)
   - ✅ Debug why migrations aren't auto-applying - migrations work correctly via initializeDatabase()
   - ✅ Fix narrative threads column creation - columns exist and populated
   - ✅ Add migration verification system - enhanced with auto-fix mode
   - ✅ Update documentation - commands updated in CLAUDE.md

2. **P.DEBT.3.9** - Memory Value Extraction
   - Implement extraction from element descriptions
   - Add memory value columns to database
   - Create extraction tests
   - Update compute services

3. **P.DEBT.3.10** - Fix Puzzle Sync (17/32 failing)
   - Debug 17 failing puzzle syncs
   - Fix missing required fields
   - Add validation and error handling
   - Update sync documentation

4. **P.DEBT.3.11** - Complete Test Coverage
   - Add missing compute service tests
   - Implement integration tests
   - Add performance benchmarks
   - Document test coverage

See DEVELOPMENT_PLAYBOOK.md for detailed task instructions.

## 🎯 Automated Task Execution Protocol

**🚀 STREAMLINED WORKFLOW - Zero Manual Documentation Updates!**

### Pre-Task (1 minute)
- [ ] Run `npm run verify:all` (includes documentation consistency check)
- [ ] Use TodoWrite to mark task as `in_progress`
- [ ] Review task details in DEVELOPMENT_PLAYBOOK.md

### During Task (Focus on Implementation)
- [ ] Follow implementation steps exactly
- [ ] Run tests after each change
- [ ] Use TodoWrite to track sub-task progress
- [ ] Flag any discrepancies immediately

### Post-Task (Automated Documentation)
- [ ] Run all tests: `npm test`
- [ ] Run verification: `npm run verify:all`
- [ ] Check all acceptance criteria met
- [ ] **AUTOMATED**: `npm run docs:task-complete <task-id>` (updates ALL documentation)
- [ ] **AUTOMATED**: Documentation consistency verified as part of `npm run verify:all`

## 📚 Automated Documentation System

**No More Manual Updates!** The following commands handle all documentation:

```bash
# When starting work
npm run docs:status-report        # See current status

# When completing a task  
npm run docs:task-complete P.DEBT.3.10  # Updates ALL docs automatically

# Verification (integrated into verify:all)
npm run docs:verify-sync          # Check consistency

# Initialize system (one-time)
npm run docs:init                 # Add automation markers
```

**What Gets Updated Automatically:**
- ✅ Current task status across all documentation files
- ✅ Progress counters (e.g., "9/11 tasks complete" → "10/11 tasks complete")  
- ✅ Last completed task with date
- ✅ Next task assignment
- ✅ Consistency verification across all files

**Files Managed:**
- QUICK_STATUS.md (single source of truth)
- README.md (public overview)
- DEVELOPMENT_PLAYBOOK.md (current phase)
- PRODUCTION_INTELLIGENCE_TOOL_PRD.md (progress tracker)
- CLAUDE.md (this file)

## Known Issues & Warnings

**Non-blocking warnings** (documented for later):
- Characters with no links: Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling
- 42 timeline_events missing act_focus computed field

**Critical issues** (blocking features):
- ✅ Migration system not auto-applying - FIXED via enhanced verification system
- ✅ Memory value extraction not implemented - COMPLETE via MemoryValueExtractor service
- 17/32 puzzles failing sync due to missing required fields

## Project Structure

```
ALNTool/
├── Core Docs (3 files)
│   ├── QUICK_STATUS.md         # Current task
│   ├── DEVELOPMENT_PLAYBOOK.md # How to implement
│   └── PRODUCTION_INTELLIGENCE_TOOL_PRD.md # What & why
├── storyforge/
│   ├── backend/               # Node.js API
│   └── frontend/              # React app
└── Supporting Files
    ├── SCHEMA_MAPPING_GUIDE.md # Notion→SQL mappings
    └── game design background/ # Game mechanics context
```

## Key Technologies

- **Backend**: Node.js, Express, SQLite (better-sqlite3), Notion API
- **Frontend**: React, Vite, Material-UI, Zustand, React Query, React Flow
- **Testing**: Jest, Supertest
- **Branch**: `feature/production-intelligence-tool`