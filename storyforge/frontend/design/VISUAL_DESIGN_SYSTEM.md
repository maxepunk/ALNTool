# Visual Design System: Entity-Level Intelligence Interface
**Date**: January 11, 2025  
**Author**: Sarah Chen, Principal UX Engineer  
**Status**: Day 5 - Visual Design Foundation  
**Principle**: Clarity enables velocity

---

## Executive Summary

This visual design system transforms four-dimensional complexity into immediate understanding. Every visual decision serves one goal: **help designers make confident decisions in under 2 minutes**.

Core principles:
1. **Recognition over recall** - Instant entity identification
2. **Progressive disclosure** - Complexity on demand
3. **Performance-first** - Beauty within 50-node constraints
4. **Unified experience** - One cohesive system replacing 18 pages

---

## Visual Design Tokens

### Color System

#### Semantic Entity Colors
```css
:root {
  /* Entity type colors - high contrast, colorblind-safe */
  --character-primary: #2563EB;    /* Blue - human, relatable */
  --character-secondary: #DBEAFE;
  --character-accent: #1E40AF;
  
  --element-primary: #059669;      /* Green - tangible objects */
  --element-secondary: #D1FAE5;
  --element-accent: #047857;
  
  --puzzle-primary: #7C3AED;       /* Purple - challenges */
  --puzzle-secondary: #EDE9FE;
  --puzzle-accent: #6D28D9;
  
  --timeline-primary: #EA580C;     /* Orange - time flow */
  --timeline-secondary: #FED7AA;
  --timeline-accent: #C2410C;
  
  /* Intelligence layer colors */
  --story-intelligence: #8B5CF6;   /* Violet - narrative */
  --social-intelligence: #3B82F6;  /* Blue - collaboration */
  --economic-intelligence: #10B981; /* Green - value */
  --production-intelligence: #F59E0B; /* Amber - logistics */
  --gaps-intelligence: #EF4444;    /* Red - warnings */
  
  /* State colors */
  --selected-glow: #FEF3C7;
  --hover-highlight: rgba(255, 255, 255, 0.1);
  --error-state: #DC2626;
  --success-state: #059669;
  
  /* Semantic grays */
  --surface-primary: #FFFFFF;
  --surface-secondary: #F9FAFB;
  --surface-tertiary: #F3F4F6;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-disabled: #D1D5DB;
  --border-default: #E5E7EB;
  --border-focus: #3B82F6;
}

/* Dark mode tokens */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-primary: #111827;
    --surface-secondary: #1F2937;
    --surface-tertiary: #374151;
    --text-primary: #F9FAFB;
    --text-secondary: #D1D5DB;
    /* Entity colors remain vibrant in dark mode */
  }
}
```

### Spacing System
```css
:root {
  /* 4px base unit for precise alignment */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  
  /* Component-specific spacing */
  --node-padding: var(--space-3);
  --panel-padding: var(--space-4);
  --graph-margin: var(--space-6);
}
```

