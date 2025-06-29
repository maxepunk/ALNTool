# Filesystem Cleanup Plan - June 2025

> **Purpose**: Comprehensive plan to clean up the ALNTool filesystem, consolidate documentation, and prepare for implementation of critical fixes.

## 📊 Current State Analysis

### Filesystem Overview
- **Root Directory**: 16 markdown files (needs reduction to ~10)
- **Empty Directories**: 11 empty folders across the project
- **Archived Content**: Significant duplication in docs/archive/
- **Temporary Files**: 3 log files, 2 test databases
- **Documentation Spread**: ~40+ markdown files across various locations

### Key Issues Identified
1. **Documentation Sprawl**: Same information in multiple files
2. **Outdated Content**: Handoff notes, old assessments still in root
3. **Empty Directories**: Leftover from restructuring
4. **Inconsistent Organization**: Mix of current/archived content
5. **No Clear Hierarchy**: Important docs mixed with temporary ones

## 🎯 Cleanup Objectives

1. **Reduce Root Clutter**: From 16 to ~10 essential files
2. **Clear Archive Strategy**: Move outdated content systematically
3. **Remove Empty Directories**: Clean up filesystem
4. **Consolidate Related Docs**: Merge overlapping content
5. **Establish Clear Hierarchy**: Core → Reference → Archive

## 📋 Detailed Cleanup Actions

### Phase 1: Archive Outdated Content (10 minutes)

**Move to `docs/archive/sessions/`**:
```bash
mkdir -p docs/archive/sessions
mv SESSION_HANDOFF_20250612.md docs/archive/sessions/
mv FINAL_MILE_READINESS_ASSESSMENT.md docs/archive/sessions/
mv PATH_FORWARD_RECOMMENDATION.md docs/archive/sessions/
mv CLAUDE_UNIFICATION_REPORT.md docs/archive/sessions/
mv MCP_DIAGNOSTIC_REPORT.md docs/archive/sessions/
```

### Phase 2: Consolidate Documentation (20 minutes)

**1. Merge MCP Documentation**:
Create single `MCP_GUIDE.md` combining:
- MCP_USER_GUIDE.md (usage)
- MCP_SERVER_CONFIGURATION_GUIDE.md (setup)
- MCP_DIAGNOSTIC_REPORT.md (troubleshooting)

**2. Remove Redundant Files**:
- Delete `test-hook-file.md` (test artifact)
- Archive game design docs if already in archive

### Phase 3: Remove Empty Directories (5 minutes)

```bash
# Remove all empty directories
find . -type d -empty -not -path "./.git/*" -not -path "./node_modules/*" -delete
```

### Phase 4: Clean Temporary Files (5 minutes)

```bash
# Remove log files (they'll be recreated)
rm storyforge/frontend/frontend.log
rm storyforge/frontend/frontend-startup.log
rm storyforge/backend/backend.log

# Keep test databases (needed for tests)
```

### Phase 5: Reorganize Documentation Structure (15 minutes)

**Final Root Structure** (10 files):
```
ALNTool/
├── README.md                    # Project overview & status
├── CLAUDE.md                    # Claude Code instructions
├── DEVELOPMENT_PLAYBOOK.md      # Implementation guide
├── SCHEMA_MAPPING_GUIDE.md      # Data model reference
├── AUTHORITY_MATRIX.md          # Conflict resolution
├── CODE_AUDIT_2025.md          # Comprehensive audit & fixes
├── MCP_GUIDE.md                # Consolidated MCP documentation
├── WSL2_DEV_BEST_PRACTICES.md  # WSL2 development guide
├── WSL_RECOVERY_PLAN.md        # WSL2 recovery procedures
└── .gitignore
```

**Documentation Hierarchy**:
```
docs/
├── Core/                        # Backup of core docs
├── Reference/                   # Technical references
├── Guides/                      # How-to guides
│   ├── DEVELOPER_QUICK_START.md
│   ├── CLAUDE_CODE_GUIDE.md
│   └── TROUBLESHOOTING_GUIDE.md
└── archive/                     # Historical documents
    ├── sessions/                # Session handoffs
    ├── assessments/             # Old audits
    └── design/                  # Game design docs
```

## 🔄 Documentation Update Plan

### 1. Update README.md
- Remove references to deleted files
- Update project structure section
- Clarify current sprint status
- Add quick links to key documents

### 2. Update DEVELOPMENT_PLAYBOOK.md
- Remove references to archived documents
- Update file paths
- Add section for "Final Mile" fixes
- Update troubleshooting references

### 3. Update CLAUDE.md
- Remove references to deleted files
- Simplify documentation section
- Update MCP tool references

### 4. Create MCP_GUIDE.md
- Configuration section
- Usage examples
- Troubleshooting guide
- Best practices

## 🚀 Implementation Steps

### Step 1: Create Backup (2 minutes)
```bash
tar -czf docs_backup_$(date +%Y%m%d).tar.gz *.md docs/
```

### Step 2: Execute Cleanup (10 minutes)
Run cleanup commands in phases as listed above

### Step 3: Update Documentation (20 minutes)
Update core files with new references

### Step 4: Verify & Commit (5 minutes)
```bash
git add -A
git commit -m "chore: filesystem cleanup and documentation consolidation

- Archived outdated session files
- Consolidated MCP documentation
- Removed empty directories
- Updated core documentation references
- Reduced root files from 16 to 10"
```

## ✅ Success Criteria

After cleanup:
- [ ] Root directory has ≤10 markdown files
- [ ] No empty directories (except intentional ones)
- [ ] All MCP docs consolidated into one guide
- [ ] Outdated content moved to archive
- [ ] Core docs updated with correct references
- [ ] Clean git status (all changes committed)

## 🎯 Next Steps After Cleanup

1. Implement critical fixes from CODE_AUDIT_2025.md
2. Update test coverage
3. Fix character links schema
4. Expose hidden UI features
5. Integrate MemoryValueExtractor

## Time Estimate

**Total Time**: ~45 minutes
- Backup: 2 minutes
- Archive files: 10 minutes
- Consolidate docs: 20 minutes
- Remove directories: 5 minutes
- Update references: 5 minutes
- Verify & commit: 3 minutes

This cleanup will create a much cleaner, more maintainable project structure that makes it easier to focus on implementing the critical fixes identified in the code audit.