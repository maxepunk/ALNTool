# About Last Night - Production Intelligence Tool

## Overview

This repository contains the Production Intelligence Tool for "About Last Night," an immersive murder mystery game. The tool is being evolved from the existing StoryForge foundation to provide comprehensive journey management and production capabilities.

## 🚀 Quick Start for Developers

### The 3-Document System

We use a streamlined documentation approach. You only need 3 files:

1. **📋 [QUICK_STATUS.md](./QUICK_STATUS.md)** - START HERE EVERY DAY (30 seconds)
   - Shows your current task
   - Quick progress check
   - Next steps

2. **📖 [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)** - Your main guide while coding
   - Every implementation detail
   - Exact code to write
   - File locations
   - Acceptance criteria

3. **📄 [PRODUCTION_INTELLIGENCE_TOOL_PRD.md](./PRODUCTION_INTELLIGENCE_TOOL_PRD.md)** - Reference when needed
   - UI/UX specifications
   - Architecture details
   - Feature requirements

**That's it!** See [STREAMLINED_DOCS_GUIDE.md](./STREAMLINED_DOCS_GUIDE.md) for why we simplified.

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
   README.md → QUICK_STATUS.md → DEVELOPMENT_PLAYBOOK.md → PRD
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

> **🚨 Critical Hand-off Note**: Before starting ANY task:
> 1. Run the verification protocol above
> 2. Document any discrepancies found
> 3. Update documentation if codebase has changed
> 4. Only proceed if verification passes
> 
> Our current priority is a focused **Technical Debt Repayment** effort. Begin by:
> 1. Running the verification protocol
> 2. Opening `DEVELOPMENT_PLAYBOOK.md`
> 3. Starting with task `P.DEBT.1.1` in the "Technical Debt Repayment Plan"
> 
> All new feature development is paused until verification is complete.

### Your Daily Workflow

```
Morning:
1. Run verification protocol (2-3 minutes)
2. Check QUICK_STATUS.md (30 sec)
3. Open DEVELOPMENT_PLAYBOOK.md to current task
4. Code

Evening:
1. Run verification protocol again
2. Update QUICK_STATUS.md if task done
3. Commit with milestone reference (e.g., "Complete P.DEBT.1.1")
4. Document any code-doc discrepancies found

Testing:
- Run compute service tests with `npm test src/services/compute/__tests__/NarrativeThreadComputer.test.js`
- Run verification protocol after any significant changes
```

### Project Setup

```bash
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
├── 📚 Core Documentation (Just 3 files!)
│   ├── QUICK_STATUS.md              # Current task tracker
│   ├── DEVELOPMENT_PLAYBOOK.md      # Implementation guide  
│   └── PRODUCTION_INTELLIGENCE_TOOL_PRD.md  # Specifications
│
├── 💻 Application Code
│   └── storyforge/
│       ├── backend/                 # Node.js/Express API
│       └── frontend/                # React application
│
├── 🎮 Game Design Background
│   ├── active_synthesis_streamlined.md    # Complete game understanding
│   ├── concept_evolution_streamlined.md   # Design evolution history
│   └── questions_log_streamlined.md       # Open questions & answers
│
└── 📁 Supporting Files
    ├── SampleNotionData/            # Test data
    ├── TROUBLESHOOTING.md           # Only if stuck
    └── SCHEMA_MAPPING_GUIDE.md      # Notion→SQL field mappings
```

## 🎯 Current Status

**Active Task:** <!-- AUTO:CURRENT_TASK -->P.DEBT.3.11 – Complete Test Coverage (NEXT)<!-- /AUTO:CURRENT_TASK -->

**Recent Completions:**
- <!-- AUTO:LAST_COMPLETED -->P.DEBT.3.10 (2025-06-06)<!-- /AUTO:LAST_COMPLETED -->: Implemented comprehensive memory value extraction system with SF_ field parsing

**Current Focus:** Fix puzzle sync issues (17/32 puzzles failing due to missing required fields)

