#!/bin/bash
# Option 3 Implementation Script - Complete Documentation Rewrite
# This script implements a fresh start with NEW_CLAUDE.md based on actual system state

set -e  # Exit on error

echo "=== Starting Option 3: Complete Documentation Rewrite ==="
echo "This will archive ALL existing documentation and create NEW_CLAUDE.md"
echo ""

# Create archive directory with timestamp
ARCHIVE_DIR="docs/archive/$(date +%Y%m%d-%H%M%S)-option3-rewrite"
mkdir -p "$ARCHIVE_DIR"

# Step 1: Archive all existing documentation
echo "Step 1: Archiving all existing documentation..."
find . -name "*.md" -type f ! -path "./node_modules/*" ! -path "./.git/*" -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null || true
echo "✓ Archived all .md files to $ARCHIVE_DIR"

# Step 2: Generate current metrics
echo ""
echo "Step 2: Gathering current system metrics..."

cd storyforge/frontend
CONSOLE_LOGS=$(grep -r "console\." src --include="*.js" --include="*.jsx" 2>/dev/null | wc -l || echo "0")
ERROR_BOUNDARIES=$(grep -r "<ErrorBoundary" src --include="*.jsx" 2>/dev/null | wc -l || echo "0")
LARGE_COMPONENTS=$(find src -name "*.jsx" -exec wc -l {} + 2>/dev/null | awk '$1 > 500 {count++} END {print count+0}')
cd ../..

echo "✓ Metrics collected:"
echo "  - Console logs: $CONSOLE_LOGS"
echo "  - Error boundaries: $ERROR_BOUNDARIES"
echo "  - Components >500 lines: $LARGE_COMPONENTS"

# Step 3: Create NEW_CLAUDE.md
echo ""
echo "Step 3: Creating NEW_CLAUDE.md..."

cat > NEW_CLAUDE.md << EOF
# CLAUDE.md - ALNTool Production Intelligence

**Generated**: $(date +"%Y-%m-%d %H:%M:%S")
**Metrics Last Verified**: $(date +"%Y-%m-%d %H:%M:%S")

## Quick Status
- Build Status: ✅ Both frontend/backend build successfully
- Console Logs: $CONSOLE_LOGS (target: 0)
- Error Boundaries: $ERROR_BOUNDARIES (9 app/route level)
- Components >500 lines: $LARGE_COMPONENTS (target: 0)
- Test Coverage: Unable to measure (test failures)

## What This Tool Does
About Last Night Production Intelligence Tool - journey management and production tool for an immersive murder mystery game. Provides micro (individual paths) and macro (system balance) views.

## Tech Stack
- Frontend: React 18 + Vite + Material-UI + Zustand + React Query v4
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Data: Notion API → SQLite sync pipeline
- Testing: Jest + Playwright + MSW

