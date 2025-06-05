# Development Playbook
## Complete Implementation Guide for Production Intelligence Tool

**Version**: 2.0 - Consolidated & Actionable  
**Purpose**: Single source of truth for all implementation steps  
**Principle**: If you're coding, this document tells you exactly what to do

---

## 🎯 Current Development Status

**Active Phase**: Phase 2 - Core Views - Journey & System Lenses
**Active Phase**: Phase 2 - Core Views - Journey & System Lenses
**Current Milestone**: P2.M1 - Player Journey Timeline Component
**Current Task**: P2.M1.X: User Review and Frontend Access (Player Journey Timeline)
**Branch**: `feature/production-intelligence-tool` (Commit changes to this branch)

---

## Phase 1: Foundation - Journey Infrastructure 🚧

### Overview
Backend can compute and serve character journeys with gap detection.

### P1.M1: SQLite Database Layer 🚧

#### P1.M1.1: Install Dependencies & Create Database Service ✅
**File**: `backend/src/db/database.js`

```javascript
// Implementation complete
const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = process.env.DATABASE_PATH || './data/production.db';
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
  }
  
  // Additional methods implemented...
}
```

**Verification**: 
- [x] `npm list better-sqlite3` shows installed
- [x] Database file created at `./data/production.db`
- [x] Can connect and run test query

#### P1.M1.2: Schema Implementation ✅
**Note**: Schema definitions (`CREATE TABLE IF NOT EXISTS`) are located within `backend/src/db/database.js` in the `initializeDatabase` function.

**Verification**:
- [x] All tables created successfully
- [x] Foreign key constraints working
- [x] Test data insertable

#### P1.M1.3: Implement Robust Migration System ✅
**File(s) likely affected**:
- `storyforge/backend/src/db/migrations.js` (major overhaul)
- `storyforge/backend/src/db/database.js` (potential adjustments)
- New directory: `backend/src/db/migration-scripts/`

**Implementation Plan**:
1. Design a schema for a `schema_migrations` table (e.g., `id`, `version`, `name`, `applied_at`).
2. Implement logic in `migrations.js` to:
    - Create the `schema_migrations` table if it doesn't exist.
    - Read all migration script files (e.g., `YYYYMMDDHHMMSS_description.sql`) from `migration-scripts/`.
    - Check against the `schema_migrations` table to determine pending migrations.
    - Apply pending migrations sequentially, recording each in the `schema_migrations` table.
3. Create an initial migration script in `migration-scripts/` containing the current complete schema to establish a baseline.
4. Refactor `initializeDatabase` in `database.js` to rely on the migration system. `runMigrations` should be the primary entry point for schema setup.

**Acceptance Criteria**:
- [x] `schema_migrations` table is created and used to track applied migrations.
- [x] System can apply new SQL migration scripts from a designated directory.
- [x] Initial schema is successfully established via the first migration script.
- [x] `runMigrations` function correctly brings the database schema to the latest version.

### P1.M2: Journey Engine 🚧

#### P1.M2.1: Core Engine Structure ✅
**File**: `backend/src/services/journeyEngine.js`

```javascript
class JourneyEngine {
  constructor() { // constructor(notionService, db)
    // this.notionService = notionService; // Note: Data sourced via dbQueries
    // this.db = db; // Note: db connection likely handled internally or passed differently
  }
**Note**: Data for journey building is primarily sourced via `dbQueries.js` (local database) rather than direct `notionService` calls within `buildCharacterJourney`.

  async buildCharacterJourney(characterId) {
    // 1. Fetch character data (from local DB via dbQueries)
    const character = await this.notionService.getCharacter(characterId); // Placeholder, actual is via dbQueries
    
    // 2. Fetch related data (events, puzzles, elements from local DB via dbQueries)
    const events = await this.notionService.getCharacterEvents(characterId); // Placeholder
    const puzzles = await this.notionService.getCharacterPuzzles(characterId); // Placeholder
    const elements = await this.notionService.getCharacterElements(characterId); // Placeholder
    
    // 3. Compute segments
    const segments = this.computeJourneySegments(character, events, puzzles, elements);
    
    // 4. Detect gaps
    const gaps = this.detectGaps(segments);
    
    // 5. Cache in database // Addressed by P1.M2.4
    // this.cacheJourney(characterId, segments, gaps);
    
    return { character, segments, gaps };
  }
  
  // Additional methods implemented...
}
```

