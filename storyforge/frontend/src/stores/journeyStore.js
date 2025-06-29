import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import logger from '../utils/logger';
import api from '../services/api'; // Assuming api.js exports a default or named 'api' object

const useJourneyStore = create(subscribeWithSelector((set, get) => ({
  // State
  activeCharacterId: null,
  journeyData: new Map(), // Stores the entire journey object { character_info, graph } by characterId
  loadingJourneyCharacterId: null, // Tracks loading state for a specific character's journey
  error: null,
  selectedNode: null, // Holds the currently selected node from the journey graph

  // Actions
  setActiveCharacterId: (characterId) => set({ activeCharacterId: characterId, error: null, selectedNode: null }),
  setSelectedNode: (node) => set({ selectedNode: node }),

  loadJourney: async (characterId) => {
    if (!characterId) return;

    const state = get();
    if (state.loadingJourneyCharacterId === characterId) {
      logger.debug(`Already loading journey for character ${characterId}, skipping duplicate request`);
      return;
    }
    
    // Do not re-fetch if data already exists, unless forced
    if (state.journeyData.has(characterId)) {
      logger.debug(`Journey data already loaded for character ${characterId}`);
      return;
    }
    
    set({ loadingJourneyCharacterId: characterId, error: null, selectedNode: null });
    try {
      const journeyResult = await api.getJourneyByCharacterId(characterId);

      set(state => ({
        journeyData: new Map(state.journeyData).set(characterId, journeyResult),
        loadingJourneyCharacterId: null,
      }));
    } catch (err) {
      logger.error(`Error loading journey for character ${characterId}:`, err);
      set({ error: err.message || 'Failed to load journey', loadingJourneyCharacterId: null });
    }
  },

  clearJourneyData: (characterId) => set(state => {
    const newJourneyData = new Map(state.journeyData);
    newJourneyData.delete(characterId);
    return { journeyData: newJourneyData, selectedNode: null };
  }),

  clearAllJourneyData: () => set({
    journeyData: new Map(),
    activeCharacterId: null,
    error: null,
    selectedNode: null,
  }),

  // Getters
  activeJourney: () => {
    const activeId = get().activeCharacterId;
    return activeId ? (get().journeyData.get(activeId) || null) : null;
  },

})));

export default useJourneyStore;
