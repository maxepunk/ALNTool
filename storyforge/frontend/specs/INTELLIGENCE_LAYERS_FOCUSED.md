# Intelligence Layers: Reality-Based Specifications

**Date**: January 9, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Purpose**: Design 5 reality-based intelligence layers that provide entity-level design decision support

---

## Executive Summary

Intelligence layers are not different views - they are analytical overlays that reveal the impact of design decisions. When a designer selects any entity and asks "what if I change this?", intelligence layers provide comprehensive answers across story, social, economic, and production dimensions. Each layer must work with actual data available from our APIs.

---

## Core Intelligence Architecture

### Selection-Driven Intelligence
```javascript
// When any entity is selected
onEntitySelect(entity) {
  // Base intelligence always loaded
  const baseIntelligence = await loadBaseIntelligence(entity);
  
  // Layer-specific intelligence loaded on demand
  const activeIntelligence = await Promise.all(
    activeLayers.map(layer => loadLayerIntelligence(entity, layer))
  );
  
  // Combine and display
  updateIntelligencePanel(baseIntelligence, activeIntelligence);
}
```

### Intelligence Response Structure
```javascript
{
  entityId: "element_victoria_voice_memo",
  entityType: "element",
  baseIntelligence: {
    // Always present regardless of active layers
    name: "Victoria's Voice Memo",
    type: "Memory Token Audio",
    currentState: { /* ownership, location, value */ }
  },
  layerIntelligence: {
    storyIntegration: { /* when active */ },
    socialChoreography: { /* when active */ },
    economicImpact: { /* when active */ },
    productionReality: { /* when active */ },
    contentGaps: { /* when active */ }
  }
}
```

---

## Layer 1: Story Integration Intelligence

### Purpose
Reveals how any entity connects to the narrative, what story it tells, and who discovers it.

### Activation Context
- Designing timeline events
- Creating story-revealing elements  
- Planning narrative discovery paths
- Checking story completeness

### Data Sources
```sql
-- Timeline connections via foreign keys
SELECT te.* FROM timeline_events te 
WHERE te.id = element.timeline_event_id

-- Character discovery paths via journey data
SELECT DISTINCT character_id FROM character_puzzles cp
JOIN puzzles p ON cp.puzzle_id = p.id
WHERE p.reward_ids LIKE '%element_id%'

-- Narrative completion calculation
WITH story_coverage AS (
  SELECT COUNT(DISTINCT timeline_event_id) as revealed_events
  FROM elements WHERE timeline_event_id IS NOT NULL
)
```

### Intelligence Provided

**For Elements**:
```javascript
{
  storyIntegration: {
    revealsTimelineEvent: {
      id: "event_123",
      description: "Victoria records voice memo about Marcus",
      narrativeImportance: "High", // Calculated based on event connections
      actFocus: "Act 1"
    },
    discoveryPaths: [
      {
        character: "Derek",
        method: "Via Sarah's jewelry box puzzle",
        probability: "High", // Based on puzzle difficulty/accessibility
        timing: "Mid Act 1"
      }
    ],
    storyCompleteness: 0.85, // How much this contributes to full narrative
    narrativeGaps: ["No evidence of Marcus's response exists"]
  }
}
```

**For Timeline Events**:
```javascript
{
  storyIntegration: {
    revealingElements: [
      { id: "elem_1", name: "Voice Memo", type: "Memory Token Audio" },
      { id: "elem_2", name: "Hotel Receipt", type: "Prop" }
    ],
    currentDiscovery: {
      potentialCharacters: ["Derek", "Sarah", "Alex"],
      blockedCharacters: ["James"], // Can't access revealing elements
      discoveryRate: 0.6 // 60% of players find this in playtests
    },
    narrativeWeight: "Critical", // Based on downstream dependencies
    relatedEvents: ["Marcus confronts Victoria", "Sarah discovers affair"]
  }
}
```

