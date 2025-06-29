# Documentation Maintenance Process

## Overview
This document consolidates our documentation maintenance process, ensuring the 4-document system remains accurate and sustainable.

## The 4-Document System

### Core Documents
1. **README.md** - Project status and navigation
2. **DEVELOPMENT_PLAYBOOK.md** - Implementation guide  
3. **CLAUDE.md** - Claude Code workflow optimization
4. **SCHEMA_MAPPING_GUIDE.md** - Data model reference
5. **AUTHORITY_MATRIX.md** - Conflict resolution

### Archive Structure
```
docs/archive/
├── design/          # Game design documents
├── handoff/         # Historical handoff docs
├── reports/         # Review and analysis reports
├── requirements/    # Original PRD
└── tech-debt/       # Technical debt documentation
```

## Automated Maintenance

### Daily Commands
```bash
# Check current documentation status
npm run docs:status-report

# Update docs after completing a task
npm run docs:task-complete <task-id>

# Verify documentation consistency
npm run docs:verify-sync
```

### Automatic Enforcement
1. **Pre-commit Hook** (`.git/hooks/pre-commit`)
   - Two-stage verification process:
     - Stage 1: `npm run docs:verify-sync` - Checks automation markers
     - Stage 2: `npm run docs:verify` - Comprehensive verification
   - Blocks commits if:
     - Documentation claims don't match system state
     - Verification timestamps are older than 7 days
     - Duplicate status claims exist
     - Authority matrix rules are violated
   - Installation: Run `./scripts/setup-hooks.sh` after cloning
   - Bypass: `git commit --no-verify` (use sparingly)

2. **GitHub Actions** (`.github/workflows/documentation-check.yml`)
   - Runs on all PRs to main branches
   - Ensures documentation stays aligned

3. **PR Template** (`.github/pull_request_template.md`)
   - Checkbox for documentation updates
   - Authority hierarchy reminder

## Update Triggers

Per AUTHORITY_MATRIX.md:

| Change Type | Action Required | Tool/Command |
|-------------|----------------|--------------|
| Task Complete | Update status | `npm run docs:task-complete` |
| Code Change | Update patterns | Edit DEVELOPMENT_PLAYBOOK.md |
| Bug Fix | Update known issues | Edit README.md |
| Schema Change | Update mappings | Edit SCHEMA_MAPPING_GUIDE.md |
| Workflow Change | Update guides | Edit CLAUDE.md |

## Health Checks

### Automated (via npm scripts)
- Documentation sync verification
- Template marker consistency
- Link integrity checking
- Health dashboard monitoring (`npm run docs:health`)
- Verification reports (`npm run docs:verify`)

### Manual Reviews
- **Weekly**: README.md status accuracy
- **Per PR**: Documentation impact assessment
- **Monthly**: Authority conflicts check
- **Quarterly**: System effectiveness review

## Review Cycles

### Weekly Automated Reports
**When**: Every Monday morning  
**What**: Run automated health checks and review results
```bash
# Generate comprehensive health report
npm run docs:health

# Check for broken links and stale content
npm run docs:verify

# Review automation coverage
npm run docs:status-report
```

**Action Items**:
- Fix any broken links (priority: high)
- Update stale content (>30 days)
- Review conflict metrics
- Check automation coverage trends

### Monthly Manual Checklist
**When**: First working day of each month  
**Who**: Lead developer or documentation owner

**Checklist**:
- [ ] Review all core documentation for accuracy
  - [ ] README.md reflects current project state
  - [ ] DEVELOPMENT_PLAYBOOK.md matches implementation
  - [ ] SCHEMA_MAPPING_GUIDE.md aligns with database
  - [ ] CLAUDE.md workflow still optimal
  - [ ] AUTHORITY_MATRIX.md conflicts resolved

- [ ] Check cross-references between documents
  - [ ] All internal links functional
  - [ ] No orphaned documentation
  - [ ] Expected cross-references present

- [ ] Verify automation effectiveness
  - [ ] Template markers updating correctly
  - [ ] Pre-commit hooks functioning
  - [ ] GitHub Actions passing

- [ ] Archive obsolete content
  - [ ] Move outdated docs to archive
  - [ ] Update references as needed
  - [ ] Document archival reasons

### Quarterly Assessments
**When**: Start of each quarter (Jan, Apr, Jul, Oct)  
**Purpose**: Strategic review and improvement planning

**Assessment Areas**:
1. **Documentation System Health**
   - Overall health score trend (target: >85%)
   - Automation coverage (target: >80%)
   - Conflict frequency (target: <5/month)
   - Update latency (target: <24 hours)

2. **Process Effectiveness**
   - Are review cycles being followed?
   - Is automation reducing manual work?
   - Are developers finding information quickly?
   - What pain points remain?

3. **Improvement Planning**
   - Identify top 3 documentation pain points
   - Plan automation enhancements
   - Update review processes if needed
   - Set metrics for next quarter

**Deliverables**:
- Quarterly Documentation Health Report
- Improvement roadmap for next quarter
- Updated automation scripts if needed
- Process refinements documented

### Ad-hoc Reviews
**Trigger Events**:
- Major feature releases
- Significant architecture changes
- Team onboarding sessions
- Critical bug discoveries

**Process**:
1. Run full verification suite
2. Update affected documentation
3. Review authority hierarchy
4. Communicate changes to team

## Best Practices

### When Adding Documentation
1. Determine which of the 4 core docs owns the domain
2. Add content to the appropriate document
3. Avoid creating new top-level documents
4. Archive historical content properly

### When Updating Documentation
1. Use automated tools when available
2. Follow the authority hierarchy (code > docs)
3. Update template markers via TaskStatusManager
4. Run verification before committing

### When Archiving Documentation
1. Move to appropriate subfolder in `/docs/archive/`
2. Update any references to the archived document
3. Use `git mv` to preserve history
4. Document reason for archival

## Success Metrics
- Update latency: <24 hours from code change
- Conflict rate: <5 per month
- Automation usage: >80% of updates
- Verification pass rate: >95%

## Troubleshooting

For common issues, see:
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [Developer Quick Start](./DEVELOPER_QUICK_START.md)
- [Claude Code Guide](./CLAUDE_CODE_GUIDE.md)

## Future Improvements
- Enhanced link checking automation
- Automatic archive suggestions
- Documentation coverage metrics
- Integration with issue tracking