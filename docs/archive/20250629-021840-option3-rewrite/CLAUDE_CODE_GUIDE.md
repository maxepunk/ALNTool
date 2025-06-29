# Claude Code Session Guide

## 🤖 Using the Documentation Authority System

This guide helps Claude Code sessions navigate our documentation hierarchy and maintain consistency.

## 🎯 Quick Start for Claude

### Your First Actions in Any Session

1. **Read CLAUDE.md** - Contains your onboarding protocol
2. **Check README.md** - Current project status and priorities  
3. **Verify with code** - Trust implementation over documentation

### The Authority Hierarchy

```
When you find conflicting information:
1. Code/Database (Tier 1) → ALWAYS trust this
2. Higher tier beats lower tier
3. Update lower tier to match higher tier
4. Note the correction in your response
```

## 📋 Critical Patterns for Claude

### Pattern 1: "Documentation Verification First"

```python
# Before accepting any documented claim:
1. Check if code implements it (Tier 1)
2. Verify database schema matches (Tier 1)  
3. Only then trust documentation
```

### Pattern 2: "Single Source of Truth"

```yaml
Current Status: README.md ONLY
Implementation: DEVELOPMENT_PLAYBOOK.md ONLY
Schema/Fields: SCHEMA_MAPPING_GUIDE.md ONLY
Claude Workflow: CLAUDE.md ONLY
```

### Pattern 3: "Update Cascade"

```
If code changes:
  → Update README (status)
  → Update PLAYBOOK (patterns)
  → Update SCHEMA guide (if fields change)
  → Run docs:verify-sync
```

## 🔍 Common Claude Scenarios

### Scenario: "User asks about feature status"

```markdown
1. Check README.md current status section
2. Verify by looking at actual code
3. If mismatch: trust code, update README
4. Tell user the verified status
```

### Scenario: "User wants to implement new feature"

```markdown
1. Check DEVELOPMENT_PLAYBOOK.md for patterns
2. Look at similar existing code
3. Follow established patterns
4. Update docs after implementation
```

### Scenario: "Docs conflict with each other"

```markdown
1. Identify tier of each document
2. Higher tier is correct
3. Update lower tier document
4. Run: npm run docs:verify-sync
5. Mention the fix to user
```

### Scenario: "Can't find information"

```markdown
1. Check code first (most reliable)
2. Search all core docs
3. Check /docs/archive/ for historical
4. Ask user if still not found
```

## 🛠️ Claude-Specific Commands

### Verification Commands
```bash
# Always available from storyforge/backend/
npm run docs:verify-sync      # Check consistency
npm run verify:all            # Complete verification
npm run docs:status-report    # Current status
```

### When Making Changes
```bash
# After completing user's task:
npm run docs:task-complete <task-id>

# If docs are out of sync:
npm run docs:init
```

## 📝 Documentation Update Checklist

When you modify code, check:

- [ ] **Behavior changed?** → Update README status
- [ ] **New pattern?** → Add to DEVELOPMENT_PLAYBOOK  
- [ ] **Schema changed?** → Update SCHEMA_MAPPING_GUIDE
- [ ] **Workflow improved?** → Update CLAUDE.md
- [ ] **Bug fixed?** → Update known issues in README

## 🚨 Red Flags for Claude Sessions

### 1. Documentation Making Technical Claims
```
❌ "The sync algorithm uses a three-phase approach"
✅ Check: storyforge/backend/src/services/sync/
```

### 2. Status Claims in Old Documents
```
❌ "Phase 1 implementation" (in archived doc)
✅ Check: README.md current status section
```

### 3. Conflicting Field Names
```
❌ Docs show different field names
✅ Check: production.db actual schema
```

## 💡 Best Practices for Claude

1. **Verify First, Document Second**
   - Always check code before trusting docs
   - Update docs immediately when wrong

2. **Use Explicit Paths**
   - Give users exact file locations
   - Include line numbers when helpful
   - Example: `src/services/sync/SyncOrchestrator.js:45`

3. **Batch Documentation Updates**
   - Make all code changes first
   - Then update all affected docs
   - Run verification once at the end

4. **Flag Uncertainties**
   - If docs conflict, tell the user
   - Show your verification process
   - Explain which source you trusted

## 🔄 Session Handoff Notes

When context window fills, note:

1. **Current task status** (which subtask you're on)
2. **Documentation updates made** (what you changed)
3. **Pending documentation updates** (what still needs updating)
4. **Verification status** (did you run docs:verify-sync?)

## 📊 Quick Reference Card

```
What to read first?
├── CLAUDE.md (your workflow)
├── README.md (current status)
└── Task at hand in PLAYBOOK

Where to check facts?
├── Code (always truth)
├── Database (actual schema)
└── Tests (expected behavior)

What to update?
├── Behavior → README
├── Patterns → PLAYBOOK
├── Schema → SCHEMA_MAPPING
└── Workflow → CLAUDE.md

How to verify?
└── npm run docs:verify-sync
```

## 🎓 Key Principles for Claude

1. **"Implementation is truth, documentation is a map"**
2. **"When in doubt, check it out (in code)"**
3. **"Update immediately, verify constantly"**
4. **"One source per domain, no duplicates"**

## 🔗 Essential Resources

- **Your main guide**: [CLAUDE.md](../CLAUDE.md)
- **Authority system**: [AUTHORITY_MATRIX.md](../AUTHORITY_MATRIX.md)
- **Current implementation**: `/storyforge/backend/src/`
- **Database truth**: `/storyforge/backend/data/production.db`

---

Remember: You're here to help users build features efficiently. The documentation system should enable that, not slow it down. When docs are wrong, fix them and move on. Focus on delivering value!