**Verification**:
- [x] Can instantiate JourneyEngine
- [x] All methods defined
- [x] Data Sourcing: Confirmed that JourneyEngine sources data for journey construction via the local database (dbQueries.js), per architectural design (Notion sync is handled separately).

#### P1.M2.2: Segment Computation ✅
**Implementation**: Creates 5-minute segments for 90-minute journey

```javascript
computeJourneySegments(character, events, puzzles, elements) {
  const segments = [];
  
  for (let minute = 0; minute < 90; minute += 5) {
    const segment = {
      id: `${character.id}-${minute}`,
      characterId: character.id,
      startMinute: minute,
      endMinute: minute + 5,
      activities: this.findActivitiesInRange(minute, minute + 5, puzzles, elements),
      interactions: this.findInteractionsInRange(minute, minute + 5, events),
      discoveries: this.findDiscoveriesInRange(minute, minute + 5, elements),
      gapStatus: null // Set by gap detection
    };
    segments.push(segment);
  }
  
  return segments;
}
```

**Verification**:
- [x] Generates 18 segments (90 min / 5 min)
- [x] Each segment has correct structure
- [x] Time ranges are continuous

#### P1.M2.3: Gap Detection Algorithm ✅
**Implementation**: Identifies empty segments and bottlenecks

```javascript
detectGaps(segments) {
  const gaps = [];
  
  segments.forEach((segment, index) => {
    const hasContent = 
      segment.activities.length > 0 || 
      segment.interactions.length > 0 || 
      segment.discoveries.length > 0;
    
    if (!hasContent) {
      // Check if this is part of a larger gap
      const gapStart = this.findGapStart(segments, index);
      const gapEnd = this.findGapEnd(segments, index);
      
      // Only create gap if we're at the start of a gap sequence
      if (index === gapStart) {
        gaps.push({
          id: `gap-${segment.characterId}-${segment.startMinute}`,
          characterId: segment.characterId,
          startMinute: segments[gapStart].startMinute,
          endMinute: segments[gapEnd].endMinute + 5,
          severity: this.calculateSeverity(gapEnd - gapStart + 1),
          type: 'empty',
          suggestedSolutions: [] // Note: Actual gap objects do not include a 'type' field.
        });
      }
    }
  });
  
  return gaps;
}
```

**Verification**:
- [x] Identifies all empty segments
- [x] Groups consecutive gaps
- [x] Calculates severity correctly

#### P1.M2.4: Implement Journey Caching in Database ✅

**File(s) likely affected**:
- `backend/src/services/journeyEngine.js` (modify `buildCharacterJourney`)
- `backend/src/db/queries.js` (new queries to write/read cached journeys)
- `backend/src/db/database.js` (potential schema changes for caching tables/fields)

**Implementation Plan**:
1. Determine schema for storing computed/cached journeys (e.g., new tables like `computed_journey_segments` or adapt existing ones).
2. Modify `buildCharacterJourney` in `journeyEngine.js`:
    - Before computation, attempt to fetch a previously computed journey for the `characterId`.
    - If a valid cached journey exists (e.g., based on TTL or data change detection), return it.
    - Otherwise, compute the journey and then save the resulting segments and gaps to the database.
3. Add necessary functions to `db/queries.js` for these save/retrieve operations.

**Acceptance Criteria**:
- [x] `buildCharacterJourney` first attempts to retrieve a computed journey from the database.
- [x] If cached journey is found and valid, it's returned without re-computation.
- [x] If no valid cached journey, it's computed and then the results are stored in the database.

### P1.M3: API Endpoints 🚧

#### P1.M3.1: Journey Routes ✅
**Files**: Route definitions are primarily in `backend/src/routes/journeyRoutes.js` (mounted at `/api`). See also `backend/src/index.js` for how routes are mounted.