### Typography Scale
```css
:root {
  /* System font stack for performance */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                 "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
  
  /* Type scale */
  --text-xs: 0.75rem;    /* 12px - badges, labels */
  --text-sm: 0.875rem;   /* 14px - secondary text */
  --text-base: 1rem;     /* 16px - body text */
  --text-lg: 1.125rem;   /* 18px - emphasis */
  --text-xl: 1.25rem;    /* 20px - headings */
  --text-2xl: 1.5rem;    /* 24px - section titles */
  
  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Animation Timing
```css
:root {
  /* Timing functions */
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --spring: cubic-bezier(0.5, 1.25, 0.75, 1.25);
  
  /* Durations */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-deliberate: 800ms;
  
  /* Specific transitions */
  --node-hover: var(--duration-instant) var(--ease-out);
  --node-select: var(--duration-normal) var(--spring);
  --view-change: var(--duration-slow) var(--ease-in-out);
  --intelligence-toggle: var(--duration-fast) var(--ease-out);
}
```

---

## Node Visual Language

### Entity Type Characteristics

#### Character Nodes
```css
.character-node {
  /* Shape */
  shape: circle;
  width: 48px;
  height: 48px;
  
  /* Color */
  background: var(--character-primary);
  border: 2px solid var(--character-accent);
  
  /* Typography */
  .node-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: white;
  }
  
  /* States */
  &.selected {
    width: 56px;
    height: 56px;
    box-shadow: 0 0 0 4px var(--selected-glow);
    transform: scale(1.1);
  }
  
  &.related {
    opacity: 0.9;
    border-color: var(--character-primary);
  }
  
  &.contextual {
    opacity: 0.6;
    transform: scale(0.9);
  }
  
  &.aggregated {
    opacity: 0.4;
    transform: scale(0.7);
  }
}
```

#### Element Nodes
```css
.element-node {
  /* Diamond shape via rotation */
  shape: square;
  width: 40px;
  height: 40px;
  transform: rotate(45deg);
  
  /* Nested content counter-rotation */
  .node-content {
    transform: rotate(-45deg);
  }
  
  /* Color coding by element type */
  &[data-element-type="memory-token"] {
    background: var(--element-primary);
  }
  
  &[data-element-type="prop"] {
    background: var(--element-secondary);
    border: 2px solid var(--element-primary);
  }
  
  &[data-element-type="set-dressing"] {
    background: var(--surface-tertiary);
    border: 2px dashed var(--element-accent);
  }
}
```

#### Puzzle Nodes
```css
.puzzle-node {
  /* Square with rounded corners */
  shape: square;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  
  /* Visual depth */
  background: var(--puzzle-primary);
  border: 2px solid var(--puzzle-accent);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  
  /* Collaboration indicator */
  &[data-collaboration-required="true"]::after {
    content: "";
    position: absolute;
    top: -4px;
    right: -4px;
    width: 12px;
    height: 12px;
    background: var(--social-intelligence);
    border-radius: 50%;
  }
}
```

#### Timeline Event Nodes
```css
.timeline-node {
  /* Triangle pointing right (time flow) */
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 20px 0 20px 34.64px; /* Equilateral triangle */
  border-color: transparent transparent transparent var(--timeline-primary);
  
  /* Act indicator */
  &[data-act="1"]::before { content: "I"; }
  &[data-act="2"]::before { content: "II"; }
  
  &::before {
    position: absolute;
    left: -28px;
    top: -8px;
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    color: white;
  }
}
```

### Node Type Visual Examples

```
Character Node        Element Node         Puzzle Node         Timeline Node
   (Circle)            (Diamond)            (Square)            (Triangle)
                                                               
     .--.              ◆                   ┌────┐              ▶
    /    \             ╱╲                  │    │              ╱│
   │  SM  │           ╱  ╲                 │ P1 │             ╱ │
    \    /           ╱ E12 ╲               │    │            ╱  │
     '--'            ╲    ╱                └────┘           ╱   │
                      ╲  ╱                                 ╱Act1│
                       ╲╱                                 ╱_____|
                       
  Sarah Mitchell   Element #12         Puzzle #1        Timeline Event
   Character      Memory Token      Jewelry Box       Marcus's Affair
```

### Selection State Visualization

```
Overview State (All Characters Visible)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    (·)     (·)      (·)       (·)      (·)                    │
│     A       S        M         V        D         Legend:      │
│                                                   A = Alex      │
│         (·)      (·)       (·)      (·)          S = Sarah     │
│          J        H         L        K           M = Marcus    │
│                                                   V = Victoria  │
│    (·)       (·)       (·)       (·)             D = Derek     │
│     P         R         T         B              (·) = 40px    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Entity Selected State (Sarah + Related Context)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         ◆····◆                    ┌────┐                       │
│        ╱      ╲                   │ P3 │········▶              │
│    ╔══╗        ╲                  └────┘        ╱│             │
│   ║ S ║=========◆                     ║        ╱ │  Size Key:  │
│    ╚══╝        ╱ ╲                    ║       ╱T2│  ╔══╗ 56px  │
│      ║ ╲      ╱   ◆···········┌────┐ ║      ╱___│  (··) 48px  │
│     (·)  ◆--◆                 │ P1 │═╝           ▶  [·] 32px  │
│      M                        └────┘            T1   · 24px    │
│                                                                 │
│  ══ Strong connection   ·· Weak connection   -- Related        │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Hierarchy

#### Size Scaling System
```javascript
const nodeSizes = {
  selected: 56,      // 1.2x base
  primary: 48,       // Base size
  secondary: 40,     // 0.85x base
  tertiary: 32,      // 0.7x base
  aggregated: 24     // 0.5x base
};

// Dynamic sizing based on relevance
function calculateNodeSize(node, context) {
  if (node.id === context.selectedId) return nodeSizes.selected;
  if (node.relevanceScore > 0.8) return nodeSizes.primary;
  if (node.relevanceScore > 0.6) return nodeSizes.secondary;
  if (node.relevanceScore > 0.4) return nodeSizes.tertiary;
  return nodeSizes.aggregated;
}
```

