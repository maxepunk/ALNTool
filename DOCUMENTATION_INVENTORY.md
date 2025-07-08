# ALNTool Documentation Inventory & Categorization

> **Created**: 2025-01-07  
> **Purpose**: Master inventory of all documentation with proposed reorganization  
> **Total Files**: 130+ markdown files

## Documentation Categories & Proposed Locations

### 1. Primary Documentation Hub
**Current Location**: Root directory  
**Proposed Location**: Keep at root  
**Action**: Update and maintain

| File | Size | Purpose | Action |
|------|------|---------|--------|
| CLAUDE.md | 15KB | AI agent instructions | Keep as primary hub |
| README.md | 236B | Points to CLAUDE.md | Expand for humans |
| PRODUCT_REQUIREMENTS_DOCUMENT.md | 17KB | Product spec | Move to docs/reference/ |

### 2. Architecture Documentation
**Current**: Scattered across root and /docs  
**Proposed**: Consolidate in docs/architecture/  
**Action**: Merge related files

| File | Current Location | Proposed Location | Action |
|------|------------------|-------------------|--------|
| ARCHITECTURE_DEEP_DIVE.md | Root | docs/architecture/deep-dive.md | Move |
| ARCHITECTURE_QUICK_REFERENCE.md | Root | docs/architecture/quick-reference.md | Move |
| JOURNEY_INTELLIGENCE_DEPENDENCIES.md | Root | docs/architecture/dependencies.md | Move |
| STATE_MANAGEMENT.md | frontend/architecture/ | docs/architecture/state-management.md | Move |
| VISUAL_DESIGN_SYSTEM.md | frontend/design/ | docs/architecture/visual-design.md | Move |

### 3. Progress & Assessment Documents
**Current**: Root directory  
**Proposed**: .archive/progress/  
**Action**: Archive all

| File Pattern | Count | Purpose | Action |
|--------------|-------|---------|--------|
| PHASE_2_*.md | 5 | Phase 2 planning | Archive |
| phase2-*.md | 2 | Initial findings | Archive |
| *_assessment.md | 4 | Specialist assessments | Archive |
| *_PROGRESS.md | 3 | Progress tracking | Archive |
| TDD_*.md | 2 | Test planning | Archive to .archive/planning/ |

### 4. API Documentation
**Current**: Multiple locations  
**Proposed**: docs/api/  
**Action**: Consolidate into single source

| File | Location | Content | Action |
|------|----------|---------|--------|
| API.md | backend/ | Main API docs | Move to docs/api/rest-api.md |
| api-v2-structure.md | backend/docs/api/ | V2 endpoints | Merge into rest-api.md |
| migration-guide.md | backend/docs/api/ | V1→V2 guide | Keep in docs/api/ |
| endpoint-analysis.md | backend/docs/api/ | Endpoint audit | Archive |

### 5. Frontend Component Documentation
**Current**: Scattered in frontend/  
**Proposed**: docs/components/  
**Action**: Organize by component

| Component | Files | Action |
|-----------|-------|--------|
| Journey Intelligence | 11 analysis files | Consolidate to single guide |
| Graph Visualization | 5 edge/node docs | Merge into graph-component.md |
| Pattern Library | 2 duplicate files | Keep one, archive other |

### 6. Empty Stub Files
**Current**: Various locations  
**Proposed**: Complete or remove  
**Action**: Fill with content or delete

| File | Size | Location | Action |
|------|------|----------|--------|
| game-designer-guides.md | 640B | docs/ | Fill with actual content |
| analysis.md | 574B | docs/ | Delete (redundant) |
| user-guide.md | <1KB | frontend/docs/ | Fill or remove |

### 7. Test & Debug Files
**Current**: frontend/  
**Proposed**: Remove from repository  
**Action**: Delete all

| Pattern | Count | Purpose | Action |
|---------|-------|---------|--------|
| test-*.html | 8 | Debug testing | Delete |
| test-*.js | 6 | Test scripts | Delete |
| debug-*.js | 1 | Debug script | Delete |

### 8. Specialist Analysis Files
**Current**: frontend/analysis/  
**Proposed**: Consolidate duplicates  
**Action**: Keep pages/ versions, delete root duplicates

| Duplicate Set | Files | Action |
|---------------|-------|--------|
| Character analysis | 2 versions | Delete root, keep pages/ |
| Dashboard analysis | 2 versions | Delete root, keep pages/ |
| Elements analysis | 2 versions | Delete root, keep pages/ |
| Entities analysis | 2 versions | Delete root, keep pages/ |
| Puzzle analysis | 2 versions | Delete root, keep pages/ |
| Timeline analysis | 2 versions | Delete root, keep pages/ |

### 9. Configuration Files
**Current**: Root  
**Proposed**: Archive  
**Action**: Move to .archive/planning/

| File | Purpose | Action |
|------|---------|--------|
| *-swarm.yml | 4 swarm configs | Archive |

### 10. Investigation & Data Analysis
**Current**: backend/docs/data-investigation/  
**Proposed**: Keep for reference  
**Action**: Organize chronologically

| Files | Purpose | Action |
|-------|---------|--------|
| 6 investigation files | Debug sessions | Keep as reference |

## Proposed Final Structure

```
ALNTool/
├── CLAUDE.md                    # Primary AI agent hub
├── README.md                    # Expanded human guide
├── docs/
│   ├── index.md                # Documentation navigation
│   ├── architecture/
│   │   ├── overview.md         # System overview
│   │   ├── deep-dive.md        # Detailed architecture
│   │   ├── quick-reference.md  # Architecture quick ref
│   │   ├── dependencies.md     # Component dependencies
│   │   ├── state-management.md # State architecture
│   │   └── visual-design.md    # Design system
│   ├── api/
│   │   ├── rest-api.md        # Consolidated API docs
│   │   └── migration-guide.md  # V1→V2 migration
│   ├── guides/
│   │   ├── developer-setup.md  # Getting started
│   │   ├── game-designer.md    # Designer workflows
│   │   └── troubleshooting.md  # Common issues
│   ├── components/
│   │   ├── journey-intelligence.md
│   │   ├── graph-visualization.md
│   │   └── pattern-library.md
│   └── reference/
│       ├── product-requirements.md
│       ├── entity-types.md
│       └── game-concepts.md
└── .archive/
    ├── progress/      # All Phase 1/2 tracking
    ├── assessments/   # Specialist reviews
    ├── planning/      # TDD plans, swarm configs
    └── legacy/        # Superseded documentation
```

## Implementation Priority

### High Priority (Immediate)
1. Create directory structure ✓
2. Archive progress/assessment documents
3. Consolidate duplicate frontend analysis
4. Remove test/debug files

### Medium Priority (This Week)
1. Merge API documentation
2. Organize architecture docs
3. Create navigation index
4. Fill empty stubs

### Low Priority (As Needed)
1. Archive legacy documentation
2. Create templates
3. Add metadata to all docs

## Expected Outcomes

- **File Reduction**: 130 → ~75 files (42% reduction)
- **Clear Navigation**: Single docs/index.md entry point
- **No Duplicates**: Each topic covered once
- **Archive Preserved**: Historical docs retained
- **AI-Optimized**: Clear structure for Claude Code

---

*This inventory provides the roadmap for transforming documentation chaos into organized knowledge.*