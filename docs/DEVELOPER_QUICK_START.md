# Developer Quick Start Guide

## 🚀 Documentation Authority System Overview

Welcome! This guide will help you understand and use our documentation authority system effectively.

### The 30-Second Summary

1. **Code is King**: When docs and code disagree, code wins
2. **4 Core Documents**: Everything you need is in README, DEVELOPMENT_PLAYBOOK, CLAUDE.md, or SCHEMA_MAPPING_GUIDE
3. **Automated Checks**: Pre-commit hooks ensure docs stay in sync
4. **Clear Ownership**: Each document owns specific domains - no confusion

## 📊 The 6-Tier Hierarchy (What Beats What)

```
🥇 Tier 1: Code & Database (Always wins)
🥈 Tier 2: PRD & Notion (Strategic vision)  
🥉 Tier 3: README & PLAYBOOK (Daily work)
📋 Tier 4: Migrations & Tests (Technical specs)
📚 Tier 5: Archives & Git History (Context)
🎯 Tier 6: CLAUDE.md & Guides (Entry points)
```

## 🎯 Common Developer Scenarios

### "Where do I find X?"

| What You Need | Look Here | Why |
|---------------|-----------|-----|
| Current sprint status | README.md | Single source for project state |
| How to implement feature | DEVELOPMENT_PLAYBOOK.md | All patterns & standards |
| Database fields | SCHEMA_MAPPING_GUIDE.md | Field mappings & computed fields |
| Why something exists | Git history or /docs/archive/ | Historical context |

### "I found conflicting information"

1. **Check which tier each source is in** (see hierarchy above)
2. **Higher tier wins** (Code > Docs always)
3. **Update the lower tier** to match reality
4. **Run `npm run docs:verify-sync`** to check consistency

### "I'm making a code change"

**Before committing:**
- ✅ Pre-commit hook runs automatically
- ✅ Checks documentation alignment
- ✅ Blocks commit if docs need updating

**If blocked:**
```bash
# From storyforge/backend:
npm run docs:task-complete <task-id>  # If completing a task
npm run docs:init                     # To reinitialize markers
```

### "I'm reviewing a PR"

Check the PR template boxes:
- [ ] Documentation updated if behavior changed
- [ ] Schema guide updated if fields changed  
- [ ] README updated if status changed
- [ ] No authority conflicts introduced

## 🛠️ Tools at Your Disposal

### Automated Commands

```bash
# Check documentation consistency
npm run docs:verify-sync

# Complete a task and update docs
npm run docs:task-complete P.DEBT.3.10

# Show current documentation status
npm run docs:status-report

# Run all verification checks
npm run verify:all
```

### Manual Updates

Some documents have automation markers:
```markdown
<!-- AUTO:CURRENT_TASK -->P.DEBT.3.10<!-- /AUTO:CURRENT_TASK -->
```
**Don't edit between these tags!** Use the automation commands instead.

## 🚨 Red Flags to Watch For

1. **Documentation says one thing, code does another**
   - Trust the code
   - Update the docs
   - Check related docs for cascade effects

2. **Multiple documents covering the same topic**
   - Check AUTHORITY_MATRIX.md for domain owner
   - Consolidate to single source
   - Archive or remove duplicates

3. **TODO/FIXME without tracking**
   - Add an ID or create a GitHub issue
   - Our CI/CD checks for untracked items

## 📝 Quick Decision Tree

```
Need to know current status?
└─➤ README.md

Need to implement something?
└─➤ DEVELOPMENT_PLAYBOOK.md

Need field/data mappings?
└─➤ SCHEMA_MAPPING_GUIDE.md

Need historical context?
└─➤ /docs/archive/ or git log

Not sure where to look?
└─➤ Check AUTHORITY_MATRIX.md
```

## 🎓 New Developer Checklist

- [ ] Read AUTHORITY_MATRIX.md (understand the system)
- [ ] Skim all 4 core documents (know what's where)
- [ ] Run `npm run docs:verify-sync` (see it in action)
- [ ] Make a small change and commit (experience the pre-commit hook)
- [ ] Review the PR template (understand expectations)

## 💡 Pro Tips

1. **When in doubt, check the code** - It's the ultimate authority
2. **Use the automation** - Don't manually update AUTO: markers
3. **One source per topic** - If you find duplicates, consolidate
4. **Update immediately** - Don't let docs drift from code
5. **Ask if unclear** - Better to clarify than propagate confusion

## 🔗 Related Resources

- **Full Authority Matrix**: [AUTHORITY_MATRIX.md](../AUTHORITY_MATRIX.md)
- **Claude Code Guide**: [CLAUDE_CODE_GUIDE.md](./CLAUDE_CODE_GUIDE.md)
- **Troubleshooting**: [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)

---

Remember: **Good documentation helps you ship faster.** Our system is designed to stay out of your way while ensuring accuracy. Trust the automation, follow the hierarchy, and focus on building great features!