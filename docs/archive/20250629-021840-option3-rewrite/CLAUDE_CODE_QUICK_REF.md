# 🎯 Claude Code Quick Reference

## Current Task: P.DEBT.3.8 - Fix Migration System

### Essential Commands
```bash
# Always start with:
cd storyforge/backend && npm run verify:all

# Development:
npm run dev              # Backend (port 3001)
npm test                 # Run all tests
npm test -- --watch      # Test watch mode

# Debugging:
SYNC_DEBUG=true node scripts/sync-data.js
sqlite3 notion_cache.db  # Database inspection
```

### File Locations
```
📁 Migrations: storyforge/backend/src/db/migrations/
📁 Migration Runner: storyforge/backend/src/db/migrationRunner.js
📁 Compute Services: storyforge/backend/src/services/compute/
📁 Sync Services: storyforge/backend/src/services/sync/
```

### Task Checklist
- [ ] Read QUICK_STATUS.md
- [ ] Read task P.DEBT.3.8 in DEVELOPMENT_PLAYBOOK.md
- [ ] Run `npm run verify:all`
- [ ] Fix migration auto-apply
- [ ] Verify narrative_threads column
- [ ] Update tests
- [ ] Update documentation
- [ ] Run final verification

### Known Issues
- ⚠️ 17/32 puzzles failing sync (not blocking)
- ⚠️ 4 characters with no links (expected)
- ⚠️ 42 timeline_events missing act_focus (to fix later)

### When Stuck
1. Check DEVELOPMENT_PLAYBOOK.md acceptance criteria
2. Run `npm run verify:all` for current state
3. Check TROUBLESHOOTING.md
4. Review SCHEMA_MAPPING_GUIDE.md for field mappings

### Git Workflow
```bash
git status
git add -A
git commit -m "fix(migrations): [specific change]"
git push origin feature/production-intelligence-tool
```

### Remember
- 📚 Documentation first
- 🧪 Test everything
- 🚫 No new features (debt repayment only)
- ✅ Meet ALL acceptance criteria
