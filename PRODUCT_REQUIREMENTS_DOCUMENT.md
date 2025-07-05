# ALNTool Product Requirements Document (PRD)

**Version**: 2.0 - TDD-Driven Development  
**Date**: January 15, 2025  
**Status**: Primary Design Environment for About Last Night  
**Authors**: Development Team

---

## Executive Summary

ALNTool is evolving from a design decision support system into **the primary design and production environment** for the "About Last Night" murder mystery game. It will ultimately replace direct Notion editing, providing a unified interface where game designers create, modify, and analyze all game content with real-time impact intelligence.

**Current State**: Sophisticated intelligence layers built, but missing critical edges and UX fundamentals. Aggregation removed in favor of visual hierarchy.

**Target State**: Complete design environment that starts as read-only intelligence and evolves into the primary tool for creating and managing the entire game.

---

## Product Vision

### The Evolution Path

```
Phase 1: Design Decision Support (Read-Only) ← CURRENT
Phase 2: Real-Time Content Creation (Preview Mode)  
Phase 3: Integrated Design Environment (Replace Notion Editing)
Phase 4: Collaborative Design Platform (Multi-User Creation)
```

### What ALNTool Will Become
- **Phase 1**: Intelligence tool showing impact of any change
- **Phase 2**: Creation tool with live impact preview  
- **Phase 3**: Primary design environment replacing Notion UI
- **Phase 4**: Collaborative platform for entire team

### Core Philosophy
- **Design Tool First**: Built for incomplete/evolving game data
- **Intelligence Embedded**: Every action shows consequences
- **Progressive Complexity**: Simple interface, deep capabilities
- **Notion Integration**: Notion remains data store, ALNTool becomes the interface

---

## The Game Context: About Last Night

### Game Structure
1. **Act 1**: Social investigation through forced collaboration (60-90 minutes)
2. **Revelation Scene**: Game transforms when memory tokens discovered
3. **Act 2**: Three-way prisoner's dilemma with economic choices

### Key Mechanics
- **Social Choreography**: Puzzles require elements from other players
- **Memory Economy**: Tokens have values affecting player choices
- **Narrative Discovery**: Timeline events revealed through elements
- **Production Reality**: Physical props, RFID tokens, scanner logistics

### Design Challenges
Designers must balance four dimensions simultaneously:
- **Story**: What happened and how players discover it
- **Social**: Which players must interact and when
- **Economic**: Token values and path balance
- **Production**: Physical props and dependencies

---

## Users and Their Evolving Needs

### 🎭 Sarah - Experience Designer

**Phase 1 Needs** (Intelligence):
- "If Victoria's affair is worth $5000, how does that affect choices?"
- "Which characters discover this revelation?"

**Phase 2 Needs** (Creation Preview):
- "Let me create a new timeline event and see impact before saving"
- "Show me how this new element affects social connections"

**Phase 3 Needs** (Primary Tool):
- "I'll design Victoria's entire journey in ALNTool"
- "Update all her relationships and see changes live"

**Phase 4 Needs** (Collaboration):
- "Marcus is editing puzzles while I work on timeline"
- "See his changes affecting my character in real-time"

### 🧩 Marcus - Puzzle Designer

**Phase 1 Needs** (Intelligence):
- "Which character interactions does this puzzle create?"
- "Is the reward value balanced?"

**Phase 2 Needs** (Creation Preview):
- "Test different element requirements before committing"
- "Preview how puzzle changes cascade"

**Phase 3 Needs** (Primary Tool):
- "Design entire puzzle chains in the tool"
- "Drag-and-drop element requirements"

**Phase 4 Needs** (Collaboration):
- "Lock this puzzle while I redesign it"
- "Notify Sarah her character is affected"

---

## Current System Analysis

### Architecture Status
```
Notion (Data Store - Source of Truth)
    ↓ 
Backend Sync (Complete - All Relationships Captured)
    ↓
SQLite Database (Complete Data Model)
    ↓
API Layer (BROKEN - Only Character Links Exposed)
    ↓
Frontend (Ready but Data-Starved)
    ↓
Visualization (No Aggregation - Visual Hierarchy Only)
```

### Critical Issues

#### 1. Missing 80% of Edges
- **Have**: Character-character relationships only
- **Missing**: Ownership, containers, requirements, rewards, revelations
- **Impact**: Can't see puzzle dependencies or element flow

#### 2. Entity Selection Broken
- Node IDs overwrite entity IDs
- Click handlers corrupt selection state
- Intelligence panel receives wrong data

#### 3. Visual Hierarchy Implementation
- Successfully removed aggregation logic
- Using opacity/scale/blur for 400+ nodes
- But missing proper force-directed layout

#### 4. No Search or Progressive Loading
- Shows all 400+ nodes immediately
- No way to find specific entities
- Overwhelming initial experience

---

## Phased Product Requirements

### Phase 1: Design Decision Support (Weeks 1-3)

**Goal**: Complete read-only intelligence system with excellent UX

#### Core Features

1. **Entity Search & Selection**
   - Autocomplete search across all types
   - Fix ID preservation in selection
   - Keyboard navigation (arrows, enter, escape)

