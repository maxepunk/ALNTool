# Day 9 Testing Checklist: Real-World Integration
**Date**: January 14, 2025  
**Goal**: Test JourneyIntelligenceView with real production data (400+ elements)  
**Success Criteria**: <2s load time, proper aggregation, no crashes

## Pre-Testing Setup

### 1. Start Servers with tmux
```bash
# Create new tmux session
tmux new -s alntool

# Terminal 1 - Backend (Ctrl+b, c for new window)
cd storyforge/backend
npm run dev
# Verify running on http://localhost:3001
# Check console for "Notion sync completed"

# Terminal 2 - Frontend (Ctrl+b, c for new window)
cd storyforge/frontend
npm run dev
# Navigate to http://localhost:3000/journey-intelligence

# Switch between windows: Ctrl+b, n (next) or Ctrl+b, p (previous)
# Detach from tmux: Ctrl+b, d
# Reattach later: tmux attach -t alntool
```

### 3. Open Developer Tools
- Chrome DevTools: Cmd+Opt+I (Mac) / Ctrl+Shift+I (Windows)
- React DevTools: Components tab → Profiler
- Network tab: Check API response times
- Performance tab: Ready to record

---

## Performance Testing Checklist

### Initial Load Performance
- [ ] Measure time from page refresh to first render
- [ ] Check React Query cache initialization
- [ ] Verify all API calls complete < 2s
- [ ] Document memory usage baseline

### 50-Node Aggregation Testing
- [ ] Load overview mode - verify node count
- [ ] Confirm aggregation triggers at >50 nodes
- [ ] Test expanding aggregated groups
- [ ] Verify re-aggregation maintains limit
- [ ] Check visual hierarchy (connected → secondary → background)

### Entity Selection Performance
- [ ] Select character - measure transition time
- [ ] Verify focus mode reduces visible nodes
- [ ] Test all entity types (character, element, puzzle, timeline)
- [ ] Measure intelligence panel update speed
- [ ] Check for unnecessary re-renders

---

## User Journey Testing

### Sarah's Journey: Character Development
1. [ ] Select "Sarah Mitchell" character
2. [ ] Toggle Story Intelligence - verify timeline connections
3. [ ] Toggle Content Gaps - identify missing content
4. [ ] Check intelligence calculations match expected values
5. [ ] Document any discrepancies

### Marcus's Journey: Puzzle Dependencies  
1. [ ] Select a puzzle entity
2. [ ] Toggle Social Intelligence - verify collaboration mapping
3. [ ] Check reward impact analysis
4. [ ] Verify cross-character dependencies display
5. [ ] Test production requirements visibility

### Alex's Journey: Production Tracking
1. [ ] Toggle Production Intelligence layer
2. [ ] Select elements with RFID tags
3. [ ] Verify prop dependency tracking
4. [ ] Check critical missing items highlighting
5. [ ] Test production status accuracy

### Jamie's Journey: Content Gaps
1. [ ] Toggle Content Gaps layer
2. [ ] Select underdeveloped character
3. [ ] Verify gap identification accuracy
4. [ ] Check integration opportunities
5. [ ] Test suggestion relevance

---

## API Response Validation

### Elements API (?filterGroup=memoryTypes)
- [ ] Returns 400+ elements
- [ ] Has `type` field (not `basicType`)
- [ ] Includes calculated_memory_value
- [ ] Contains group_multiplier data

### Character Journey API
- [ ] Returns proper graph structure
- [ ] Includes nodes and edges
- [ ] Has character_info metadata
- [ ] Optimized for <50 nodes

### Error Handling
- [ ] Test with backend stopped
- [ ] Verify error states display
- [ ] Check retry functionality
- [ ] Confirm no console errors

---

## Bug Documentation Template

### Issue: [Brief Description]
- **Steps to Reproduce**: 
- **Expected Behavior**: 
- **Actual Behavior**: 
- **Performance Impact**: 
- **User Impact**: 
- **Priority**: High/Medium/Low
- **Screenshots/Videos**: 

---

## Performance Metrics to Record

1. **Initial Load**
   - Time to Interactive: ___ms
   - Total Bundle Size: ___MB
   - API Response Times: ___ms

2. **Runtime Performance**
   - FPS during transitions: ___
   - Memory usage after 10min: ___MB
   - React render counts: ___

3. **Aggregation Performance**
   - Time to aggregate 400 nodes: ___ms
   - Expand/collapse animation: ___ms
   - Re-render count on expansion: ___

---

## End-of-Day Summary

### What Worked Well
- 

### Issues Found
- 

### Performance Bottlenecks
- 

### Priority Fixes for Day 11
1. 
2. 
3. 

### Questions for Team
- 

---

*Remember: We're testing with REAL data for the first time. Expect surprises!*