#### Opacity Hierarchy
```css
:root {
  --opacity-selected: 1.0;
  --opacity-direct: 0.9;
  --opacity-relevant: 0.8;
  --opacity-context: 0.6;
  --opacity-aggregated: 0.4;
  --opacity-hidden: 0.15;
}
```

### Progressive Information Disclosure

```
Zoom: 0.5x (Minimal)         Zoom: 1.0x (Standard)        Zoom: 1.5x (Detailed)
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  ●   ◆   ■   ▶ │          │  (S)  ◆   [P]  ▶│          │ ╔════════╗       │
│                 │          │  Sarah│   E12  │T│          │║ Sarah M║ ◆E12  │
│    ●   ◆   ■   │   ───>   │       │        │ │   ───>   │║ Tier 2 ║$5000  │
│                 │          │ (M)  ◆   [P2]  │          │╚════════╝       │
│  ●   ◆   ■   ▶ │          │Marcus│         ▶│          │ ┌────────┐  ▶T1 │
└─────────────────┘          └─────────────────┘          │ │Puzzle 1│ Act1 │
 Icons only                   Names visible                │ │2 collab│      │
                                                          └─────────────────┘
                                                           Full metadata
```

#### Zoom Level Details
```javascript
const zoomThresholds = {
  minimal: 0.5,    // Icons only
  basic: 0.75,     // Icons + abbreviated names
  standard: 1.0,   // Full names
  detailed: 1.5,   // Names + metadata
  full: 2.0        // All information
};

// Content visibility rules
function getNodeContent(zoom, node) {
  if (zoom < zoomThresholds.minimal) {
    return { icon: true };
  }
  if (zoom < zoomThresholds.basic) {
    return { icon: true, name: node.name.substring(0, 3) + '...' };
  }
  if (zoom < zoomThresholds.standard) {
    return { icon: true, name: node.name };
  }
  if (zoom < zoomThresholds.detailed) {
    return { icon: true, name: node.name, subtitle: node.type };
  }
  return { 
    icon: true, 
    name: node.name, 
    subtitle: node.type,
    metadata: node.key_properties 
  };
}
```

### Aggregation Visualization

```
Dense Area Before Aggregation          After Smart Aggregation
┌─────────────────────┐               ┌─────────────────────┐
│ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ │               │                     │
│ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ │               │    ┌···········┐    │
│ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ │   ────────>   │   : ◆ ◆ ◆ [27]:    │
│ Too many nodes!     │               │    :◆ ◆ ◆ ◆ ◆ :    │
│ (Performance issue) │               │    └···········┘    │
└─────────────────────┘               └─────────────────────┘
                                      Clustered with count badge
```

#### Cluster Representation
```css
.node-cluster {
  /* Dotted outline showing grouped area */
  border: 2px dotted var(--border-default);
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.02);
  padding: var(--space-4);
  
  /* Count badge */
  .cluster-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--surface-primary);
    border: 2px solid var(--border-focus);
    border-radius: 12px;
    padding: 2px 8px;
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
  }
  
  /* Representative nodes */
  .cluster-preview {
    display: flex;
    gap: -8px; /* Overlapping */
    
    .preview-node {
      width: 24px;
      height: 24px;
      opacity: 0.6;
      
      &:nth-child(1) { z-index: 3; }
      &:nth-child(2) { z-index: 2; }
      &:nth-child(3) { z-index: 1; }
    }
  }
}
```

---

## Intelligence Overlay Patterns

