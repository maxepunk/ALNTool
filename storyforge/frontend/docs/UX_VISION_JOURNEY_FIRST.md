# Journey-First UX Vision for ALNTool
**Author**: Sarah Chen, Principal UX Engineer  
**Date**: January 2025  
**Status**: Pre-Production Vision Document

## Executive Summary

ALNTool must transform from a collection of database views into a unified journey design system. By making character journeys the primary interface through which all design decisions flow, we create a tool that matches how game designers actually think about murder mystery experiences.

## The Vision: Journey as Operating System

Imagine ALNTool as an "operating system" where character journeys are the desktop, and all other features are applications you launch from within that context. You never leave the journey view - you enhance it, annotate it, analyze it, but it remains your persistent workspace.

### Current State vs. Vision

**Current State**: 
- 18 separate pages with overlapping purposes
- Navigate away from journey to check dependencies
- Lose context when validating memory economy
- Mental model constantly interrupted

**Vision State**:
- One primary workspace: Enhanced Journey View
- All analysis/validation happens in-context via overlays
- Persistent journey visualization with modal interactions
- Mental model preserved throughout workflow

## Core Design Principles

### 1. Journey Persistence
The character journey graph never disappears. All other interfaces are overlays, side panels, or enhanced node states that preserve journey context.

### 2. Progressive Disclosure
Start with the simplest journey view. Add complexity through user-initiated layers:
- Basic: Nodes and connections
- Enhanced: Timing and dependencies  
- Analysis: Bottlenecks and flow
- Production: Resource validation

### 3. Direct Manipulation
Designers should drag, connect, and modify directly on the graph. No separate "edit" modes or external forms.

### 4. Ambient Information
Critical data (memory tokens, dependencies, conflicts) appears as ambient visual cues, not requiring active investigation.

### 5. Collaborative Awareness
With 2-3 designers working simultaneously, show real-time presence and changes without disrupting flow.

## Journey-First Architecture

### The Hero View: JourneyDesigner

```
┌─────────────────────────────────────────────────────────────┐
│ Character: [Dropdown] │ View: [Timeline|Analysis] │ ○ Sarah │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Journey Graph Canvas - Always Visible]                    │
│                                                             │
│  ● ──────● ──────◆ ──────● ──────■                        │
│          │        │                │                        │
│          └────────● ───────────────┘                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Contextual Action Bar - Changes based on selection]       │
└─────────────────────────────────────────────────────────────┘
```

### Contextual Overlays (Not Navigation)

When you need additional information, it appears as an overlay that doesn't hide the journey:

#### Memory Economy Overlay
- Triggered by clicking token icon or pressing 'M'
- Semi-transparent overlay shows token flow along the journey path
- Click anywhere to dismiss and return to base view

#### Dependency Inspector
- Activated by hovering over connection lines
- Shows what elements/puzzles are required
- Highlights conflicts in red directly on the graph

#### Social Connections
- Press 'S' to see character overlaps
- Other characters' paths appear as ghosted lines
- Shared puzzles glow to show coordination points

### Unified Interaction Model

Every action follows the same pattern:
1. **Select** on the journey (character, node, connection)
2. **Inspect** via overlay or enhanced state
3. **Modify** directly on the graph
4. **Validate** through ambient visual feedback

No page navigation. No context switching. No mental model disruption.

## Specific UI Patterns from Game Production Tools

### From Unreal Blueprint Editor
- **Execution wires** that show flow with animated dots
- **Data wires** with different visual treatment than logic flow
- **Comment boxes** to group related nodes
- **Zoom-to-fit** with smooth transitions

### From Unity Timeline
- **Scrubber** for time-based navigation
- **Track layers** for different aspect views
- **Clips** that can be trimmed and moved
- **Markers** for important moments

### From Perforce Version Control
- **Change visualization** showing who modified what
- **Conflict detection** with visual diff
- **Integration preview** before merging changes

## Implementation Priorities

### Phase 1: Unified Journey View (Week 1-2)
- Merge Timeline and Analysis modes into one view
- Implement overlay system for additional data
- Remove navigation to separate pages

### Phase 2: Direct Manipulation (Week 2-3)
- Drag nodes to adjust timing
- Draw connections to create dependencies
- Inline editing of node properties

### Phase 3: Ambient Intelligence (Week 3-4)
- Visual encoding of validation state
- Progressive disclosure of problems
- Real-time collaboration indicators

### Phase 4: Production Polish (Week 4-5)
- Keyboard shortcuts for power users
- Customizable workspace layouts
- Performance optimization for 100+ nodes

## Success Metrics

### Efficiency Metrics
- **Time to Issue**: <10 seconds from load to identifying first issue
- **Context Switches**: 0 page navigations during typical workflow
- **Click Depth**: Maximum 2 clicks to any information

### Satisfaction Metrics
- **Cognitive Load**: Designers report "flow state" during use
- **Error Recovery**: Mistakes are immediately visible and reversible
- **Learnability**: New designer productive in <10 minutes

### Production Metrics
- **Validation Coverage**: 100% of dependencies checked in real-time
- **Conflict Detection**: Issues surface before they block others
- **Collaboration Efficiency**: Designers aware of others' changes instantly

## Technical Feasibility

### Proven Patterns
- React Flow handles 100+ nodes (verified in current implementation)
- Overlay systems are standard in React with portals
- Real-time sync already working with backend

### New Challenges
- Ambient visualization of complex data
- Performance with multiple overlay layers
- Smooth transitions between view states

### Mitigation Strategies
- Use React.memo aggressively for overlay components
- Implement viewport culling for off-screen nodes
- Debounce real-time updates intelligently

## What We're NOT Building

❌ **Generic project management tool** - Every feature serves journey design
❌ **Database browser** - Data appears in journey context only  
❌ **Separate validation app** - Validation is ambient, not a separate step
❌ **Multi-game platform** - Optimized specifically for About Last Night

## Call to Action

The current ALNTool has all the right data and backend intelligence. What it lacks is a unified vision that puts the designer's mental model first. By reorganizing around the journey as the persistent workspace, we can transform a functional tool into an exceptional one.

The journey is not just another view - it IS the tool.

---

*"The best tools disappear. The designer thinks about the game, not the software."*  
— Sarah Chen