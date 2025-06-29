# Documentation Authority Troubleshooting Guide

## 🔧 Common Issues and Solutions

This guide helps resolve common problems with the documentation authority system.

## 🚨 Pre-Commit Hook Issues

### Problem: "Documentation is out of sync with code!"

**Symptoms:**
```bash
❌ Documentation is out of sync with code!
```

**Solutions:**

1. **If you completed a task:**
   ```bash
   cd storyforge/backend
   npm run docs:task-complete <task-id>
   ```

2. **If automation markers are broken:**
   ```bash
   cd storyforge/backend
   npm run docs:init
   ```

3. **If you just want to check what's wrong:**
   ```bash
   cd storyforge/backend
   npm run docs:verify-sync
   ```

### Problem: "pre-commit: command not found"

**Symptoms:**
```bash
.git/hooks/pre-commit: line 1: command not found
```

**Solution:**
```bash
# Make sure the hook is executable
chmod +x .git/hooks/pre-commit

# If on Windows, check line endings
dos2unix .git/hooks/pre-commit  # or recreate the file
```

### Problem: Pre-commit hook not running

**Solution:**
```bash
# Check if hook exists
ls -la .git/hooks/pre-commit

# If missing, reinstall from team
cp team-scripts/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit
```

## 📄 Documentation Conflicts

### Problem: "Document X says A, but Document Y says B"

**Resolution Process:**

1. **Check tier levels:**
   ```
   Code (Tier 1) > PRD (Tier 2) > README (Tier 3) > etc.
   ```

2. **Higher tier wins:**
   - Trust the higher tier information
   - Update lower tier to match

3. **Verify and commit:**
   ```bash
   npm run docs:verify-sync
   git add <updated-files>
   git commit -m "fix: Resolve documentation conflict between X and Y"
   ```

### Problem: "Can't find information anywhere"

**Search Strategy:**

1. **Check implementation first:**
   ```bash
   # Search in code
   grep -r "feature_name" storyforge/backend/src/
   
   # Check database schema
   sqlite3 storyforge/backend/data/production.db ".schema"
   ```

2. **Check core documentation:**
   - README.md - Current status
   - DEVELOPMENT_PLAYBOOK.md - Implementation details
   - SCHEMA_MAPPING_GUIDE.md - Data structures

3. **Check archives:**
   ```bash
   find docs/archive -name "*.md" | xargs grep -l "search_term"
   ```

## 🤖 Automation Issues

### Problem: "AUTO: markers showing old information"

**Symptoms:**
```markdown
<!-- AUTO:CURRENT_TASK -->OLD_TASK<!-- /AUTO:CURRENT_TASK -->
```

**Solution:**
```bash
# Update to current task
cd storyforge/backend
npm run docs:task-complete NEW_TASK_ID

# Or reinitialize all markers
npm run docs:init
```

### Problem: "npm run docs:verify-sync" fails

**Common Causes:**

1. **Missing QUICK_STATUS.md:**
   ```bash
   # Warning is non-blocking, but to fix:
   touch QUICK_STATUS.md
   npm run docs:init
   ```

2. **Actual sync issues:**
   ```bash
   # See detailed report
   npm run docs:status-report
   ```

## 🔄 CI/CD Pipeline Issues

### Problem: GitHub Actions failing on documentation check

**Debug Steps:**

1. **Run locally first:**
   ```bash
   cd storyforge/backend
   npm run verify:all
   ```

2. **Check for untracked TODOs:**
   ```bash
   # Find TODOs without IDs
   grep -r "TODO\|FIXME" --include="*.md" . | grep -v "id:"
   ```

3. **Ensure all files committed:**
   ```bash
   git status
   git add .
   git commit --amend  # if needed
   ```

## 📝 Update Protocol Issues

### Problem: "Don't know which document to update"

**Quick Decision Guide:**

| Change Type | Update This | Section |
|-------------|------------|---------|
| Task completed | README.md | Current Status |
| Bug fixed | README.md | Known Issues |
| Feature added | DEVELOPMENT_PLAYBOOK.md | Patterns/Examples |
| API changed | DEVELOPMENT_PLAYBOOK.md | API Documentation |
| Schema changed | SCHEMA_MAPPING_GUIDE.md | Field Mappings |
| Workflow improved | CLAUDE.md | Workflow section |

### Problem: "Updates not cascading properly"

**Cascade Checklist:**

1. **Code change made** ✓
2. **Primary doc updated** (based on change type)
3. **Related docs checked** for impacts
4. **Verification run** `npm run docs:verify-sync`
5. **PR template completed** with all checkboxes

## 🐛 Common Anti-Patterns

### Anti-Pattern 1: Updating docs without verifying code

```bash
❌ Edit README.md to say "Feature X complete"
✅ Verify feature works, THEN update README.md
```

### Anti-Pattern 2: Creating duplicate documentation

```bash
❌ Create NEW_FEATURE_GUIDE.md
✅ Add to existing DEVELOPMENT_PLAYBOOK.md
```

### Anti-Pattern 3: Ignoring tier hierarchy

```bash
❌ Trust archived doc over current code
✅ Always verify against Tier 1 (code/database)
```

## 🔍 Diagnostic Commands

### Full System Check
```bash
# Run from project root
cd storyforge/backend

# Check everything
npm run verify:all

# Individual checks
npm run verify:migrations
npm run verify:pre-deploy
npm run docs:verify-sync
```

### Documentation Status
```bash
# Current status report
npm run docs:status-report

# Check specific file
grep "AUTO:" ../README.md
grep "AUTO:" ../DEVELOPMENT_PLAYBOOK.md
```

### Git Hook Status
```bash
# Check hook is active
ls -la .git/hooks/pre-commit

# Test hook manually
bash .git/hooks/pre-commit
```

## 💡 Prevention Tips

1. **Always run verification before committing**
2. **Update docs immediately after code changes**
3. **Use automation commands, don't edit AUTO: tags**
4. **Follow the tier hierarchy religiously**
5. **When in doubt, check the code**

## 🆘 Still Stuck?

1. **Check AUTHORITY_MATRIX.md** for system overview
2. **Review recent commits** for similar changes
3. **Ask team** about edge cases
4. **Document the solution** once found

---

Remember: The system is designed to help, not hinder. If something feels overly complex, it might be a sign to simplify the approach!