```
Base Graph                    + Story Intelligence         + Social Intelligence
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│     (S)         │          │     (S)         │          │     (S)┅┅┅┅┅┅┅  │
│    ╱   ╲       │          │    ╱┊ ┊╲       │          │    ╱║ ║╲       │
│   ◆     ◆      │   ───>   │   ◆┅┅┅┅◆      │   ───>   │   ◆═════◆      │
│    ╲   ╱       │          │    ╲┊ ┊╱       │          │    ╲║ ║╱       │
│     ▶─┘        │          │     ▶┅┘ ←glow  │          │     ▶─┘ ←collab │
└─────────────────┘          └─────────────────┘          └─────────────────┘
                             ┅┅ Story thread              ══ Social link
                             ┊ Timeline flow              ║ Strong collab

Intelligence Combination Example (Story + Economic + Gaps)
┌────────────────────────────────────────────────────────────┐
│                  [!] Missing content                        │
│     (S)━━━━━━━━━━◆ $5000                                  │
│    ╱   ╲        ╱│╲                 Legend:               │
│   ◆$500 ◆$1200 ╱ │ ╲               ━━ Story critical      │
│    ╲   ╱      ╱  │  ╲              ── Economic flow       │
│     ▶─┘      ◆   │   ◆ $3000       [!] Content gap        │
│              $0 [!]                 $n Token value         │
└────────────────────────────────────────────────────────────┘
```

### Layer Visual Treatments

#### Story Intelligence
```css
.story-intelligence-active {
  /* Timeline connections */
  .story-edge {
    stroke: var(--story-intelligence);
    stroke-width: 2;
    stroke-dasharray: 5, 5;
    animation: flow 2s linear infinite;
  }
  
  /* Narrative importance glow */
  .node[data-story-importance="high"] {
    filter: drop-shadow(0 0 8px var(--story-intelligence));
  }
  
  /* Story thread indicators */
  .story-thread-badge {
    position: absolute;
    top: -4px;
    left: -4px;
    width: 16px;
    height: 16px;
    background: var(--story-intelligence);
    border-radius: 50%;
    font-size: 10px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@keyframes flow {
  to { stroke-dashoffset: -10; }
}
```

#### Social Intelligence
```css
.social-intelligence-active {
  /* Collaboration rings */
  .collaboration-required::before {
    content: "";
    position: absolute;
    inset: -8px;
    border: 2px solid var(--social-intelligence);
    border-radius: inherit;
    opacity: 0.6;
    animation: pulse 2s ease-in-out infinite;
  }
  
  /* Social connection strength */
  .social-edge {
    stroke: var(--social-intelligence);
    
    &[data-strength="strong"] {
      stroke-width: 4;
      opacity: 1;
    }
    
    &[data-strength="medium"] {
      stroke-width: 2;
      opacity: 0.7;
    }
    
    &[data-strength="weak"] {
      stroke-width: 1;
      stroke-dasharray: 2, 2;
      opacity: 0.5;
    }
  }
  
  /* Collaboration count */
  .social-load-indicator {
    position: absolute;
    bottom: -4px;
    right: -4px;
    background: var(--social-intelligence);
    color: white;
    font-size: var(--text-xs);
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: var(--font-bold);
  }
}
```

#### Economic Intelligence
```css
.economic-intelligence-active {
  /* Value badges */
  .value-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--economic-intelligence);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    
    &::before {
      content: "$";
    }
  }
  
  /* Economic flow visualization */
  .economic-edge {
    stroke: var(--economic-intelligence);
    stroke-width: 3;
    marker-end: url(#arrowhead-economic);
    
    /* Width represents value */
    &[data-value="high"] { stroke-width: 6; }
    &[data-value="medium"] { stroke-width: 4; }
    &[data-value="low"] { stroke-width: 2; }
  }
  
  /* Path pressure indicator */
  .economic-pressure {
    fill: var(--economic-intelligence);
    fill-opacity: 0.1;
    stroke: var(--economic-intelligence);
    stroke-width: 2;
    stroke-dasharray: 4, 2;
  }
}
```

#### Production Intelligence
```css
.production-intelligence-active {
  /* Status indicators */
  .production-status {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    
    &[data-status="ready"] {
      background: var(--success-state);
    }
    
    &[data-status="missing"] {
      background: var(--error-state);
      animation: blink 1s ease-in-out infinite;
    }
    
    &[data-status="partial"] {
      background: var(--production-intelligence);
    }
  }
  
  /* Dependency chains */
  .production-edge {
    stroke: var(--production-intelligence);
    stroke-width: 2;
    stroke-dasharray: 2, 4;
    
    &.critical-path {
      stroke-width: 3;
      stroke-dasharray: none;
      filter: drop-shadow(0 0 4px var(--production-intelligence));
    }
  }
}
```

