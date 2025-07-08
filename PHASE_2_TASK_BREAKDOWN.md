# Phase 2 Task Breakdown & Orchestration Plan

## Critical Path Analysis

### BLOCKER Tasks (Must Complete First)
These tasks block all other work and must be completed in sequence.

#### Task 1.1: Fix App Loading Issue
**Owner**: interaction_lead  
**Duration**: 30-45 minutes  
**Files**: 
- `/storyforge/frontend/src/App.jsx`

**Specific Changes**:
1. Line 46: Change `cacheTime` to `gcTime`
2. Add error handling to metadata query:
   ```javascript
   onError: (error) => {
     console.error('Metadata query failed:', error);
     setInitialLoading(false);
   },
   onSuccess: (data) => {
     console.log('Metadata loaded:', data);
     setInitialLoading(false);
   }
   ```
3. Remove `onSettled` callback (appears broken in v5)
4. Add timeout fallback after 5 seconds

**Verification**: App should load and display JourneyIntelligenceView

#### Task 1.2: Fix API Import Errors
**Owner**: graph_lead  
**Duration**: 1 hour  
**Files**: All components using API calls

**Search Pattern**:
```bash
# Find all incorrect imports
grep -r "import {.*} from.*services/api" src/components/JourneyIntelligence/
```

**Fix Pattern**:
```javascript
// Wrong:
import { getCharacters, getElements } from '../../services/api';
const data = await getCharacters();

// Correct:
import { api } from '../../services/api';
const data = await api.getCharacters();
```

**Files to Fix**:
- EntityManager.js
- All intelligence layer components
- GraphManager.js
- Any component with API calls

### HIGH Priority Tasks (After Blockers)

#### Task 2.1: Debug Empty Graph
**Owner**: graph_lead  
**Duration**: 2-3 hours  
**Dependencies**: Tasks 1.1 and 1.2 must be complete

**Investigation Steps**:
1. Add console logs in AdaptiveGraphCanvas to trace data flow
2. Check if `entities` prop is populated
3. Verify `processGraphData` returns nodes/edges
4. Test with hardcoded sample data
5. Check ReactFlow initialization

**Expected Issue**: Data transformation or state management disconnect

#### Task 2.2: Verify Core Interactions
**Owner**: interaction_lead  
**Duration**: 1-2 hours  
**Dependencies**: Graph must be rendering

**Test Checklist**:
- [ ] Click on node → entity selected
- [ ] Selected entity highlighted
- [ ] IntelligencePanel shows entity data
- [ ] Hover shows tooltips
- [ ] ESC key clears selection
- [ ] Toggle intelligence layers

### MEDIUM Priority Tasks

#### Task 3.1: Intelligence Layer Data Display
**Owner**: intelligence_lead  
**Duration**: 3-4 hours  
**Dependencies**: Entity selection must work

**For Each Layer**:
1. Economic: Verify token values display
2. Story: Check timeline connections
3. Social: Validate collaboration data
4. Production: Show physical dependencies
5. Content Gaps: Display missing elements

**Key Fix**: Ensure layers receive selected entity data

#### Task 3.2: Keyboard Navigation Implementation
**Owner**: interaction_lead  
**Duration**: 2-3 hours  
**Dependencies**: Basic selection working

**Implementation**:
```javascript
// In AdaptiveGraphCanvas or parent
useEffect(() => {
  const handleKeyPress = (e) => {
    switch(e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        // Navigate to nearest node
        break;
      case 'Enter':
        // Select focused node
        break;
      case 'Tab':
        // Cycle through UI sections
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### LOW Priority Tasks (Performance & Polish)

#### Task 4.1: Backend Intelligence Computation
**Owner**: intelligence_lead  
**Duration**: 4-6 hours  
**Dependencies**: Frontend must be stable

**Migration Plan**:
1. Create `/api/v2/intelligence/:entityId` endpoint
2. Move computation logic from frontend to backend
3. Cache results for 5 minutes
4. Update frontend to fetch computed data

#### Task 4.2: Documentation Update
**Owner**: documentation_lead  
**Duration**: 2 hours  
**Dependencies**: All fixes complete

**Updates Required**:
- Remove "COMPLETE" status from Phase 1
- Document actual keyboard shortcuts
- Update API usage examples
- Add troubleshooting guide

## Orchestration Timeline

### Day 1 Morning (Hours 1-4)
1. **interaction_lead**: Fix App.jsx loading (Task 1.1)
2. **graph_lead**: Fix API imports (Task 1.2)
3. **Orchestrator**: Test with Playwright after each fix
4. **Both**: Debug empty graph together (Task 2.1)

### Day 1 Afternoon (Hours 5-8)
1. **interaction_lead**: Verify interactions (Task 2.2)
2. **graph_lead**: Continue graph debugging if needed
3. **intelligence_lead**: Start reviewing layer data flow
4. **Orchestrator**: Document working features

### Day 2 Morning (Hours 9-12)
1. **intelligence_lead**: Fix layer data display (Task 3.1)
2. **interaction_lead**: Implement keyboard nav (Task 3.2)
3. **graph_lead**: Optimize graph performance
4. **Orchestrator**: Integration testing

### Day 2 Afternoon (Hours 13-16)
1. **All**: Integration testing and bug fixes
2. **documentation_lead**: Begin documentation updates
3. **Orchestrator**: Create before/after screenshots

### Day 3 (If Needed)
1. **intelligence_lead**: Backend migration (Task 4.1)
2. **All**: Performance optimization
3. **Final testing and polish**

## Communication Protocol

1. **Specialists report completion** of each task to Orchestrator
2. **Orchestrator tests** with Playwright before marking complete
3. **Blockers reported immediately** - don't wait
4. **No direct specialist communication** - all through Orchestrator
5. **Daily summary** at end of each day

## Success Metrics

### End of Day 1
- [ ] App loads successfully
- [ ] Graph displays entities
- [ ] Basic selection works

### End of Day 2
- [ ] All interactions functional
- [ ] Intelligence layers show data
- [ ] Keyboard navigation works

### End of Day 3
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] All tests passing

## Risk Mitigation

1. **If React Query fix fails**: Remove it temporarily, use direct fetch
2. **If graph won't render**: Create minimal test case with 5 nodes
3. **If specialists blocked**: Orchestrator can step in with direct fixes
4. **If timeline slips**: Focus on core functionality, defer optimizations