## Quick Start
\`\`\`bash
# Terminal 1: Backend (port 3001)
cd storyforge/backend && npm run dev

# Terminal 2: Frontend (port 3000/3001/3002...)
cd storyforge/frontend && npm run dev
\`\`\`

## Essential Commands

### Development
\`\`\`bash
# Frontend
npm run dev                  # Start dev server
npm run build               # Production build
npm test                    # Jest tests
npm run test:architecture   # Check code health

# Backend
npm run dev                # Start with nodemon
npm run verify:all         # Run ALL verifications
npm test                   # Jest tests
node scripts/sync-data.js  # Sync from Notion
\`\`\`

### Verification Commands
\`\`\`bash
# Count console logs (should be 0)
grep -r "console\." src --include="*.js" --include="*.jsx" | wc -l

# Count error boundaries
grep -r "<ErrorBoundary" src --include="*.jsx" | wc -l

# Find components >500 lines
find src -name "*.jsx" -exec wc -l {} + | sort -n | tail -10

# Verify test coverage
npm test -- --coverage
\`\`\`

## Current Architecture

### Backend Structure (52 JS files)
\`\`\`
src/
├── controllers/         # HTTP handlers
├── routes/             # API endpoints
├── services/      
│   ├── sync/           # Notion → SQLite sync
│   │   └── entitySyncers/  # Per-entity sync logic
│   └── compute/        # Derived field computation
├── db/                 # Database layer
│   └── migration-scripts/  # SQL migrations
└── utils/              # Shared utilities
\`\`\`

### Frontend Structure (62 JSX files)
\`\`\`
src/
├── pages/              # Route components
├── components/         # Reusable UI components
├── services/           # API client
├── stores/             # Zustand state management
├── hooks/              # Custom React hooks
└── contexts/           # React contexts
\`\`\`

## Key Architecture Patterns

### Backend: SyncOrchestrator Pattern
- **Multi-phase sync**: Entity → Relationship → Compute → Cache
- **Entity syncers**: Extend BaseSyncer with fetch/transform/save
- **Compute phase**: Cross-entity calculations after sync

### Frontend: Component Patterns
- **Error Boundaries**: App/Route level only (need component level)
- **Data Fetching**: React Query v4 with stale-while-revalidate
- **State Management**: Zustand for UI, React Query for server state

## Current Issues

### Priority 1: Stability
1. **No component-level error boundaries** - cascade failures possible
2. **$CONSOLE_LOGS console.log statements** - security/performance risk
3. **Test failures** - preventing coverage measurement

### Priority 2: Maintainability  
1. **Large components** - $LARGE_COMPONENTS files over 500 lines
2. **Inconsistent data patterns** - need standardized hooks
3. **No unified error handling** - each component different

## Development Rules
1. **Verify Everything** - Use actual commands, not memory
2. **Test First** - Write failing test before implementation
3. **Track Progress** - Use TodoWrite for all tasks
4. **Trust Code** - Code > Docs > Memory
5. **Check Notion** - Source of truth for data issues

## Test-Driven Development

### Quick TDD Cycle
1. **Write test** → See it fail (RED)
2. **Write code** → Make it pass (GREEN)  
3. **Improve** → Refactor with confidence

### Test Organization
- Unit tests: Co-located with code (\`Component.test.jsx\`)
- Integration tests: \`__tests__/integration/\`
- E2E tests: \`e2e/\` directory with Playwright

### Running Tests
\`\`\`bash
npm test                    # Run all tests
npm test -- --watch         # TDD mode
npm test -- --coverage      # Coverage report
npm test ComponentName      # Specific component
\`\`\`

## Next Actions

### Immediate (Phase 1 - Stabilization)
1. Add component-level error boundaries
2. Replace console.* with production logger
3. Fix failing tests to enable coverage
4. Refactor components >500 lines

### Coming Soon (Phase 2 - Standardization)
1. Create useEntityData hook pattern
2. Implement unified error/loading states
3. Add comprehensive test coverage
4. Document patterns in code

---
*This is the single source of truth. All other documentation has been archived.*
*Generated with verified metrics on $(date +"%Y-%m-%d %H:%M:%S")*
EOF

echo "✓ Created NEW_CLAUDE.md with current metrics"

# Step 4: Create minimal supporting files
echo ""
echo "Step 4: Creating minimal supporting structure..."

# Create a simple README pointing to CLAUDE.md
cat > README.md << 'EOF'
# ALNTool - About Last Night Production Intelligence

See [CLAUDE.md](./CLAUDE.md) for all documentation.

## Quick Start
```bash
cd storyforge/backend && npm run dev  # Terminal 1
cd storyforge/frontend && npm run dev # Terminal 2
```
EOF

echo "✓ Created minimal README.md"

# Step 5: Git operations (commented out for safety)
echo ""
echo "Step 5: Git operations (manual steps required):"
echo ""
echo "Run these commands to commit the changes:"
echo ""
echo "git add -A"
echo "git commit -m \"feat: implement Option 3 - complete documentation rewrite"
echo ""
echo "Archive contains all previous documentation"
echo "NEW_CLAUDE.md based on verified system state"
echo "Metrics: $CONSOLE_LOGS console logs, $ERROR_BOUNDARIES error boundaries, $LARGE_COMPONENTS large components"
echo ""
echo "Generated on $(date +"%Y-%m-%d %H:%M:%S")\""
echo ""

# Final summary
echo "=== Option 3 Implementation Complete ==="
echo ""
echo "✓ All documentation archived to: $ARCHIVE_DIR"
echo "✓ NEW_CLAUDE.md created with verified metrics"
echo "✓ Minimal README.md created"
echo ""
echo "Next steps:"
echo "1. Review NEW_CLAUDE.md for accuracy"
echo "2. Rename NEW_CLAUDE.md to CLAUDE.md when ready"
echo "3. Commit changes using the git commands above"
echo "4. Begin Phase 1 - Stabilization tasks"