#### Gap Intelligence
```css
.gap-intelligence-active {
  /* Missing content pulse */
  .content-gap {
    animation: warning-pulse 1.5s ease-in-out infinite;
  }
  
  /* Gap indicators */
  .gap-indicator {
    position: absolute;
    inset: -4px;
    border: 2px dashed var(--gaps-intelligence);
    border-radius: inherit;
    opacity: 0.8;
  }
  
  /* Opportunity badges */
  .opportunity-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gaps-intelligence);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
  }
}

@keyframes warning-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
```

### Layer Combination Rules

When multiple intelligence layers are active, visual treatments combine without creating chaos:

```css
/* Example: Story + Social active */
.story-intelligence-active.social-intelligence-active {
  /* Edges show both patterns */
  .edge {
    &.story-social {
      stroke: url(#gradient-story-social);
      stroke-width: 3;
      stroke-dasharray: 5, 2, 1, 2; /* Combined pattern */
    }
  }
  
  /* Nodes show primary intelligence */
  .node {
    /* Story takes precedence for narrative importance */
    &[data-story-importance="high"] {
      filter: drop-shadow(0 0 8px var(--story-intelligence));
    }
    
    /* Social indicators remain visible */
    .collaboration-required::before {
      opacity: 0.4; /* Reduced to not conflict */
    }
  }
}

/* Maximum 3 active layers for clarity */
.too-many-layers-warning {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  background: var(--timeline-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: 4px;
  font-size: var(--text-sm);
}
```

---

## Transition Animations

### Selection Transitions

```css
/* Entity selection animation sequence */
.node-selecting {
  animation: select-sequence var(--duration-normal) var(--spring);
}

@keyframes select-sequence {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1.1); }
}

/* Related nodes response */
.becoming-related {
  animation: fade-to-related var(--duration-fast) var(--ease-out);
}

@keyframes fade-to-related {
  from { opacity: 0.6; }
  to { opacity: 0.9; }
}

/* Context nodes fade */
.becoming-context {
  animation: fade-to-context var(--duration-normal) var(--ease-out);
}

@keyframes fade-to-context {
  from { opacity: 0.9; }
  to { opacity: 0.6; }
}
```

### View Mode Transitions

```javascript
// Smooth layout morphing
const viewTransitions = {
  overviewToFocus: {
    duration: 500,
    easing: 'ease-in-out',
    stages: [
      { time: 0, action: 'mark-transitioning' },
      { time: 100, action: 'fade-unrelated' },
      { time: 200, action: 'start-movement' },
      { time: 400, action: 'scale-focused' },
      { time: 500, action: 'complete' }
    ]
  },
  
  focusToIntelligence: {
    duration: 300,
    easing: 'ease-out',
    stages: [
      { time: 0, action: 'prepare-overlay' },
      { time: 100, action: 'fade-in-intelligence' },
      { time: 200, action: 'adjust-edges' },
      { time: 300, action: 'complete' }
    ]
  }
};
```

### Performance-Aware Animation

```css
/* Reduce motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Keep essential feedback */
  .node.selected {
    transform: scale(1.1);
    box-shadow: 0 0 0 4px var(--selected-glow);
  }
}

/* GPU-optimized transforms */
.gpu-accelerated {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU layer */
}

/* Performance mode simplifications */
.performance-mode {
  .node {
    /* Disable shadows and filters */
    box-shadow: none !important;
    filter: none !important;
  }
  
  .edge {
    /* Simplify edge rendering */
    stroke-dasharray: none !important;
  }
  
  /* Reduce animation complexity */
  * {
    animation: none !important;
  }
}
```

---

## Responsive Layout System