```javascript
// GET /api/journeys/:characterId
router.get('/journeys/:characterId', async (req, res) => {
  try {
    const journey = await journeyController.getJourney(req.params.characterId);
    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/journeys/:characterId/gaps
router.get('/journeys/:characterId/gaps', async (req, res) => {
  try {
    const gaps = await journeyController.getGaps(req.params.characterId);
    res.json(gaps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Verification**:
- [x] Routes registered in Express
- [x] Return correct data structure
- [x] Error handling works

#### P1.M3.2: Gap Management Endpoints ✅
**Implementation**: CRUD operations for gaps

```javascript
// GET /api/gaps/all
router.get('/gaps/all', async (req, res) => {
  try {
    const gaps = await gapController.getAllGaps();
    res.json(gaps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

**Task: Implement `POST /api/gaps/:gapId/resolve` Endpoint** ✅

**File(s) likely affected**:
- `backend/src/routes/journeyRoutes.js` (add route)
- `backend/src/controllers/journeyController.js` (new `resolveGap` handler)
- `backend/src/db/queries.js` (new query to update gap in DB)

**Implementation Plan**:
1. Define `router.post('/gaps/:gapId/resolve', resolveGap);` in `journeyRoutes.js`.
2. Implement `resolveGap` controller in `journeyController.js` to handle request body (e.g., status, comment) and call DB query.
3. Implement DB query in `queries.js` to update the gap record.

**Acceptance Criteria (for the POST endpoint)**:
- [x] `POST /api/gaps/:gapId/resolve` endpoint is implemented and functional.
- [x] Endpoint accepts a payload to update the gap (e.g., new status, resolution notes).
- [x] The corresponding gap record in the database is updated correctly.
- [x] Appropriate success or error responses are returned.
```

**Verification**:
- [x] Can fetch all gaps across characters
- [x] Resolution endpoint (`POST /api/gaps/:gapId/resolve`) accepts payload (status, comment) and updates database correctly.
- [x] Appropriate success/error responses are returned by the endpoint.

### P1.M4: Frontend State Foundation ✅

#### P1.M4.1: Journey Store Setup ✅
**File**: `frontend/src/stores/journeyStore.js`

```javascript
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { api } from '../services/api';

const useJourneyStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      activeCharacterId: null,
      journeyData: new Map(),
      gaps: new Map(),
      selectedTimeRange: [0, 90],
      selectedGap: null,
      
      // Actions
      setActiveCharacter: (characterId) => 
        set({ activeCharacterId: characterId }),
      
      loadJourney: async (characterId) => {
        try {
          const data = await api.getJourney(characterId);
          set(state => ({
            journeyData: new Map(state.journeyData).set(characterId, data),
            gaps: new Map(state.gaps).set(characterId, data.gaps)
          }));
        } catch (error) {
          console.error('Failed to load journey:', error);
        }
      },
      
      selectGap: (gap) => set({ selectedGap: gap }),
      
      // Computed (via selectors)
      selectors: {
        getActiveJourney: () => {
          const state = get();
          return state.journeyData.get(state.activeCharacterId);
        },
        
        getActiveGaps: () => {
          const state = get();
          return state.gaps.get(state.activeCharacterId) || [];
        }
      }
    }))
  )
);
```

**Verification**:
- [x] Store creates successfully
- [x] Can load journey data
- [x] Selectors return correct data

#### P1.M4.2: User Review and Frontend Access (Phase 1 End)

**Expected Frontend State:**
- While no interactive UI components are built in Phase 1, the frontend's `journeyStore.js` is capable of fetching and managing character journey data (segments, activities, interactions, discoveries) and gap information from the backend API.

**Accessing for Review:**
- **Method:** Developer-assisted demonstration or via a temporary debug interface.
- **Steps (Developer Lead):**
    1. Run the backend server.
    2. Run the frontend application.
    3. Using browser developer tools or a temporary debug view, demonstrate that selecting/inputting a `characterId` triggers API calls to `/api/journeys/:characterId`.
    4. Show that the `journeyStore` is populated with the expected data structures:
        - Journey segments (e.g., 18 segments for a 90-minute journey).
        - Associated activities, interactions, and discoveries within segments.
        - Identified gaps with their start and end times.

**Key Review Goals:**
- Verify that the frontend can successfully connect to the backend API.
- Confirm that character journey data and gap information are fetched and structured correctly in the frontend state store (`journeyStore.js`).
- Check for any errors during data fetching or processing in the browser console.

---

## Phase 2: Core Views - Journey & System Lenses 🚧

### Overview
Build the dual-lens interface with Player Journey Timeline as centerpiece.

### P2.M1: Player Journey Timeline Component 🚧

#### P2.M1.1: Basic Timeline Structure ✅
**File**: `frontend/src/components/PlayerJourney/TimelineView.jsx`

```jsx
import React from 'react';
import { Box, Paper } from '@mui/material';
import { useJourneyStore } from '../../stores/journeyStore';