**Progress:** Phase 1 ✅ (100%) | Phase 1.5 (Debt Repayment) 🚧 (<!-- AUTO:PROGRESS -->11/11<!-- /AUTO:PROGRESS --> complete) | Overall ~<!-- AUTO:OVERALL_PROGRESS -->91<!-- /AUTO:OVERALL_PROGRESS -->%

### Recent Victories:
- ✅ **P.DEBT.3.7 (Sync Route Testing) – COMPLETE (2025-06-06)**: All sync route tests pass (including error, concurrency, and performance cases). Robust error handling and concurrency control implemented in sync routes.
- ✅ **Technical Debt Report Created (2025-06-08)**: A full review was conducted, producing a clear, prioritized action plan.
- ✅ **Documentation Aligned (2025-06-08)**: All core project documents (`README`, `QUICK_STATUS`, `DEVELOPMENT_PLAYBOOK`, `PRD`) have been updated to reflect our current focus on solidifying the architecture.
- ✅ **Architectural Flaw FIXED**: All backend endpoints, including relationship graphs, now source data from SQLite.
- ✅ **Single Source of Truth**: The backend now correctly uses SQLite as the single source of truth for all data, including computed fields.
- ✅ **P.DEBT.1.1 Complete (2025-06-06)**: Removed 7 deprecated functions from `db/queries.js`, eliminating zombie code from the legacy timeline/gap model.
- ✅ **NarrativeThreadComputer and all compute services (Act Focus, Resolution Paths, Narrative Threads, Character Link) extracted and fully tested – P.DEBT.3.5 COMPLETE (2025-06-10)**
- ✅ **P.DEBT.3.5 (Compute Services) – Extracted (Act Focus, Resolution Paths, Narrative Threads, Character Link) compute services (with comprehensive tests) – COMPLETE (2025-06-10)**

### What Works vs What Doesn't:
- ✅ All core journey and graph logic is functional.
- ✅ Data sync is stable and populates all necessary entities and relationships.
- ✅ Narrative thread computation and all compute services are implemented and tested.
- ⚠️ The codebase contains significant legacy code ("zombie code") and obsolete database tables that must be removed. This is our current focus.
- ⚠️ 17/32 puzzles still have sync errors due to data issues in Notion (the code itself is working).

**For detailed action items, see the "Technical Debt Repayment Plan" in [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)**

**Current Task:** P.DEBT.3.8 – Integration & Deprecation (IN PROGRESS)

See [QUICK_STATUS.md](./QUICK_STATUS.md) for a high-level summary.

## 📝 Key Development Info

- **Branch:** `feature/production-intelligence-tool`
- **Node Version:** 16+
- **Key Tech:** React, Node.js, SQLite, Zustand
- **Notion Integration:** Requires API key in `.env`
- **Data Sync:** Run `node scripts/sync-data.js` before first use

## 🎯 Verification Status (Handoff Note)

Before starting any task, please run the verification protocol (see "Documentation Verification Protocol" above) and review the following:

- **Verification Script:**  
  The script (`npm run verify:all`) now runs successfully. It checks migrations, critical tables, computed fields, and puzzle sync status (via the `sync_log` table).  
  **Warnings (Pinned for Later):**  
  - Characters with no links (e.g., Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling) – review if these are expected.
  - 42 records in `timeline_events` have a missing computed field (`act_focus`).  
  (These warnings are not blocking but should be addressed in a future task.)

- **Documentation:**  
  Always verify that the documentation (README, QUICK_STATUS, DEVELOPMENT_PLAYBOOK, PRD) accurately reflects the current codebase.  
  (See "Documentation Verification Protocol" above.)

## 🆘 Getting Help

1. **First:** Check current task in DEVELOPMENT_PLAYBOOK.md  
2. **If Stuck:** See TROUBLESHOOTING.md  
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
These 3 files contain everything needed for active development:
- **QUICK_STATUS.md** - What's happening right now
- **DEVELOPMENT_PLAYBOOK.md** - How to build each feature
- **PRODUCTION_INTELLIGENCE_TOOL_PRD.md** - What we're building and why

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
