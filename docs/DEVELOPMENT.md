# ALNTool Development Guide

> **Last Updated**: 2025-01-07  
> **Status**: Accurate setup and development instructions  
> **Purpose**: Get developers productive quickly

## Prerequisites

- Node.js 18+ (check with `node -v`)
- npm 9+ (check with `npm -v`)
- Git
- SQLite3 (usually pre-installed on macOS/Linux)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/ALNTool.git
cd ALNTool

# Install dependencies
npm install              # Root dependencies
cd storyforge/frontend && npm install
cd ../backend && npm install

# Start development servers (from project root)
npm run dev              # Starts both frontend (3000) and backend (3001)

# Or use tmux (recommended)
tmux new-session -d -s backend 'cd storyforge/backend && npm run dev'
tmux new-session -d -s frontend 'cd storyforge/frontend && npm run dev'
```

## Project Structure

```
ALNTool/
├── storyforge/
│   ├── frontend/        # React app (port 3000)
│   └── backend/         # Express API (port 3001)
├── docs/               # Core documentation
└── .archive/           # Historical docs (ignore)
```

## Development Workflow

### Frontend Development

```bash
cd storyforge/frontend

# Development server with hot reload
npm run dev              # http://localhost:3000

# Run tests
npm test                 # Jest unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # Playwright E2E tests

# Code quality
npm run lint             # ESLint check
npm run format           # Prettier formatting

# Build for production
npm run build            # Creates dist/ directory
npm run preview          # Preview production build
```

### Backend Development

```bash
cd storyforge/backend

# Development server with nodemon
npm run dev              # http://localhost:3001

# Run tests
npm test                 # Jest tests
npm test -- --watch      # Watch mode
npm test -- ActFocusComputer  # Test specific file

# Database operations
sqlite3 data/production.db  # Direct database access

# Trigger Notion sync
curl -X POST http://localhost:3001/api/sync/data
```

## Common Tasks

### 1. Adding a New Frontend Component

```bash
# Create component file
mkdir -p src/components/MyFeature
touch src/components/MyFeature/MyComponent.jsx

# Create test file
mkdir -p src/components/MyFeature/__tests__
touch src/components/MyFeature/__tests__/MyComponent.test.jsx
```

Component template:
```jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function MyComponent({ data }) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}

MyComponent.propTypes = {
  data: PropTypes.object.isRequired
};
```

### 2. Adding a New API Endpoint

```bash
# Add to backend/src/routes/apiV2.js
router.get('/my-endpoint', myController.myMethod);

# Create controller method in appropriate controller
# Keep under 150 lines per controller
```

### 3. Running Database Migrations

```bash
cd storyforge/backend

# Migrations run automatically on server start
# To run manually:
node src/db/runMigrations.js

# To create new migration:
touch src/db/migration-scripts/012-my-new-migration.sql
```

### 4. Debugging Common Issues

**Frontend won't load:**
```bash
# Check if backend is running
curl http://localhost:3001/api/metadata

# Check for console errors (should be 0)
cd storyforge/frontend
npm run verify:console

# Check React Query configuration
# Ensure cacheTime is used (not gcTime) in App.jsx
```

**Backend sync fails:**
```bash
# Check Notion API key (if using real Notion)
echo $NOTION_API_KEY

# Check database permissions
ls -la storyforge/backend/data/production.db

# View sync logs
sqlite3 storyforge/backend/data/production.db \
  "SELECT * FROM sync_log ORDER BY created_at DESC LIMIT 10;"
```

**Tests failing:**
```bash
# Backend: Check for GameConstants
cd storyforge/backend
grep -r "GameConstants" src/config/

# Frontend: Update snapshots if needed
cd storyforge/frontend
npm test -- -u
```

## Code Style Guidelines

### General Rules
- **NO console.log statements** - Use proper logging
- **Components < 500 lines** - Split large components
- **Controllers < 150 lines** - Decompose into services
- **Descriptive names** - `useCharacterData` not `useData`
- **PropTypes required** - For all React components

### Frontend Patterns
```jsx
// ✅ Good: Explicit imports
import { api } from '../../services/api';
const characters = await api.getCharacters();

// ❌ Bad: Direct imports
import { getCharacters } from '../../services/api';
```

### Backend Patterns
```javascript
// ✅ Good: Use transactions
await withTransaction(async (db) => {
  // Multiple operations
});

// ✅ Good: Standardized responses
res.success(data);
res.error('Not found', 404);
```

## Testing Strategy

### Frontend Testing
- **Unit tests**: Component logic and hooks
- **Integration tests**: Component interactions
- **E2E tests**: Critical user journeys
- Run all: `npm test`

### Backend Testing
- **Unit tests**: Services and utilities
- **Integration tests**: API endpoints
- **Transaction tests**: Database operations
- Run all: `npm test`

### Test Data
- Frontend: Mock API responses with MSW
- Backend: In-memory SQLite for tests
- E2E: Separate test database

## Performance Considerations

### Frontend
- **Bundle size limit**: 500KB (currently 770KB)
- **Initial load**: Characters only, others on-demand
- **Graph nodes**: 100 max visible (viewport culling)
- **API caching**: 5min stale, 10min cache time

### Backend
- **Sync operations**: Sequential to prevent conflicts
- **API responses**: Cached 5 minutes
- **Database queries**: Use indexes, avoid N+1
- **Memory**: Watch sync process memory usage

## Deployment Checklist

- [ ] Remove all console.log statements
- [ ] Run all tests
- [ ] Build frontend production bundle
- [ ] Check bundle size
- [ ] Update version in package.json
- [ ] Document any breaking changes
- [ ] Test sync process with production data

## Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### Backend (.env)
```bash
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/production.db
NOTION_API_KEY=your_key_here  # Optional
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Locked
```bash
# Find and kill SQLite processes
ps aux | grep production.db
kill -9 [PID]
```

### Memory Issues During Sync
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

## Getting Help

1. Check `/docs/` for architecture and vision
2. Search codebase for examples
3. Run tests to understand expected behavior
4. Check `.archive/` for historical context (but don't trust it)

---

*Remember: The code is the truth. When in doubt, read the source.*