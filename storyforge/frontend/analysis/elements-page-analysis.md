# Elements Page Analysis

## Overview
The Elements page is a production management interface for game elements (props, memories, documents) that need to be created for the physical game. It provides filtering, categorization, and production status tracking.

## All Features

### 1. Element Listing & Display
- **DataTable Component**: Sortable table displaying elements
- **Column Data**:
  - Name (20% width)
  - Type (15%) - Color-coded chips (Memory=warning, Prop=info, Character Sheet=secondary)
  - Act Focus (10%) - Which act the element belongs to
  - Status (15%) - Production status with color coding
  - First Available (10%) - When element first appears in game
  - Themes (15%) - Multiple theme tags per element
  - Memory Sets (15%) - Memory category groupings

### 2. Filtering System
- **Element Type Filter**: All Types, specific type selection
- **Status Filter**: All Statuses, Ready for Playtest, In development, Idea/Placeholder
- **First Available Filter**: All Acts, Act 1, Act 2, Act 3
- **Act Focus Filter**: All Acts, Act 1, Act 2, Act 3 (client-side)
- **Theme Filter**: Multi-select checkboxes with "Select All" option (client-side)
- **Memory Set Filter**: Dropdown selection (client-side)
- **URL State**: Type filter persists in URL query params

### 3. Production Intelligence Dashboard
- **ElementDashboardCards**: Key metrics display
  - Total Elements count
  - Memory Tokens (total, ready, in development)
  - Production Status (ready, in progress, needs work)
  - Act Distribution chart
  - Type Distribution breakdown
- **ElementProductionAlert**: Warning system for:
  - Memory token shortage (< 45 tokens, target 55)
  - Memory production readiness (< 80% ready)
  - Overall production readiness (< 70% ready)
  - Missing act focus assignments

### 4. Element Detail View
- **Properties Card**: Basic element information
- **Characters Tab**: Characters who interact with element
- **Timeline Tab**: When element appears in story
- **Puzzles Tab**: Puzzles that use/unlock this element
- **Container Tab**: If element contains other elements
- **Contents Tab**: Elements contained within this one
- **Relationship Mapper**: Visual graph of connections

## API Endpoints Used

### Primary Endpoints
1. `GET /api/elements` - List all elements with filters
   - Query params: `type`, `status`, `firstAvailable`
   - Returns: Array of element objects

2. `GET /api/elements/:id` - Get single element details
   - Returns: Complete element object with relationships

3. `GET /api/elements/:id/graph` - Get element relationship graph
   - Query params: `depth` (default: 2)
   - Returns: Graph data for visualization

4. `GET /api/game-constants` - Get configuration values
   - Used for thresholds and targets

### Data Structure
```javascript
{
  id: string,
  name: string,
  basicType: string, // "Memory Token", "Prop", "Character Sheet", etc.
  status: string, // "Ready for Playtest", "In development", etc.
  firstAvailable: string, // Act number
  properties: {
    actFocus: string, // "Act 1", "Act 2", "Act 3"
    themes: string[], // ["Technology", "Memory", etc.]
    memorySets: string[], // Memory grouping categories
    memoryValue: number // Token value if applicable
  },
  // Relationships
  puzzles: [], // Puzzles that use this element
  characters: [], // Characters who interact with it
  timeline: [], // Timeline events involving element
  container: {}, // Parent container element
  contents: [] // Child elements if container
}
```

## UI Components and Patterns

### Reusable Components
- **DataTable**: Generic sortable table with row click handling
- **PageHeader**: Standard page title with action buttons
- **ErrorBoundary**: Component-level error handling
- **Chip**: Material-UI chips for status/type display
- **Skeleton**: Loading states

### UI Patterns
- **Filter Persistence**: Type filter in URL for shareable links
- **Lazy Loading**: React Query with 5min stale time
- **Error Recovery**: Retry buttons on errors
- **Empty States**: Contextual messages based on filters
- **Loading States**: Skeleton loaders during data fetch

## Journey Dependencies

### Elements as Discovery Nodes
- **Memory Tokens**: Primary collectibles that unlock character memories
- **Props**: Physical items that provide clues or unlock puzzles
- **Documents**: Letters, emails, photos that reveal story
- **Character Sheets**: Background info unlocked through gameplay

### Element-Puzzle Connections
- Elements can be **required** to start a puzzle
- Elements can be **rewards** from completing puzzles
- Container elements can hold other elements (nested discoveries)
- Some elements are "keys" that unlock multiple puzzles

### Memory Value System
- Memory tokens have point values
- Total memory economy tracked across all elements
- Memory sets group related tokens thematically
- Target: 55 total tokens for complete game economy

### Element Flow Through Game
1. **Discovery**: Player finds element in physical space
2. **Collection**: Element added to player inventory
3. **Usage**: Element used to unlock puzzle or reveal story
4. **Reward**: Completing associated content may yield new elements

## What Becomes Journey Graph Features

### Discovery Nodes in Journey Graph
- Each element becomes a potential discovery node
- Node properties:
  - Element name and type
  - Memory value (if applicable)
  - Act placement
  - Theme associations
  - Production status visualization

### Memory Economy Layer Integration
- **Token Flow Visualization**: Show memory token distribution across journey
- **Balance Tracking**: Running total of memory values collected
- **Set Completion**: Track themed memory set progress
- **Value Density**: Highlight high-value discovery clusters

### Unlock/Reward Connections
- **Prerequisite Arrows**: Element → Puzzle unlocks
- **Reward Arrows**: Puzzle → Element rewards
- **Container Relationships**: Parent → Child element trees
- **Cross-Character Sharing**: Elements used by multiple characters

### Production Intelligence Layer
- **Status Indicators**: Color-code nodes by production readiness
- **Missing Elements**: Highlight gaps in element coverage
- **Resource Conflicts**: When multiple puzzles need same element
- **Physical Constraints**: Container capacity limits
- **Prop Tracking**: Ensure all required props are producible

## Integration Opportunities

### For Journey Intelligence View
1. **Element Discovery Timeline**: When each element becomes available
2. **Memory Economy Visualization**: Token collection progress bar
3. **Production Readiness Overlay**: Show which journey paths are ready
4. **Theme Coherence Check**: Ensure thematic consistency along paths
5. **Resource Dependencies**: Critical path analysis for element availability

### Quick Actions from Journey View
- Click element node → View/edit element details
- Hover element → Show memory value and status
- Filter journey by element production status
- Highlight all nodes requiring specific element type

### Data to Surface
- Total elements per act/character/path
- Memory token distribution balance
- Production bottlenecks blocking paths
- Theme consistency across journey segments
- Element reuse efficiency metrics