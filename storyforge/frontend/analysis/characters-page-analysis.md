# Characters Page Analysis

## Overview
The Characters page (`/characters`) serves as a production hub for managing character data in About Last Night. It provides a comprehensive view of all characters with filtering, analytics, and navigation to detailed character views.

## Features Inventory

### 1. Data Display & Table Features
- **DataTable Component**: Sortable, searchable table with custom columns
- **Search**: Full-text search across character names and loglines
- **Pagination**: Handled by DataTable component
- **Row Click Navigation**: Navigates to `/characters/{id}` for detailed view
- **Initial Sort**: By name, ascending

### 2. Filtering System
- **Type Filter**: Player vs NPC
- **Tier Filter**: Core, Secondary, Tertiary
- **Resolution Path Filter**: Black Market, Detective, Third Path, Unassigned
- **Filter Persistence**: Through React Query cache keys

### 3. Dashboard Analytics Cards
- **Character Roster**: Total count with tier distribution breakdown
- **Path Balance**: Distribution across three resolution paths + unassigned
- **Memory Economy**: Total tokens, average per character, progress bar
- **Production Readiness**: Characters fully configured vs needing work

### 4. Production Issues Alert
- **Warning System**: Detects and displays production issues
- **Issue Types**:
  - Path assignment warnings (>20% unassigned)
  - Social isolation warnings (>15% isolated)
  - Path imbalance notifications
  - Memory economy warnings (<45 tokens)
- **Action Link**: Navigates to Resolution Path Analyzer

### 5. Actions
- **Refresh Button**: Invalidates cache and refetches data
- **Add Character**: Placeholder for Phase 3 (shows alert)

## API Endpoints Used
- `api.getCharacters(filters)` - Fetches character list with optional type/tier filters
- Uses React Query for caching (5-minute stale time)
- Query key: `['characters', filters]`

## UI Components & Patterns
- **Material-UI Components**: Paper, Grid, Card, Chip, Button, Select, Alert
- **Custom Components**:
  - `PageHeader` - Consistent page header with actions
  - `DataTable` - Reusable table component
  - `CharacterDashboardCards` - Analytics visualization
  - `CharacterFilters` - Filter controls
  - `ProductionIssuesAlert` - Issue detection display
  - `ErrorBoundary` - Error handling wrapper
- **Loading States**: Skeleton loader for initial load, spinner for refresh
- **Empty States**: Contextual messages based on filters

## Data Displayed in Table

| Column | Data | Format | Width |
|--------|------|--------|-------|
| Name | Character name | Text | 18% |
| Type | Player/NPC | Color-coded chip with icon | 8% |
| Tier | Core/Secondary/Tertiary | Color-coded chip | 8% |
| Resolution Paths | Path assignments | Abbreviated chips (max 2 shown) | 12% |
| Act Focus | Act 1/2/3 | Color-coded chip | 8% |
| Logline | Character description | Text | 25% |
| Memory Tokens | Token count | X of Y format | 8% |
| Connections | Social link count | Chip with icon | 8% |
| Events | Event count | Number | 5% |

## Feature Categorization

### Journey-Critical Features
These are essential for journey design workflow:
- **Resolution Path Display**: Shows which narrative paths each character belongs to
- **Act Focus**: Indicates when characters are most active in the journey
- **Memory Token Count**: Critical for memory economy balance
- **Character Connections**: Essential for understanding social dynamics
- **Path Balance Analytics**: Ensures even distribution across paths
- **Production Issues Detection**: Identifies journey-breaking problems

### Journey-Relevant Features
Helpful for journey design but not essential:
- **Character Type (Player/NPC)**: Useful context for journey planning
- **Character Tier**: Helps prioritize core vs secondary characters
- **Event Count**: Indicates character involvement level
- **Logline**: Quick character context
- **Production Readiness Metrics**: Overall health indicators

### General Reference Features
Not specific to journey design:
- **Add Character Button**: Administrative function (Phase 3)
- **Basic filtering by type/tier**: General browsing
- **Alphabetical sorting**: General organization
- **Search functionality**: General navigation

## Intelligence Layer Integration Opportunities

### As Overlay Information
When selecting a character node in journey view:
- **Memory Token Details**: Show specific tokens owned
- **Social Connections**: Visual links to other characters
- **Resolution Path Membership**: Highlight path participation
- **Production Issues**: Character-specific warnings

### As Context Panel Content
When a character is selected:
- **Full Character Stats**: All table columns in detail
- **Analytics Summary**: Tier, path, connections, tokens
- **Production Warnings**: Specific issues for this character
- **Quick Actions**: Navigate to detail page, view connections

### As Intelligence Layer Data
For the 5 proposed intelligence layers:

1. **Flow Intelligence**: Act focus data shows timing
2. **Dependency Intelligence**: Character connections reveal dependencies
3. **Memory Economy**: Token counts and distribution
4. **Social Intelligence**: Connection counts and network analysis
5. **Production Intelligence**: Issue detection and readiness metrics

## Key Insights for Journey Design

1. **Path Assignment is Critical**: The page heavily emphasizes resolution path assignment as a key production metric
2. **Memory Economy Integration**: Token counting is built into the core display
3. **Social Network Awareness**: Connection counting helps identify isolated characters
4. **Production Health Monitoring**: Multiple analytics track journey readiness
5. **Act-Based Organization**: Act focus helps with timing and pacing

## Migration Recommendations

For the unified journey view:
1. **Keep Analytics as Toggle Layer**: Path balance and memory economy visualizations
2. **Embed Key Metrics**: Resolution paths and connections in node tooltips
3. **Preserve Issue Detection**: Make production warnings prominent
4. **Simplify Filters**: Focus on journey-relevant filters (paths, acts)
5. **Context Panel Details**: Move full character details to selection panel