```
Desktop (>1400px)                          Laptop (1024-1400px)
┌─────┬─────────────────────┬────────┐    ┌──────────────────┬────────┐
│ [≡] │ Controls Bar        │ [?]    │    │ Controls Bar     │ [?]    │
├─────┼─────────────────────┼────────┤    ├──────────────────┼────────┤
│     │                     │        │    │                  │        │
│  S  │   Graph Canvas      │ Intel  │    │  Graph Canvas    │ Intel  │
│  i  │                     │ Panel  │    │                  │ Panel  │
│  d  │   (Sarah) ══> ◆     │        │    │  (Sarah) ══> ◆   │ (320px)│
│  e  │      ║        ║     │ Story: │    │     ║        ║   │        │
│  b  │     ▶────────┘     │ High   │    │    ▶────────┘   │ Compact│
│  a  │                     │        │    │                  │ View   │
│  r  │                     │        │    │                  │        │
└─────┴─────────────────────┴────────┘    └──────────────────┴────────┘
 60px        Flexible          400px                           320px

Tablet (768-1023px)                       Mobile (<768px)
┌────────────────────────────┐            ┌──────────────────┐
│ Controls Bar         [≡]   │            │ [≡] ALNTool [?]  │
├────────────────────────────┤            ├──────────────────┤
│                            │            │ ┌──────┬────────┐│
│      Graph Canvas          │            │ │Graph │ Intel  ││
│                            │            │ └──────┴────────┘│
│     (Sarah) ══> ◆          │            │                  │
│        ║        ║          │            │   (Sarah)        │
│       ▶────────┘          │            │      ║           │
├────────────────────────────┤            │      ◆           │
│ Intelligence Panel (Sticky)│            │      ║           │
│ ┌─────────┬──────────────┐ │            │      ▶           │
│ │Analysis │ Suggestions  │ │            │                  │
│ └─────────┴──────────────┘ │            │ [View Intel ↑]   │
└────────────────────────────┘            └──────────────────┘
         Full width                        Tab-based interface
```

### Grid Structure

```css
.journey-intelligence-layout {
  display: grid;
  min-height: 100vh;
  background: var(--surface-primary);
  
  /* Desktop layout (>1400px) */
  @media (min-width: 1401px) {
    grid-template-areas:
      "controls controls controls"
      "sidebar graph panel";
    grid-template-columns: 60px 1fr 400px;
    grid-template-rows: 60px 1fr;
  }
  
  /* Laptop layout (1024-1400px) */
  @media (min-width: 1024px) and (max-width: 1400px) {
    grid-template-areas:
      "controls controls"
      "graph panel";
    grid-template-columns: 1fr 320px;
    grid-template-rows: 60px 1fr;
  }
  
  /* Tablet layout (768-1023px) */
  @media (min-width: 768px) and (max-width: 1023px) {
    grid-template-areas:
      "controls"
      "graph"
      "panel";
    grid-template-columns: 1fr;
    grid-template-rows: 60px 60vh auto;
    
    .intelligence-panel {
      position: sticky;
      bottom: 0;
      max-height: 40vh;
      overflow-y: auto;
    }
  }
  
  /* Mobile layout (<768px) */
  @media (max-width: 767px) {
    grid-template-areas:
      "controls"
      "content";
    grid-template-columns: 1fr;
    grid-template-rows: 60px 1fr;
    
    /* Tab-based interface on mobile */
    .mobile-tabs {
      display: flex;
      position: sticky;
      top: 60px;
      background: var(--surface-primary);
      border-bottom: 1px solid var(--border-default);
      z-index: 10;
    }
  }
}
```

### Adaptive Components

#### Control Bar
```css
.control-bar {
  grid-area: controls;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  background: var(--surface-secondary);
  border-bottom: 1px solid var(--border-default);
  gap: var(--space-4);
  
  /* Desktop: all controls visible */
  @media (min-width: 1024px) {
    .entity-selector { flex: 0 0 240px; }
    .intelligence-toggles { flex: 0 0 auto; }
    .search-bar { flex: 1; max-width: 400px; }
    .view-controls { flex: 0 0 auto; }
  }
  
  /* Tablet: compact mode */
  @media (min-width: 768px) and (max-width: 1023px) {
    .entity-selector { flex: 0 0 180px; }
    .intelligence-toggles { 
      .toggle-label { display: none; } /* Icons only */
    }
  }
  
  /* Mobile: drawer-based */
  @media (max-width: 767px) {
    .mobile-menu-trigger { display: block; }
    .desktop-controls { display: none; }
  }
}
```

#### Intelligence Panel
```css
.intelligence-panel {
  grid-area: panel;
  background: var(--surface-primary);
  border-left: 1px solid var(--border-default);
  overflow-y: auto;
  
  /* Responsive sizing */
  @media (min-width: 1401px) {
    padding: var(--space-6);
    
    .panel-section {
      margin-bottom: var(--space-8);
    }
  }
  
  @media (max-width: 1400px) {
    padding: var(--space-4);
    
    .panel-section {
      margin-bottom: var(--space-6);
    }
    
    /* Compact data display */
    .intelligence-metric {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
    }
  }
  
  @media (max-width: 767px) {
    /* Full screen on mobile */
    position: fixed;
    inset: 60px 0 0 0;
    transform: translateX(100%);
    transition: transform var(--duration-normal) var(--ease-out);
    z-index: 100;
    
    &.open {
      transform: translateX(0);
    }
  }
}
```

