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

### Your Daily Workflow

```
Morning:
1. Check QUICK_STATUS.md (30 sec)
2. Open DEVELOPMENT_PLAYBOOK.md to current task
3. Code

Evening:
1. Update QUICK_STATUS.md if task done
2. Commit with milestone reference (e.g., "Complete P.DEBT.1.1")
```
> **🚨 Hand-off Note for New Developers:** Our current priority is a focused **Technical Debt Repayment** effort. Please begin by opening the `DEVELOPMENT_PLAYBOOK.md` and starting with task `P.DEBT.1.1` in the "Technical Debt Repayment Plan" section. All new feature development is paused.

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

**Active Task**: **Technical Debt Repayment**. All new feature development is paused until the critical architectural issues identified in our recent code review are resolved.
**Last Major Update**: Completed a comprehensive technical debt review and updated all project documentation to reflect the new, focused cleanup plan. (2025-06-08)
**Progress**: Phase 1 ✅ (100%) | Phase 1.5 (Debt Repayment) 🚧 (33% of Priority 1 complete) | Overall ~45%

### Recent Victories:
- ✅ **Technical Debt Report Created (2025-06-08)**: A full review was conducted, producing a clear, prioritized action plan.
- ✅ **Documentation Aligned (2025-06-08)**: All core project documents (`README`, `QUICK_STATUS`, `DEVELOPMENT_PLAYBOOK`, `PRD`) have been updated to reflect our current focus on solidifying the architecture.
- ✅ **Architectural Flaw FIXED**: All backend endpoints, including relationship graphs, now source data from SQLite.
- ✅ **Single Source of Truth**: The backend now correctly uses SQLite as the single source of truth for all data, including computed fields.
- ✅ **P.DEBT.1.1 Complete (2025-06-06)**: Removed 7 deprecated functions from `db/queries.js`, eliminating zombie code from the legacy timeline/gap model.

### What Works vs What Doesn't:
- ✅ All core journey and graph logic is functional.
- ✅ Data sync is stable and populates all necessary entities and relationships.
- ⚠️ The codebase contains significant legacy code ("zombie code") and obsolete database tables that must be removed. This is our current focus.
- ⚠️ 17/32 puzzles still have sync errors due to data issues in Notion (the code itself is working).

**For detailed action items, see the "Technical Debt Repayment Plan" in [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)**

See [QUICK_STATUS.md](./QUICK_STATUS.md) for a high-level summary.

## 📝 Key Development Info

- **Branch**: `feature/production-intelligence-tool`
- **Node Version**: 16+
- **Key Tech**: React, Node.js, SQLite, Zustand
- **Notion Integration**: Requires API key in `.env`
- **Data Sync**: Run `node scripts/sync-data.js` before first use

## 🆘 Getting Help

1. **First**: Check current task in DEVELOPMENT_PLAYBOOK.md
2. **If Stuck**: See TROUBLESHOOTING.md
3. **Still Stuck**: Document the issue for others

## 🎉 Why This Works

- **No Documentation Sprawl**: Just 3 focused files
- **Always Know Where You Are**: QUICK_STATUS.md
- **Always Know What To Do**: DEVELOPMENT_PLAYBOOK.md  
- **Never Lost**: Clear task progression

---

**Remember**: If you're confused, you're in the wrong document. There are only 3!

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
2. **Narrative Threads** (Puzzles) - Rollup from reward elements  
3. **Resolution Paths** (All entities) - Compute from ownership patterns
4. **Linked Characters** - Already computed, needs API exposure

Without these computations:
- ❌ Balance Dashboard can't show path distribution
- ❌ Timeline can't filter by Act
- ❌ Resolution Path Analyzer is non-functional

See [SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md) → "Computed Fields" section for implementation details.

---
