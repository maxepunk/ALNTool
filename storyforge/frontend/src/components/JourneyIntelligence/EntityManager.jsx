/**
 * EntityManager - Handles entity selection and data fetching logic
 * Extracted from JourneyIntelligenceView to reduce complexity
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { api } from '../../services/api';
import { useCharacterJourney, useAllCharacters } from '../../hooks/useCharacterJourney';
import { useTransformedElements } from '../../hooks/useTransformedElements';
import logger from '../../utils/logger';

const useEntityManager = () => {
  const { selectedEntity } = useJourneyIntelligenceStore();
  
  // Determine which view mode we're in
  const isCharacterFocused = selectedEntity?.type === 'character';
  const focusedCharacterId = isCharacterFocused ? selectedEntity.id : null;
  
  // Fetch data based on view mode
  const { 
    data: journeyData, 
    isLoading: isLoadingJourney, 
    error: journeyError 
  } = useCharacterJourney(focusedCharacterId, {
    enabled: !!focusedCharacterId
  });
  
  // For overview mode, fetch all entities
  const { 
    data: characters, 
    isLoading: isLoadingCharacters, 
    error: charactersError,
    refetch: refetchCharacters 
  } = useAllCharacters({
    enabled: !focusedCharacterId
  });
  
  // Always fetch elements for intelligence analysis
  const { 
    data: elements, 
    isLoading: isLoadingElements, 
    error: elementsError,
    refetch: refetchElements 
  } = useTransformedElements({
    includeMemoryTokens: true
  });
  
  // Fetch puzzles for overview mode
  const {
    data: puzzles,
    isLoading: isLoadingPuzzles,
    error: puzzlesError
  } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => api.getPuzzles(),
    enabled: !focusedCharacterId,
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch timeline events for overview mode
  const {
    data: timelineEvents,
    isLoading: isLoadingTimeline,
    error: timelineError
  } = useQuery({
    queryKey: ['timeline-events'],
    queryFn: () => api.getTimelineEvents(),
    enabled: !focusedCharacterId,
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch character relationships for overview mode
  const {
    data: characterLinks,
    isLoading: isLoadingLinks,
    error: linksError
  } = useQuery({
    queryKey: ['character-links'],
    queryFn: async () => {
      const response = await api.getCharacterLinks();
      
      // Handle both direct array and wrapped response
      const links = Array.isArray(response) ? response : (response?.data || response || []);
      
      logger.debug('EntityManager: Raw character links from API', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        linksCount: links?.length || 0,
        sampleLink: links?.[0]
      });
      
      // Map backend field names to frontend expectations
      return links.map((link, index) => ({
        ...link,
        id: `link-${link.character_a_id}-${link.character_b_id}-${index}`,
        source: link.character_a_id,
        target: link.character_b_id,
        strength: link.link_strength || 1,
        type: link.link_type || 'character-character'
      }));
    },
    enabled: !focusedCharacterId,
    staleTime: 5 * 60 * 1000
  });
  
  // Combined loading and error states
  const isLoading = (focusedCharacterId ? isLoadingJourney : 
    (isLoadingCharacters || isLoadingPuzzles || isLoadingTimeline || isLoadingLinks)) || 
    isLoadingElements;
    
  const error = journeyError || charactersError || elementsError || 
    puzzlesError || timelineError || linksError;
  
  // Data refresh handlers
  const refreshData = useCallback(() => {
    refetchCharacters();
    refetchElements();
  }, [refetchCharacters, refetchElements]);
  
  // Sync handler
  const syncData = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/data', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Wait for sync to complete, then refresh
        setTimeout(() => {
          refreshData();
        }, 2000);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Unknown error' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [refreshData]);
  
  logger.debug('EntityManager: Data state', {
    isLoading,
    hasError: !!error,
    charactersCount: characters?.length || 0,
    elementsCount: elements?.length || 0,
    puzzlesCount: puzzles?.length || 0,
    timelineEventsCount: timelineEvents?.length || 0,
    characterLinksCount: characterLinks?.length || 0,
    focusedCharacterId,
    sampleCharacterLink: characterLinks?.[0]
  });
  
  return {
    // Data
    journeyData,
    characters,
    elements,
    puzzles,
    timelineEvents,
    characterLinks,
    
    // State
    isLoading,
    error,
    focusedCharacterId,
    
    // Actions
    refreshData,
    syncData
  };
};

export default useEntityManager;