**For Characters**:
```javascript
{
  storyIntegration: {
    narrativeContent: {
      timelineEvents: 3, // Backstory events
      revealingElements: 7, // Elements that tell their story
      storyRole: "Supporting", // Based on tier + content
      contentCoverage: 0.3 // 30% vs other characters
    },
    discoveryProfile: {
      whatTheyDiscover: ["Victoria's murder evidence", "Marcus's motive"],
      howTheyDiscover: ["Through owned elements", "Via puzzle rewards"],
      narrativeImpact: "Medium" // Their discoveries affect story understanding
    },
    contentGaps: [
      "No backstory before the party",
      "Relationship to victim unclear"
    ]
  }
}
```

### Visual Indicators
```javascript
// Overlay on graph when Story Integration active
const StoryOverlay = {
  // Highlight story connections
  highlightTimelineConnections: true,
  showRevealingPaths: true,
  
  // Visual encoding
  nodeDecorations: {
    hasTimelineEvent: { badge: '📖', glow: 'gold' },
    narrativeCritical: { border: '3px solid gold' },
    storyGap: { opacity: 0.5, pattern: 'diagonal-stripes' }
  },
  
  // Edge styling for story flow
  edgeStyles: {
    reveals: { stroke: 'gold', strokeWidth: 3, animated: true },
    relatedTo: { stroke: 'gold', strokeWidth: 1, dashed: true }
  }
};
```

---

## Layer 2: Social Choreography Intelligence

### Purpose
Shows how entities create, require, or affect character interactions and collaborative gameplay.

### Activation Context
- Designing puzzles that force collaboration
- Balancing character interaction loads
- Planning social dynamics
- Checking isolation/overload

### Data Sources
```sql
-- Character collaboration requirements via puzzle elements
SELECT DISTINCT c1.id, c2.id 
FROM character_owned_elements coe1
JOIN puzzles p ON p.required_elements LIKE '%' || coe1.element_id || '%'
JOIN character_puzzles cp ON cp.puzzle_id = p.id
JOIN characters c1 ON coe1.character_id = c1.id
JOIN characters c2 ON cp.character_id = c2.id
WHERE c1.id != c2.id

-- Social load calculation
SELECT character_id, COUNT(DISTINCT other_character_id) as interaction_count
FROM character_interactions
GROUP BY character_id
```

### Intelligence Provided

**For Puzzles**:
```javascript
{
  socialChoreography: {
    requiredCollaborations: [
      {
        characters: ["Alex", "Derek"],
        reason: "Alex has business card, Derek has combination",
        interactionType: "Forced cooperation",
        dramaticPotential: "High" // Based on character relationships
      }
    ],
    socialBalance: {
      alexLoad: 8, // Total interactions
      derekLoad: 5,
      recommendation: "Alex is overloaded, consider redistributing"
    },
    collaborationQuality: {
      score: 0.8, // How meaningful vs mechanical
      factors: ["Natural character connection", "Interesting trade dynamic"]
    },
    alternatives: [
      "Could use Sarah's key instead for 3-way interaction"
    ]
  }
}
```

**For Elements**:
```javascript
{
  socialChoreography: {
    ownershipChain: {
      startsWith: "Derek",
      requiredBy: ["Alex's safe puzzle", "Sarah's jewelry box"],
      socialPath: "Derek → Alex → Sarah"
    },
    collaborationPotential: {
      canEnableInteractions: 3,
      currentlyUsedFor: 1,
      unusedPotential: "Could create Derek-Marcus interaction"
    },
    socialImpact: {
      ifMoved: "Would break Alex-Derek collaboration",
      ifValueChanged: "No social impact",
      ifRemoved: "3 character journeys become isolated"
    }
  }
}
```

**For Characters**:
```javascript
{
  socialChoreography: {
    interactionProfile: {
      totalInteractions: 12,
      uniqueCharacters: 7,
      interactionTypes: {
        required: 8, // Must collaborate
        optional: 4  // Can collaborate
      }
    },
    socialRole: "Connector", // Based on interaction patterns
    collaborationMap: [
      { character: "Sarah", count: 3, type: "Puzzle cooperation" },
      { character: "Derek", count: 2, type: "Element trading" }
    ],
    socialLoadAnalysis: {
      status: "Overloaded",
      recommendation: "Redistribute 2-3 interactions",
      comparedToAverage: "+40%"
    }
  }
}
```

