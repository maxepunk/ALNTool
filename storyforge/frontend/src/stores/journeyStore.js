import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useJourneyStore = create(subscribeWithSelector((set, get) => ({
  // UI State only - no data fetching
  activeCharacterId: null,
  selectedNode: null, // Currently selected node in the journey graph
  
  // UI Actions
  setActiveCharacterId: (characterId) => set({ 
    activeCharacterId: characterId, 
    selectedNode: null 
  }),
  
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  clearSelectedNode: () => set({ selectedNode: null }),
})));

export default useJourneyStore;
