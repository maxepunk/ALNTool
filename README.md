# About Last Night - Production Intelligence Tool

> **Executive Summary**: Central navigation hub and status tracker for the Production Intelligence Tool project. Contains current development phase (Technical Debt Repayment → Final Mile), sprint status, project structure, setup instructions, and quick links to all other documentation. Test coverage milestone achieved (63.68%). Ready for Final Mile fixes to connect Phase 4+ features to users.

## 🗺️ Claude Quick Nav

**Top Sections for Quick Access:**
1. [🚨 Critical Status Update](#-critical-status-update) - Current phase and major discoveries
2. [📊 Current Sprint Status](#-current-sprint-status) - What's happening now
3. [📁 Directory Structure](#-directory-structure) - Where everything lives
4. [🛠️ Getting Started](#%EF%B8%8F-getting-started) - Setup and installation
5. [🔧 Development Commands](#-development-commands) - Common commands

**Search Keywords:** 
`status`, `progress`, `setup`, `install`, `commands`, `architecture`, `structure`, `sprint`, `phase`, `current work`

**Cross-References:**
- Implementation details → [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)
- Data model → [SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md)
- Claude workflow → [CLAUDE.md](./CLAUDE.md)

## Overview

This repository contains the Production Intelligence Tool for "About Last Night," an immersive murder mystery game. The tool is being evolved from the existing StoryForge foundation to provide comprehensive journey management and production capabilities.

## 🚀 Quick Start for Developers

### The Streamlined Documentation System

We've consolidated our documentation for clarity. Start here:

1. **📋 This README** - START HERE (Current status & quick orientation)
   - Current sprint status
   - Quick progress check
   - System overview
   - Getting started

2. **📖 [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)** - Your implementation guide
   - Technical requirements
   - Architecture details
   - Code patterns
   - Troubleshooting
   - Known issues

3. **📐 [SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md)** - Data model reference
   - Notion → SQL mappings
   - Field transformations
   - Computed fields
   - Data relationships

### Documentation Verification Protocol

Before starting any task, you MUST verify the accuracy of our documentation against the actual codebase. Follow these steps in order:

1. **Initial Verification** (Before Reading Documentation)
   ```bash
   # Run these commands to verify current state
   cd storyforge/backend
   npm test  # Verify all tests pass
   node scripts/verify-docs.js  # Our custom verification script
   ```

2. **Documentation Review Order**
   ```
   README.md → DEVELOPMENT_PLAYBOOK.md → SCHEMA_MAPPING_GUIDE.md
   ```
   At each step, verify the documented state matches the codebase:
   - ✅ Test results match documented status
   - ✅ File paths exist and match
   - ✅ Dependencies are correctly listed
   - ✅ Current task is accurately described

3. **Task-Specific Verification**
   For each task in DEVELOPMENT_PLAYBOOK.md:
   - Run relevant test suite
   - Check affected files exist
   - Verify acceptance criteria are testable
   - Confirm dependencies are available

4. **Code-Doc Alignment Check**
   ```bash
   # Run these before starting any task
   npm run verify-docs  # Checks doc-code alignment
   npm run check-deps   # Verifies dependencies
   ```

> **🚨 Critical Status Update**: 
> 
> **Current Phase**: Final Mile (Connecting Phase 4+ Features)
> 
> **Final Mile Progress (June 15, 2025)**:
> - ✅ Character Links: Working correctly (60 links exist, no schema fix needed) [VERIFIED]
> - ✅ MemoryValueExtractor: Already integrated in ComputeOrchestrator [VERIFIED]
> - ✅ Database Cleanup: Removed deprecated `memory_value` column
> - ⚠️ Memory Values: Only 1/100 elements has non-zero value (Howie's Memory Token) [VERIFIED]
> - ℹ️ SF_ Template: Found in description text (e.g., "S.F. - Last Try"), not structured format [VERIFIED]
> - ✅ Act Focus Analysis: 42 events missing values due to incomplete Notion data (NOT a bug) [VERIFIED]
> 
> **Test Coverage Milestone Achieved (June 12, 2025)**: P.DEBT.3.11 Complete
> - **Coverage Improved**: From 13.7% to 63.68% overall
> - **Tests Created**: Controllers, Services, Database, Utils all have comprehensive test suites
> - **Key Learnings**: See [TEST_COVERAGE_LEARNINGS.md](./storyforge/backend/TEST_COVERAGE_LEARNINGS.md)
> 
> **Code Audit Completed (January 10, 2025)**: Comprehensive audit confirms Phase 4+ features exist but are blocked by critical bugs
> - **Full Audit Report**: See [CODE_AUDIT_2025.md](./CODE_AUDIT_2025.md)
> - **Overall Grade**: B+ (Good architecture with critical issues)
> 
> **Major Discovery**: The tool is actually in Phase 4+ implementation (not Phase 1 as docs claim)
> - Sophisticated features ALREADY EXIST: ExperienceFlowAnalyzer, MemoryEconomyWorkshop, DualLensLayout
> - These features are INACCESSIBLE due to data pipeline and UI/UX issues
> - The path to 1.0 is the "Final Mile" - connecting existing features, NOT building new ones
> 
> **Code Audit Findings vs Reality** (Updated after verification):
> - ✅ Character relationships: 60 records working (audit was wrong about schema mismatch)
> - ⚠️ Puzzle sync: 3/32 failing (not 17 as claimed)
> - ⚠️ Memory values: Parser exists but not integrated in sync pipeline
> - ❌ UI discovery: Sophisticated features hidden from users (no navigation items)
> - ✅ Test suite: Tests passing individually (audit was wrong about failures)
> - ✅ Test coverage: 63.68% achieved (was 13.7%)
> 
> **Final Mile Actions Required** (Updated June 14, 2025):
> 1. ~~Fix character links schema~~ ✅ Already working correctly
> 2. ~~Integrate MemoryValueExtractor~~ ✅ Already integrated
> 3. ~~Fix Act Focus computation~~ ✅ Working correctly (NULL values expected with incomplete data)
> 4. Add navigation for hidden features - 1 hour
> 5. Update Notion elements with SF_ template (data task - designer responsibility)
> 6. Update 59 elements with "First Available" field (data task - designer responsibility)
> 
> **Current Focus**: Ready for Final Mile fixes (see DEVELOPMENT_PLAYBOOK.md)
> 
> **Process Discovery (June 14, 2025)**: <!-- VERIFIED: 2025-06-14 -->
> - ✅ Established Notion Validation Protocol - Always check Notion as source of truth before assuming data issues are bugs
> - ✅ Distinguished data completeness vs technical bugs - 42 missing act_focus values are expected with incomplete Notion data
> - ✅ Updated verification protocols in CLAUDE.md and troubleshooting guide in DEVELOPMENT_PLAYBOOK.md

### Your Daily Workflow

```
Morning (Verify-First):
1. cd storyforge/backend && npm run verify:all (2-3 minutes)
2. Check actual test/database state with verification queries
3. Open DEVELOPMENT_PLAYBOOK.md to current task section
4. Note any doc-reality discrepancies BEFORE coding

During Work:
1. Code based on verified reality, not doc claims
2. Update docs immediately when finding discrepancies
3. Add <!-- VERIFIED: YYYY-MM-DD --> timestamps

Evening:
1. Run npm run verify:all again
2. Update docs with npm run docs:task-complete <task-id>
3. Commit with task reference (e.g., "Complete P.DEBT.3.11")
4. Update TodoWrite with progress
```

### Project Setup

```bash
# Initial setup (one time)
./scripts/setup-hooks.sh  # Install git hooks for documentation verification

# Backend setup
cd storyforge/backend
npm install
cp .env.example .env  # Add your Notion API key
npm run dev

# Frontend setup (new terminal)
cd storyforge/frontend
npm install
npm run dev

# Access application
Frontend: http://localhost:3000
Backend API: http://localhost:3001
```

## 📁 Project Structure

```
ALNTool/
├── 📚 Core Documentation (10 files)
│   ├── README.md                    # Project hub & status
│   ├── CLAUDE.md                    # Claude Code workflow optimization
│   ├── DEVELOPMENT_PLAYBOOK.md      # Implementation guide & specifications
│   ├── SCHEMA_MAPPING_GUIDE.md      # Notion→SQL field mappings
│   ├── AUTHORITY_MATRIX.md          # Documentation conflict resolution
│   ├── CODE_AUDIT_2025.md          # Comprehensive audit & fixes
│   ├── MCP_GUIDE.md                # MCP server documentation
│   ├── WSL2_DEV_BEST_PRACTICES.md  # WSL2 development guide
│   ├── WSL_RECOVERY_PLAN.md        # WSL2 recovery procedures
│   └── FILESYSTEM_CLEANUP_PLAN.md  # Cleanup documentation
│
├── 💻 Application Code
│   └── storyforge/
│       ├── backend/                 # Node.js/Express API
│       │   └── data/               # SQLite database
│       ├── frontend/                # React application
│       └── test-results/            # Test execution results
│
├── 📁 Documentation & Resources
│   ├── docs/                        # Organized documentation
│   │   ├── Guides/                 # How-to guides
│   │   └── archive/                # Historical documents
│   │       ├── sessions/           # Session handoffs
│   │       ├── assessments/        # Old audits
│   │       └── design/             # Game design docs
│   └── SampleNotionData/           # Example Notion data
│
└── 🔧 Configuration
    ├── package.json                # Root package config
    ├── node_modules/               # Root dependencies
    └── .gitignore                  # Git ignore rules
```

**Note**: Root directory cleaned up on June 10, 2025 - removed 7 empty archived directories and relocated test-results/

## 🎯 Project Overview

**What:** Production Intelligence Tool for "About Last Night" murder mystery game
**Purpose:** Provides micro (character paths) and macro (system balance) views for production teams
**Status:** Phase 4+ features built but need "Final Mile" fixes to connect to users

### 📊 System Health
<!-- VERIFIED: 2025-06-11 -->
To check current system status, run:
```bash
cd storyforge/backend && npm run verify:all
```

**Known Working State (Verified June 15, 2025):**
- ✅ 22 characters, 75 timeline events, 100 elements, 32 puzzles synced
- ✅ 60 character relationships working correctly
- ✅ All tests passing when run individually
- ✅ Resolution paths computed for all entities
- ✅ Test coverage: 63.68% overall (P.DEBT.3.11 complete)
- ⚠️ 42/75 timeline events missing act_focus values (Notion data incomplete) <!-- VERIFIED: 2025-06-28 -->
- ⚠️ Only 1/100 elements has non-zero memory value
- ⚠️ Frontend features exist but not accessible in navigation

For current development task, see: **[DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md#current-development-status)**

### Recent Accomplishments (Technical Debt Phase)

<details>
<summary>Click to expand recent completions</summary>

#### Architecture & Data Pipeline
- ✅ **Architectural Integrity Achieved**: Refactored into robust, transactional system with SQLite as single source of truth
- ✅ **Journey Graph Implementation**: Re-envisioned as narrative dependency graph with new visualization
- ✅ **Compute Services Extracted** (P.DEBT.3.5): Act Focus, Resolution Paths, Narrative Threads, Character Links

#### Code Cleanup (June 2025)
- ✅ **P.DEBT.1.1**: Removed 7 deprecated functions from legacy timeline/gap model
- ✅ **P.DEBT.1.2**: Dropped legacy tables (journey_segments, gaps, cached tables)
- ✅ **P.DEBT.1.3**: Removed zombie logic from journeyEngine.js
- ✅ **P.DEBT.2.1**: Refactored API responses to clean graph model
- ✅ **P.DEBT.2.2**: Implemented new caching with 80-90% performance improvement

#### Service Refactoring (June 2025)  
- ✅ **P.DEBT.3.1-P.DEBT.3.4**: Decomposed 760-line monolith into focused modules:
  - CharacterSyncer, ElementSyncer, PuzzleSyncer, TimelineEventSyncer
  - RelationshipSyncer with two-phase sync architecture
  - 45% code reduction in dataSyncService
- ✅ **P.DEBT.3.7**: Comprehensive sync route testing with error handling
- ✅ **P.DEBT.3.10**: Memory value extraction with SF_ field parsing

</details>

### Implementation Status

#### ✅ What's Working
- **Core Infrastructure**: Journey graphs, data sync, compute services
- **Data Pipeline**: Notion → SQLite → API endpoints (single source of truth)
- **Computed Fields**: Act Focus, Resolution Paths, Narrative Threads
- **Sync Architecture**: Transactional with rollback support
- **Performance**: Caching provides 80-90% improvement

#### ⚠️ Known Issues <!-- VERIFIED: 2025-06-15 -->
- **Act Focus**: 42 timeline events missing values (Notion data incomplete) <!-- VERIFIED: 2025-06-28 -->
- **Memory Values**: Only 1/100 elements has non-zero value (data issue, not technical)
- **Frontend Access**: Phase 4+ features exist but hidden (no navigation items)
- **Isolated Characters**: Some characters have no relationships yet

#### 🔧 Next Priorities <!-- VERIFIED: 2025-06-15 -->
1. **Test Coverage**: ✅ COMPLETE - Achieved 63.68% coverage
2. **Quick Wins** (Final Mile):
   - Add navigation for Phase 4+ features (1 hour)
   - Update Notion data (designer responsibility):
     - Add memory values to 99 elements
     - Complete act_focus for 42 timeline events
3. **Frontend Access**: Connect existing features to UI

## 📝 Key Development Info

- **Branch:** `feature/production-intelligence-tool`
- **Node Version:** 16+
- **Key Tech:** React, Node.js, SQLite, Zustand
- **Notion Integration:** Requires API key in `.env`
- **Data Sync:** Run `node scripts/sync-data.js` before first use

## ✅ Verification Checklist

<details>
<summary>Expand for detailed verification steps</summary>

### Before Any Task
1. **Run Verification Suite**
   ```bash
   cd storyforge/backend
   npm run verify:all
   ```
   Expected output:
   - ✅ 8 migrations applied
   - ✅ Critical tables and columns present
   - ✅ Computed fields populated
   - ⚠️ Known warnings (non-blocking):
     - Characters with no links: Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling
     - 42 timeline_events missing act_focus computed field

2. **Verify Implementation**
   ```bash
   # Check compute services
   ls src/services/compute/
   # Should show: ActFocusComputer.js, ResolutionPathComputer.js, etc.
   
   # Check sync services  
   ls src/services/sync/
   # Should show: SyncOrchestrator.js, entitySyncers/, etc.
   ```

3. **Test Status**
   ```bash
   npm test
   # All compute service tests should pass
   # No failing sync tests
   # Migration tests passing
   ```

4. **Documentation Accuracy**
   - [ ] Current task matches codebase state
   - [ ] File paths exist and are correct
   - [ ] Known issues match actual warnings

</details>

## 🆘 Getting Help

1. **First:** Check current task in DEVELOPMENT_PLAYBOOK.md  
2. **If Stuck:** See "Troubleshooting Guide" section in DEVELOPMENT_PLAYBOOK.md  
3. **Still Stuck:** Document the issue for others

## 🎉 Why This Works

- **No Documentation Sprawl:** Just 3 focused files  
- **Always Know Where You Are:** QUICK_STATUS.md  
- **Always Know What To Do:** DEVELOPMENT_PLAYBOOK.md  
- **Never Lost:** Clear task progression

---

**Remember:** If you're confused, you're in the wrong document. There are only 3!

## 📖 Documentation Architecture

Our documentation follows a layered approach:

### 🎯 Core Documentation (Start Here)
These files contain everything needed for active development:
- **CLAUDE.md** - Claude Code workflow optimization
- **DEVELOPMENT_PLAYBOOK.md** - How to build each feature, including complete requirements & specifications
- **SCHEMA_MAPPING_GUIDE.md** - Notion→SQL field mappings and data model reference
- **[AUTHORITY_MATRIX.md](./AUTHORITY_MATRIX.md)** - Resolves conflicts between docs, code, and reality
- **[CODE_AUDIT_2025.md](./CODE_AUDIT_2025.md)** - Comprehensive code audit findings with prioritized fixes

### 📚 Training & Onboarding Guides
For new team members or detailed understanding:
- **[Developer Quick Start Guide](./docs/DEVELOPER_QUICK_START.md)** - Quick onboarding and common scenarios
- **[Claude Code Guide](./docs/CLAUDE_CODE_GUIDE.md)** - Detailed Claude Code workflows and best practices
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions

### 🎮 Game Design Background (Context)
Deeper understanding of the game we're building tools for:
- **active_synthesis_streamlined.md** - Complete validated game design
- **concept_evolution_streamlined.md** - How the design evolved
- **questions_log_streamlined.md** - Design questions and their resolution

### 🔧 Technical References (As Needed)
- **SCHEMA_MAPPING_GUIDE.md** - Complete Notion→SQL field mappings
- **TROUBLESHOOTING.md** - Common problems and solutions
- **SampleNotionData/** - Example data from Notion

---

## 🚨 Current Implementation Priority: Computed Fields

The tool requires several **computed fields** that don't exist in Notion but are essential for core features:

1. **Act Focus** (Timeline Events) - Aggregate from related elements
2. **Narrative Threads** (Puzzles) - Rollup from reward elements  ✅ Complete
3. **Resolution Paths** (All entities) - Compute from ownership patterns
4. **Linked Characters** - Already computed, needs API exposure

⚠️ **VERIFICATION REQUIRED**: Before working on computed fields:
1. Run `npm test src/services/compute/__tests__/` to verify current implementation
2. Check `storyforge/backend/src/services/compute/` for actual implementation
3. Verify test coverage matches documented status
4. Confirm database schema matches PRD specifications

Without these computations:
- ❌ Balance Dashboard can't show path distribution
- ❌ Timeline can't filter by Act
- ❌ Resolution Path Analyzer is non-functional

See [SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md) → "Computed Fields" section for implementation details.

---
