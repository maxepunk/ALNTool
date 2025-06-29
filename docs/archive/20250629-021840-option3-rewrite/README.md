# About Last Night - Production Intelligence Tool

> **Executive Summary**: Central navigation hub and status tracker for the Production Intelligence Tool project. Contains current development status, project structure, setup instructions, and quick links to all other documentation. Following the Architecture Remediation Plan (December 2024).

## 🗺️ Claude Quick Nav

**Top Sections for Quick Access:**
1. [📊 Current Phase](#-current-phase) - Architecture Remediation Phase 1
2. [🏗️ Architectural Health](#%EF%B8%8F-architectural-health) - Real metrics
3. [🚀 Quick Start](#-quick-start) - Setup instructions
4. [📁 Project Structure](#-project-structure) - Where everything lives
5. [📚 Documentation Map](#-documentation-map) - What each doc contains

**Search Keywords:** 
`status`, `metrics`, `setup`, `phase 1`, `stabilization`, `error boundaries`, `console logs`

**Cross-References:**
- Implementation details → [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)
- Data model → [SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md)
- Claude workflow → [CLAUDE.md](./CLAUDE.md)
- Phase tracking → [docs/PHASE_TRACKER.md](./docs/PHASE_TRACKER.md)

## Overview

Production Intelligence Tool for "About Last Night," an immersive murder mystery game. Provides journey management and balance analysis for game designers and production teams.

## 📊 Current Phase

**Active Phase**: Architecture Remediation Phase 1 - Stabilization  
**Phase System**: See [PHASE_TRACKER.md](./docs/PHASE_TRACKER.md) for the ONLY valid phase tracking  
**Started**: January 2025  
**Progress**: 0/8 hours  

### Current Task
**Task 1.1**: Integrate Error Boundaries (1.5 hours)
- Wire existing ErrorBoundary.jsx into application
- Add to all route-level components
- Test error recovery

## 🏗️ Architectural Health

### Real Metrics (Not Aspirational)
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage | 15% | 80% | 🔴 Critical |
| Console Logs | 0 | 0 | ✅ Complete |
| Error Boundaries | 100% | 100% | ✅ Complete |
| Largest Component | 1,065 lines | 300 lines | 🟡 Todo |
| Database Errors | 0 | 0 | ✅ Complete |

### Verification Commands
```bash
# Verify metrics are accurate
cd storyforge/backend
npm test -- --coverage  # Shows real test coverage
grep -r "console\." --include="*.js" --include="*.jsx" --exclude-dir=node_modules storyforge/ | wc -l  # Count console logs
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- SQLite3
- Notion API key

### Setup
```bash
# Install git hooks (one time)
./scripts/setup-hooks.sh

# Backend
cd storyforge/backend
npm install
cp .env.example .env  # Add your Notion API key
npm run dev

# Frontend (new terminal)
cd storyforge/frontend
npm install
npm run dev

# Access
Frontend: http://localhost:3000
Backend API: http://localhost:3001
```

### Critical Database Fix Needed
```bash
# The app won't run until this is fixed:
# In backend/src/db/queries.js:393
# Change: ORDER BY timestamp DESC
# To: ORDER BY created_at DESC
```

## 📁 Project Structure

```
ALNTool/
├── 📚 Core Documentation
│   ├── README.md                    # You are here
│   ├── DEVELOPMENT_PLAYBOOK.md      # Implementation guide
│   ├── SCHEMA_MAPPING_GUIDE.md      # Data mappings
│   ├── CLAUDE.md                    # Claude optimization
│   └── docs/
│       └── PHASE_TRACKER.md         # Single source of phase truth
│
├── 💻 Application Code
│   └── storyforge/
│       ├── backend/                 # Node.js API
│       └── frontend/                # React app
│
└── 📁 Archives
    └── docs/archive/                # Historical docs
```

## 📚 Documentation Map

### Essential Documents
1. **This README** - Current state and navigation
2. **[DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)** - How to build features
3. **[SCHEMA_MAPPING_GUIDE.md](./SCHEMA_MAPPING_GUIDE.md)** - Notion→SQL mappings
4. **[PHASE_TRACKER.md](./docs/PHASE_TRACKER.md)** - Phase system tracking

### What Lives Where
- **Current Status**: This README
- **Implementation Details**: DEVELOPMENT_PLAYBOOK.md
- **Data Model**: SCHEMA_MAPPING_GUIDE.md
- **Phase Tracking**: docs/PHASE_TRACKER.md
- **Historical Context**: docs/archive/

## 🎯 What's Actually Working

### ✅ Functional
- Basic Notion sync (characters, elements, puzzles, timeline events)
- SQLite database storage
- Basic frontend with dashboard
- Some compute services

### ❌ Not Working
- Error boundaries (built but not integrated)
- Test suite (database initialization issues)
- Console logging (106 statements in production)
- Advanced UI features (built but hidden)
- Memory value extraction (exists but not integrated)

## 🚨 Known Issues

1. **Database Error** - `queries.js:393` uses wrong column name
2. **No Error Recovery** - Any component error crashes entire app
3. **Test Infrastructure** - Tests fail due to database issues
4. **Hidden Features** - Player Journey, Narrative Threads not in nav

## 📈 Progress Tracking

For detailed progress, see [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md#current-development-status)

To update progress:
```bash
cd storyforge/backend
npm run docs:task-complete 1.1  # When finishing a task
```

---

**Remember**: This document reflects ACTUAL state, not aspirations. For what we're building toward, see the requirements in DEVELOPMENT_PLAYBOOK.md.