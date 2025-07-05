# Backend Assessment for Journey-First UX

## Executive Summary

The ALNTool backend is currently **READ-ONLY** and lacks essential capabilities for the Journey-First UX vision. While it has excellent data fetching and computation features, it has **ZERO write/edit capabilities** for the journey graph.

## 1. Read Capabilities ✅ EXCELLENT

### What We Can Display:

#### ✅ Journey Data (Single Request)
- **Endpoint**: `GET /api/journeys/:characterId`
- **Returns**: Complete journey graph with nodes and edges
- **Node Types**: 
  - `activityNode` (puzzles)
  - `discoveryNode` (elements)
  - `loreNode` (timeline events)
- **Edge Types**: 
  - Dependency edges (unlocks/rewards)
  - Context edges (lore connections)

#### ✅ Relationships/Dependencies
- All puzzle dependencies included via `locked_item_id`
- Reward connections via `reward_ids`
- Timeline event relationships via `timeline_event_id`
- Character relationships available separately

#### ✅ Memory Token Flow
- Memory values computed and cached
- Total memory value per character
- Act-based memory calculations
- Token flow between puzzles/elements

#### ✅ Real-time Validation
- Validation warnings for all entities
- Missing dependency detection
- Memory economy validation
- Narrative thread consistency

### Data Structure Example:
```json
{
  "character_id": "char-alex-reeves",
  "character_info": {
    "name": "Alex Reeves",
    "category": "guest",
    "linkedCharacters": [...]
  },
  "graph": {
    "nodes": [
      {
        "id": "puzzle-123",
        "type": "activityNode",
        "data": { "label": "Puzzle: Safe Combination", ... },
        "position": { "x": 0, "y": 0 }
      }
    ],
    "edges": [
      {
        "id": "e-element-456-to-puzzle-123",
        "source": "element-456",
        "target": "puzzle-123",
        "label": "unlocks"
      }
    ]
  }
}
```

## 2. Write Capabilities ❌ NONE

### What We CANNOT Edit:

#### ❌ Node Position Updates
- No endpoint to save node positions
- Positions are hardcoded to `{x: 0, y: 0}`
- Frontend must maintain positions locally

#### ❌ Connection Modifications
- No endpoints to create/modify edges
- No way to change puzzle dependencies
- No way to update reward connections

#### ❌ Puzzle Property Edits
- No UPDATE endpoints for puzzles
- No way to change timing, owner, rewards
- All edits must go through Notion

#### ❌ Timeline Reordering
- No way to update timeline sequence
- No drag-and-drop reordering support
- Fixed chronological order only

### Missing CRUD Operations:
```
❌ POST   /api/journeys/:characterId/nodes
❌ PUT    /api/journeys/:characterId/nodes/:nodeId
❌ DELETE /api/journeys/:characterId/nodes/:nodeId
❌ POST   /api/journeys/:characterId/edges
❌ PUT    /api/journeys/:characterId/edges/:edgeId
❌ DELETE /api/journeys/:characterId/edges/:edgeId
❌ PUT    /api/journeys/:characterId/layout
```

## 3. Real-time Features ❌ NONE

### Collaboration Support:
- ❌ No WebSocket implementation
- ❌ No polling mechanisms
- ❌ No user presence tracking
- ❌ No conflict resolution
- ❌ No change notifications

### Current Sync Mechanism:
- Manual sync from Notion only
- One-way data flow (Notion → SQLite)
- No write-back to Notion
- Cache invalidation on sync

## Required Backend Work

### ⚠️ Minor Additions (1-2 days each)

1. **Save Layout Positions**
   ```javascript
   PUT /api/journeys/:characterId/layout
   Body: { nodes: [{ id, position: {x, y} }] }
   ```

2. **Update Node Properties**
   ```javascript
   PUT /api/journeys/:characterId/nodes/:nodeId
   Body: { data: { timing, owner_id, etc } }
   ```

### ❌ Major Work Required (1-2 weeks each)

1. **Full CRUD for Journey Graph**
   - Create/update/delete nodes
   - Create/update/delete edges
   - Validate dependency cycles
   - Update Notion on changes

2. **Real-time Collaboration**
   - WebSocket server setup
   - Presence management
   - Conflict resolution (OT/CRDT)
   - Change broadcasting

3. **Bi-directional Sync**
   - Write changes back to Notion
   - Handle sync conflicts
   - Queue management
   - Error recovery

## Recommendations

### Option 1: Local-First (Quick Win)
- Store all edits in browser localStorage
- Export journey configurations as JSON
- Manual import to Notion when ready
- **Timeline**: 1 week frontend work

### Option 2: Database Layer (Medium Term)
- Add edit tables to SQLite
- Track changes separately from Notion data
- Batch sync to Notion periodically
- **Timeline**: 2-3 weeks full stack work

### Option 3: Full Integration (Long Term)
- Implement real-time Notion API updates
- Add WebSocket collaboration
- Full CRUD with validation
- **Timeline**: 4-6 weeks full stack work

## Current Workarounds

The frontend can implement Journey-First UX with:
1. **Read-only journey visualization** ✅
2. **Local position management** (localStorage)
3. **Export edited journeys** as configuration files
4. **"What-if" scenarios** without persistence
5. **Visual validation** without saving

## Conclusion

The backend provides excellent READ capabilities but zero WRITE capabilities. The Journey-First UX can be partially implemented as a read-only visualization tool, but full editing features require significant backend development.

**Recommended Path**: Start with Option 1 (local-first) to validate the UX, then incrementally add backend capabilities based on user feedback.