2. **Complete Edge Visualization**
   ```javascript
   // All relationship types must be visible:
   - character-character (✓ working)
   - character-owns-element (❌ missing) 
   - character-owns-puzzle (❌ missing)
   - element-contains-element (❌ missing)
   - puzzle-requires-element (❌ missing)
   - puzzle-rewards-element (❌ missing)
   - element-reveals-timeline (❌ missing)
   ```

3. **Visual Hierarchy System** (No Aggregation)
   - All nodes always visible
   - Selected entity: Full opacity, larger scale
   - Connected entities: High opacity, normal scale
   - Secondary connections: Medium opacity, smaller scale
   - Background entities: Low opacity, smallest scale
   - Smooth transitions between states

4. **Progressive Entity Loading**
   - Initial: 22 characters with relationships
   - Controls to load elements/puzzles/timeline
   - Maintain performance with 400+ nodes

5. **Intelligence Layers** (5 total)
   - Economic: Token values, path balance, choice pressure
   - Story: Timeline connections, narrative flow, revelation timing
   - Social: Required interactions, collaboration patterns
   - Production: Props needed, RFID status, dependencies
   - Content Gaps: Missing connections, integration opportunities

6. **Layout Algorithms**
   - Force-directed primary layout
   - Clustering by ownership in focus mode
   - Radial layout when character selected
   - Edge routing to minimize crossings

#### Technical Requirements
- Fix entity selection bug (immediate)
- Add all missing edge types to API
- Implement D3-force simulation properly
- State persistence with Zustand
- <2s load time with all entities

### Phase 2: Real-Time Content Creation (Weeks 4-6)

**Goal**: Add creation capabilities with live impact preview

#### New Capabilities

1. **Draft Entity Creation**
   ```javascript
   // Create entities locally without saving
   - Draft timeline events
   - Draft elements with values
   - Draft puzzles with requirements
   - See impact before committing
   ```

2. **Live Impact Analysis**
   - Economic balance shifts
   - Social interaction changes
   - Story integration opportunities
   - Production requirement updates

3. **Creation Workflows**
   - "Add backstory for Howie" → Guided timeline creation
   - "Balance this path" → Value adjustment with preview
   - "Fill content gap" → Smart suggestions

4. **Export to Notion**
   - Save creation session as import plan
   - Batch create in Notion
   - Maintain source of truth

#### API Requirements
```
POST /api/entities/preview-impact
POST /api/content/validate-integration
POST /api/creation-sessions
GET /api/intelligence/suggestions
```

### Phase 3: Integrated Design Environment (Weeks 7-10)

**Goal**: Become primary design tool with bidirectional Notion sync

#### Transformation

1. **Edit Mode**
   - Toggle between view/edit modes
   - Direct manipulation on graph
   - Inline property editing
   - Relationship drag-and-drop

2. **Full CRUD Operations**
   ```javascript
   // Replace Notion's UI entirely
   - Create entities in ALNTool
   - Update properties directly
   - Delete with impact preview
   - Rearrange relationships
   ```

3. **Notion Sync Architecture**
   - Queue edits locally
   - Batch sync to Notion
   - Conflict resolution
   - Rollback capability

4. **Version Control**
   - Change history
   - Undo/redo system
   - Diff visualization
   - Restore points

#### This is where ALNTool becomes the primary tool

### Phase 4: Collaborative Design Platform (Weeks 11-13)

**Goal**: Enable real-time multi-designer collaboration

#### Collaboration Features

1. **Presence System**
   - See other designers' cursors
   - Show who's editing what
   - Active user list
   - Focus following

2. **Edit Coordination**
   - Optimistic locking
   - Conflict prevention
   - Change broadcasting
   - Merge assistance

3. **Communication**
   - Inline comments on entities
   - Change annotations
   - @mentions system
   - Activity feed

4. **Team Workflows**
   - Assign ownership areas
   - Review system
   - Approval workflows
   - Task assignment

---

## Data Model & Relationships

### Entity Structure
```typescript
interface Entity {
  id: string;
  name: string;
  entityCategory: 'character' | 'element' | 'puzzle' | 'timeline';
  // Common fields for all entities
}

interface Character extends Entity {
  tier: 'Core' | 'Major' | 'Supporting';
  characterType: 'Player' | 'NPC';
  logline?: string;
}

interface Element extends Entity {
  type: string; // 'Memory Token', 'Prop', etc.
  value?: number;
  owner_character_id?: string;
  container_element_id?: string;
  timeline_event_id?: string;
  rightful_owner_id?: string;
  productionStatus: string;
}

interface Puzzle extends Entity {
  required_elements: string[];
  reward_elements: string[];
  owner_character_id?: string;
  actFocus: 'Act 1' | 'Act 2';
}

interface TimelineEvent extends Entity {
  date: string;
  participants: string[];
  revealing_elements: string[];
  actFocus: 'Act 1' | 'Act 2';
  description: string;
}
```

