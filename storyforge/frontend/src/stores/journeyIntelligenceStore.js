/**
 * Enhanced Journey Intelligence Store
 * Manages UI state for entity selection, intelligence layers, and performance
 * All data fetching remains in React Query - this is UI state only
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

export const useJourneyIntelligenceStore = create(
  persist(
    subscribeWithSelector((set, get) => ({
    // Selection state
    selectedEntity: null,
    selectionHistory: [],
    
    // View state
    viewMode: 'overview', // overview | entity-focus | intelligence-deep-dive
    activeIntelligence: ['story', 'social'], // Max 3 active layers
    focusMode: 'overview', // overview | focused | performance
    
    // UI state
    graphConfig: {
      zoom: 1,
      center: { x: 0, y: 0 },
      nodeVisibility: {},
      edgeVisibility: {}
    },
    
    // Performance state
    performanceMode: 'auto', // auto | quality | performance
    visibleNodeCount: 0,
    _userOverrideMode: null, // Track if user manually set mode
    
    // Actions
    selectEntity: (entity) => {
      const current = get().selectedEntity;
      const history = get().selectionHistory;
      
      // Add current to history if it exists
      const newHistory = current 
        ? [...history, current].slice(-5) // Keep max 5
        : history;
      
      set({
        selectedEntity: entity,
        selectionHistory: newHistory,
        viewMode: entity ? 'entity-focus' : 'overview'
      });
    },
    
    setSelectedEntity: (entity) => {
      set({ selectedEntity: entity });
    },
    
    setFocusMode: (mode) => {
      set({ focusMode: mode });
    },
    
    navigateBack: () => {
      const history = get().selectionHistory;
      if (history.length === 0) return;
      
      const previousEntity = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      
      set({
        selectedEntity: previousEntity,
        selectionHistory: newHistory,
        viewMode: previousEntity ? 'entity-focus' : 'overview'
      });
    },
    
    toggleIntelligence: (layer) => {
      const active = get().activeIntelligence;
      
      if (active.includes(layer)) {
        // Remove layer
        set({
          activeIntelligence: active.filter(l => l !== layer)
        });
      } else {
        // Add layer, enforce max 3
        if (active.length >= 3) {
          // Remove oldest (first) layer
          set({
            activeIntelligence: [...active.slice(1), layer]
          });
        } else {
          set({
            activeIntelligence: [...active, layer]
          });
        }
      }
    },
    
    clearIntelligence: () => {
      set({ activeIntelligence: [] });
    },
    
    setViewMode: (mode) => {
      set({ viewMode: mode });
    },
    
    updateNodeCount: (count) => {
      const currentMode = get().performanceMode;
      const userOverride = get()._userOverrideMode;
      
      set({ visibleNodeCount: count });
      
      // Auto-switch performance mode if not user overridden
      if (!userOverride && currentMode === 'auto') {
        if (count >= 40) {
          set({ performanceMode: 'performance' });
        }
      } else if (userOverride === 'auto') {
        // User wants auto mode
        if (count >= 40) {
          set({ performanceMode: 'performance' });
        } else {
          set({ performanceMode: 'auto' });
        }
      }
    },
    
    setPerformanceMode: (mode) => {
      set({
        performanceMode: mode,
        _userOverrideMode: mode
      });
    },
    
    updateGraphConfig: (config) => {
      set({
        graphConfig: {
          ...get().graphConfig,
          ...config
        }
      });
    },
    
    setNodeVisibility: (nodeId, visible) => {
      set({
        graphConfig: {
          ...get().graphConfig,
          nodeVisibility: {
            ...get().graphConfig.nodeVisibility,
            [nodeId]: visible
          }
        }
      });
    },
    
    setEdgeVisibility: (edgeId, visible) => {
      set({
        graphConfig: {
          ...get().graphConfig,
          edgeVisibility: {
            ...get().graphConfig.edgeVisibility,
            [edgeId]: visible
          }
        }
      });
    }
  })),
  {
    name: 'journey-intelligence-store', // unique name for localStorage key
    partialize: (state) => ({
      // Persist only specific parts of the state
      selectedEntity: state.selectedEntity,
      viewMode: state.viewMode,
      activeIntelligence: state.activeIntelligence,
      focusMode: state.focusMode,
      graphConfig: state.graphConfig,
      performanceMode: state.performanceMode,
      _userOverrideMode: state._userOverrideMode
      // Don't persist: selectionHistory, visibleNodeCount (these are runtime state)
    }),
    version: 1, // Allows for migration if state shape changes
  }
  )
);