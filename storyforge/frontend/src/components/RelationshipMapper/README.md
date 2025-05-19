# Relationship Mapper Component

The Relationship Mapper is a core visual component in StoryForge that provides an interactive graph visualization of entity relationships. It allows users to see how different entities (Characters, Elements, Puzzles, Timeline Events) are connected.

## Features

- **Visual Relationship Graph**: Displays a node graph showing direct 1st-degree relations for any selected entity
- **Entity Type Coloring**: Each entity type has its own color scheme for easy identification
- **Clickable Nodes**: Nodes are clickable and navigate to the detail page of the related entity
- **Auto Layout**: Automatically positions nodes in a radial, force-directed, or hierarchical layout, grouping them by entity type
- **Filtering**: Users can filter nodes and edges by type, depth, and signal strength
- **Responsive Design**: Adapts to different screen sizes

## Usage

```jsx
import RelationshipMapper from '../components/RelationshipMapper';

// Inside your component:
<RelationshipMapper
  title="Entity Relationships" // Optional custom title
  entityType="Character" // Required: One of 'Character', 'Element', 'Puzzle', 'Timeline'
  entityId="<notion-id>" // Required: ID of the entity being viewed
  entityName="Entity Name" // Name of the entity for display
  relationshipData={entityData} // The full entity data object including its relations
  isLoading={isLoading} // Loading state
  error={error} // Error state
/>
```

## Component Structure

- **RelationshipMapper.jsx**: Main component that renders the graph and manages UI state (now via a custom hook)
- **useRelationshipMapperUIState.js**: Custom hook that encapsulates all UI state and handlers for the RelationshipMapper (filters, view mode, depth, snackbar, fullscreen, etc.)
- **useGraphTransform.js**: Hook that transforms, filters, and lays out graph data
- **transformToGraphElements.js**: Pure function that encapsulates all transformation logic for nodes and edges (single source of truth)
- **filterGraph.js**: Pure function that encapsulates all filtering logic for nodes and edges
- **layoutUtils.js**: Utilities for calculating node positions (radial, force-directed, hierarchical)
- **useLayoutManager.js**: Hook for managing layout switching and options
- **EntityNode.jsx**: Custom node component for displaying entities
- **index.js**: Export file for easier imports

### UI State Management (as of June 2024)

All UI state for the RelationshipMapper (including filters, view mode, depth, snackbar, fullscreen, info modal, etc.) is now managed via the `useRelationshipMapperUIState` custom hook. This hook centralizes state logic, making the main component smaller, more maintainable, and easier to extend for future features (such as layout/user preference persistence or interactive editing).

**Usage Example:**

```js
import useRelationshipMapperUIState from './useRelationshipMapperUIState';

const ui = useRelationshipMapperUIState({});
const { viewMode, nodeFilters, edgeFilters, ...handlers } = ui;
// Use these in your component as needed
```

The main `RelationshipMapper.jsx` component now delegates all UI state and handlers to this hook, ensuring a clean separation of concerns.

## Data Flow & Filtering

1. The component receives entity data through the `relationshipData` prop
2. Data is transformed into nodes and edges using `transformToGraphElements.js` (single source of truth)
3. **Filtering** is handled exclusively by the `filterGraph.js` pure function, which supports:
   - Depth filtering (max hops from center node)
   - Node type filtering (by entity type)
   - Edge type filtering (by relationship type)
   - Low-signal suppression (removes trivial/low-value nodes)
   - Timeline node removal (optional)
4. The filtered nodes/edges are then passed to the selected layout algorithm
5. The layouted nodes/edges are rendered in the graph
6. Clicking on a node navigates to that entity's detail page

### Filtering API

- Filtering options are controlled via UI and passed as props/state to `useGraphTransform`, which delegates to `filterGraph`.
- To add or modify filtering logic, update `filterGraph.js` only.

### Data Transformation API

- All transformation from raw Notion/BFF data or BFF-precomputed graph data to React Flow nodes/edges is handled by `transformToGraphElements.js`.
- No other part of the codebase should perform node/edge transformation.

## Future Enhancements (Phase 4)

- **Interactive Editing**: Allow creating/modifying relationships directly by interacting with the graph
- **Additional Visualization Options**: Add more layout algorithms (force-directed, hierarchical, etc.)
- **Filters**: Add ability to filter the graph by relationship type or entity type (now implemented)
- **Zoom to Area**: Add buttons to focus on specific parts of the graph
- **Multi-Level Relationships**: Option to show 2nd or 3rd degree connections
- **Performance Optimization**: Improve rendering for large relationship graphs
- **Mobile Interactions**: Enhance touch interactions for mobile users

## Guidelines for Future Development

1. **Keep Node UI Clean**: Nodes should display minimal but useful information
2. **Use Color Consistently**: Follow the established color scheme for entity types
3. **Maintain Performant Rendering**: Large graphs can impact performance, use virtualization when needed
4. **Respect Accessibility**: Ensure proper contrast, keyboard navigation, and screen reader support
5. **Consider Data Complexity**: StoryForge works with complex interconnected data; make sure visualizations clarify rather than complicate

## Troubleshooting

- If nodes are overlapping, adjust the radius or layout algorithm parameters in `layoutUtils.js`
- If certain relationships aren't appearing, check that they're being properly included in the data transformation and not filtered out by `filterGraph`
- If you see an empty graph, ensure that `relationshipData` contains the proper structure with relation arrays and that filtering options are not too restrictive

## Backend Expansion Note

- The BFF currently supports multi-hop (depth-based) expansion for 1st/2nd degree relationships. If more advanced or dynamic graph expansion (e.g., interactive in-place expansion) is needed in the future, the BFF may need to be enhanced for performance and flexibility. 