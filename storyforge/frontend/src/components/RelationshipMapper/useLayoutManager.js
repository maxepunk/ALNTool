/**
 * useLayoutManager.js
 * Custom hook for managing RelationshipMapper layouts.
 * As per PRD Section 9, Phase 1, Step 2, this is simplified for a fixed Dagre layout.
 */

// Default (and only) layout type
const DAGRE_LAYOUT_TYPE = 'dagre';

// Define a single, default set of options for Dagre.
// Most detailed Dagre configurations (nodesep, ranksep, etc.) are now
// managed within getDagreLayout.js itself to ensure a single source of truth
// for the default hierarchical layout.
// This hook can provide minimal overrides if needed, e.g., ensuring rankdir.
const defaultDagreLayoutOptions = {
  rankdir: 'TB', // Enforce Top-to-Bottom as the standard orientation.
  // Other specific options passed to useGraphTransform can be added here if needed.
};

/**
 * Custom hook to manage RelationshipMapper layouts (Simplified for fixed Dagre layout).
 * 
 * @returns {Object} Layout management utilities and state.
 */
const useLayoutManager = (/* { isFullScreen = false } = {} */) => {
  // The layout type is now fixed.
  const layoutType = DAGRE_LAYOUT_TYPE;

  // Layout options are now simplified to a single default set for Dagre.
  // The distinction between panel/fullscreen options for layout is removed as per PRD.
  const options = defaultDagreLayoutOptions;

  // Expose the current layout and options
  const layoutManager = {
    layoutType,    // Always 'dagre'
    options,       // Default Dagre options (e.g., { rankdir: 'TB' })
    
    // Boolean flags for convenience, though only isHierarchical will be true.
    isRadial: false,
    isForceDirected: false,
    isHierarchical: true,
  };

  return layoutManager;
};

export default useLayoutManager;