### Visual Indicators
```javascript
// Overlay showing social connections
const SocialOverlay = {
  // Highlight collaboration requirements
  showCollaborationPaths: true,
  emphasizeOverloadedCharacters: true,
  
  // Node decorations
  nodeDecorations: {
    highSocialLoad: { aura: 'red', pulseAnimation: true },
    isolated: { opacity: 0.5, border: 'dashed' },
    connector: { shape: 'star', size: 'large' }
  },
  
  // Edge styling for social connections
  edgeStyles: {
    requiredCollaboration: { stroke: 'orange', strokeWidth: 4 },
    optionalCollaboration: { stroke: 'orange', strokeWidth: 2, dashed: true },
    socialOverload: { stroke: 'red', glowAnimation: true }
  }
};
```

---

## Layer 3: Economic Impact Intelligence

### Purpose
Reveals how value changes affect player choices, path balance, and the memory token economy.

### Activation Context
- Setting memory token values
- Balancing path rewards
- Creating choice pressure
- Checking economic fairness

### Data Sources
```sql
-- Token value distribution
SELECT 
  memory_type,
  COUNT(*) as count,
  SUM(calculated_memory_value) as total_value,
  AVG(calculated_memory_value) as avg_value
FROM elements
WHERE memory_type IS NOT NULL
GROUP BY memory_type

-- Path pressure calculation
SELECT 
  CASE 
    WHEN calculated_memory_value > 5000 THEN 'High'
    WHEN calculated_memory_value > 1000 THEN 'Medium'
    ELSE 'Low'
  END as pressure_tier,
  COUNT(*) as token_count
FROM elements
WHERE memory_type IS NOT NULL
```

### Intelligence Provided

**For Elements (Memory Tokens)**:
```javascript
{
  economicImpact: {
    currentValue: 5000,
    valueBreakdown: {
      baseValue: 1000, // From value_rating
      typeMultiplier: 5.0, // Business type
      groupBonus: "Not applied (need 2 more tokens)"
    },
    pathPressure: {
      level: "High",
      explanation: "At $5000, strongly incentivizes Black Market",
      psychologicalImpact: "Players feel forced to choose money"
    },
    economicBalance: {
      vsAverageToken: "+250%",
      percentileRank: "Top 10%",
      redistributionEffect: "Would balance Detective path if reduced to $3000"
    },
    setCompletion: {
      set: "Victoria Memories",
      currentlyCollected: "3/5",
      potentialBonus: "$50,000 if completed",
      feasibility: "Requires specific puzzle sequence"
    }
  }
}
```

**For Puzzles**:
```javascript
{
  economicImpact: {
    rewardValue: {
      total: 8000,
      breakdown: [
        { element: "Voice Memo", value: 5000 },
        { element: "Hotel Receipt", value: 3000 }
      ]
    },
    economicRipple: {
      immediateImpact: "High-value decision point",
      downstreamEffect: "Affects 3 subsequent puzzle rewards",
      cumulativeValue: 15000 // Including downstream
    },
    pathAnalysis: {
      blackMarketAttractiveness: 0.8, // 80% choose money
      detectiveProgress: "+15%", // Story completion
      balanceScore: 0.6 // Slightly favors Black Market
    },
    recommendations: [
      "Reduce voice memo to 3000 for better balance",
      "Or increase Detective narrative reward"
    ]
  }
}
```

**For Characters**:
```javascript
{
  economicImpact: {
    tokenPortfolio: {
      ownedTokens: 3,
      totalValue: 4500,
      valueDistribution: "Skewed low"
    },
    economicRole: "Low contributor", // Based on portfolio
    pathInfluence: {
      blackMarketPotential: "$4,500",
      detectiveContribution: "Minor stories",
      returnPathItems: "1 item to James"
    },
    balanceAnalysis: {
      vsAverageCharacter: "-40%",
      recommendation: "Add 1-2 medium value tokens",
      economicAgency: "Low" // Can't influence path choice much
    }
  }
}
```

