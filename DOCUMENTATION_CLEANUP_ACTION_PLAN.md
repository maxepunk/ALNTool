# ALNTool Documentation Cleanup Action Plan

## Executive Summary

This action plan provides step-by-step instructions for transforming 130+ scattered documentation files into a coherent, AI-optimized documentation system. Expected outcomes: 37% file reduction, elimination of conflicts, and establishment of sustainable documentation practices.

## Phase 1: Critical Fixes (Immediate - 2 hours)

### 1.1 Fix Application Loading Issue
```bash
# Fix React Query v5 configuration
cd storyforge/frontend
# Update App.jsx line 47: cacheTime → gcTime
# Remove console.log statements (lines 53, 56, 65)
```

### 1.2 Update CLAUDE.md Status
- Add clarification about Phase 1 status
- Note the React Query fix as completed
- Add warning about Phase 2 assessment conflicts

### 1.3 Create Archive Structure
```bash
mkdir -p .archive/{progress,assessments,planning,legacy}
mkdir -p docs/{architecture,api,guides,components,reference}
mkdir -p .templates
```

## Phase 2: Documentation Consolidation (Day 1 - 4 hours)

### 2.1 Archive Historical Documents
```bash
# Move progress tracking
mv PHASE_2_*.md .archive/progress/
mv phase2-*.md .archive/progress/
mv *_PROGRESS.md .archive/progress/

# Move assessments
mv *_assessment.md .archive/assessments/
mv *_findings.md .archive/assessments/

# Move planning docs
mv *-swarm.yml .archive/planning/
mv TDD_*.md .archive/planning/
```

### 2.2 Consolidate Duplicate Frontend Analysis
```bash
# Keep only the pages/ versions
rm storyforge/frontend/analysis/{character,dashboard,elements,entities,puzzle,timeline}.md
# Keep the pages/ subdirectory versions which have identical content
```

### 2.3 Merge API Documentation
- Combine backend/API.md + backend/docs/api/*.md → docs/api/rest-api.md
- Update with v2 endpoint structure
- Add deprecation notices for v1 endpoints

### 2.4 Consolidate Phase 2 Documentation
- Merge all Phase 2 assessments → docs/architecture/phase-2-status.md
- Include consolidated findings from all specialists
- Resolve conflicting claims with evidence

## Phase 3: Content Organization (Day 2 - 4 hours)

### 3.1 Create Navigation Index
```markdown
# docs/index.md

# ALNTool Documentation

## Quick Links
- [Getting Started](./guides/developer-setup.md)
- [Architecture Overview](./architecture/overview.md)
- [API Reference](./api/rest-api.md)
- [Component Library](./components/journey-intelligence.md)

## Documentation Map
[Visual hierarchy of all documentation]
```

### 3.2 Populate Empty Stubs
- Fill docs/game-designer-guides.md with actual workflow content
- Complete docs/analysis.md or remove if redundant
- Add content to frontend component documentation

### 3.3 Standardize Document Format
Apply template to all active documentation:
```markdown
# [Title]

> **Last Updated**: YYYY-MM-DD
> **Status**: Current | Draft | Deprecated
> **Audience**: Developers | Game Designers | All

## Overview
[Purpose and scope]

## Prerequisites
[Required knowledge or setup]

## Content
[Main documentation content]

## Examples
[Code examples with file references]

## Troubleshooting
[Common issues and solutions]

## Related Documents
- [Related Doc 1](./related-1.md)
- [Related Doc 2](./related-2.md)
```

## Phase 4: AI Optimization (Day 3 - 3 hours)

### 4.1 Add Structured Metadata
For each document, add frontmatter:
```yaml
---
title: "Journey Intelligence Architecture"
category: "architecture"
tags: ["frontend", "reactflow", "visualization"]
dependencies: ["react", "reactflow", "zustand"]
last_updated: "2025-01-07"
code_references:
  - "storyforge/frontend/src/components/JourneyIntelligenceView.jsx"
  - "storyforge/frontend/src/stores/journeyIntelligenceStore.js"
---
```

### 4.2 Create Quick Reference Cards
Build concise reference documents:
- Command cheat sheet
- Common troubleshooting steps
- API endpoint quick reference
- Component prop tables

### 4.3 Implement Cross-References
- Add "See also" sections to related documents
- Create concept glossary
- Build dependency maps

## Phase 5: Validation & Cleanup (Day 4 - 2 hours)

### 5.1 Remove Test Files
```bash
# Remove all test HTML/JS files
rm storyforge/frontend/test-*.{html,js,jsx}
rm storyforge/frontend/debug-*.js
```

### 5.2 Validate Documentation
- Check all internal links work
- Verify code references are accurate
- Ensure no TODO sections remain
- Confirm no conflicting information

### 5.3 Update Version Control
```bash
# Create cleanup commit
git add -A
git commit -m "docs: major documentation reorganization and cleanup

- Reduced documentation files from 130 to ~75
- Established clear hierarchy in /docs
- Archived historical progress tracking
- Fixed React Query v5 configuration
- Removed test/debug files
- Standardized documentation format"
```

## Implementation Tracking

### Priority 1: Immediate (Today)
- [ ] Fix React Query v5 config (cacheTime → gcTime)
- [ ] Remove console.log statements
- [ ] Create archive directories
- [ ] Update CLAUDE.md with accurate status

### Priority 2: Consolidation (Tomorrow)
- [ ] Archive progress/assessment documents
- [ ] Delete duplicate frontend analysis files
- [ ] Merge API documentation
- [ ] Consolidate Phase 2 assessments

### Priority 3: Organization (Day 3)
- [ ] Create docs/index.md navigation
- [ ] Populate empty stub files
- [ ] Standardize document formats
- [ ] Add structured metadata

### Priority 4: Enhancement (Day 4)
- [ ] Add AI-optimized features
- [ ] Create quick reference cards
- [ ] Implement cross-references
- [ ] Validate all documentation

## Success Criteria

1. **File Count**: Reduced from 130 to ~75 markdown files
2. **Organization**: Clear hierarchy with no files in wrong locations
3. **Accuracy**: Zero conflicting information between documents
4. **Completeness**: No empty stub files in active documentation
5. **AI-Ready**: All documents have proper metadata and references
6. **Maintainable**: Clear update process and ownership

## Long-term Maintenance

### Documentation Review Cycle
- **Daily**: Update CLAUDE.md with any critical changes
- **Weekly**: Archive completed work documents
- **Monthly**: Full accuracy review and dead link check
- **Quarterly**: Major reorganization if needed

### Documentation Ownership
- **CLAUDE.md**: Lead developer maintains
- **Architecture**: Technical lead owns
- **API**: Backend team maintains
- **Components**: Frontend team maintains
- **Guides**: Rotate responsibility

---

*This action plan transforms documentation chaos into a sustainable, AI-optimized system that serves both human developers and Claude Code effectively.*