const TimelineView = () => {
  const journey = useJourneyStore(state => state.selectors.getActiveJourney());
  
  if (!journey) {
    return <Box>Select a character to view their journey</Box>;
  }
  
  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      // <TimelineHeader character={journey.character} /> // Note: Header functionality (character name display) is integrated directly into TimelineView.
      // <TimelineRuler /> // Note: Ruler functionality (time interval display) is integrated directly.
      // <TimelineSegments segments={journey.segments} /> // Note: Segment rendering is integrated, utilizing ActivityBlock.jsx for items.
      // <GapIndicators gaps={journey.gaps} /> // Note: Uses singular GapIndicator.jsx component in a loop for each gap.
    </Paper>
  );
};
```

**Verification**:
- [x] Component renders without errors
- [x] Shows loading state
- [x] Displays basic timeline structure

#### P2.M1.2: Segment Visualization ✅
**Note**: The functionality for segment visualization is primarily handled within `frontend/src/components/PlayerJourney/TimelineView.jsx`, utilizing the `ActivityBlock.jsx` component for displaying individual activities, interactions, and discoveries. There is no separate `TimelineSegment.jsx` file.

```jsx
// const TimelineSegment = ({ segment, index }) => {
//   const { activities, interactions, discoveries } = segment;
//   const isEmpty = !activities.length && !interactions.length && !discoveries.length;
  