### Visual Indicators
```javascript
// Economic overlay styling
const EconomicOverlay = {
  // Show value tiers
  colorByValue: true,
  showValueLabels: true,
  
  // Node decorations
  nodeDecorations: {
    highValue: { 
      aura: 'gold', 
      size: 'large',
      label: (value) => `$${value.toLocaleString()}`
    },
    setBonus: { badge: '🎯', tooltip: 'Part of set' },
    economicPressure: { 
      border: (pressure) => `${pressure}px solid gold`
    }
  },
  
  // Visual value encoding
  valueTiers: {
    high: { color: '#FFD700', minValue: 3000 },
    medium: { color: '#FFA500', minValue: 1000 },
    low: { color: '#CD853F', minValue: 0 }
  }
};
```

---

## Layer 4: Production Reality Intelligence

### Purpose
Shows physical requirements, dependencies, and production risks for running the game.

### Activation Context
- Production planning
- Prop dependency checking
- RFID token preparation
- Risk assessment

### Data Sources
```sql
-- Production status summary
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN rfid_tag IS NOT NULL THEN 1 END) as rfid_ready
FROM elements
GROUP BY status

-- Critical path analysis
WITH critical_elements AS (
  SELECT e.*, COUNT(DISTINCT cp.character_id) as affected_characters
  FROM elements e
  JOIN puzzles p ON p.required_elements LIKE '%' || e.id || '%'
  JOIN character_puzzles cp ON cp.puzzle_id = p.id
  WHERE e.status != 'Ready'
  GROUP BY e.id
)
```

### Intelligence Provided

**For Elements**:
```javascript
{
  productionReality: {
    physicalStatus: {
      propRequired: true,
      propType: "Voice recorder device",
      currentStatus: "In Development",
      estimatedCompletion: "3 days"
    },
    rfidRequirements: {
      needsRFID: true,
      rfidStatus: "Not programmed",
      contentReady: true,
      programmingQueue: 12 // Position in queue
    },
    dependencies: {
      containerRequired: "Sarah's jewelry box",
      containerStatus: "Ready",
      relatedProps: ["Jewelry box key", "Combination lock"]
    },
    productionImpact: {
      ifMissing: {
        affectedCharacters: ["Derek", "Alex", "Sarah"],
        brokenPuzzles: ["Jewelry Box Opening"],
        storyImpact: "Major - blocks Victoria backstory"
      },
      alternatives: "Could use printed QR code as backup"
    }
  }
}
```

**For Puzzles**:
```javascript
{
  productionReality: {
    propRequirements: {
      total: 5,
      ready: 3,
      inDevelopment: 1,
      missing: 1,
      breakdown: [
        { prop: "Safe", status: "Ready", critical: true },
        { prop: "Business cards", status: "Ready", critical: true },
        { prop: "Combination lock", status: "In Development", critical: true },
        { prop: "Gym membership", status: "Missing", critical: true },
        { prop: "Safe contents", status: "Ready", critical: false }
      ]
    },
    setupComplexity: {
      score: "Medium",
      factors: ["Multiple props", "Specific placement required", "RFID scanning"],
      estimatedSetupTime: "10 minutes",
      requiredStaff: 2
    },
    riskAssessment: {
      missingCritical: ["Gym membership"],
      impact: "Puzzle cannot function",
      mitigation: "Create backup membership card",
      probabilityOfFailure: 0.3
    }
  }
}
```

**For Characters**:
```javascript
{
  productionReality: {
    kitRequirements: {
      coatCheckItems: 4,
      readyItems: 3,
      missingItems: ["RFID scanner"],
      criticalDependencies: ["Scanner blocks Act 2 participation"]
    },
    propDependencies: {
      requiredFromOthers: [
        { item: "Derek's business card", status: "Ready" },
        { item: "Sarah's key", status: "In Development" }
      ],
      providesToOthers: [
        { item: "Cease & desist letter", for: ["Marcus"], status: "Ready" }
      ]
    },
    castingRequirements: {
      physicalRequirements: "None",
      socialRequirements: "High - 8 forced interactions",
      specialSkills: "Good at puzzles",
      backupPlan: "Can combine with Marcus role if needed"
    }
  }
}
```

