# Troubleshooting Guide
## When You're Lost or Stuck

### "I don't know what I'm supposed to be building"

**Diagnosis Steps**:
1. Check QUICK_REFERENCE.md - What milestone are you on?
2. Open DEVELOPMENT_PLAYBOOK.md - Find your milestone
3. Read the "Acceptance Criteria" for that milestone
4. Look at the PRD mockups in Section 6 for visual reference

**Example**:
- If working on P2.M1.1 (Timeline Structure)
- PRD Section 7.1 shows what the timeline should look like
- Playbook gives exact component structure
- Acceptance criteria tells you when it's "done"

---

### "I implemented something but it doesn't feel right"

**Check Against PRD**:
1. Does it match the Core Vision? (Section 1)
2. Does it follow the UX principles? (Section 6.2)
3. Does it enable the user flows? (Section 6.3)

**Common Misalignments**:
- Building entity-centric instead of journey-centric views
- Missing the dual-lens concept (journey + system)
- Not considering the time-based nature of everything

---

### "The existing code doesn't match what I'm supposed to build"

**This is expected!** StoryForge is entity-centric, we're making it journey-centric.

**Approach**:
1. Keep existing code working (feature flags)
2. Build new features alongside
3. Only modify existing code when necessary
4. Document what you're changing and why

**Example**:
```javascript
// Instead of modifying Dashboard.jsx directly
// Create BalanceDashboard.jsx as new component
// Update routes to point to new component
// Keep old dashboard accessible at /old-dashboard
```

---

### "I don't understand the journey computation logic"

**Journey = Character's 90-minute experience**

**Key Concepts**:
1. **Segments**: 5-minute time blocks (18 total)
2. **Activities**: What they do (find item, solve puzzle)
3. **Interactions**: Who they meet
4. **Discoveries**: What they learn
5. **Gaps**: Segments with no content

**Visual**:
```
0-5 min:   [Activities] [Interactions] [Discoveries]
5-10 min:  [Activities] [----GAP----] [Discoveries]
10-15 min: [Activities] [Interactions] [Discoveries]
```

---

### "The gap detection seems arbitrary"

**Gap Rules** (from game design):
1. **Dead time**: >10 minutes with no activity
2. **Isolation**: >15 minutes with no interactions
3. **No progress**: No discoveries for >20 minutes
4. **Bottlenecks**: Required items not available

**Implementation**:
```javascript
// Gaps are not just empty time
// They're problematic patterns in the journey
if (noActivitiesFor(10) || noInteractionsFor(15)) {
  createGap('high_severity');
}
```

---

### "State management is confusing"

**Three Layers** (PRD Section 5):
1. **UI State** (Zustand): What view, what's selected
2. **Data State** (SQLite + React Query): Journeys, gaps
3. **Sync State**: What needs to sync with Notion

**Data Flow**:
```
Notion → SQLite → React Query → Zustand → Components
         ↑__________________________|
                  (Updates)
```

**Key Principle**: 
- SQLite is source of truth
- Zustand is for UI state only
- React Query handles caching

---

### "I don't know how to test this"

**Test Pyramid for Each Milestone**:

1. **Unit Tests** (Most tests):
   - Individual functions
   - Component rendering
   - Store actions

2. **Integration Tests** (Some tests):
   - API endpoints
   - Store + API
   - Component + Store

3. **E2E Tests** (Few tests):
   - Complete user flows
   - Only for critical paths

**Example for P1.M2.2** (Segment Computation):
```javascript
// Unit test
test('creates 18 segments for 90 minutes', () => {
  const segments = computeSegments(90, 5);
  expect(segments).toHaveLength(18);
});

// Integration test
test('journey engine returns segments with data', async () => {
  const journey = await engine.buildJourney('char-1');
  expect(journey.segments[0].activities).toBeDefined();
});
```

---

### "Performance is terrible"

**Common Culprits**:

1. **Rendering all 18 journeys at once**
   - Solution: Virtual scrolling
   - Only render visible portions

2. **Re-computing on every render**
   - Solution: useMemo for expensive calculations
   - Cache in SQLite

3. **Too many API calls**
   - Solution: Batch requests
   - Use React Query caching

**Performance Checklist**:
- [ ] React DevTools Profiler shows <16ms renders
- [ ] No unnecessary re-renders
- [ ] API calls are batched/cached
- [ ] Large lists use virtualization

---

### "The UI doesn't match the mockups"

**PRD Section 6.1** has the exact layout:
```
┌─────────────────────────────────────────┐
│          COMMAND BAR                    │
├─────────────┬───────────────────────────┤
│   JOURNEY   │      SYSTEM               │
│   SPACE     │      SPACE                │
├─────────────┴───────────────────────────┤
│         CONTEXT WORKSPACE               │
└─────────────────────────────────────────┘
```

