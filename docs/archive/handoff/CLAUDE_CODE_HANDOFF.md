# Claude Code Handoff Guide

## 🚀 Quick Start for Claude Code

### 1. Initialize Claude Code with Streamlined Prompt
Use the prompt in `CLAUDE_CODE_INIT.md` for your `/init` command. This is a streamlined version that maintains all critical constraints while being more digestible.

### 2. First Commands to Run
```bash
# 1. Navigate to backend and verify system state
cd storyforge/backend
npm run verify:all

# 2. Check current documentation
# Read these files in Claude Code's editor:
# - README.md (project overview)
# - QUICK_STATUS.md (current task)
# - DEVELOPMENT_PLAYBOOK.md (implementation details)

# 3. Run tests to ensure clean state
npm test

# 4. Start development servers if needed
npm run dev  # Backend on port 3001
# In new terminal:
cd ../frontend && npm run dev  # Frontend on port 3000
```

## 📋 Current Task Context

### Task: P.DEBT.3.8 - Fix Migration System
**Problem**: Migrations aren't auto-applying, causing issues with computed fields.

**Key Files to Review**:
- `storyforge/backend/src/db/migrations/` - Migration scripts
- `storyforge/backend/src/db/migrationRunner.js` - Migration execution logic
- `storyforge/backend/src/services/compute/NarrativeThreadComputer.js` - Affected by missing columns

**Acceptance Criteria**:
- [ ] Migrations auto-apply on server start
- [ ] Narrative threads column exists and populates
- [ ] Migration verification system implemented
- [ ] All tests pass
- [ ] Documentation updated

## 🔍 Key Things Claude Code Should Know

### 1. **Documentation is Sacred**
- The 3-document system (QUICK_STATUS, DEVELOPMENT_PLAYBOOK, PRD) is the single source of truth
- Always update docs when making changes
- Flag any discrepancies between code and documentation

### 2. **Current State Awareness**
- We're in Technical Debt Repayment mode - NO new features
- 17/32 puzzles have sync errors (known issue, not blocking)
- Migration system needs fixing (current priority)
- All computed fields are implemented but some need database columns

### 3. **Verification is Mandatory**
- Always run `npm run verify:all` before and after changes
- Document any new warnings
- The known warnings about characters with no links are non-blocking

### 4. **Test-Driven Approach**
- Every task has acceptance criteria that must be met
- Tests must pass before considering a task complete
- Performance benchmarks are specified for compute services

## 🛠️ Common Workflows

### Working on Sync Issues
```bash
# 1. Check sync status
node scripts/sync-data.js --status

# 2. Run specific syncer tests
npm test src/services/sync/__tests__/PuzzleSyncer.test.js

# 3. Debug with detailed logging
SYNC_DEBUG=true node scripts/sync-data.js
```

### Working on Compute Services
```bash
# 1. Run compute tests
npm test src/services/compute/__tests__/

# 2. Check performance
npm test -- --testNamePattern="performance"

# 3. Verify computed fields
sqlite3 notion_cache.db "SELECT id, name, act_focus FROM timeline_events LIMIT 5;"
```

### Database Inspection
```bash
# Check migrations
sqlite3 notion_cache.db ".tables"
sqlite3 notion_cache.db ".schema timeline_events"

# Check computed fields
sqlite3 notion_cache.db "SELECT COUNT(*) FROM timeline_events WHERE act_focus IS NOT NULL;"

# Check sync status
sqlite3 notion_cache.db "SELECT * FROM sync_log ORDER BY created_at DESC LIMIT 5;"
```

## ⚠️ Critical Warnings

### DO NOT:
- ❌ Start new features (we're in debt repayment mode)
- ❌ Skip the verification protocol
- ❌ Ignore acceptance criteria
- ❌ Make changes without updating documentation
- ❌ Assume migrations are working (they're not - that's the current task)

### DO:
- ✅ Follow DEVELOPMENT_PLAYBOOK.md exactly
- ✅ Run tests frequently
- ✅ Document everything
- ✅ Ask for clarification if confused
- ✅ Update QUICK_STATUS.md when completing tasks

## 📊 Progress Context

### Recently Completed (for context):
- P.DEBT.3.7: Sync Route Testing ✅
- P.DEBT.3.6: Compute Service Extraction ✅
- P.DEBT.3.5: Relationship Syncer Implementation ✅

### Current Focus:
- P.DEBT.3.8: Fix Migration System 🚧

### Next Up:
- P.DEBT.3.9: Memory Value Extraction
- P.DEBT.3.10: Fix Puzzle Sync
- P.DEBT.3.11: Complete Test Coverage

## 🎯 Success Metrics

Claude Code session will be successful if:
1. Migration system is fixed and auto-applies
2. All tests continue to pass
3. Documentation is updated to reflect changes
4. No new technical debt is introduced
5. Clear handoff notes are left for next session

## 💡 Pro Tips

1. **Use the 3-tab workflow**:
   - Tab 1: QUICK_STATUS.md
   - Tab 2: DEVELOPMENT_PLAYBOOK.md (scrolled to current task)
   - Tab 3: Your test output

2. **Commit frequently** with descriptive messages:
   ```bash
   git commit -m "fix(migrations): add auto-apply on server start"
   git commit -m "test(migrations): add verification for narrative_threads column"
   ```

3. **When stuck**, check in order:
   - Acceptance criteria in DEVELOPMENT_PLAYBOOK.md
   - TROUBLESHOOTING.md
   - Run `npm run verify:all` for system state

4. **Document as you go**:
   - Add comments explaining why, not what
   - Update docs immediately when finding discrepancies
   - Leave breadcrumbs for the next session

## 🤝 Handoff Protocol

Before ending the Claude Code session:

1. **Update QUICK_STATUS.md** with:
   - What was completed
   - What's in progress
   - Any new blockers
   - Next immediate steps

2. **Run final verification**:
   ```bash
   npm test
   npm run verify:all
   git status  # Ensure all changes committed
   ```

3. **Document session outcomes** in a comment at the bottom of this file

Good luck! The project is well-architected and the path forward is clear. Focus on P.DEBT.3.8 and the migration system will be your primary concern.

---

## Session Outcomes Log

<!-- Add your session summary here before closing -->