//   return (
//     <Box
//       sx={{
//         position: 'absolute',
//         left: `${(segment.startMinute / 90) * 100}%`,
//         width: `${(5 / 90) * 100}%`,
//         height: '100%',
//         borderRight: '1px solid #333',
//         backgroundColor: isEmpty ? '#ff000020' : 'transparent',
//         '&:hover': { backgroundColor: '#ffffff10' }
//       }}
//     >
//       {/* {activities.map(activity => (
//         <ActivityIcon key={activity.id} activity={activity} /> // Note: Items rendered via ActivityBlock.jsx
//       ))} */}
//       {/* {interactions.map(interaction => (
//         <InteractionLine key={interaction.id} interaction={interaction} /> // Note: Items rendered via ActivityBlock.jsx
//       ))} */}
//       {/* {discoveries.map(discovery => (
//         <DiscoveryMarker key={discovery.id} discovery={discovery} /> // Note: Items rendered via ActivityBlock.jsx
//       ))} */}
//     </Box>
//   );
// };
// The snippet below illustrated the intended logic for displaying segment items. This is now primarily handled by ActivityBlock.jsx within TimelineView.jsx.
```

**Verification**:
- [x] Segments positioned correctly
- [ ] Empty segments highlighted // Implemented differently: shows message for empty 5-min intervals in selected range.
- [ ] Content icons display // Uses ActivityBlock with text Chips, not specific icons.

#### P2.M1.3: Timeline Interactivity ✅
**Implementation Goal**: Add zoom, pan, and click interactions

```jsx
const TimelineControls = () => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  
  return (
    <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
      <IconButton onClick={() => setZoom(Math.min(zoom * 1.2, 5))}>
        <ZoomInIcon />
      </IconButton>
      <IconButton onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))}>
        <ZoomOutIcon />
      </IconButton>
      <IconButton onClick={() => { setZoom(1); setPan(0); }}>
        <CenterFocusIcon />
      </IconButton>
    </Box>
  );
};
```

**Acceptance Criteria**:
- [x] Can zoom in/out (0.5x to 5x)
- [x] Can pan when zoomed
- [x] Click segment to see details
- [x] Keyboard shortcuts (Ctrl+scroll for zoom)
- [ ] Touch gestures on mobile

**Test Implementation**:
```javascript
// frontend/src/components/PlayerJourney/__tests__/TimelineView.test.jsx
describe('Timeline Interactivity', () => {
  it('should zoom in when zoom in button clicked', () => {
    const { getByLabelText } = render(<TimelineView />);
    const zoomIn = getByLabelText('Zoom in');
    fireEvent.click(zoomIn);
    // Assert transform scale increased
  });
  
  it('should pan when dragged while zoomed', () => {
    // Test pan functionality
  });
});
```

#### P2.M1.4: Gap Highlighting & Selection ✅
**Waiting on**: P2.M1.3 completion

**Implementation Plan**:
1. Visual gap indicators with severity colors ✅ (Implemented in GapIndicator.jsx)
2. Click gap to select in store ✅ (Implemented in GapIndicator.jsx)
3. Hover to preview gap details ✅
4. Animated attention indicators ✅

### P2.M1.X: User Review and Frontend Access (Player Journey Timeline)
*(Note: This review point assumes completion of P2.M1.1 through P2.M1.4)*

**Expected Frontend State:**
- The `TimelineView.jsx` component is implemented and integrated, providing a visual representation of character journeys.
- The timeline should display segments, activities, interactions, discoveries, and highlight identified gaps.
- Basic timeline interactivity (zoom, pan, click for details - subject to P2.M1.3 completion) should be functional.

**Accessing for Review:**
- **Method:** Run the full application (backend and frontend) and navigate to the Player Journey Timeline view.
- **Steps:**
    1. Ensure the backend server is running and serving data.
    2. Start the frontend development server (e.g., `npm run dev` or equivalent in `storyforge/frontend`).
    3. Open the application in a web browser.
    4. Navigate to a specific character's detail page (e.g., `/characters/:id`). From there, click the 'Player Journey' button in the page actions area. This will set the active character and navigate to the Player Journey Timeline view (`/player-journey`).

**Key Review Goals:**
- **Visual Accuracy:**
    - Timeline displays with a clear header, time ruler, and 18 chronological segments for a 90-minute journey.
    - Activities, interactions, and discoveries are represented as icons/markers within the correct time segments.
    - Empty segments are visually distinct (e.g., different background color).
    - Identified gaps are highlighted on the timeline (severity colors if P2.M1.4 is complete).
    - Spot-check data accuracy for a few key events against Notion or test data.
- **Interactivity (as per P2.M1.3 completion):**
    - **Zoom:** The timeline can be zoomed in and out using available controls.
    - **Pan:** When zoomed, the timeline can be panned horizontally.
    - **Selection/Details:** Clicking on a segment, event, or gap provides more details or highlights it (specifics depend on P2.M1.4 implementation for gaps).
- **Responsiveness & Errors:**
    - The timeline view loads without errors in the console.
    - Basic responsiveness is adequate (no major layout breaks).
- **Character Switching:** Navigating to a different character's detail page and clicking their 'Player Journey' button correctly updates the timeline to show that specific character's journey.

### P2.M2: Gap Resolution Workflow 🚧

#### P2.M2.1: Context Panel ⏳
**Waiting on**: P2.M1.3 completion

**File**: `frontend/src/components/GapResolution/ContextPanel.jsx`

**Implementation Plan**:
```jsx
const ContextPanel = () => {
  const selectedGap = useJourneyStore(state => state.selectedGap);
  
  if (!selectedGap) return null;
  
  return (
    <Paper sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
      <GapDetails gap={selectedGap} />
      <SuggestedSolutions gap={selectedGap} />
      <QuickActions gap={selectedGap} />
    </Paper>
  );
};
```

#### P2.M2.2: Smart Suggestions ⏳
**Waiting on**: P2.M2.1 completion

**Backend Integration Required**:
- Endpoint: `GET /api/gaps/:gapId/suggestions`
- Returns: Ranked list of content that could fill gap
- Considers: Time availability, character proximity, theme

### P2.M3: Layout Restructuring ⏳

#### P2.M3.1: Dual-Lens Layout ⏳
**Waiting on**: Timeline component completion

**File**: `frontend/src/components/Layout/DualLensLayout.jsx`

**Implementation Plan**:
1. Split screen with resizable divider
2. Journey Space (left) - Timeline focus
3. System Space (right) - Analytics focus
4. Context Workspace (bottom) - Adaptive
5. Command Bar (top) - Persistent

### P2.M4: View Synchronization ⏳

#### P2.M4.1: Shared State Management ⏳
**Waiting on**: Layout implementation

**Implementation**: Cross-view state coordination
- Selected time range affects both views
- Character selection updates analytics
- Gap selection shows system impact

---

## Phase 3: System Intelligence 📅

### Overview
Add system-wide analytics and balance monitoring.

### P3.M1: Balance Dashboard 📅

#### P3.M1.1: Three-Path Metrics
**File**: `frontend/src/components/SystemViews/BalanceDashboard.jsx`

**Implementation Plan**:
1. Calculate path values from journey data
2. Visual comparison (bar charts)
3. Trend analysis over time
4. Imbalance warnings

#### P3.M1.2: Path Simulation
**Backend Required**: 
- `POST /api/balance/simulate`
- Input: Proposed changes
- Output: Predicted impact

### P3.M2: Interaction Matrix 📅

#### P3.M2.1: Heat Map Visualization
**Implementation**: D3.js or Canvas-based matrix
- 19x19 character grid
- Color intensity = interaction frequency
- Time-based filtering

#### P3.M2.2: Isolation Detection
**Algorithm**: Find characters with low interaction scores
- Warning thresholds
- Suggested pairings
- Time slot availability

### P3.M3: Timeline Archaeology 📅

#### P3.M3.1: Event Surface Map
**Visualization**: How past events emerge in gameplay
- Vertical timeline (19 years)
- Discovery probability
- Connected elements

---

## 🛠️ Implementation Guidelines

### Code Standards

#### File Naming
```
ComponentName.jsx       // React components
componentName.js        // Regular JS files
ComponentName.test.jsx  // Test files
use-hook-name.js       // Custom hooks
```

#### Commit Messages
```
Complete P1.M2.3 - Gap detection algorithm
Fix P2.M1.2 - Segment positioning issue  
WIP P2.M1.3 - Timeline zoom controls
```

#### Testing Requirements
- Unit tests for all utility functions
- Integration tests for API endpoints
- Component tests for user interactions
- E2E tests for critical paths

### Development Flow

1. **Start Task**
   - Check this playbook for current task
   - Create feature branch: `feature/P2.M1.3-timeline-interactivity`
   - Write tests first (TDD)

2. **During Development**
   - Implement acceptance criteria
   - Run tests frequently
   - Check against PRD UI specs
   - Update progress markers

3. **Complete Task**
   - All tests passing
   - Code reviewed (or self-reviewed)
   - Update this playbook's verification checkboxes
   - Merge to main branch

### Common Patterns

#### API Integration
```javascript
// Always use try-catch with loading states
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await api.getSomething();
    // Process data
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### State Updates
```javascript
// Always use immutable updates
set(state => ({
  ...state,
  someMap: new Map(state.someMap).set(key, value),
  someArray: [...state.someArray, newItem]
}));
```