**Key Requirements**:
- Command bar is always visible
- Journey/System spaces are resizable
- Context workspace adapts to current task

---

### "I'm lost in the Phase 2 implementation"

**Phase 2 Dependencies**:
```
Timeline Component
    ↓
Dual-Lens Layout
    ↓
Gap Resolution
    ↓
View Sync
```

**Cannot skip ahead!** Each builds on the previous.

**If stuck on Timeline**:
1. Just render the time scale first
2. Add segments
3. Add content to segments
4. Add interactivity last

---

### Recovery Strategies

**When completely lost**:
1. Git stash your changes
2. Go back to last working commit
3. Re-read the milestone in DEVELOPMENT_PLAYBOOK
4. Start with the smallest possible implementation
5. Build incrementally

**Daily Checklist**:
- [ ] Updated QUICK_REFERENCE.md with progress
- [ ] Committed work with milestone reference
- [ ] Ran tests
- [ ] Updated any new findings in this guide

---

### Red Flags You're Off Track

1. **Building features not in current milestone**
2. **Modifying core StoryForge functionality**
3. **Creating new database schemas not in PRD**
4. **Implementing complex UI before basic works**
5. **Working on optimization before functionality**

**Remember**: Make it work → Make it right → Make it fast

---

### Getting Help

Before asking for help, prepare:
1. Current milestone (e.g., "P1.M2.3")
2. What you expected to happen
3. What actually happened
4. What you've tried
5. Relevant code snippet

**Template**:
```
Milestone: P1.M2.3 - Gap Detection
Expected: Detect gaps in journey segments
Actual: No gaps detected even with empty segments
Tried: 
- Verified segments have empty activities array
- Checked gap detection rules
- Added console logs

Code:
[relevant snippet]
```

---

### "I'm getting 404 errors on journey endpoints"

**Root Cause**: SQLite database is empty

**Solution**:
```bash
cd storyforge/backend
node scripts/sync-data.js
```

**Verification**:
```bash
node scripts/sync-data.js --status
# Should show populated records for all tables
```

**Common Issues**:
- Forgot to run sync after fresh clone
- Database file deleted/corrupted
- Sync failed partway through

---

### "Character sync shows foreign key constraint errors"

**Root Cause**: Trying to insert relationships before base data exists

**This has been fixed** in the current codebase with two-phase sync:
1. Phase 1: Sync all base data without relationships
2. Phase 2: Sync all relationships after base data exists

**If you still see this**:
- Pull latest code changes
- Check dataSyncService.js has `syncCharacterRelationships()` method
- Ensure sync runs in correct order

---

### "Puzzle sync is failing with errors"

**Current Known Issue**: 17 out of 32 puzzles fail to sync

**Debugging Steps**:
1. Check sync output for specific error messages
2. Common issues:
   - Missing required fields (name, timing)
   - Malformed relation data
   - Invalid JSON in puzzle_element_ids

**Temporary Workaround**:
- The app will work with partial puzzle data
- Missing puzzles won't break journey computation
- Fix is tracked as task P2.M1.5

**To investigate a specific puzzle**:
```javascript
// In dataSyncService.js syncPuzzles method
console.log('Raw puzzle data:', JSON.stringify(notionPuzzle, null, 2));
console.log('Mapped puzzle:', JSON.stringify(mappedPuzzle, null, 2));
```

---

### "Character relationships aren't showing in the UI"

**Root Cause**: Character links are computed and stored in database but NOT returned by the API

**UPDATE (2025-06-06): This has been FIXED!**

**What was the problem**:
- `character_links` table had 125 relationships
- `getLinkedCharacters` function wasn't implemented
- Journey API wasn't including linked characters in response

**How it was fixed**:
1. Added `getLinkedCharacters` function to `queries.js`
2. Updated `buildCharacterJourney` to fetch and include linked characters
3. Verified working - Marcus Blackwood now returns 11 linked characters

**If still not working**:
```bash
# Check if character_links table has data
cd storyforge/backend
node scripts/debug-links.js
# Should show 125 total links
```

---

### "Database shows 0 records after sync"

**Root Cause**: Database state can get corrupted or sync can fail silently

**Symptoms**:
- `character_links`: 0 records
- `puzzles`: 0 records  
- `elements`: fewer than 100 records

**Solution**:
```bash
# Run a fresh sync
cd storyforge/backend
node scripts/sync-data.js

# Verify all data synced
node scripts/sync-data.js --status
# Should show:
# characters: 22 records
# elements: 100 records
# puzzles: 15 records (17 fail)
# timeline_events: 75 records
# character_links: 125 records
```