### Touch Interactions

```css
/* Touch-friendly targets */
@media (pointer: coarse) {
  .node {
    /* Minimum 44px touch target */
    min-width: 44px;
    min-height: 44px;
    
    /* Larger tap area */
    &::after {
      content: "";
      position: absolute;
      inset: -8px;
    }
  }
  
  .control-button {
    min-width: 44px;
    min-height: 44px;
    padding: var(--space-3);
  }
  
  /* Touch-specific interactions */
  .long-press-menu {
    display: none;
    position: absolute;
    background: var(--surface-primary);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: var(--space-2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    &.active {
      display: block;
    }
  }
}

/* Gesture support */
.graph-canvas {
  /* Pinch to zoom */
  touch-action: pan-x pan-y pinch-zoom;
  
  /* Momentum scrolling */
  -webkit-overflow-scrolling: touch;
}
```

---

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have 3:1 contrast ratio against their background
- Focus indicators have 3:1 contrast ratio

### Keyboard Navigation
```css
/* Focus indicators */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.node:focus-visible {
  box-shadow: 
    0 0 0 2px var(--surface-primary),
    0 0 0 4px var(--border-focus);
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--surface-primary);
  color: var(--text-primary);
  padding: var(--space-2) var(--space-4);
  text-decoration: none;
  z-index: 100;
  
  &:focus {
    top: 0;
  }
}
```

### Screen Reader Support
```html
<!-- Entity nodes -->
<g role="button" 
   aria-label="Character: Sarah Mitchell" 
   aria-describedby="sarah-details"
   tabindex="0">
  <circle class="character-node" />
  <text class="node-label">Sarah</text>
</g>

<!-- Intelligence toggles -->
<button role="switch" 
        aria-checked="true" 
        aria-label="Story Intelligence Layer">
  <span class="sr-only">Toggle story intelligence overlay</span>
  <svg class="toggle-icon" aria-hidden="true">...</svg>
</button>

<!-- Status announcements -->
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  <span id="selection-announcement">Selected Marcus Thompson. 5 story connections, 3 social dependencies.</span>
</div>
```

### Colorblind Support
```css
/* Patterns in addition to color */
.character-node { stroke-dasharray: none; }
.element-node { stroke-dasharray: 3, 3; }
.puzzle-node { stroke-dasharray: 5, 2; }
.timeline-node { stroke-dasharray: 1, 1; }

/* Colorblind mode toggle */
.colorblind-mode {
  --character-primary: #0066CC;
  --element-primary: #009900;
  --puzzle-primary: #663399;
  --timeline-primary: #FF6600;
  
  /* High contrast patterns */
  .node {
    border-width: 3px;
  }
}
```

---

## Component Interface Mockups

### Control Bar Layout
```
Desktop Control Bar
┌────────────────────────────────────────────────────────────────────────┐
│ [≡] Character: Sarah ▼ │ 📖 📤 💰 🏭 ❓ │ 🔍 Search... │ ⊞ ⊟ ⟲ │ ⚙️ │
└────────────────────────────────────────────────────────────────────────┘
  Menu  Entity Selector    Intelligence Toggles    Search    View  Settings

Mobile Control Bar (Collapsed)
┌──────────────────────────┐
│ [≡] ALNTool │ Sarah ▼│ ⋮ │
└──────────────────────────┘
```

### Intelligence Panel States
```
Character Selected: Sarah Mitchell          Element Selected: Voice Memo
┌─────────────────────────────┐            ┌─────────────────────────────┐
│ Intelligence Analysis       │            │ Intelligence Analysis       │
├─────────────────────────────┤            ├─────────────────────────────┤
│ ▼ Story Integration (High)  │            │ ▼ Timeline Connection       │
│   • 3 timeline events       │            │   Event: "Victoria records.."│
│   • Missing: Act 2 content  │            │   Importance: Critical      │
│   • Arc: 65% complete       │            │                            │
│                             │            │ ▼ Accessibility            │
│ ▼ Social Load (8 collabs)   │            │   Available to: Derek, Alex │
│   ⚠️ Above average (5)       │            │   Blocked for: Sarah       │
│   • Derek: 3 puzzles        │            │   Via: Jewelry Box puzzle   │
│   • Alex: 2 puzzles         │            │                            │
│   • Marcus: 3 puzzles       │            │ ▼ Economic Impact          │
│                             │            │   Value: $5,000 ⚠️         │
│ ▼ Economic Contribution     │            │   Path pressure: HIGH      │
│   Total value: $12,500      │            │   Set bonus: Victoria Set   │
│   Path balance: Good        │            │                            │
│                             │            │ ► Production Status        │
│ ► Production Requirements   │            │ ► Story Suggestions        │
└─────────────────────────────┘            └─────────────────────────────┘

Collapsed sections (►) expand on click
Warning indicators (⚠️) show issues
```