### Visual Indicators
```javascript
// Production overlay styling
const ProductionOverlay = {
  // Show production status
  colorByStatus: true,
  showStatusIcons: true,
  
  // Node decorations
  nodeDecorations: {
    ready: { checkmark: '✅', border: 'solid green' },
    inDevelopment: { icon: '🔨', border: 'dashed orange' },
    missing: { icon: '❌', border: 'solid red', pulse: true },
    rfidRequired: { badge: 'RFID', corner: 'top-right' }
  },
  
  // Risk visualization
  riskIndicators: {
    critical: { aura: 'red', animation: 'pulse' },
    important: { aura: 'orange' },
    standard: { aura: 'green' }
  }
};
```

---

## Layer 5: Content Gap Intelligence

### Purpose
Identifies missing content, integration opportunities, and narrative development potential.

### Activation Context
- Content creation planning
- Identifying underwritten characters
- Finding story gaps
- Planning new elements

### Data Sources
```sql
-- Content coverage analysis
SELECT 
  c.id,
  c.name,
  COUNT(DISTINCT te.id) as timeline_events,
  COUNT(DISTINCT e.id) as owned_elements,
  COUNT(DISTINCT p.id) as puzzles
FROM characters c
LEFT JOIN character_timeline_events cte ON c.id = cte.character_id
LEFT JOIN timeline_events te ON cte.timeline_event_id = te.id
LEFT JOIN character_owned_elements coe ON c.id = coe.character_id
LEFT JOIN elements e ON coe.element_id = e.id
LEFT JOIN character_puzzles cp ON c.id = cp.character_id
LEFT JOIN puzzles p ON cp.puzzle_id = p.id
GROUP BY c.id

-- Story gap detection
SELECT te1.id, te1.date, te2.id, te2.date,
  JULIANDAY(te2.date) - JULIANDAY(te1.date) as gap_days
FROM timeline_events te1
JOIN timeline_events te2 ON te2.date > te1.date
WHERE gap_days > 30 -- Significant time gaps
```

### Intelligence Provided

**For Characters**:
```javascript
{
  contentGaps: {
    contentCoverage: {
      timelineEvents: 2, // vs avg 8
      ownedElements: 1, // vs avg 5  
      puzzles: 1, // vs avg 3
      overallScore: 0.2 // 20% content vs average
    },
    missingNarratives: [
      "No backstory before party",
      "No relationship to victim established",
      "No clear motive or alibi"
    ],
    integrationOpportunities: [
      {
        type: "Timeline Event",
        suggestion: "Howie witnesses kitchen argument",
        impact: "Provides murder timeline evidence",
        connections: ["Links to poison theme", "Explains late discovery"]
      },
      {
        type: "Element",
        suggestion: "Howie's catering schedule",
        impact: "Shows access to poison",
        value: 1500 // Suggested value
      }
    ],
    developmentPriority: "High", // Based on coverage score
    quickWins: [
      "Add 2 timeline events for instant improvement",
      "Create 1 memory token for economic participation"
    ]
  }
}
```

**For Timeline Events**:
```javascript
{
  contentGaps: {
    evidenceSupport: {
      revealingElements: 1, // vs recommended 3-4
      elementTypes: ["Memory Token Audio"],
      missingTypes: ["Physical evidence", "Witness testimony"]
    },
    narrativeGaps: {
      before: "No setup for this event",
      after: "No consequences shown",
      relatedEvents: 2 // Should have 4-5
    },
    integrationSuggestions: [
      {
        type: "Element",
        name: "Security footage timestamp",
        reason: "Provides visual evidence",
        impact: "Makes event more discoverable"
      }
    ],
    discoverability: {
      currentPaths: 1,
      recommendedPaths: 3,
      suggestedCharacters: ["Alex", "Marcus"],
      accessibilityScore: 0.3 // Low
    }
  }
}
```

