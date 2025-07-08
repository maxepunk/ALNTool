# Phase 2 Execution Guide

## Quick Start

```bash
# Run the implementation team
claude chat --profile swarm --swarm-config alntool-implementation-swarm.yml
```

## Specialist Assignments

### Graph Visualization Lead (Days 1-3)
```
CONTEXT: /docs/refactor/PHASE_2_IMPLEMENTATION_PLAN.md
FOCUS: Make all 7 edge types visible and working

BUGS TO FIX:
1. Character-element ownership edges not showing
2. Character-element association edges not showing  
3. Element-element container relationships missing
4. Puzzle-element requirement/reward edges missing
5. Character-timeline event edges not rendering
6. Progressive loading buttons don't actually add entities
7. Force-directed layout not implemented

FILES TO MODIFY:
- src/utils/graphDataProcessor.js (call edge creation functions)
- src/utils/dataTransformers.js (verify edge creation logic)
- src/components/JourneyIntelligence/AdaptiveGraphCanvas.jsx
- src/utils/layoutUtils.js (implement force-directed positioning)
```

### Interaction Lead (Days 2-4)
```
CONTEXT: /docs/refactor/PHASE_2_IMPLEMENTATION_PLAN.md
FOCUS: Fix selection and implement all interactions

BUGS TO FIX:
1. Entity selection overwrites IDs incorrectly
2. No hover preview on nodes
3. No hover highlighting on edges
4. Focus mode doesn't center/zoom properly
5. No keyboard navigation
6. Can't multi-select entities

FILES TO MODIFY:
- src/components/JourneyIntelligence/AdaptiveGraphCanvas.jsx
- src/components/JourneyIntelligence/nodes/*.jsx (add hover states)
- src/hooks/patterns/useKeyboardShortcuts.js
- src/stores/journeyIntelligenceStore.js
```

### Intelligence Layer Lead (Days 3-5)
```
CONTEXT: /docs/refactor/PHASE_2_IMPLEMENTATION_PLAN.md
FOCUS: Make intelligence layers show real data

CURRENT STATE:
- Layers exist but show no data
- Toggle UI works but doesn't affect display
- No connection to backend intelligence data

FILES TO MODIFY:
- src/components/JourneyIntelligence/layers/*.jsx
- src/hooks/useIntelligenceData.js
- src/components/JourneyIntelligence/IntelligenceManager.jsx
- src/services/api.js (add intelligence endpoints if missing)
```

### Integration Lead (Days 4-6)
```
CONTEXT: /docs/refactor/PHASE_2_IMPLEMENTATION_PLAN.md
FOCUS: Performance and integration

PERFORMANCE ISSUES:
1. No viewport culling (renders all nodes)
2. No virtualization for large datasets
3. Unnecessary re-renders
4. Memory leaks from event handlers

INTEGRATION BUGS:
1. Features conflict with each other
2. State management inconsistencies
3. Error boundaries not catching failures
```

## Daily Execution Pattern

### Morning Sync (Coordinator)
1. Check what each specialist completed
2. Run integration tests
3. Identify conflicts/blockers
4. Adjust daily goals

### Specialist Work
1. Focus on assigned bugs/features
2. Test in browser frequently
3. Push working code by end of day
4. Document what works/what doesn't

### Evening Integration (Coordinator)  
1. Pull all changes
2. Test features together
3. Fix integration issues
4. Update progress tracking

## Success Validation

After each feature, validate:
```bash
# Start the app
npm run dev

# Test checklist:
- [ ] Feature visible in UI
- [ ] No console errors
- [ ] Interactions work as expected
- [ ] Performance acceptable
- [ ] Integrates with other features
```

## Common Pitfalls to Avoid

1. **Don't refactor working code** - Use what exists
2. **Don't add new architecture** - Implement within current structure
3. **Don't claim "done" without browser testing**
4. **Don't work in isolation** - Integrate daily
5. **Don't optimize prematurely** - Make it work first

## Communication Template

```markdown
## Day X Update - [Specialist Name]

### Completed
- Feature: [What works in the browser]
- Bug fix: [What was broken, now works]

### In Progress  
- [Feature/fix currently working on]

### Blocked
- [What's preventing progress]

### Integration Notes
- [How this affects other features]
```

## Emergency Procedures

If integration breaks everything:
1. Revert to last working state
2. Isolate the breaking change
3. Fix in isolation
4. Re-integrate carefully

If performance degrades:
1. Profile in browser DevTools
2. Identify the bottleneck
3. Simple fix first (memo, callback, etc.)
4. Complex optimization only if needed

## Final Validation

End of Phase 2 checklist:
- [ ] All 7 edge types visible
- [ ] Entity selection works correctly
- [ ] Progressive loading functional
- [ ] All 5 intelligence layers show data
- [ ] Hover effects implemented
- [ ] Focus mode works
- [ ] Keyboard navigation active
- [ ] 400+ entities performant
- [ ] Zero console errors
- [ ] User can accomplish all workflows