**Common Causes**:
- Sync interrupted mid-process
- Database locked by another process
- Network issues during Notion API calls

---

### "Computed fields (Act Focus, Resolution Paths) are null"

**Root Cause**: These fields must be computed after base data sync

**UPDATE (2025-06-06)**: Computation logic has been implemented!

**Implementation Status**:
- ✅ Act Focus - Computed for timeline events from related elements
- ✅ Resolution Paths - Computed for all entities based on patterns
- ❌ Narrative Threads - Fails due to missing database column

**If computed fields are still null**:
1. Ensure full sync completed successfully
2. Check sync output for "Computing derived fields..." section
3. Verify computation completed: "✅ Computed act focus for 75 timeline events"

**Debug specific entity**:
```sql
-- Check if act_focus was computed
SELECT id, description, act_focus FROM timeline_events LIMIT 5;

-- Check if resolution_paths were computed  
SELECT id, name, resolution_paths FROM characters LIMIT 5;
```

---

### "Narrative threads computation fails with 'no such column'"

**Root Cause**: Database migration not applied

**The Problem**:
- Migration file exists: `20250106000000_add_computed_fields.sql`
- Migration system isn't recognizing/applying it
- Column `narrative_threads` doesn't exist in elements table

**Temporary Workaround**:
```bash
# Manually apply the migration
cd storyforge/backend
sqlite3 data/production.db < src/db/migration-scripts/20250106000000_add_computed_fields.sql
```

**Proper Fix**: Debug why migration system isn't picking up new migrations

---

### "I see schema mismatch errors in sync"

**Common Schema Mismatches**:

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "Cannot read property 'Puzzle' of undefined" | Puzzle title field name mismatch | Map both `puzzle` and `name` fields |
| "FOREIGN KEY constraint failed" | Wrong sync order | Already fixed with two-phase sync |
| "Missing required field: timing" | Puzzle has no timing set in Notion | Add validation/defaults |

**Debug Schema Issues**:
```javascript
// Add to notionPropertyMapper.js temporarily
console.log('Available properties:', Object.keys(properties));
console.log('Looking for:', propertyName);
```

**Finding Missing Data**:
```sql
-- Run these in SQLite to see what's missing
SELECT COUNT(*) FROM elements WHERE status IS NULL; -- Should be 100
SELECT COUNT(*) FROM puzzles WHERE story_reveals IS NULL; -- Currently all
SELECT COUNT(*) FROM timeline_events WHERE notes IS NULL; -- Currently all
```

---

### "Why are Act Focus/Resolution Paths/etc. showing as undefined?"

**Root Cause**: These are computed fields that need implementation

**The Confusion**: Frontend expects these fields but they don't exist in Notion. They were incorrectly labeled as "non-existent fields to remove" but they're actually essential computed fields.

**What They Are**:
- **Act Focus** (Timeline Events) - Computed from related elements' acts
- **Narrative Threads** (Puzzles) - Rolled up from reward elements
- **Resolution Paths** (All entities) - Computed from ownership patterns
- **Linked Characters** - Already computed in character_links table

**Implementation Required**:
1. Add computation functions to dataSyncService.js
2. Calculate during sync process
3. Store in database columns
4. Include in API responses

**See**: SCHEMA_MAPPING_GUIDE.md → "Computed Fields" section for complete implementation guide

**Critical Understanding**: These fields ARE the "intelligence" in "Production Intelligence Tool" - they transform raw data into insights.

---

### "How do I know what data should be calculated vs stored?"

**Stored in Notion** (source data):
- Character basics (name, tier, logline)
- Event descriptions and dates
- Element properties
- Puzzle configurations

**Calculated/Inferred** (computed by backend):
- Character links (from shared events/puzzles)
- Path affinities (from element/interaction analysis)
- Memory value totals (from element descriptions)
- Interaction density (from timeline analysis)
- Gap severity (from journey patterns)

**Rule of Thumb**: 
- If it's about ONE entity → Store in Notion
- If it's about RELATIONSHIPS → Calculate in backend
- If it's about PATTERNS → Calculate in backend

---

### "Memory token values aren't being extracted"

**The Problem**: Memory values are embedded in description field

**Format in Notion Elements**:
```
Description: "A memory of the first rave... 
SF_RFID: 12345
SF_ValueRating: 3
SF_MemoryType: Personal"
```

**Extraction Pattern**:
```javascript
function extractMemoryValue(description) {
  const match = description.match(/SF_ValueRating:\s*(\d+)/);
  return match ? parseInt(match[1]) : 0;
}
```