### Intelligence Toggle States
```
All Off                Active Layers              Performance Warning
┌─────────────┐       ┌─────────────┐            ┌──────────────────────┐
│ 📖 📤 💰 🏭 ❓ │       │ 📖 📤 💰 🏭 ❓ │            │ ⚠️ 3 layers maximum   │
│ ○ ○ ○ ○ ○ │  ───> │ ● ● ○ ● ○ │     ───>   │ Disable one to add   │
└─────────────┘       └─────────────┘            │ another layer        │
                      Story + Social              └──────────────────────┘
                      + Production active
```

---

## Performance Optimization

### CSS Performance Rules

```css
/* Use transforms instead of position changes */
.node-moving {
  transform: translate(var(--x), var(--y));
  /* NOT: left: var(--x); top: var(--y); */
}

/* Batch paint operations */
.nodes-container {
  contain: layout style paint;
}

/* Reduce paint areas */
.static-element {
  will-change: auto; /* Only set during animations */
}

/* Efficient shadows */
.shadow-performance {
  /* Use box-shadow sparingly */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  /* NOT: Multiple shadows or spread */
  /* box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1); */
}
```

### Progressive Enhancement

```javascript
// Feature detection
const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
const supportsGap = CSS.supports('gap', '1rem');

// Apply enhanced styles only if supported
if (supportsBackdropFilter) {
  document.documentElement.classList.add('backdrop-blur-support');
}

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 100) {
      console.warn('Slow frame:', entry);
      // Switch to performance mode if needed
    }
  }
});

performanceObserver.observe({ entryTypes: ['measure'] });
```

---

## Implementation Examples

### Node Component Structure
```jsx
function EntityNode({ data, selected, type }) {
  const nodeClass = cn(
    'entity-node',
    `${type}-node`,
    {
      'selected': selected,
      'related': data.isRelated,
      'contextual': data.isContextual,
      'gpu-accelerated': true
    }
  );
  
  return (
    <g 
      className={nodeClass}
      role="button"
      tabIndex={0}
      aria-label={`${type}: ${data.name}`}
    >
      <NodeShape type={type} size={data.size} />
      <NodeContent data={data} zoom={zoom} />
      {data.badges && <NodeBadges badges={data.badges} />}
      {selected && <SelectionGlow />}
    </g>
  );
}
```

### Intelligence Toggle Component
```jsx
function IntelligenceToggle({ layer, active, onToggle }) {
  const toggleClass = cn(
    'intelligence-toggle',
    `${layer}-intelligence`,
    { 'active': active }
  );
  
  return (
    <button
      className={toggleClass}
      onClick={() => onToggle(layer)}
      role="switch"
      aria-checked={active}
      aria-label={`${layer} intelligence layer`}
    >
      <Icon name={layer} />
      <span className="toggle-label">{layer}</span>
      {active && <ActiveIndicator />}
    </button>
  );
}
```

---

## Visual Quality Checklist

### Pre-Implementation Review
- [ ] All entity types visually distinct at 50% zoom
- [ ] Color contrast passes WCAG 2.1 AA
- [ ] Touch targets minimum 44px
- [ ] Animations respect prefers-reduced-motion
- [ ] Focus indicators visible on all backgrounds

### Implementation Testing
- [ ] 50 nodes render smoothly at 60fps
- [ ] Transitions complete within defined durations
- [ ] Intelligence overlays combine without visual conflict
- [ ] Responsive breakpoints transition smoothly
- [ ] Accessibility tools report no major issues

### Performance Validation
- [ ] Initial render <100ms
- [ ] Selection response <50ms
- [ ] View transitions <500ms
- [ ] Memory usage stable during extended use
- [ ] No paint thrashing during animations

---

*"Great visual design is invisible - it simply enables understanding."*  
— Sarah Chen