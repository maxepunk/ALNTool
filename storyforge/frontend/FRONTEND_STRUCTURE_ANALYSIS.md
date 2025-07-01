# Frontend Structure Analysis

## Page Components and Their Purposes

### Core Entity Pages
1. **Dashboard** (`/`) - Main overview page with production metrics
2. **Characters** (`/characters`) - List view of all characters
3. **CharacterDetail** (`/characters/:id`) - Individual character details
4. **Timeline** (`/timelines`) - List view of timeline events
5. **TimelineDetail** (`/timelines/:id`) - Individual timeline event details
6. **Puzzles** (`/puzzles`) - List view of all puzzles
7. **PuzzleDetail** (`/puzzles/:id`) - Individual puzzle details
8. **Elements** (`/elements`) - List view of all elements
9. **ElementDetail** (`/elements/:id`) - Individual element details

### Specialized Analysis Pages
10. **PlayerJourneyPage** (`/player-journey`) - Primary character journey design view with dual-lens layout
11. **MemoryEconomyPage** (`/memory-economy`) - Memory token economy analysis and balancing
12. **CharacterSociogramPage** (`/character-sociogram`) - Character relationship network visualization
13. **NarrativeThreadTrackerPage** (`/narrative-thread-tracker`) - Narrative thread coherence analysis
14. **ResolutionPathAnalyzerPage** (`/resolution-path-analyzer`) - Resolution path balancing and analysis
15. **ElementPuzzleEconomyPage** (`/element-puzzle-economy`) - Element-puzzle relationship flow
16. **PuzzleFlowPage** (`/puzzles/:id/flow`) - Individual puzzle flow visualization

### Utility Pages
17. **NotFound** - 404 error page
18. **TestErrorComponent** (`/test-error`) - Error boundary testing

## Major View Components

### Journey-Related Components
- **JourneyGraphView** - Core graph visualization for character journeys using ReactFlow
- **ExperienceFlowAnalyzer** - Wrapper around JourneyGraphView with analysis features
- **PlayerJourney/** folder contains:
  - Custom node types (ActivityNode, DiscoveryNode, LoreNode)
  - ExperienceAnalysisPanel
  - CharacterSelector
  - analyzeExperienceFlow utility

### Relationship/Graph Components
- **RelationshipMapper** - Reusable graph component for entity relationships
  - Used in ElementDetail and TimelineDetail pages
  - Contains EntityNode, SecondaryEntityNode, CustomEdge
  - Has its own layout utilities and UI state management
- **CharacterSociogramPage** - Uses ReactFlow directly with EntityNode from RelationshipMapper
- **PuzzleFlowPage** - Uses ReactFlow with graph components from RelationshipMapper

### Layout Components
- **DualLensLayout** - Split view layout used by PlayerJourneyPage
- **AppLayout** - Main application layout with navigation drawer
- **BreadcrumbNavigation** - Breadcrumb trail component
- **ContextIndicator** - Shows current context in the UI
- **CommandBar** - Command/action bar
- **ContextWorkspace** - Workspace management component

## Duplication and Overlapping Functionality

### Graph Visualization Duplication
1. **Multiple ReactFlow Implementations**:
   - JourneyGraphView (PlayerJourney)
   - RelationshipMapper (used in Element/Timeline details)
   - CharacterSociogramPage (direct ReactFlow usage)
   - PuzzleFlowPage (direct ReactFlow usage)

2. **Node Component Duplication**:
   - EntityNode (RelationshipMapper) - used for general entities
   - ActivityNode, DiscoveryNode, LoreNode (PlayerJourney) - journey-specific
   - Both CharacterSociogramPage and PuzzleFlowPage reuse EntityNode but in different contexts

3. **Layout Utilities**:
   - useAutoLayout (PlayerJourney)
   - layoutUtils.js with getDagreLayout (RelationshipMapper)
   - Both implement similar graph layout functionality

### Similar Analysis Features
- **ExperienceAnalysisPanel** (PlayerJourney) 
- **DependencyAnalysisPanel** (RelationshipMapper)
- Both analyze relationships but for different contexts

## Current Routing Structure

The app uses React Router v6 with a hierarchical structure:
- Base routes for entity lists and details
- Specialized analysis pages as top-level routes
- Nested routes for entity-specific views (e.g., `/puzzles/:id/flow`)

## Component Organization

```
src/
├── pages/              # Route components
├── components/         # Reusable components
│   ├── PlayerJourney/  # Journey-specific components
│   ├── RelationshipMapper/ # General graph components
│   ├── Layout/         # Layout components
│   ├── Dashboard/      # Dashboard-specific
│   ├── Elements/       # Element-specific
│   ├── Characters/     # Character-specific
│   └── ...            # Other domain-specific folders
├── hooks/             # Custom React hooks
├── stores/            # Zustand stores
├── services/          # API services
└── utils/             # Utility functions
```

## Recommendations for Consolidation

1. **Unify Graph Components**: Create a single, flexible graph visualization system that can handle all use cases (journey, relationships, flow, sociogram)

2. **Standardize Node Types**: Create a base node component that can be extended for specific use cases rather than having separate implementations

3. **Consolidate Layout Logic**: Merge useAutoLayout and layoutUtils into a single, comprehensive layout system

4. **Component Naming**: Some components have generic names (e.g., "EntityNode") that don't clearly indicate their purpose or domain

5. **View Consolidation**: Consider whether some specialized pages could be combined or made into tabs/modes of existing pages to reduce navigation complexity