**For System-Wide Gaps**:
```javascript
{
  contentGaps: {
    systemAnalysis: {
      characterGaps: [
        { character: "Howie", coverage: 0.1 },
        { character: "James", coverage: 0.3 }
      ],
      timelineGaps: [
        { period: "Pre-party setup", events: 2 }, // Should have 8
        { period: "Murder window", events: 5 } // Should have 10
      ],
      elementGaps: {
        "Memory Token Video": 3, // Have 3, need 8
        "Physical evidence": 12 // Have 12, need 20
      }
    },
    recommendations: {
      priority1: "Develop Howie's complete arc",
      priority2: "Add pre-party timeline events", 
      priority3: "Create more video evidence tokens"
    }
  }
}
```

### Visual Indicators
```javascript
// Gap analysis overlay
const GapOverlay = {
  // Highlight underdeveloped content
  fadeCompleteContent: true,
  emphasizeGaps: true,
  
  // Node decorations
  nodeDecorations: {
    underdeveloped: { 
      opacity: 0.5, 
      border: 'dashed red',
      badge: '!' 
    },
    noContent: {
      pattern: 'diagonal-stripes',
      tooltip: 'Needs content'
    },
    opportunity: {
      glow: 'purple',
      badge: '+',
      animation: 'pulse'
    }
  },
  
  // Gap indicators
  gapMarkers: {
    narrative: { icon: '📖', color: 'purple' },
    evidence: { icon: '🔍', color: 'blue' },
    social: { icon: '👥', color: 'orange' }
  }
};
```

---

## Implementation Architecture

### Intelligence Service
```javascript
class IntelligenceService {
  constructor(api) {
    this.api = api;
    this.cache = new Map();
  }
  
  async getIntelligence(entity, layers) {
    const cacheKey = `${entity.id}-${layers.join(',')}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const intelligence = await Promise.all([
      this.getBaseIntelligence(entity),
      ...layers.map(layer => this.getLayerIntelligence(entity, layer))
    ]);
    
    const result = this.mergeIntelligence(intelligence);
    this.cache.set(cacheKey, result);
    return result;
  }
  
  async getLayerIntelligence(entity, layer) {
    switch(layer) {
      case 'story':
        return this.getStoryIntelligence(entity);
      case 'social':
        return this.getSocialIntelligence(entity);
      case 'economic':
        return this.getEconomicIntelligence(entity);
      case 'production':
        return this.getProductionIntelligence(entity);
      case 'gaps':
        return this.getGapIntelligence(entity);
    }
  }
}
```

### Performance Optimization
```javascript
// Batch intelligence queries
const useIntelligenceBatch = (entities, layers) => {
  return useQueries(
    entities.map(entity => ({
      queryKey: ['intelligence', entity.id, layers],
      queryFn: () => intelligenceService.getIntelligence(entity, layers),
      staleTime: 5 * 60 * 1000
    }))
  );
};

// Progressive intelligence loading
const useProgressiveIntelligence = (entity, allLayers) => {
  // Load critical intelligence first
  const { data: critical } = useQuery(
    ['intelligence-critical', entity.id],
    () => intelligenceService.getIntelligence(entity, ['story', 'social']),
    { staleTime: 5 * 60 * 1000 }
  );
  
  // Load additional intelligence after
  const { data: additional } = useQuery(
    ['intelligence-additional', entity.id],
    () => intelligenceService.getIntelligence(entity, ['economic', 'production', 'gaps']),
    { 
      enabled: !!critical,
      staleTime: 5 * 60 * 1000 
    }
  );
  
  return { critical, additional };
};
```

---

## Success Metrics

### Response Time
- Initial intelligence: <500ms
- Layer toggle: <200ms
- Full analysis: <2s

### Accuracy
- Data freshness: <5 minutes
- Calculation accuracy: 100%
- Recommendation relevance: >80%

### User Success
- "I understand the impact immediately"
- "I can make confident design decisions"
- "I see opportunities I missed before"
- "I know what will break if I change this"

---

## Conclusion

These 5 intelligence layers transform ALNTool from a data browser into a design intelligence system. By providing entity-level impact analysis across all game dimensions, designers can make informed decisions quickly and confidently. The key is that intelligence responds to selection and intent, not forcing designers to hunt for information.

---

*"Intelligence is not about having all the data - it's about knowing what the data means for your next decision."*  
— Sarah Chen