# Tooltip Implementation Plan

## Overview
Add contextual help throughout the UI to guide game designers without cluttering the interface.

## Priority Areas for Tooltips

### 1. Player Journey Page

#### Experience Analysis Panel
- **Pacing Score**: "Measures time distribution between activities. 80+ is good, 60-79 needs work, <60 has issues."
- **Memory Tokens X/Y**: "Tokens collected / Total available. Target: 3-8 per character in 55-token economy."
- **Experience Balance**: "Ratio of discovery vs action puzzles. Aim for variety to maintain engagement."
- **Bottlenecks**: "Puzzles that block progression with no alternatives. Click to see details."

#### Graph View Controls
- **Timeline/Analysis Toggle**: "Switch between chronological view and experience flow analysis."
- **Fit Screen**: "Reset zoom to show entire journey."
- **Node Types**: "Green=Puzzles, Blue=Elements, Purple=Timeline Events"

### 2. Dashboard

#### Production Metrics Cards
- **Missing Dependencies**: "Elements or puzzles required but not available when needed."
- **Bottleneck Puzzles**: "Critical path puzzles with no alternative routes."
- **Isolated Characters**: "Characters with >45min without social interaction."

#### Quick Access Items
- **Validation Pending**: "Puzzles that need production review before implementation."
- **Recent Changes**: "Items modified in last sync from Notion."

### 3. Memory Economy Page

#### Balance Metrics
- **Token Flow**: "Visual representation of token collection and spending over time."
- **Surplus/Deficit**: "Running balance. Negative = blocked progression."
- **Gate Requirements**: "Major puzzles requiring token payments."

### 4. Relationship Mapper

#### Controls
- **Signal Strength**: "Hide connections below importance threshold to reduce clutter."
- **Exploration Depth**: "How many relationship levels to display from selected node."
- **Dependency Mode**: "Highlights production dependencies vs narrative connections."

### 5. Character/Puzzle/Element Lists

#### Filter Options
- **Production Status**: "Ready=good to go, Issues=has problems, Not Started=needs work"
- **Path Filter**: "Black Market=resource focus, Detective=investigation, Third Path=balance"

## Implementation Approach

### Using Material-UI Tooltip Component

```jsx
import { Tooltip, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Inline help icon pattern
<Tooltip 
  title="Measures time distribution between activities. 80+ is good, 60-79 needs work, <60 has issues."
  arrow
  placement="top"
>
  <IconButton size="small" sx={{ ml: 0.5 }}>
    <HelpOutlineIcon fontSize="small" />
  </IconButton>
</Tooltip>

// Wrap existing element pattern
<Tooltip title="Click to view detailed character journey">
  <Button>View Journey</Button>
</Tooltip>
```

### Tooltip Content Guidelines

1. **Be Concise**: 1-2 sentences maximum
2. **Be Specific**: Include numbers/thresholds where relevant
3. **Be Actionable**: Tell users what to do, not just what something is
4. **Use Examples**: "Good: 80+, Warning: 60-79, Bad: <60"

### Placement Strategy

- **Headers**: Help icon after section titles
- **Metrics**: Hover on the number itself
- **Buttons**: Wrap entire button
- **Complex Controls**: Help icon inline with label

## Files to Modify

### High Priority (Core Workflow)
1. `src/components/PlayerJourney/ExperienceAnalysisPanel.jsx`
2. `src/components/PlayerJourney/JourneyGraphView.jsx`
3. `src/components/Dashboard/ProductionMetrics.jsx`
4. `src/components/MemoryEconomy/MemoryBalanceCard.jsx`

### Medium Priority (Common Features)
5. `src/components/RelationshipMapper/ControlsPanel.jsx`
6. `src/components/CharacterFilters.jsx`
7. `src/components/PuzzleFilters.jsx`
8. `src/components/ElementFilters.jsx`

### Low Priority (Advanced Features)
9. `src/pages/ResolutionPathAnalyzerPage.jsx`
10. `src/pages/NarrativeThreadTrackerPage.jsx`

## Testing Approach

1. Add tooltips incrementally
2. Test with actual game designers if possible
3. Ensure tooltips don't block interactions
4. Verify mobile/touch behavior
5. Check accessibility (keyboard navigation)

## Success Metrics

- Reduced questions about metric meanings
- Faster onboarding for new designers
- Increased use of advanced features
- No performance impact from tooltips

## Example Implementation

For the Pacing Score in ExperienceAnalysisPanel.jsx:

```jsx
// Before
<Typography variant="subtitle2">
  <SpeedIcon fontSize="small" />
  Pacing Score: {experienceAnalysis.pacing.score}/100
</Typography>

// After
<Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <SpeedIcon fontSize="small" />
  Pacing Score: {experienceAnalysis.pacing.score}/100
  <Tooltip 
    title="Measures time distribution between activities. 80+ is excellent pacing with good variety. 60-79 may have some slow periods. Below 60 indicates significant pacing issues that could bore or frustrate players."
    arrow
  >
    <HelpOutlineIcon 
      fontSize="small" 
      sx={{ 
        cursor: 'help',
        opacity: 0.6,
        '&:hover': { opacity: 1 }
      }} 
    />
  </Tooltip>
</Typography>
```

---
*Tooltip Implementation Plan v1.0 - Created 2025-06-30*