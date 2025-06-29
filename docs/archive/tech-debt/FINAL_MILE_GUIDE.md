# Final Mile Development Guide

## Overview
This tool has sophisticated features built but inaccessible due to:
1. Data pipeline gaps (mostly fixed, some integration remaining)
2. Frontend design failures

Your job is to connect them to users by fixing these specific issues.

## Critical Context
- The tool was built by people who deeply understood "About Last Night" game design
- Features like 60/40 pacing analysis already exist in code
- Documentation claims "Phase 1" but implementation is Phase 4+
- Users can't find or access the sophisticated features
- **IMPORTANT**: Major architectural fixes were completed June 7-9, 2025:
  - SQLite is now the single source of truth (not Notion)
  - Graph service refactor eliminated dual data pipeline issue
  - Two-phase sync architecture prevents foreign key issues

## Specific Fixes Required

### Data Pipeline Fixes

#### 1. ~~Character Relationships~~ ✅ ALREADY FIXED
- RelationshipSyncer correctly uses `character_a_id` and `character_b_id`
- Character links are computed with weighted scoring
- Graph service provides relationships from SQLite
- **NO ACTION NEEDED**

#### 2. ~~Puzzle Sync~~ ✅ ALREADY WORKING
- All 32 puzzles sync successfully
- Two-phase sync architecture handles foreign keys correctly
- 17 puzzles have NULL owners (Notion data issue, not sync failure)
- **NO ACTION NEEDED**

#### 3. Memory Value Extraction (Enables economy tracking) 🔴 REAL ISSUE
The MemoryValueExtractor exists but isn't integrated into the compute pipeline:

```javascript
// In ComputeOrchestrator.js constructor, add:
const MemoryValueExtractor = require('./MemoryValueExtractor');
this.memoryValueExtractor = new MemoryValueExtractor(db);

// In computeAll() method, after narrative threads:
console.log('🧮 Computing memory values...');
const memoryStats = await this.memoryValueExtractor.extractAndStoreMemoryValues();
stats.processed += memoryStats.processed;
stats.errors += memoryStats.errors;
stats.details.memoryValues = memoryStats;
```

Also fix parsing issues - rfid_tag and memory_type fields not populating from descriptions.

#### 4. Act Focus Computation
- 42 timeline_events missing act_focus
- ActFocusComputer exists but may not be running for all events
- Verify it processes events without related elements

### Frontend Design Fixes

#### 5. Surface Hidden Features in Navigation
```javascript
// File: src/layouts/AppLayout.jsx
// Add prominent section:
{
  title: "Production Intelligence",
  icon: <AssessmentIcon />,
  items: [
    { name: "Experience Flow Analysis", path: "/player-journey", 
      description: "Pacing & bottleneck detection" },
    { name: "Memory Economy Workshop", path: "/memory-economy",
      description: "Token tracking & balance" },
    { name: "Character Sociogram", path: "/character-sociogram",
      description: "Relationship visualization" }
  ]
}
```

#### 6. Default to Production Mode
```javascript
// File: src/pages/MemoryEconomyPage.jsx, Line 66
const [workshopMode, setWorkshopMode] = useState(true); // was false
```

#### 7. Add Discovery Mechanisms
- Add info tooltips explaining advanced features
- Create "Production Mode" toggle in header
- Add onboarding flow highlighting analysis tools
- Include feature cards on dashboard

#### 8. Improve Analysis Visibility
```javascript
// In JourneyGraphView.jsx
// Change analysis mode to be more discoverable:
// - Larger toggle with explanation
// - Default to ON for game designers
// - Add "New!" badge to draw attention
```

## Features That Already Exist (DO NOT REBUILD)

### ExperienceFlowAnalyzer (Hidden in JourneyGraphView)
- Pacing analysis (60% discovery, 40% action)
- Bottleneck detection with visual highlights
- Memory token flow tracking
- Act transition analysis
- Production quality scoring

### MemoryEconomyWorkshop (Hidden behind toggle)
- 55-token economy tracking
- Resolution path distribution charts
- Production pipeline (Design → Build → Ready)
- Balance recommendations engine
- Economic health scoring

### DualLensLayout (Implemented but underutilized)
- Side-by-side journey and system views
- Context-aware workspace
- Command bar for quick actions

## How to Verify Success

**Data Pipeline:**
1. ✅ Character sociogram shows relationships (ALREADY WORKING)
2. ✅ Puzzle flow visualizes all dependencies (ALREADY WORKING)
3. 🔴 Memory values populate in economy view (NEEDS INTEGRATION)
4. 🔴 Timeline events show act assignments (42 MISSING)

**Frontend Design:**
1. Production Intelligence prominent in navigation
2. Workshop mode shows by default
3. Analysis features have clear CTAs
4. New users can discover advanced features
5. Tooltips explain sophisticated capabilities

## Summary of Real vs False Issues

### False Issues (Already Fixed)
- ❌ Character relationship mapping (never existed)
- ❌ Puzzle sync failures (all 32 sync successfully)
- ❌ Element field mappings (all fields present in DB)
- ❌ Dual data pipeline (fixed by graph service refactor)

### Real Issues Remaining
- ✅ MemoryValueExtractor not integrated into ComputeOrchestrator
- ✅ Memory field parsing incomplete (rfid_tag, memory_type)
- ✅ 42 timeline events missing act_focus
- ✅ Frontend features hidden from users

## Post-1.0 Roadmap (Found in DEVELOPMENT_PLAYBOOK)

After completing the Final Mile, Phase 3 features are planned:
- **P3.M1: Balance Dashboard** - Leverages resolution paths
- **P3.M2: Interaction Matrix** - Uses character links
- **P3.M3: Timeline Archaeology** - Needs narrative threads

These all depend on the sophisticated features being accessible first.