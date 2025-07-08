# Intelligence Layers Data Analysis

## Overview
This document provides a detailed analysis of the data structures and rendering logic for all 5 intelligence layers in the ALNTool JourneyIntelligence system. Each layer fetches real data from the backend and renders entity-specific analysis.

## Common Patterns

### Data Fetching Pattern
All layers follow a consistent data fetching pattern:
1. **Primary data source**: `usePerformanceElements` hook - fetches all elements from SQLite
2. **Secondary data sources**: React Query for specific entity types (timeline events, puzzles)
3. **Hook rules**: All hooks called before conditional returns to follow React rules

### Entity Type Detection
```javascript
const entityCategory = selectedEntity.entityType || selectedEntity.type || 'unknown';
```
All layers use this pattern to determine the selected entity's type and render appropriate analysis.

### Conditional Rendering
Layers only render when:
- Layer is active in `activeIntelligence` array
- An entity is selected (`selectedEntity` is not null)

## 1. Economic Layer (EconomicLayer.jsx)

### Data Expected
```javascript
// Elements data structure
{
  id: string,
  name: string,
  calculated_memory_value: number,  // From SQLite computation
  memory_group: string,             // Group classification
  group_multiplier: number,         // Value multiplier
  rightful_owner: string,          // For return path
  owner_character_id: string,      // Character ownership
  type: string                     // Element type from performance path
}
```

### Rendering Logic
- **Element Analysis**:
  - Displays memory token value with color coding (red if >= $5000)
  - Shows memory group and multiplier with chip component
  - Calculates choice pressure (high value = Black Market incentive)
  - Displays return path if rightful_owner exists

- **Character Analysis**:
  - Aggregates all owned elements' values into portfolio total
  - Categorizes economic role (High/Medium/Low contributor)
  - Shows token count

- **Puzzle Analysis**:
  - Currently placeholder - awaiting puzzle economic data integration

### Real vs Placeholder Data
- **Real**: Element values, memory groups, ownership data
- **Placeholder**: Puzzle economic analysis

## 2. Story Intelligence Layer (StoryIntelligenceLayer.jsx)

### Data Expected
```javascript
// Elements
{
  id: string,
  timeline_event_id: string,       // Links to timeline
  narrative_thread: string,        // Story context
  calculated_memory_value: number, // For importance rating
  owner_character_id: string
}

// Timeline Events (from API)
{
  id: string,
  name: string,
  description: string,
  act_focus: string,              // Act 1/Act 2/Revelation
  narrative_importance: string    // Critical/High/Medium/Low
}
```

### Rendering Logic
- **Element Analysis**:
  - Shows timeline connection or identifies gap
  - Displays narrative thread if present
  - Rates story importance based on value/connections

- **Character Analysis**:
  - Counts owned elements and narrative threads
  - Lists connected timeline events
  - Identifies story development gaps

- **Timeline Event Analysis**:
  - Counts revealing elements by owner
  - Analyzes content balance (0 = urgent, 1 = risky, 2-3 = good)
  - Shows story arc information

### Real vs Placeholder Data
- **Real**: Element-timeline connections, narrative threads, timeline event data
- **Placeholder**: None - fully connected to real data

## 3. Social Intelligence Layer (SocialIntelligenceLayer.jsx)

### Data Expected
```javascript
// Puzzles (from API)
{
  id: string,
  name: string,
  required_elements: string[],      // Element IDs needed
  required_collaborators: string[], // Character IDs needed
  reward_elements: string[],        // Elements given as rewards
  social_complexity: string         // High/Medium/Low
}

// Elements (includes ownership for social mapping)
{
  owner_character_id: string,       // Who owns this element
  id: string,
  name: string
}
```

### Rendering Logic
- **Element Analysis**:
  - Identifies puzzles requiring this element
  - Shows owner and access pattern
  - Flags shared resources and collaboration requirements

- **Character Analysis**:
  - Calculates collaboration load (direct + indirect)
  - Lists owned tradeable elements
  - Warns about overloaded characters

