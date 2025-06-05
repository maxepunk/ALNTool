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

This guide is meant to get you unstuck quickly. Update it when you solve a confusing problem!
