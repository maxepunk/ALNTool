# Phase 2 Implementation Priorities

## Immediate Action Required (Day 1 Morning)

### 1. Fix App Loading Issue (30 minutes)
**Owner**: interaction_lead
**File**: storyforge/frontend/src/App.jsx

```javascript
// Change line 46 from:
cacheTime: 10 * 60 * 1000,
// To:
gcTime: 10 * 60 * 1000,

// Add proper error handling:
onError: (error) => {
  console.error('Metadata query failed:', error);
  setInitialLoading(false);
}
```

### 2. Fix API Imports (1 hour)
**Owner**: graph_lead
**Files**: All intelligence layers and managers

Search and replace pattern:
```javascript
// Find: import { getCharacters, getElements } from '../../services/api';
// Replace: import { api } from '../../services/api';
// Update calls: api.getCharacters() instead of getCharacters()
```

## Day 1-2: Core Functionality Restoration

### Graph Rendering Fix (Day 1)
**Owner**: graph_lead
- Debug why graphData.nodes is empty
- Verify data flow from API to ReactFlow
- Test with sample data first
- Implement proper error boundaries

### Basic Interactions (Day 1)
**Owner**: interaction_lead
- Verify entity selection works
- Fix hover state tooltips
- Implement basic keyboard navigation (arrows, enter, tab)
- Add loading states for all components

### Backend Connection (Day 2)
**Owner**: intelligence_lead
- Connect intelligence computation endpoints
- Move heavy calculations server-side
- Implement proper caching strategy
- Add performance monitoring

## Day 3-4: Feature Completion

### Missing Phase 1 Features (Day 3)
**Owner**: interaction_lead & graph_lead
- Multi-select with Shift/Ctrl
- Keyboard shortcuts documentation
- Accessibility (ARIA labels, focus management)
- Error recovery mechanisms

### Performance Optimization (Day 4)
**Owner**: intelligence_lead & graph_lead
- Bundle size reduction (target: 500KB)
- Lazy loading for intelligence layers
- Virtual scrolling for entity lists
- Progressive entity loading

## Day 5-6: Polish & Validation

### UX Vision Validation (Day 5)
**Owner**: Orchestrator (with Playwright)
- Test all user workflows
- Screenshot documentation
- Performance benchmarking
- Accessibility audit

### Documentation Update (Day 6)
**Owner**: documentation_lead
- Update CLAUDE.md with accurate status
- Create user guide with screenshots
- Document keyboard shortcuts
- Update API documentation

## Success Criteria Checklist

### Minimum Viable Product (End of Day 2)
- [ ] App loads successfully
- [ ] Graph displays entities
- [ ] Click selection works
- [ ] Basic intelligence data visible

### Feature Complete (End of Day 4)
- [ ] All interactions functional
- [ ] Keyboard navigation complete
- [ ] Performance acceptable (3s load)
- [ ] All 5 intelligence layers working

### Production Ready (End of Day 6)
- [ ] All tests passing
- [ ] Documentation accurate
- [ ] Bundle size optimized
- [ ] Accessibility compliant
- [ ] No console errors

## Specialist Task Allocation

### graph_lead
1. Fix API imports in graph components
2. Debug empty graph issue
3. Implement visual hierarchy
4. Optimize rendering performance

### interaction_lead
1. Fix App.jsx loading issue
2. Complete keyboard navigation
3. Implement multi-select
4. Add accessibility features

### intelligence_lead
1. Move computation server-side
2. Connect all backend endpoints
3. Implement caching strategy
4. Monitor performance

### documentation_lead
1. Update project status accurately
2. Create user documentation
3. Document API changes
4. Maintain test coverage

## Risk Mitigation

1. **If loading fix doesn't work**: Try removing React Query temporarily
2. **If graph remains empty**: Use mock data to verify rendering
3. **If performance degrades**: Implement pagination immediately
4. **If specialists conflict**: Orchestrator makes final decision

## Daily Standup Schedule

- **Morning**: Orchestrator tests previous day's work with Playwright
- **Midday**: Specialists report progress and blockers
- **Evening**: Integration testing and priority adjustment

---
*Start Date: 2025-01-07*
*Target Completion: 2025-01-12*