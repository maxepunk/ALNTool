# ALNTool Documentation Architecture Plan

## Executive Summary

This plan establishes a unified documentation architecture for ALNTool, resolving the current chaos of 130+ scattered files into a coherent system optimized for AI-assisted development workflows.

## Current State Analysis

### Problems Identified
- **130 markdown files** scattered across the codebase
- **Conflicting status claims** (Phase 1 marked complete vs. app broken)
- **Multiple documentation strategies** attempted but not completed
- **30+ duplicate analysis files** from various assessment phases
- **Empty stub files** diluting documentation quality
- **No clear hierarchy** or navigation structure
- **Temporal confusion** mixing current state with historical progress

### Root Causes
1. Multiple documentation efforts without central coordination
2. Automated swarm-based documentation generation creating proliferation
3. No established standards for file naming, location, or structure
4. Progress tracking mixed with permanent documentation
5. No clear ownership or maintenance process

## Proposed Architecture

### Primary Documentation Hub: CLAUDE.md

CLAUDE.md will remain the single source of truth for Claude Code interactions, containing:
- Quick start commands
- Current project state
- Development workflow guidance
- Essential troubleshooting
- Links to detailed documentation

### Documentation Hierarchy

```
ALNTool/
├── CLAUDE.md                      # Primary hub for AI agents
├── README.md                      # Human-friendly project overview
├── CHANGELOG.md                   # Version history and updates
├── docs/                          # All detailed documentation
│   ├── index.md                   # Documentation map/navigation
│   ├── architecture/              # System design & technical details
│   │   ├── overview.md
│   │   ├── frontend-architecture.md
│   │   ├── backend-architecture.md
│   │   ├── data-flow.md
│   │   └── decision-log.md
│   ├── api/                       # API documentation
│   │   ├── rest-api.md
│   │   ├── websocket-api.md
│   │   └── data-schemas.md
│   ├── guides/                    # How-to guides
│   │   ├── developer-setup.md
│   │   ├── game-designer-guide.md
│   │   ├── testing-guide.md
│   │   └── deployment-guide.md
│   ├── components/                # Component documentation
│   │   ├── journey-intelligence.md
│   │   ├── graph-visualization.md
│   │   └── intelligence-layers.md
│   └── reference/                 # Reference materials
│       ├── game-concepts.md
│       ├── entity-types.md
│       └── business-logic.md
├── .archive/                      # Historical documents
│   ├── progress/                  # Phase 1/2 progress tracking
│   ├── assessments/               # Various audit reports
│   └── planning/                  # Historical planning docs
└── .templates/                    # Documentation templates
    ├── component-doc.md
    ├── api-endpoint.md
    └── architecture-decision.md
```

### Documentation Categories

#### 1. **Operational Documentation** (Active Use)
- Setup and installation guides
- API references with examples
- Component documentation with props/methods
- Testing procedures
- Deployment processes

#### 2. **Architectural Documentation** (Reference)
- System design decisions
- Data flow diagrams
- Technology choices and rationale
- Integration patterns

#### 3. **Domain Documentation** (Context)
- Game design concepts
- Business logic explanations
- Entity relationships
- User workflows

#### 4. **Historical Documentation** (Archive)
- Progress reports
- Assessment findings
- Planning documents
- Superseded designs

## Implementation Strategy

### Phase 1: Immediate Actions (Day 1)

1. **Fix Critical Issues**
   - Update CLAUDE.md with accurate Phase 1 status
   - Fix React Query v5 configuration issue
   - Remove console.log statements

2. **Create Documentation Index**
   - Build docs/index.md as navigation hub
   - Map all existing documentation to new categories
   - Identify duplicates for consolidation

3. **Archive Historical Documents**
   - Move all progress tracking to .archive/progress/
   - Move assessment reports to .archive/assessments/
   - Preserve git history for reference

### Phase 2: Consolidation (Days 2-3)

1. **Merge Duplicate Content**
   - Combine 30+ analysis files into coherent guides
   - Merge multiple architecture documents
   - Consolidate API documentation

2. **Complete Stub Files**
   - Fill in game-designer-guides.md with actual content
   - Complete analysis.md or remove if redundant
   - Populate component documentation

3. **Standardize Formats**
   - Apply consistent headers and sections
   - Add navigation breadcrumbs
   - Include update timestamps

### Phase 3: Enhancement (Days 4-5)

1. **AI-Optimized Features**
   - Add structured metadata for easier parsing
   - Include code location references (file:line format)
   - Add example snippets for common tasks

2. **Cross-Referencing**
   - Link related documents
   - Create concept glossary
   - Build command quick reference

3. **Validation System**
   - Automated checks for documentation accuracy
   - Link validation
   - Code snippet testing

## Documentation Standards

### File Naming
- Use kebab-case: `journey-intelligence-guide.md`
- Descriptive names over abbreviations
- Include doc type suffix: `-guide`, `-reference`, `-api`

### Document Structure
```markdown
# Document Title

> **Last Updated**: 2025-01-07
> **Status**: Current | Draft | Deprecated
> **Audience**: Developers | Game Designers | All

## Overview
Brief description of document purpose

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

## Content Sections
...

## Related Documents
- [Link to related doc](./related-doc.md)

## Change Log
- 2025-01-07: Initial creation
```

### Code References
Always use the format `path/to/file.js:123` for code locations to enable easy navigation.

### Update Process
1. Update content in appropriate document
2. Update last modified date
3. Update CHANGELOG.md for significant changes
4. Verify links still work
5. Run documentation validation

## Success Metrics

1. **Discoverability**: Any documentation found within 30 seconds
2. **Accuracy**: Zero conflicting information between documents
3. **Completeness**: No "TODO" or empty sections in active docs
4. **Maintainability**: Clear ownership and update process
5. **AI-Compatibility**: Claude Code can navigate and reference efficiently

## Maintenance Plan

### Weekly
- Review and update CLAUDE.md with latest changes
- Archive completed progress documents
- Validate critical path documentation

### Monthly
- Full documentation accuracy review
- Remove obsolete content
- Update architecture diagrams

### Quarterly
- Documentation user survey
- Major reorganization if needed
- Technology stack updates

## Migration Checklist

- [ ] Archive all progress tracking documents
- [ ] Consolidate duplicate documentation
- [ ] Update CLAUDE.md with accurate status
- [ ] Create docs/index.md navigation
- [ ] Populate empty stub files
- [ ] Standardize all document formats
- [ ] Add AI-optimized metadata
- [ ] Implement validation system
- [ ] Update README.md for humans
- [ ] Remove all test/debug files from repo

---

*This architecture plan establishes a sustainable documentation system that serves both human developers and AI agents effectively.*