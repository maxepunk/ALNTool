import { useState, useCallback } from 'react';

/**
 * useRelationshipMapperUIState.js
 * Custom hook to encapsulate all UI state and handlers for RelationshipMapper.
 */
export default function useRelationshipMapperUIState({
  initialViewMode = 'default',
  initialDepth = 2,
  initialNodeFilters = {
    Character: true,
    Puzzle: true,
    Element: true,
    Timeline: true,
  },
  initialEdgeFilters = {
    dependency: true,
    containment: true,
    character: true,
    default: true,
  },
  initialShowLowSignal = true,
}) {
  // UI state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [nodeFilters, setNodeFilters] = useState(initialNodeFilters);
  const [edgeFilters, setEdgeFilters] = useState(initialEdgeFilters);
  const [depth, setDepth] = useState(initialDepth);
  const [showLowSignal, setShowLowSignal] = useState(initialShowLowSignal);
  const [hoveredElement, setHoveredElement] = useState(null); // { id: string, type: 'node' | 'edge' }
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Handlers
  const toggleFullScreen = useCallback(() => setIsFullScreen((v) => !v), []);
  const openFilterMenu = useCallback((event) => setFilterMenuAnchor(event.currentTarget), []);
  const closeFilterMenu = useCallback(() => setFilterMenuAnchor(null), []);
  const toggleNodeFilter = useCallback((nodeType) => {
    setNodeFilters((prev) => ({ ...prev, [nodeType]: !prev[nodeType] }));
  }, []);
  const toggleEdgeFilter = useCallback((edgeType) => {
    setEdgeFilters((prev) => ({ ...prev, [edgeType]: !prev[edgeType] }));
  }, []);
  const toggleLowSignal = useCallback(() => setShowLowSignal((v) => !v), []);
  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);
    closeFilterMenu();
  }, [closeFilterMenu]);
  const handleLayoutChange = useCallback((layoutManager, newLayoutType) => {
    if (newLayoutType !== null) {
      layoutManager.changeLayout(newLayoutType);
      setSnackbar({
        open: true,
        message: `Switched to ${newLayoutType === 'radial' ? 'Radial' : newLayoutType === 'force-directed' ? 'Force-Directed' : 'Hierarchical'} layout`,
        severity: 'info',
      });
    }
  }, []);
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    // State
    isFullScreen,
    viewMode,
    filterMenuAnchor,
    infoOpen,
    nodeFilters,
    edgeFilters,
    depth,
    showLowSignal,
    hoveredElement,
    snackbar,
    // Setters
    setIsFullScreen,
    setViewMode,
    setFilterMenuAnchor,
    setInfoOpen,
    setNodeFilters,
    setEdgeFilters,
    setDepth,
    setShowLowSignal,
    setHoveredElement,
    setSnackbar,
    // Handlers
    toggleFullScreen,
    openFilterMenu,
    closeFilterMenu,
    toggleNodeFilter,
    toggleEdgeFilter,
    toggleLowSignal,
    changeViewMode,
    handleLayoutChange,
    handleCloseSnackbar,
  };
} 