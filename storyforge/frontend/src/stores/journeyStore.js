import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import api from '../services/api'; // Assuming api.js exports a default or named 'api' object

const useJourneyStore = create(subscribeWithSelector((set, get) => ({
  // State
  activeCharacterId: null,
  journeyData: new Map(), // Stores journey details { segments, character_info } by characterId
  gaps: new Map(), // Stores gap details by characterId
  selectedTimeRange: [0, 90], // Default full game duration
  loadingJourneyCharacterId: null, // Tracks loading state for a specific character's journey
  error: null,
  // New state for selected gap and suggestions
  selectedGap: null,
  gapSuggestions: [],
  loadingSuggestions: false,
  suggestionError: null, // Optional: dedicated error state for suggestions

  // Actions
  setActiveCharacterId: (characterId) => set({ activeCharacterId: characterId, error: null, selectedGap: null, gapSuggestions: [] }), // Also clear gap selection
  setSelectedTimeRange: (timeRange) => set({ selectedTimeRange: timeRange }),

  loadJourney: async (characterId) => {
    if (!characterId) return;
    set({ loadingJourneyCharacterId: characterId, error: null });
    try {
      const response = await api.get(`/journeys/${characterId}`);
      const data = response.data; // Assuming response structure { character_id, character_info, segments, gaps }

      set(state => ({
        journeyData: new Map(state.journeyData).set(characterId, {
          character_info: data.character_info,
          segments: data.segments,
        }),
        gaps: new Map(state.gaps).set(characterId, data.gaps || []), // Ensure gaps is always an array
        loadingJourneyCharacterId: null,
      }));
    } catch (err) {
      console.error(`Error loading journey for character ${characterId}:`, err);
      set({ error: err.message || 'Failed to load journey', loadingJourneyCharacterId: null });
    }
  },

  loadGapsForCharacter: async (characterId) => {
    if (!characterId) return;
    // This action might be redundant if loadJourney already fetches gaps.
    // However, if there's a dedicated endpoint or need to refresh gaps separately:
    set(state => ({
      loadingJourneyCharacterId: state.loadingJourneyCharacterId === null ? characterId : state.loadingJourneyCharacterId, // Keep existing loading state if another load is in progress for the same char
      error: null
    }));
    try {
      const response = await api.get(`/journeys/${characterId}/gaps`);
      const fetchedGaps = response.data; // Assuming response is an array of gaps

      set(state => ({
        gaps: new Map(state.gaps).set(characterId, fetchedGaps || []),
        loadingJourneyCharacterId: get().loadingJourneyCharacterId === characterId ? null : get().loadingJourneyCharacterId, // Only clear if this was the primary load
      }));
    } catch (err) {
      console.error(`Error loading gaps for character ${characterId}:`, err);
      set(state => ({
        error: err.message || 'Failed to load gaps',
        loadingJourneyCharacterId: get().loadingJourneyCharacterId === characterId ? null : get().loadingJourneyCharacterId
      }));
    }
  },

  clearJourneyData: (characterId) => set(state => {
    const newJourneyData = new Map(state.journeyData);
    newJourneyData.delete(characterId);
    const newGaps = new Map(state.gaps);
    newGaps.delete(characterId);
    return { journeyData: newJourneyData, gaps: newGaps };
  }),

  clearAllJourneyData: () => set({
    journeyData: new Map(),
    gaps: new Map(),
    activeCharacterId: null, // Optionally reset active character
    error: null,
  }),

  // Computed (getters)
  activeJourney: () => {
    const activeId = get().activeCharacterId;
    return activeId ? get().journeyData.get(activeId) : null;
  },
  activeGaps: () => {
    const activeId = get().activeCharacterId;
    return activeId ? get().gaps.get(activeId) || [] : []; // Ensure returns an array
  },

  // New actions for gap selection and suggestions
  loadGapSuggestions: (gap) => {
    set({ loadingSuggestions: true, gapSuggestions: [], suggestionError: null });
    // Simulate API call delay
    setTimeout(() => {
      if (!gap) {
        set({ loadingSuggestions: false, gapSuggestions: [] });
        return;
      }
      // Temporary frontend mimic logic for suggestions
      const duration = gap.end_minute - gap.start_minute;
      let newSuggestions = [];
      if (duration <= 5) {
        newSuggestions.push({ id: 'sugg_low_1', type: 'discovery', description: `Gap (${duration}m): Add a small discovery or observation.` });
        newSuggestions.push({ id: 'sugg_low_2', type: 'interaction', description: `Gap (${duration}m): Consider a brief interaction.` });
      } else if (duration <= 10) {
        newSuggestions.push({ id: 'sugg_med_1', type: 'element', description: `Gap (${duration}m): Introduce a minor puzzle or a significant element.` });
        newSuggestions.push({ id: 'sugg_med_2', type: 'puzzle', description: `Gap (${duration}m): A simple puzzle could fit here.` });
      } else {
        newSuggestions.push({ id: 'sugg_high_1', type: 'activity', description: `Gap (${duration}m): A complex activity or multi-step element interaction.` });
        newSuggestions.push({ id: 'sugg_high_2', type: 'element_interaction', description: `Gap (${duration}m): Multi-step interaction with a key element.` });
      }
      set({ gapSuggestions: newSuggestions, loadingSuggestions: false });
    }, 500); // Simulate 0.5 second delay
  },

  setSelectedGap: (gap) => {
    const currentSelectedGap = get().selectedGap;
    if (currentSelectedGap && gap && currentSelectedGap.id === gap.id) {
      // If clicking the same gap, deselect it
      set({ selectedGap: null, gapSuggestions: [], loadingSuggestions: false, suggestionError: null });
    } else if (gap) {
      set({ selectedGap: gap, suggestionError: null });
      get().loadGapSuggestions(gap);
    } else {
      set({ selectedGap: null, gapSuggestions: [], loadingSuggestions: false, suggestionError: null });
    }
  },

  // New getters
  selectedGapDetails: () => get().selectedGap,
  currentGapSuggestions: () => get().gapSuggestions,

})));

export default useJourneyStore;
