# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ALNTool - About Last Night Production Intelligence

**v1.0 Target Date**: 2025-07-21  
**Current Phase**: Entity-Level Design Intelligence: Phased Implementation Plan - Phase 1

## What This Tool Does
About Last Night Production Intelligence Tool - an immersive murder mystery game production system.
- **Previous State**: 18 separate database views that failed to support design workflow
- **Current State**: Incomplete implementation of: Unified JourneyIntelligenceView with 5 intelligence layers
- **Core Concept**: Select any entity → see complete impact analysis across Story + Social + Economic + Production dimensions
- **Next Step**: Address Phase 1 Critical Issues ("@storyforge\frontend\docs\PHASE_1_CRITICAL_ISSUES.md")

## Memory Architecture

This CLAUDE.md uses strategic imports to manage memory efficiently:
- **Daily Essentials**: Core commands and architecture (this file)
- **Technical Details**: @docs/developer-technical.md
- **User Workflows**: @docs/game-designer-guides.md  
- **Analysis/Context**: @docs/analysis.md

Import files are loaded automatically. Max depth: 5 hops.

## Current Project Documents & Tracking:
- **Phase 1 Implementation Plan**: @storyforge/frontend/docs/PHASE_1_ACTION_PLAN.md (Living planning/tracking document, always update after each step of work on the project)
- **Multi-Phase Vision**: @storyforge/frontend/docs/UX_VISION_JOURNEY_FIRST_PHASED.md (reference)
- **Feature Consolidation Matrix**: @storyforge/frontend/analysis/FEATURE_CONSOLIDATION_MATRIX.md (reference) 
- **Comprehensive UX Understanding**: @storyforge/frontend/analysis/COMPREHENSIVE_UX_UNDERSTANDING.md (reference)

## Quick Start

Always use tmux to start servers:

```bash
# Terminal 1 - Backend
cd storyforge/backend
npm run dev            # Port 3001

# Terminal 2 - Frontend  
cd storyforge/frontend
npm run dev            # Port 3000
```

## Essential Commands

```bash
# Development
npm run dev                 # Start both servers (from root)
npm test -- --watch         # TDD mode
npm run verify:all          # Run all verifications
node scripts/verify-fixes.js # Verify architecture

# Frontend specific
cd storyforge/frontend
npm test JourneyGraphView   # Test specific component
npm run test:e2e           # E2E tests (5 tests, ~17s)

# Backend specific  
cd storyforge/backend
node scripts/sync-data.js   # Manual Notion sync
```

## Current Architecture (Updated 2025-01-13)

### State Management
- **React Query**: All server state (data fetching, caching)
- **Zustand**: Enhanced with journeyIntelligenceStore for entity selection
- **Single API object**: All endpoints unified in `services/api.js`

### New Components (Day 8 Complete)
- **JourneyIntelligenceView**: Main unified interface container
- **AdaptiveGraphCanvas**: Smart graph with 50-node aggregation
- **IntelligencePanel**: Entity-specific deep analysis
- **5 Intelligence Layers**: Economic, Story, Social, Production, ContentGaps
- **Data Hooks**: usePerformanceElements, useFreshElements, useCharacterJourney

### API Response Format
```javascript
// Success
{ success: true, data: <response>, message: <optional> }

// Error  
{ success: false, error: { message: <msg>, code: <code>, details: <optional> } }
```

### Critical: Dual-Path API Architecture
- **Performance Path**: `/api/elements?filterGroup=memoryTypes` → returns `type` field (400+ elements)
- **Fresh Path**: `/api/elements` → returns `basicType` field (real-time from Notion)
- **Solution**: Use `getElementType(element)` utility or appropriate hooks

### Key Patterns
- **Zero console.log** - Use logger utility instead
- **Error boundaries**: 79 comprehensive boundaries
- **Component size**: <500 lines (enforced)
- **TDD workflow**: Test first, always

## Development Principles

