/**
 * useIntelligenceData - Custom hook for fetching intelligence panel data
 * Consolidates all data fetching logic for the intelligence panel
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { usePerformanceElements } from './usePerformanceElements';

const useIntelligenceData = (entity) => {
  // Fetch timeline events
  const { data: timelineEvents, isLoading: loadingTimeline } = useQuery({
    queryKey: ['timeline-events'],
    queryFn: async () => {
      const response = await api.getTimelineEvents();
      return response.data || [];
    },
    enabled: !!entity
  });

  // Use performance elements hook for elements data
  const { data: elements, isLoading: loadingElements } = usePerformanceElements({
    includeMemoryTokens: true,
    enabled: !!entity
  });

  // Fetch puzzles (only for character entities)
  const { data: puzzles, isLoading: loadingPuzzles } = useQuery({
    queryKey: ['puzzles'],
    queryFn: async () => {
      const response = await api.getPuzzles();
      return response.data || [];
    },
    enabled: !!entity && entity.type === 'character'
  });

  const isLoading = loadingTimeline || loadingElements || 
    (entity?.type === 'character' && loadingPuzzles);

  return {
    timelineEvents,
    elements,
    puzzles,
    isLoading
  };
};

export default useIntelligenceData;