- **Puzzle Analysis**:
  - Analyzes social choreography complexity
  - Lists required players and element dependencies
  - Evaluates interaction design quality

### Real vs Placeholder Data
- **Real**: Element ownership, puzzle requirements, collaboration patterns
- **Placeholder**: Timeline event social analysis (basic message only)

## 4. Production Intelligence Layer (ProductionIntelligenceLayer.jsx)

### Data Expected
```javascript
// Elements with production fields
{
  id: string,
  rfid: string,                    // RFID tag for memory tokens
  production_status: string,       // Ready/In Development/etc
  memory_type: string,            // Identifies memory tokens
  calculated_memory_value: number,
  container: string,              // Physical location
  location: string                // Alternative location field
}

// Uses utility functions for field access:
getRFIDTag(element)
getProductionStatus(element)
isMemoryToken(element)
getElementValue(element)
```

### Rendering Logic
- **Element Analysis**:
  - Shows production status with color-coded chips
  - Critical RFID warnings for memory tokens
  - Physical location/container info
  - Lists dependent puzzles

- **Character Analysis**:
  - Inventory of owned props
  - RFID gap analysis for memory tokens
  - Production readiness status
  - Critical puzzle dependencies

- **Puzzle Analysis**:
  - Checks all required elements exist
  - Identifies missing RFID tags
  - Rates setup complexity
  - Lists production blockers

### Real vs Placeholder Data
- **Real**: RFID status, production status, element locations
- **Placeholder**: None - uses real production data

## 5. Content Gaps Layer (ContentGapsLayer.jsx)

### Data Expected
Uses all data sources to cross-reference and identify gaps:
- Elements (with all fields)
- Timeline events
- Puzzles

### Rendering Logic
- **Element Gap Analysis**:
  - Missing timeline connections (high severity)
  - Missing narrative threads (medium severity)
  - Orphaned elements (no owner/puzzle use)
  - Memory tokens without story connections

- **Character Gap Analysis**:
  - Backstory completeness (0 events = critical)
  - Element ownership gaps
  - Puzzle integration gaps
  - Overall development status

- **Timeline Event Gap Analysis**:
  - Evidence count (0 = critical, 1 = risky)
  - Evidence distribution across characters
  - Suggests evidence types for gaps

### Real vs Placeholder Data
- **Real**: All gap analysis based on actual data relationships
- **Placeholder**: Puzzle gap analysis (basic message only)

## API Integration

### Primary Data Hook
```javascript
usePerformanceElements({
  includeMemoryTokens: true
})
```
- Returns all elements from SQLite with computed fields
- Uses performance-optimized path for 400+ elements
- Includes calculated values, memory groups, etc.

### Secondary API Calls
```javascript
// Timeline events
api.getTimelineEvents() // GET /api/timeline

// Puzzles
api.getPuzzles() // GET /api/puzzles
```

### Data Caching
- All queries use 5-minute stale time
- Prevents excessive API calls
- React Query handles cache invalidation

## Key Insights

### 1. Data Completeness
The layers are designed to handle sparse data gracefully:
- Show warnings/alerts for missing data
- Provide suggestions for content development
- Work with partial data

### 2. Cross-Entity Analysis
Each layer analyzes entities differently:
- Elements: Individual properties and usage
- Characters: Aggregated portfolio analysis
- Timeline Events: Evidence distribution
- Puzzles: Requirement satisfaction

### 3. Visual Hierarchy
All layers use consistent UI patterns:
- Color-coded severity (error/warning/success)
- Material-UI components for consistency
- Fixed positioning overlay at top-right
- Max height with scroll for long content

### 4. Performance Considerations
- UseMemo for expensive calculations
- Conditional rendering to avoid unnecessary work
- Efficient data filtering and aggregation

## Current Limitations

Based on test data, the system has limited content:
- Only 1 element with calculated memory value
- No timeline connections established
- No element ownership assigned
- No puzzle requirements defined
- No RFID tags assigned

However, the layers are fully functional and will provide rich analysis as game content is added to the database.