# Feature Consolidation Matrix: Entity-Level Design Decision Support

**Date**: January 7, 2025  
**Status**: UPDATED - Reflects corrected understanding of intelligence layers  
**Purpose**: Map current features to unified journey intelligence system based on entity-level design decision support

**⚠️ CRITICAL UPDATE (Jan 13)**: Our frontend expects `element_type` field but backend provides:
- `type` field from performance API path (?filterGroup=memoryTypes) with computed values
- `basicType` field from fresh Notion path with relational data
See DATA_ARCHITECTURE_GUIDE.md for complete explanation of dual-path architecture.

---

## Executive Summary: Complete UI Transformation

**Previous Thinking**: Migrate features from 18 pages into overlays  
**Corrected Understanding**: Replace database browsing with entity-level design decision support  
**New Goal**: When designer selects any entity, show complete impact analysis across all game dimensions

**No backwards compatibility required** - aggressive transformation enabled.

---

## Entity-Level Intelligence Transformation Matrix

### Character Entity Intelligence
**Current State (CharactersPage.jsx)** - REPLACE ENTIRELY:
- Basic info table (name, type, tier, logline)
- Act Focus column (shows "N/A" - field doesn't exist for characters)
- Sortable columns, search functionality
- Links to individual character detail views

**Transformed Intelligence**:
```javascript
// When character selected in journey view:
{
  selectedEntity: "character_alex_reeves",
  intelligenceLayers: {
    contentGapAnalysis: {
      timelineEvents: 2,        // Has minimal backstory content
      memoryTokens: 1,          // Underrepresented in token economy
      collaborationLoad: 8,     // Highly collaborative character
      storyIntegration: "Gap"   // Needs more narrative development
    },
    socialChoreography: {
      requiredCollaborations: ["Sarah", "Derek", "Marcus"],
      dependencyChain: "Critical", // Many puzzles need Alex's elements
      interactionBalance: "Overloaded", // Too many social requirements
      castingNotes: "Needs confident extrovert"
    },
    economicImpact: {
      memoryTokenValue: 1200,   // Low contribution to token economy
      pathAccessibility: ["Detective", "Black Market"], // Can't access Return path
      choicePressure: "Low"     // Tokens not high-value enough for tension
    },
    productionReality: {
      propsRequired: ["Cease & Desist papers", "Backpack", "Business cards"],
      criticalMissing: ["RFID scanner"], // Blocks revelation scene
      collaborationProps: ["Shared safe combination", "Derek's gym bag"]
    }
  }
}
```

**Design Questions Answered**:
- "Alex has minimal content - what timeline events would develop his backstory?"
- "Alex is overloaded with social requirements - should we redistribute some collaborations?"
- "Alex's memory tokens are low-value - should we increase them for path choice pressure?"

### Element Entity Intelligence
**Current State (ElementsPage.jsx)** - REPLACE ENTIRELY:
- Data table with type (or basicType), owner, container, status
- Search and filter functionality
- Memory parsing display (SF_ fields parsed from Description)
- Basic RFID token information (only in performance path)

**Transformed Intelligence**:
```javascript
// When element selected (e.g., "Victoria's Voice Memo"):
{
  selectedEntity: "element_victoria_voice_memo",
  intelligenceLayers: {
    storyRevelation: {
      timelineEvent: "Victoria records voice memo about Marcus fight",
      narrativeImportance: "High", // Critical for understanding motive
      characterImpact: ["Victoria", "Marcus", "Sarah"], // Who should discover this
      storyCompleteness: 85 // Percentage toward complete narrative
    },
    accessibilityAnalysis: {
      availableToCharacters: ["Derek", "James", "Alex"], // Who can get this token
      puzzleRequirements: ["Open jewelry box", "Solve combination lock"],
      actAvailability: "Act 2", // When it becomes accessible
      socialDependencies: ["Must collaborate with Sarah for jewelry box key"]
    },
    economicImpact: {
      currentValue: 5000, // High-value token
      pathPressure: "Creates tension", // Forces difficult choice decisions
      setBonus: "Victoria Memories", // Part of character memory set
      balanceAnalysis: "May be overvalued - creates unfair Detective path pressure"
    },
    productionStatus: {
      rfidCreated: true,
      physicalProp: "Voice recorder prop",
      containerDependency: "Sarah's jewelry box",
      criticalPath: "Blocks Victoria's complete story if missing"
    }
  }
}
```

**Design Questions Answered**:
- "This memory token is worth $5000 - does that create unfair economic pressure?"
- "Which characters can access Victoria's voice memo, and should that change?"
- "If we move this element to a different puzzle, what social interactions change?"

### Puzzle Entity Intelligence
**Current State (PuzzlesPage.jsx)** - REPLACE ENTIRELY:
- Puzzle list with timing, difficulty, rewards
- All timing shows "Unknown" (data quality issue)
- Reward element associations
- Basic status tracking

**Transformed Intelligence**:
```javascript
// When puzzle selected (e.g., "Sarah's Jewelry Box Combination"):
{
  selectedEntity: "puzzle_sarah_jewelry_box",
  intelligenceLayers: {
    socialChoreographyAnalysis: {
      requiredCollaborators: ["Alex", "Derek"], // Who must work together
      forcedInteractions: ["Alex needs Derek's business card for combination"],
      socialLoad: "Sarah: 3 collaborations, Alex: 8 collaborations", // Balance check
      interactionQuality: "Meaningful" // Creates dramatic tension, not just forced
    },
    rewardImpactAnalysis: {
      memoryTokenRewards: ["Victoria's voice memo", "Paternity test"],
      totalValueRewarded: 7500, // High-value rewards create choice pressure
      downstreamPuzzles: ["Requires tokens for Detective report completion"],
      economicRippleEffect: "Major impact on all three paths"
    },
    accessibilityMapping: {
      characterAccess: ["Sarah (owns box)", "Alex (has business card)", "Derek (has combination)"],
      actBoundary: "Act 1 → Act 2 transition", // When puzzle becomes solvable
      blockers: ["Missing Derek's business card breaks entire chain"],
      alternativeRoutes: "None - critical bottleneck"
    },
    productionRequirements: {
      physicalProps: ["Jewelry box", "Combination lock", "Business cards"],
      criticalDependencies: ["Derek's attendance required"],
      setupComplexity: "Medium", // Multiple moving parts
      failureImpact: "High" // Many character journeys broken if this fails
    }
  }
}
```

**Design Questions Answered**:
- "If I change this puzzle's reward value, how does that affect path balance?"
- "This puzzle requires Alex and Derek - are they already overloaded with social requirements?"
- "What happens if Derek doesn't show up? Which other character journeys break?"

### Timeline Event Entity Intelligence
**Current State (TimelineEventsPage.jsx)** - REPLACE ENTIRELY:
- Event list with dates, descriptions, act focus
- Act focus correctly computed for timeline events
- Character associations shown
- Basic narrative content display

**Transformed Intelligence**:
```javascript
// When timeline event selected (e.g., "Marcus and Victoria's Affair"):
{
  selectedEntity: "timeline_marcus_victoria_affair",
  intelligenceLayers: {
    storyIntegrationAnalysis: {
      revealingElements: ["Victoria's voice memo", "Hotel receipt", "Text messages"],
      discoveringCharacters: ["Sarah", "Derek", "James"], // Who finds evidence
      narrativeCriticality: "High", // Essential for motive understanding
      storyArcCompletion: "Part of Victoria character development arc"
    },
    elementCreationSuggestions: {
      missingEvidence: ["Physical evidence of hotel stays", "Witness testimony"],
      suggestedElements: ["Hotel keycard", "Restaurant receipt", "Uber ride history"],
      integrationOpportunities: ["Could add to Alex's investigation materials"]
    },
    characterImpactMapping: {
      primaryCharacters: ["Marcus", "Victoria"], // Direct participants
      discoveryCharacters: ["Sarah"], // Who should learn about this
      dramaticImpact: "High tension - reveals motive for Sarah's anger",
      castingConsiderations: "Requires actors comfortable with affair storyline"
    },
    contentBalanceAnalysis: {
      currentTokenValue: 8000, // Combined value of revealing tokens
      pathImplication: "High-value content pressures Detective vs Black Market choice",
      storyAccessibility: "Available to multiple paths - good balance",
      narrativeWeight: "Major plot point - appropriately weighted"
    }
  }
}
```

**Design Questions Answered**:
- "This affair storyline needs more evidence - what elements should reveal it?"
- "Which characters should discover Marcus and Victoria's affair for maximum drama?"
- "The affair evidence is worth $8000 total - does that create unfair choice pressure?"

---

## Complete Page Elimination Strategy

### Pages to Eliminate Completely:
1. **CharactersPage.jsx** → Character entity intelligence in journey view
2. **ElementsPage.jsx** → Element entity intelligence in journey view  
3. **PuzzlesPage.jsx** → Puzzle entity intelligence in journey view
4. **TimelineEventsPage.jsx** → Timeline event intelligence in journey view
5. **MemoryEconomyPage.jsx** → Memory economy overlay in journey view
6. **RelationshipMapperPage.jsx** → Social choreography intelligence layer
7. **DashboardPage.jsx** → Summary intelligence in journey view header
8. **All duplicate ReactFlow implementations** → Single enhanced journey graph

### Single Target Interface:
**JourneyIntelligenceView.jsx** - The complete design environment

```javascript
// Single interface structure:
<JourneyIntelligenceView>
  <IntelligenceToggleBar>
    [Element Design] [Timeline Event] [Puzzle Design] [Character Development] [Production Reality]
  </IntelligenceToggleBar>
  
  <UnifiedJourneyGraph>
    // Enhanced ReactFlow with all entity types
    // Click any entity → Intelligence context panel
    // Toggle layers → Overlay analysis visualization
  </UnifiedJourneyGraph>
  
  <EntityIntelligencePanel>
    // Context-sensitive analysis based on selected entity
    // Real-time impact analysis
    // Design decision support
  </EntityIntelligencePanel>
</JourneyIntelligenceView>
```

---

## Intelligence Layer Specifications (Reality-Based)

### 1. Element Design Intelligence
**Trigger**: Designer selects any element  
**Analysis Provided**:
- Timeline event connections via `timeline_event_id` foreign key
- Character accessibility via puzzle dependency analysis
- Memory token economy impact via `calculated_memory_value` and `group_multiplier`
- RFID production status via `rfid_tag` field

### 2. Timeline Event Design Intelligence  
**Trigger**: Designer selects any timeline event  
**Analysis Provided**:
- Revealing elements via reverse `timeline_event_id` lookup
- Character discovery mapping via character-timeline event relationships
- Story integration via `act_focus` computed field
- Narrative content gaps via element coverage analysis

### 3. Puzzle Design Intelligence
**Trigger**: Designer selects any puzzle  
**Analysis Provided**:
- Social choreography via `required_elements` cross-character analysis
- Reward impact via `reward_ids` economic ripple calculation
- Character accessibility via element ownership and container analysis
- Production requirements via physical prop dependency mapping

### 4. Character Development Intelligence
**Trigger**: Designer selects any character  
**Analysis Provided**:
- Content gaps via timeline event count and memory token representation
- Social load via collaboration requirement aggregation
- Economic contribution via owned/associated element value totals
- Production reality via prop dependency and casting requirement analysis

### 5. Production Reality Intelligence
**Trigger**: Production assessment mode  
**Analysis Provided**:
- Complete prop dependency via element-puzzle-character relationship mapping
- Critical path analysis via dependency chain failure impact
- RFID token production via `rfid_tag` creation status
- Social interaction logistics via collaborative puzzle requirements

---

## API Data Sources (Verified Available)

### Character Journey Data:
```sql
-- Available via getCharacterJourneyData(characterId)
SELECT * FROM characters WHERE id = ?
SELECT * FROM timeline_events te JOIN character_timeline_events cte ON te.id = cte.timeline_event_id WHERE cte.character_id = ?
SELECT * FROM puzzles p JOIN character_puzzles cp ON p.id = cp.puzzle_id WHERE cp.character_id = ?
SELECT * FROM elements e JOIN character_owned_elements coe ON e.id = coe.element_id WHERE coe.character_id = ?
```

### Memory Token Economy:
```sql
-- Available via getElementsWithComputedFields() - PERFORMANCE PATH ONLY
-- Accessed via GET /api/elements?filterGroup=memoryTypes
SELECT e.*, e.calculated_memory_value, e.memory_group, e.group_multiplier
FROM elements e WHERE e.memory_type IS NOT NULL
-- Returns 'type' field, not 'basicType'
```

### Story Revelation Mapping:
```sql
-- Available via timeline_event_id relationships
SELECT e.name, te.description, te.act_focus
FROM elements e 
JOIN timeline_events te ON e.timeline_event_id = te.id
```

---

## Success Metrics: Complete Transformation

### Current State (18 Pages):
- "I need to check 6 different pages to understand one element's impact"
- "I don't know if changing this puzzle breaks other character journeys"  
- "I can't see the economic impact of story decisions"

### Target State (1 Interface):
- "I select any entity and immediately see complete impact analysis"
- "I understand ripple effects before making design changes"
- "I can balance story, social, economic, and production dimensions simultaneously"

### Measurable Outcomes:
- **Page Count**: 18 → 1
- **Design Decision Time**: 15 minutes → 2 minutes
- **Context Switching**: Eliminated entirely
- **Impact Understanding**: From guesswork to complete analysis

---

## Implementation Strategy: Aggressive Replacement

### Week 1: Intelligence Foundation
- Build single `JourneyIntelligenceView` component
- Implement all 5 intelligence layers with real data
- Create entity selection → intelligence panel flow

### Week 2: Complete Migration
- Port valuable patterns (search, filter) into intelligence context
- Eliminate all 18 existing pages
- Single route: `/journey-intelligence`

### Week 3: Polish & Optimization
- Performance optimization for large data sets
- Keyboard shortcuts and power user features
- Complete documentation of new workflow

**No gradual migration. Complete transformation.**

---

*"We're not preserving anything. We're building the tool the designers actually need."*