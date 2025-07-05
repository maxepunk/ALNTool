# Timeline Page Analysis

## Component Overview
- **Primary Component**: `Timeline.jsx` (list view) and `TimelineDetail.jsx` (detail view)
- **Purpose**: Display chronological story events with filtering and detailed viewing capabilities
- **User Flow**: Timeline list → Click event → Timeline detail with relationships

## Features

### Timeline List View (`Timeline.jsx`)
1. **Data Table Display**
   - Description (40% width)
   - Date with chronological sorting
   - Act Focus with color-coded chips (Act 1: warning, Act 2: info, Act 3: secondary)
   - Themes as chip arrays
   - Character count indicator

2. **Filtering System**
   - Memory/Evidence Type filter (server-side)
   - Act Focus filter (server-side)
   - Theme filtering (client-side with multi-select chips)
   - Select All/None theme controls
   - Active filter counter

3. **UI Components**
   - DataTable component with sorting
   - PageHeader component
   - Responsive grid layout
   - Loading states with spinner
   - Error handling with retry
   - Refresh button

### Timeline Detail View (`TimelineDetail.jsx`)
1. **Event Information**
   - Full description
   - Formatted date/time display
   - Memory type indicator
   - Notes section

2. **Related Content Tabs**
   - Characters Involved tab with count
   - Memory/Evidence tab with count
   - Clickable lists linking to character/element details

3. **Relationship Mapper**
   - Toggle-able relationship visualization
   - Shows entity connections
   - Graph depth of 2 levels

4. **Actions**
   - Refresh data
   - Toggle relationship map visibility
   - Edit event (Phase 3 placeholder)
   - Navigate back to list

## API Endpoints Used

1. **`api.getTimelineEvents(filters)`**
   - Endpoint: `GET /timeline`
   - Params: `memType`, `actFocus`
   - Returns: Array of timeline events
   - Used for: List view data

2. **`api.getTimelineEventById(id)`**
   - Endpoint: `GET /timeline/:id`
   - Returns: Single timeline event with relationships
   - Used for: Detail view data

3. **`api.getTimelineGraph(id, depth)`**
   - Endpoint: `GET /timeline/:id/graph`
   - Params: `depth` (default: 2)
   - Returns: Graph data for relationship mapper
   - Used for: Relationship visualization

4. **`api.getTimelineEventsList(filters)`**
   - Endpoint: `GET /timeline/list`
   - Returns: Database-backed timeline events
   - Used for: Dashboard integration

## UI Patterns

1. **React Query Integration**
   - Query keys: `['timelineEvents', filters]`, `['timelineEvent', id]`, `['timelineGraph', id]`
   - Stale time: 5 minutes
   - Cache time: 10 minutes
   - Keep previous data during refetch

2. **Material-UI Components**
   - Paper containers with elevation
   - Grid responsive layout
   - Chips for categorization
   - Tabs for content organization
   - IconButtons for actions

3. **State Management**
   - Local state for filters and UI toggles
   - React Query for server state
   - UseMemo for filtered data optimization

## Journey-Relevant Features

### Direct Journey Connections
1. **Character Activity Timeline**
   - Shows which characters are involved in each event
   - Character count provides quick overview
   - Direct navigation to character details

2. **Temporal Flow**
   - Chronological ordering shows story progression
   - Date sorting reveals event sequences
   - Act Focus indicates story phase

3. **Memory/Evidence Tracking**
   - Links timeline events to physical game elements
   - Shows what evidence is revealed when
   - Tracks memory token distribution

### Critical Story Beats
1. **Act Transitions**
   - Act Focus filtering helps identify phase boundaries
   - Color coding provides visual story arc

2. **Theme Tracking**
   - Multi-theme tagging shows narrative threads
   - Theme filtering reveals story patterns

3. **Character Intersections**
   - Events with multiple characters show key interactions
   - Relationship mapper visualizes connections

## Flow Intelligence Layer Integration

### Temporal Context Display
- **Timeline Markers**: Show events as markers on journey timeline
- **Event Density**: Visualize busy vs. quiet periods
- **Act Boundaries**: Display act transitions on journey

### Pacing Analysis
- **Event Clusters**: Identify rapid sequences vs. gaps
- **Character Load**: Show when characters are overloaded
- **Memory Distribution**: Track token release timing

### Dependencies
- **Event Prerequisites**: Some events depend on others
- **Character Availability**: Events require character presence
- **Evidence Timing**: When memories become available

## Potential Journey View Features

### As Overlay
1. **Timeline Scrubber**
   - Horizontal timeline at bottom of journey view
   - Click to jump to time period
   - Show current position in story

2. **Event Pins**
   - Pin timeline events to journey nodes
   - Show temporal relationships
   - Highlight timing conflicts

3. **Pacing Heatmap**
   - Color overlay showing event density
   - Identify timing bottlenecks
   - Suggest pacing improvements

### As Permanent UI
1. **Mini Timeline**
   - Compressed timeline sidebar
   - Always visible for context
   - Quick time navigation

2. **Event Counter**
   - Show events per act/time period
   - Track completion percentage
   - Memory token status

### As Intelligence Layer
1. **Temporal Analysis**
   - Calculate optimal event spacing
   - Identify timing conflicts
   - Suggest reordering opportunities

2. **Flow Visualization**
   - Animate story progression
   - Show parallel timelines
   - Highlight critical paths

3. **Bottleneck Detection**
   - Find temporal choke points
   - Identify impossible timings
   - Suggest timing adjustments

## Key Insights

1. **Timeline is Story Backbone**
   - All character journeys exist within this temporal framework
   - Events create the rhythm and pacing of the experience
   - Critical for understanding story flow

2. **Multi-Character Coordination**
   - Timeline reveals when characters must interact
   - Shows parallel story threads
   - Identifies scheduling conflicts

3. **Memory Economy Integration**
   - Timeline controls when evidence is available
   - Affects player discovery sequence
   - Must align with journey design

4. **Production Planning**
   - Timeline drives actor scheduling
   - Determines prop/set requirements
   - Critical for run-of-show planning

## Recommendations for Journey Intelligence

1. **Essential Timeline Features**
   - Always show current story time
   - Highlight next/previous events
   - Show event density indicators

2. **Flow Intelligence Must-Haves**
   - Event spacing analysis
   - Pacing recommendations
   - Timing conflict detection

3. **Integration Points**
   - Link journey nodes to timeline events
   - Show temporal dependencies
   - Animate story progression

4. **Designer Tools**
   - Time-based filtering on journey
   - Event reordering suggestions
   - Pacing optimization views