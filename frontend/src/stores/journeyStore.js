import { create } from 'zustand';

const useJourneyStore = create((set) => ({
  // Shared state for selected time range [startTime, endTime]
  selectedTimeRange: [0, 90], // Default range, e.g., 0 to 90 minutes
  // Action to update the selected time range
  setSelectedTimeRange: (newRange) => {
    if (Array.isArray(newRange) && newRange.length === 2 &&
        typeof newRange[0] === 'number' && typeof newRange[1] === 'number' &&
        newRange[0] <= newRange[1]) {
      set({ selectedTimeRange: newRange });
    } else {
      console.warn('setSelectedTimeRange received an invalid range:', newRange);
    }
  },

  // Shared state for selected item ID
  selectedItemId: null, // Can be any string, e.g., "event-123", "character-abc"
  // Action to update the selected item ID
  setSelectedItemId: (itemId) => set({ selectedItemId: itemId }),

  // Breadcrumb navigation state
  breadcrumbs: [{ label: "Game", path: "/" }], // Initial breadcrumb
  // Action to set the entire breadcrumb array
  setBreadcrumbs: (newBreadcrumbs) => {
    if (Array.isArray(newBreadcrumbs) && newBreadcrumbs.every(
      crumb => typeof crumb.label === 'string' && typeof crumb.path === 'string'
    )) {
      set({ breadcrumbs: newBreadcrumbs });
    } else {
      console.warn('setBreadcrumbs received invalid data:', newBreadcrumbs);
    }
  },
  // Action to add a breadcrumb
  addBreadcrumb: (crumb) => {
    if (typeof crumb.label === 'string' && typeof crumb.path === 'string') {
      set((state) => ({ breadcrumbs: [...state.breadcrumbs, crumb] }));
    } else {
      console.warn('addBreadcrumb received invalid crumb:', crumb);
    }
  },
  // Action to remove breadcrumbs after a certain path
  // If path is "/", it resets to the initial breadcrumb.
  removeBreadcrumbAfter: (path) => {
    set((state) => {
      const index = state.breadcrumbs.findIndex(crumb => crumb.path === path);
      if (index !== -1) {
        return { breadcrumbs: state.breadcrumbs.slice(0, index + 1) };
      }
      // If path not found, maybe reset to home or do nothing
      // Resetting to home for now if path is not found for safety
      return { breadcrumbs: [{ label: "Game", path: "/" }] };
    });
  },

  // Active Gap Details
  activeGapDetails: null, // Object like { id: 'gap-1', character: 'Sarah', time: '20-25min', description: '...' }
  setActiveGapDetails: (gapDetails) => {
    if (gapDetails === null || typeof gapDetails === 'object') {
      set({ activeGapDetails: gapDetails });
    } else {
      console.warn('setActiveGapDetails received invalid data:', gapDetails);
    }
  },

  // Journey Data Structures
  journeyData: new Map(), // Stores full journey data objects, keyed by characterId
  gaps: new Map(),        // Stores arrays of gap objects, keyed by characterId
  loadingJourney: false,  // To indicate if a journey is currently being loaded

  // Active Character ID
  activeCharacterId: null,
  setActiveCharacterId: (characterId) => {
    set({ activeCharacterId: characterId, loadingJourney: true });
    // Trigger loadJourney when active character changes
    // Need to access `get` to call another action from within an action in Zustand v4+
    // See: https://github.com/pmndrs/zustand#calling-actions-from-within-actions
    useJourneyStore.getState().loadJourney(characterId);
  },

  // Async action to load journey data
  loadJourney: async (characterId) => {
    if (!characterId) {
      set({ loadingJourney: false });
      return;
    }
    set({ loadingJourney: true });
    try {
      // Dynamically import api to avoid circular dependencies if api imports from store
      // and to ensure it's only called client-side if needed.
      const api = await import('../services/api');
      const data = await api.getJourney(characterId);

      set((state) => ({
        journeyData: new Map(state.journeyData).set(characterId, data),
        gaps: new Map(state.gaps).set(characterId, data.gaps || []), // Store gaps separately
        loadingJourney: false,
      }));
      console.log(`[journeyStore] Journey loaded for ${characterId}:`, data);
    } catch (error) {
      console.error(`[journeyStore] Failed to load journey for ${characterId}:`, error);
      set({ loadingJourney: false });
    }
  },
}));

export default useJourneyStore;
