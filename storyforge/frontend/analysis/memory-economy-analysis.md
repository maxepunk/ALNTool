# Memory Economy Page Analysis

## Overview
The Memory Economy page is a sophisticated production tracking tool that visualizes token value flow, balance analysis, and production readiness across the game. It provides both high-level dashboard views and detailed token-level information.

## Token Visualization Methods

### 1. **Dashboard Cards (KPI Visualization)**
- **Token Economy Card**: Shows total tokens vs target with progress bar
  - Color coding: Green if in range (50-60), Warning if outside
  - LinearProgress component with percentage visualization
  - Target-based tracking (55 tokens)

### 2. **Production Pipeline Visualization**
- **Badge-based counters** for production stages:
  - To Design (warning color)
  - To Build (info color)
  - Ready (success color)
- Icon-based status indicators with numeric badges

### 3. **Balance Score Card**
- Letter grade system (A+, B, C)
- Color-coded based on issue count
- Issue count indicator

### 4. **Path Distribution Grid**
- Visual boxes with background colors per path
- Icon representation for each resolution path
- Numeric values prominently displayed
- Color theming from game constants

## Flow Calculations and Display

### Core Calculations (from useMemoryEconomyAnalysis hook):
```javascript
// Token statistics
totalTokens = processedMemoryData.length
completedTokens = tokens with status 'Ready' or 'Complete'
totalValue = sum of all finalCalculatedValue

// Progress calculations
tokenProgressValue = (totalTokens / targetTokens) * 100
productionProgressValue = (ready / totalTokens) * 100

// Balance analysis
- Token count range checking (50-60)
- Path distribution balance (max - min < 40%)
- Unassigned token threshold (< 30%)
- Production readiness (> 70%)
```

### Value Calculation Flow:
1. Base value from rating (backend calculated)
2. Type multiplier applied
3. Final calculated value displayed

## API Endpoints Used

```javascript
// Primary data fetching
api.getElements({ filterGroup: 'memoryTypes' })  // Memory tokens
api.getCharacters({ limit: 1000 })               // Character data
api.getPuzzles({ limit: 1000 })                  // Puzzle relationships

// Game constants for thresholds
useGameConstants() // Provides all configuration values
```

## Character-Based Breakdowns

### Current Implementation:
- **Indirect**: Memory tokens linked to characters through puzzles
- **Resolution paths**: Used as proxy for character journeys
- **Discovery tracking**: "Discovered Via" shows puzzle/event connections

### Data Relationships:
```
Memory Token → Puzzle → Character(s)
Memory Token → Timeline Event → Character(s)
Memory Token → Resolution Path → Character Journey
```

## Act-Based Summaries

Currently **NOT directly implemented**, but the structure supports it through:
- Timeline event connections
- Puzzle act associations
- Could aggregate by act through element relationships

## Overlay-Ready Patterns

### 1. **Progress Indicators**
- LinearProgress bars with determinate values
- Color coding based on thresholds
- Percentage-based visualization

### 2. **Status Chips**
- Compact visual indicators
- Color-coded by type/status
- Standardized sizing (small)

### 3. **Alert System**
- Warning/Info alerts for issues
- Stacked recommendations
- Expandable accordion for details

### 4. **Color Theming**
```javascript
// Path colors from game constants
pathThemes[path].color

// Status colors
'success' for ready/complete
'warning' for issues/to design
'info' for in progress
'error' for critical issues

// Value rating colors
value >= 4: 'error' (high value)
value === 3: 'warning' (medium)
default: 'default' (low)
```

## What Becomes Intelligence Layers

### 1. **Memory Economy Intelligence Layer**
Primary overlay showing token flow and balance:
- Token count progress bars on journey nodes
- Value accumulation along paths
- Balance warnings as node decorations

### 2. **Token Flow Visualization on Edges**
- Animated value particles flowing between nodes
- Thickness based on token value
- Color intensity for value rating
- Direction indicators for discovery flow

### 3. **Balance Indicators on Nodes**
Node decorations showing:
- Token count badges
- Production status rings (design/build/ready)
- Value accumulation totals
- Resolution path assignment

### 4. **Warning Overlays for Issues**
Contextual overlays triggered by:
- Unbalanced path distribution (>40% difference)
- Token count outside range (not 50-60)
- Too many unassigned tokens (>30%)
- Production behind schedule (<70% ready)

## Visual Patterns to Adapt

### 1. **Progress Visualization**
```jsx
// Adapt LinearProgress for node decoration
<CircularProgress 
  variant="determinate" 
  value={tokenProgress} 
  size={20}
  thickness={4}
  color={inRange ? 'success' : 'warning'}
/>
```

### 2. **Status Badges**
```jsx
// Overlay badges on nodes
<Badge 
  badgeContent={tokenCount} 
  color={statusColor}
  overlap="circular"
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <NodeContent />
</Badge>
```

### 3. **Value Flow Particles**
```jsx
// Animated particles along edges
<motion.div
  initial={{ opacity: 0, scale: 0 }}
  animate={{ 
    opacity: [0, 1, 1, 0],
    scale: [0, 1, 1, 0],
    x: edgePath.x,
    y: edgePath.y
  }}
  transition={{ duration: 2, repeat: Infinity }}
/>
```

### 4. **Alert Positioning**
```jsx
// Floating alerts near problem areas
<Portal>
  <Alert 
    severity="warning"
    sx={{
      position: 'absolute',
      top: node.position.y - 50,
      left: node.position.x,
      zIndex: 1000
    }}
  >
    {issue}
  </Alert>
</Portal>
```

## Key Insights for Journey Overlay

1. **Token-centric view** maps well to journey nodes as collection points
2. **Production status** provides natural node state visualization
3. **Path distribution** aligns with journey branching
4. **Balance analysis** creates actionable overlay warnings
5. **Value calculations** enable economic flow visualization

## Performance Considerations

- All calculations done in useMemo hook
- Backend pre-calculates values (no client-side math)
- React Query caching with 5-minute stale time
- Component-level error boundaries
- Conditional rendering for empty states

## Integration Points

For journey overlay integration:
1. Subscribe to same React Query keys for data
2. Transform token data into node decorations
3. Calculate edge flows from token relationships
4. Position warnings based on node coordinates
5. Toggle layer visibility independently