### Complete Edge Catalog
```typescript
type RelationshipType = 
  | 'character-character'         // Social connection
  | 'character-owns-element'      // Possession
  | 'character-owns-puzzle'       // Creation
  | 'element-contains-element'    // Container
  | 'puzzle-requires-element'     // Input
  | 'puzzle-rewards-element'      // Output
  | 'element-reveals-timeline'    // Discovery
  | 'character-participates-timeline' // Involvement
  | 'element-rightful-owner'      // Return path
```

---

## Technical Architecture

### Frontend Architecture (Current Focus)
```
Visual System:
- No aggregation - all nodes always visible
- Visual hierarchy through opacity/scale
- Force-directed layout with D3
- Custom node components per type

State Management:
- Zustand: UI state only
- React Query: Server data
- localStorage: User preferences

Performance:
- Progressive loading
- React.memo optimization
- Viewport culling
- Edge bundling
```

### API Requirements (Must Fix)
```
Current (Broken):
GET /api/character-links ✓ (only working endpoint)

Required for Phase 1:
GET /api/elements/relationships
GET /api/puzzles/dependencies
GET /api/timeline/connections
GET /api/entities/full-graph

Required for Phase 2:
POST /api/preview/impact
POST /api/validate/balance
GET /api/suggestions/content

Required for Phase 3:
PUT /api/entities/:id
POST /api/entities
DELETE /api/entities/:id
POST /api/sync/notion
```

---

## Test-Driven Development Strategy

### 1. Behavioral Tests (Design Tool Resilience)
```javascript
describe('Design Tool Core Behaviors', () => {
  // Don't test specific counts, test patterns
  test('handles any number of entities without crashing');
  test('shows relationships that exist in data');
  test('selection works regardless of entity type');
  test('visual hierarchy adapts to data scale');
});
```

### 2. Edge Generation Tests
```javascript
describe('Relationship Visualization', () => {
  test('generates ownership edges when owner exists');
  test('skips edges with missing endpoints');
  test('shows all relationship types from API');
  test('handles circular references gracefully');
});
```

### 3. User Workflow Tests
```javascript
describe('Designer User Journeys', () => {
  test('search and select entity in <5 seconds');
  test('see complete impact analysis immediately');
  test('preview changes before saving (Phase 2)');
  test('collaborate without conflicts (Phase 4)');
});
```

### 4. Progressive Capability Tests
```javascript
describe('Phased Feature Delivery', () => {
  test('Phase 1: Read-only intelligence works completely');
  test('Phase 2: Creation preview without breaking Phase 1');
  test('Phase 3: Editing without losing intelligence');
  test('Phase 4: Collaboration layer non-invasive');
});
```

---

## Success Metrics

### Phase 1 Success (Intelligence)
- Find any entity in <5 seconds ✓
- See ALL relationships (not just character-character)
- Understand impact in <10 seconds
- 60fps with 400+ visible nodes

### Phase 2 Success (Creation)
- Create draft entity in <30 seconds
- Preview impact before saving
- Export session to Notion successfully
- No corruption of read-only features

### Phase 3 Success (Primary Tool)
- Designers stop using Notion UI
- All design work happens in ALNTool
- Sync reliability >99.9%
- Version control prevents data loss

### Phase 4 Success (Collaboration)
- Multiple designers work simultaneously
- Zero edit conflicts
- Real-time updates <100ms
- Team velocity increased 5x

---

## Implementation Priorities

### Immediate (1-2 days)
1. Fix entity selection ID bug
2. Add missing edge endpoints to API
3. Implement proper force-directed layout
4. Add entity search

### Week 1 Completion
1. All edge types visible
2. Visual hierarchy polished  
3. Progressive loading working
4. Intelligence layers show real data

### Week 2-3 (Phase 1 Complete)
1. Performance optimization
2. Keyboard navigation
3. State persistence
4. Production testing

### Weeks 4-6 (Phase 2)
1. Local draft system
2. Impact calculations
3. Creation workflows
4. Notion export

---

## Risk Mitigation

### Technical Risks
- **Missing Edges**: Implement defensive edge generation
- **Performance**: Visual hierarchy proven to work
- **Notion Limits**: Batch operations, smart caching

### Evolution Risks
- **Scope Creep**: Strict phase gates
- **Breaking Changes**: Each phase preserves previous
- **User Trust**: Notion remains source of truth

### Adoption Risks
- **Learning Curve**: Start with familiar intelligence
- **Migration Anxiety**: Gradual feature introduction
- **Team Buy-in**: Show value at each phase

---

## Critical Success Factors

1. **Phase 1 Must Be Complete**: No moving forward without solid foundation
2. **Each Phase Preserves Previous**: Never break working features
3. **User Testing at Each Gate**: Validate before proceeding
4. **Performance First**: 400+ nodes must always be smooth
5. **Notion Integration**: Respect source of truth

---

## Conclusion

ALNTool is not just a visualization or intelligence tool - it's evolving into the primary design environment for About Last Night. By building in phases from read-only intelligence to full collaborative creation, we ensure each step delivers value while maintaining stability.

The key differentiator is that we're building a **design tool for evolving game data**, not a database management system. Every feature must support game designers in understanding impact, making decisions, and creating content with confidence.

---

*"We're not enhancing Notion. We're replacing how designers interact with it entirely."*