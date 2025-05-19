/**
 * useLayoutManager.js
 * Custom hook for managing RelationshipMapper layouts
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Layout options and configurations for the RelationshipMapper
 * 
 * @typedef {Object} LayoutOptions
 * @property {string} type - The layout type: 'radial', 'force-directed', or 'dagre'
 * @property {Object} config - Layout-specific configuration options
 */

/**
 * Custom hook to manage RelationshipMapper layouts
 * 
 * @param {Object} options - Options for the layout manager
 * @param {string} options.initialLayout - The initial layout type to use ('radial' by default)
 * @param {function} options.onLayoutChange - Optional callback when layout changes
 * @param {boolean} options.isFullScreen - Whether the layout is in full screen mode
 * @returns {Object} Layout management utilities and state
 */
const useLayoutManager = ({ 
  initialLayout = 'radial',
  onLayoutChange = null,
  isFullScreen = false
} = {}) => {
  // Current layout type
  const [layoutType, setLayoutType] = useState(initialLayout);
  
  // Define two sets of layout options
  const panelLayoutOptions = {
    radial: {
      baseRadius: 290,
      minRadiusBetweenNodes: 115,
      maxNodesRadial: 4, // Adjusted for potentially tighter space
      nodeWidth: 160, 
      nodeHeight: 70
    },
    'force-directed': {
      chargeStrength: -120,
      linkDistance: 90, // Shorter links for panel
      iterations: 120,
      linkStrength: 0.7,
      centerStrength: 0.06,
    },
    dagre: {
      rankdir: 'LR', // Default, can be overridden by user
      nodesep: 50,
      ranksep: 60,    // Tighter separation for panel
      nodeWidth: 160,
      nodeHeight: 50,
    }
  };

  const fullscreenLayoutOptions = {
    radial: {
      baseRadius: 350,
      minRadiusBetweenNodes: 130,
      maxNodesRadial: 5,
      nodeWidth: 180,
      nodeHeight: 80
    },
    'force-directed': {
      chargeStrength: -180, // More spread for fullscreen
      linkDistance: 130,
      iterations: 150,
      linkStrength: 0.7,
      centerStrength: 0.05,
    },
    dagre: {
      rankdir: 'TB', // Changed to Top-to-Bottom for potentially better Character map overview
      nodesep: 70,   // More generous separation
      ranksep: 80,
      nodeWidth: 170,
      nodeHeight: 60,
    }
  };
  
  // Layout-specific options - selected based on isFullScreen
  const [currentLayoutOptionsSet, setCurrentLayoutOptionsSet] = useState(
    isFullScreen ? fullscreenLayoutOptions : panelLayoutOptions
  );

  // Effect to update options set if isFullScreen changes
  useEffect(() => {
    setCurrentLayoutOptionsSet(isFullScreen ? fullscreenLayoutOptions : panelLayoutOptions);
  }, [isFullScreen]);

  // Get current layout configuration from the active set
  const getCurrentOptions = useCallback(() => {
    return currentLayoutOptionsSet[layoutType] || {};
  }, [layoutType, currentLayoutOptionsSet]);

  // Handle layout change
  const changeLayout = useCallback((newLayout) => {
    if (newLayout && newLayout !== layoutType) {
      console.log(`Changing layout from ${layoutType} to ${newLayout}`);
      setLayoutType(newLayout);
      
      // Call the change callback if provided
      if (onLayoutChange) {
        onLayoutChange(newLayout, currentLayoutOptionsSet[newLayout] || {});
      }
    }
  }, [layoutType, currentLayoutOptionsSet, onLayoutChange]);

  // Update specific layout options
  const updateLayoutOptions = useCallback((layout, newOptions) => {
    // Note: This function updates options within the currently active set.
    // If we want to update specific panel/fullscreen options directly, this would need more logic.
    // For now, user-driven updates via UI will modify the active set (panel or fullscreen).
    setCurrentLayoutOptionsSet(prevOptionsSet => ({
      ...prevOptionsSet,
      [layout]: {
        ...prevOptionsSet[layout],
        ...newOptions
      }
    }));
  }, []);

  // Reset layout options to defaults of the current mode (panel/fullscreen)
  const resetLayoutOptions = useCallback((layout) => {
    const defaults = isFullScreen ? fullscreenLayoutOptions : panelLayoutOptions;

    if (layout) {
      // Reset specific layout in the current set
      setCurrentLayoutOptionsSet(prev => ({
        ...prev,
        [layout]: defaults[layout] || {}
      }));
    } else {
      // Reset all layouts in the current set to their mode-specific defaults
      // This part needs care: we should reset the *entire* currentLayoutOptionsSet to defaults
      // rather than just layoutOptions state variable if that was used.
      setCurrentLayoutOptionsSet(isFullScreen ? { ...fullscreenLayoutOptions } : { ...panelLayoutOptions });
    }
  }, [isFullScreen, fullscreenLayoutOptions, panelLayoutOptions]);

  // Expose the current layout and options
  const layoutManager = {
    // Current state
    layoutType,
    options: getCurrentOptions(), // This now correctly pulls from the mode-specific set
    allOptions: currentLayoutOptionsSet, // Expose the currently active set of options
    
    // Actions
    changeLayout,
    updateOptions: (newOptions) => updateLayoutOptions(layoutType, newOptions),
    updateLayoutOptions,
    resetOptions: () => resetLayoutOptions(layoutType),
    resetLayoutOptions,
    
    // Utility
    isRadial: layoutType === 'radial',
    isForceDirected: layoutType === 'force-directed',
    isHierarchical: layoutType === 'dagre'
  };

  return layoutManager;
};

export default useLayoutManager; 