---

## 🚨 Current Blockers & Dependencies

### Active Blockers
- None currently

### Dependency Chain
```
P2.M1.3 (Current) 
  → P2.M1.4 (Gap Selection)
    → P2.M2.1 (Context Panel)
      → P2.M2.2 (Suggestions)
        → P2.M3.1 (Layout)
```

### External Dependencies
- Notion API rate limits (3 req/sec)
- SQLite performance with large datasets
- React Flow license for timeline?

---

## 📊 Progress Tracking

### Phase 1: ✅ Complete (All Phase 1 Milestones: P1.M1, P1.M2, P1.M3, P1.M4 are complete.)
- P1.M1: Database Layer ✅
- P1.M2: Journey Engine ✅
- P1.M3: API Endpoints ✅ (P1.M3.1 ✅, P1.M3.2 ✅)
- P1.M4: State Foundation ✅

### Phase 2: 🚧 In Progress (1/4 milestones fully complete)
- P2.M1: Timeline Component ✅ (P2.M1.1, P2.M1.2, P2.M1.3, P2.M1.4 are ✅)
- P2.M2: Gap Resolution ⏳ (0/2 tasks)
- P2.M3: Layout ⏳ (0/1 tasks)
- P2.M4: Sync ⏳ (0/1 tasks)

Overall: ~45% Complete (P1.M1, P1.M2, P1.M3, P1.M4, P2.M1 are fully complete milestones. Total milestones for P1, P2 & P3 = 11.)

---

## 🔍 Quick Task Lookup

**What should I work on?**
→ Check "CURRENT TASK" at the top

**Where is the code?**
→ Each task shows exact file paths

**How do I know it's done?**
→ Check the acceptance criteria

**What's next?**
→ Follow the dependency chain

**I'm stuck?**
→ Check blockers, then TROUBLESHOOTING.md

---

This playbook is the single source of truth. If it's not here, ask before implementing.