1. **Journey-First UX** - JourneyGraphView is the primary workspace
2. **Verify Everything** - Use actual commands, not memory
3. **Test First** - Write failing test before implementation
4. **Track Progress** - Use TodoWrite for all tasks
5. **Performance Matters** - <2s load times achieved

## Tech Stack

- Frontend: React 18 + Vite + Material-UI + Zustand + React Query v4
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Data: Notion API → SQLite sync pipeline
- Testing: Jest + React Testing Library + MSW + Playwright

## Current Project Status

- **Active Phase**: Phase 1 - Day 8 Complete (Ahead of Schedule!)
- **Completed**: All 5 intelligence layers, core components, 17/17 tests passing
- **Next**: Day 9 - Real-world testing with 400+ elements
- **Progress Tracker**: @storyforge/frontend/docs/PHASE_1_ACTION_PLAN.md
- **Key Success Metric**: <2s load time with full production data

## Common Test Commands

```bash
# Frontend Testing
cd storyforge/frontend

# Run all tests
npm test

# Run specific test file
npm test JourneyIntelligenceView

# Run tests in watch mode for TDD
npm test -- --watch

# Run tests with memory monitoring
npm run test:memory

# Run specific test suites
npm run test:stores        # Store tests only
npm run test:components    # Component tests only
npm run test:layers       # Intelligence layer tests

# E2E testing
npm run test:e2e          # Run all E2E tests
npm run test:e2e:headed   # Run E2E tests with browser visible
npm run test:smoke        # Quick smoke test

# Architecture verification
npm run test:architecture  # Verify console usage, component size, error boundaries
npm run verify:all        # Complete verification suite

# Backend Testing
cd storyforge/backend

# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test -- ActFocusComputer

# Verify migrations and deployment readiness
npm run verify:migrations
npm run verify:pre-deploy
npm run verify:all
```

## Database Commands

```bash
cd storyforge/backend

# Manual Notion sync
node scripts/sync-data.js

# Direct database access
sqlite3 data/production.db

# Common SQL queries for debugging
sqlite3 data/production.db "SELECT COUNT(*) FROM elements WHERE memory_type IS NOT NULL;"
sqlite3 data/production.db "SELECT name, type, calculated_memory_value FROM elements WHERE type = 'Memory Token';"
sqlite3 data/production.db "SELECT * FROM sync_log ORDER BY created_at DESC LIMIT 10;"

# Check migration status
npm run verify:migrations
```

## Debugging Tips

1. **Check API responses**: All endpoints use responseWrapper - look for `success: true/false`
2. **Verify data architecture**: Elements have `type` (performance path) or `basicType` (fresh path)
3. **Memory token values**: Stored in `calculated_memory_value`, not raw fields
4. **Component performance**: Use React DevTools Profiler for render analysis
5. **50-node limit**: AdaptiveGraphCanvas aggregates when >50 nodes
6. **Test isolation**: Tests use transactions with rollback for clean state

## Code Quality Checks

```bash
# Frontend checks
cd storyforge/frontend
npm run verify:console      # Should be 0
npm run verify:components   # All should be <500 lines
npm run verify:boundaries   # Should be 79+
npm run check:hardcoded    # Check for hardcoded values

# Backend checks
cd storyforge/backend
npm run lint               # ESLint check
npm run verify:all         # Complete verification
```

## Architecture Notes

- **4-Phase Sync Pipeline**: Entity → Relationship → Compute → Cache
- **Computed Fields**: Act focus, memory values, narrative threads calculated server-side
- **Intelligence Layers**: Client-side calculations using React Query cached data
- **Performance Boundary**: 50 nodes max, smart aggregation for larger datasets
- **Error Handling**: Comprehensive error boundaries at every major component level

## For Detailed Information

- **Technical Implementation**: See @docs/developer-technical.md
- **User Workflows**: See @docs/game-designer-guides.md
- **Performance/Analysis**: See @docs/analysis.md

---
*Single source of truth for ALNTool development*