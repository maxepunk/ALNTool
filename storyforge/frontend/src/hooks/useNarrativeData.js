/**
 * useNarrativeData.js
 * Custom hook for orchestrating all API calls needed for narrative thread analysis
 * 
 * Extracted from NarrativeThreadTrackerPage.jsx to centralize data fetching
 * and provide consistent error handling and loading states.
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import logger from '../utils/logger';

/**
 * Hook for comprehensive narrative analysis data
 * Fetches all entities needed for narrative thread analysis
 * 
 * @returns {Object} Data, loading states, and error handling
 */
export const useNarrativeData = () => {
  // Comprehensive analysis queries - always fetch all data
  const { 
    data: charactersData, 
    isLoading: charactersLoading, 
    error: charactersError,
    refetch: refetchCharacters
  } = useQuery({
    queryKey: ['charactersForNarrativeAnalysis'],
    queryFn: () => api.getCharacters({ limit: 1000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  
  const { 
    data: elementsData, 
    isLoading: elementsLoading,
    error: elementsError,
    refetch: refetchElements
  } = useQuery({
    queryKey: ['elementsForNarrativeAnalysis'],
    queryFn: () => api.getElements({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  
  const { 
    data: puzzlesData, 
    isLoading: puzzlesLoading,
    error: puzzlesError,
    refetch: refetchPuzzles
  } = useQuery({
    queryKey: ['puzzlesForNarrativeAnalysis'],
    queryFn: () => api.getPuzzles({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  
  const { 
    data: timelineEventsData, 
    isLoading: timelineLoading,
    error: timelineError,
    refetch: refetchTimelineEvents
  } = useQuery({
    queryKey: ['timelineEventsForNarrativeAnalysis'],
    queryFn: () => api.getTimelineEvents({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Aggregate loading states
  const isLoading = charactersLoading || elementsLoading || puzzlesLoading || timelineLoading;

  // Aggregate and prioritize errors
  const error = charactersError || elementsError || puzzlesError || timelineError;

  // Data validation - ensure we have arrays
  const validatedData = {
    characters: Array.isArray(charactersData) ? charactersData : [],
    elements: Array.isArray(elementsData) ? elementsData : [],
    puzzles: Array.isArray(puzzlesData) ? puzzlesData : [],
    timelineEvents: Array.isArray(timelineEventsData) ? timelineEventsData : []
  };

  // Data completeness check
  const hasCompleteData = charactersData && elementsData && puzzlesData && timelineEventsData;

  // Refetch all data function
  const refetchAll = async () => {
    try {
      const results = await Promise.all([
        refetchCharacters(),
        refetchElements(),
        refetchPuzzles(),
        refetchTimelineEvents()
      ]);
      
      // Check if any refetch failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        const firstError = errors[0].error;
        logger.error('Failed to refetch narrative data:', firstError);
        throw firstError;
      }
      
      return results;
    } catch (err) {
      logger.error('Failed to refetch narrative data:', err);
      throw err;
    }
  };

  return {
    // Validated data
    data: validatedData,
    
    // Raw data for backward compatibility
    rawData: {
      charactersData,
      elementsData,
      puzzlesData,
      timelineEventsData
    },
    
    // Loading states
    isLoading,
    loadingStates: {
      characters: charactersLoading,
      elements: elementsLoading,
      puzzles: puzzlesLoading,
      timelineEvents: timelineLoading
    },
    
    // Error handling
    error,
    errors: {
      characters: charactersError,
      elements: elementsError,
      puzzles: puzzlesError,
      timelineEvents: timelineError
    },
    
    // Data completeness
    hasCompleteData,
    
    // Utilities
    refetch: refetchAll,
    refetchIndividual: {
      characters: refetchCharacters,
      elements: refetchElements,
      puzzles: refetchPuzzles,
      timelineEvents: refetchTimelineEvents
    }
  };
};

/**
 * Hook for legacy thread-specific data fetching
 * Used for the dropdown selection functionality
 * 
 * @param {string} selectedThread - The thread to filter by
 * @returns {Object} Thread-specific data and states
 */
export const useLegacyThreadData = (selectedThread) => {
  const [uniqueThreads, setUniqueThreads] = useState([]);

  // Fetch unique narrative threads for dropdown
  const { 
    data: threadsData, 
    isLoading: isLoadingThreads, 
    error: threadsError 
  } = useQuery({
    queryKey: ['uniqueNarrativeThreads'],
    queryFn: () => api.getUniqueNarrativeThreads(),
    staleTime: 10 * 60 * 1000, // 10 minutes - threads change less frequently
    retry: 2
  });

  // Update unique threads when data changes
  useEffect(() => {
    if (threadsData) {
      setUniqueThreads(threadsData);
    }
  }, [threadsData]);

  // Thread-specific data queries - only enabled when thread is selected
  const { 
    data: legacyCharactersData, 
    isLoading: isLoadingCharacters 
  } = useQuery({
    queryKey: ['charactersByThread', selectedThread],
    queryFn: () => api.getCharacters({ narrativeThreadContains: selectedThread }),
    enabled: !!selectedThread,
    staleTime: 5 * 60 * 1000
  });

  const { 
    data: legacyElementsData, 
    isLoading: isLoadingElements 
  } = useQuery({
    queryKey: ['elementsByThread', selectedThread],
    queryFn: () => api.getElements({ narrativeThreadContains: selectedThread }),
    enabled: !!selectedThread,
    staleTime: 5 * 60 * 1000
  });

  const { 
    data: legacyPuzzlesData, 
    isLoading: isLoadingPuzzles 
  } = useQuery({
    queryKey: ['puzzlesByThread', selectedThread],
    queryFn: () => api.getPuzzles({ narrativeThreadContains: selectedThread }),
    enabled: !!selectedThread,
    staleTime: 5 * 60 * 1000
  });

  const { 
    data: legacyTimelineEventsData, 
    isLoading: isLoadingTimelineEvents 
  } = useQuery({
    queryKey: ['timelineEventsByThread', selectedThread],
    queryFn: () => api.getTimelineEvents({ narrativeThreadContains: selectedThread }),
    enabled: !!selectedThread,
    staleTime: 5 * 60 * 1000
  });

  // Aggregate loading state for legacy data
  const anyLoading = isLoadingCharacters || isLoadingElements || isLoadingPuzzles || isLoadingTimelineEvents;

  return {
    // Thread management
    uniqueThreads,
    setUniqueThreads,
    threadsData,
    isLoadingThreads,
    threadsError,
    
    // Legacy thread-specific data
    legacyData: {
      characters: legacyCharactersData,
      elements: legacyElementsData,
      puzzles: legacyPuzzlesData,
      timelineEvents: legacyTimelineEventsData
    },
    
    // Legacy loading states
    legacyLoading: {
      anyLoading,
      characters: isLoadingCharacters,
      elements: isLoadingElements,
      puzzles: isLoadingPuzzles,
      timelineEvents: isLoadingTimelineEvents
    }
  };
};