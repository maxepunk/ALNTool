# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ALNTool - About Last Night Production Intelligence

**v1.0 Target Date**: 2025-07-21

## What This Tool Does
About Last Night Production Intelligence Tool - an immersive murder mystery game production system.
- **Primary View**: Character journey design (JourneyGraphView)
- **Scale**: 2-3 game designers, ~500 DB items, 10-30 node journeys

## Memory Architecture

This CLAUDE.md uses strategic imports to manage memory efficiently:
- **Daily Essentials**: Core commands and architecture (this file)
- **Technical Details**: @docs/developer-technical.md
- **User Workflows**: @docs/game-designer-guides.md  
- **Analysis/Context**: @docs/analysis.md

Import files are loaded automatically. Max depth: 5 hops.

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

## Current Architecture (Refactored 2025-01-07)

### State Management
- **React Query**: All server state (data fetching, caching)
- **Zustand**: UI state only (selected nodes, active tabs)
- **Single API object**: All endpoints unified in `services/api.js`

### API Response Format
```javascript
// Success
{ success: true, data: <response>, message: <optional> }

// Error  
{ success: false, error: { message: <msg>, code: <code>, details: <optional> } }
```

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

## For Detailed Information

- **Technical Implementation**: See @docs/developer-technical.md
- **User Workflows**: See @docs/game-designer-guides.md
- **Performance/Analysis**: See @docs/analysis.md

---
*Single source of truth for ALNTool development*