**Where This Should Happen**:
1. During sync (extract and store in separate column)
2. During journey computation (aggregate per character)
3. During path affinity calculation (sum values)

---

### "I need to add a new calculated field"

**Decision Tree**:
1. **Is it derived from existing data?** → Calculate it
2. **Does it change when relationships change?** → Calculate it
3. **Is it expensive to compute?** → Cache it
4. **Is it needed for every request?** → Pre-compute it

**Implementation Steps**:
1. Add column to appropriate table (or create new table)
2. Add computation logic to sync service or journey engine
3. Include in API response
4. Update frontend to use it

**Example - Adding Interaction Density**:
```javascript
// In journeyEngine.js
function calculateInteractionDensity(segments) {
  const totalInteractions = segments.reduce((sum, seg) => 
    sum + seg.interactions.length, 0
  );
  return totalInteractions / segments.length;
}
```

---

### "I don't understand the three resolution paths"

**Quick Reference**:
- **Black Market**: Accumulate wealth through memory trading
- **Detective**: Pursue truth and justice through evidence
- **Third Path**: Community-focused memory recovery

**For Complete Understanding**:
See [active_synthesis_streamlined.md](./game design background/active_synthesis_streamlined.md) Section III.B

**Key Implementation Points**:
- Black Market uses electronic tracking (scanner alliance values)
- Detective evaluates case quality subjectively
- Third Path has NO electronic tracking (trust-based)

**Path Assignment Logic**:
Characters align with paths based on:
- Element ownership (e.g., Black Market card)
- Actions taken (investigating = Detective)
- Community connections (high connections = Third Path)

---

### "What's the memory economy?"

**Memory Token System**:
- Physical RFID tokens worth $100-$10,000
- Type multipliers: Personal ×1, Business ×3, Technical ×5
- Only 3 scanners for 5-20 players (creates scarcity)

**Complete Details**: See [active_synthesis_streamlined.md](./game design background/active_synthesis_streamlined.md) Section III

**For Implementation**:
- Values embedded in Element descriptions as `SF_ValueRating: [1-5]`
- Must extract during sync and calculate totals
- See SCHEMA_MAPPING_GUIDE.md for extraction patterns

---

### "Property 'Resolution Paths' not found in Notion object" Error

**UPDATE (2025-06-07): This has been FIXED!**

**Root Cause**: Previously, the application had a dual data source architecture. The relationship graph endpoints (`/api/notion/*/graph`) were incorrectly querying the Notion API directly, which does not contain computed fields like `Resolution Paths`.

**How it was fixed**:
1.  A new `graphService.js` was created to handle all graph-building logic.
2.  This service uses `queries.js` to fetch all data, including relationships and computed fields, directly from the local SQLite database.
3.  The `notionController.js` was refactored to use this new service, eliminating the direct calls to Notion for graph data.
4.  The application now correctly uses SQLite as the single source of truth for all data, ensuring consistency.

**If you see this error again**: It indicates a regression. Ensure the graph-related routes in `notionController.js` are still using `graphService.js` and not calling `notionService.js` directly.

---

### "Sync fails with 'no such column: narrative_threads'"

**UPDATE (2025-06-07): This has been FIXED!**

**Root Cause**: The database was being initialized and used by the `dataSyncService` *before* the migration scripts had a chance to run. The `20250106000000_add_computed_fields.sql` migration, which adds the `narrative_threads` column, was therefore never applied to the database.

**How it was fixed**:
The core issue was resolved by ensuring a clean database state, which allows the application's startup and sync logic to run in the correct order:
1.  The database is created.
2.  `initializeDatabase` runs, which correctly executes all pending migrations from the `/migration-scripts/` directory.
3.  The `dataSyncService` then runs against a correctly-migrated schema.

**If you see this error again**:
1.  Your database is likely in a corrupted or inconsistent state.
2.  The most reliable solution is to delete the `./data/production.db` file and re-run the sync (`node scripts/sync-data.js`). This will create a fresh, clean, and correctly migrated database.

---

### "Sync fails with 'UNIQUE constraint failed: schema_migrations.version'"

**Root Cause**: This error occurs when a migration script is run against a database where that migration's version has already been logged in the `schema_migrations` table. This happened during debugging when a forced re-run of all migrations was attempted.

**Solution**: This is a clear sign of an inconsistent database state. Do not attempt to manually edit the `schema_migrations` table. The safest and fastest solution is to start fresh:
1.  Delete the database file: `storyforge/backend/data/production.db`
2.  Re-run the data sync: `node scripts/sync-data.js`. This will create a new, clean database and apply all migrations correctly.

---

This guide is meant to get you unstuck quickly. Update it when you solve a confusing problem!
