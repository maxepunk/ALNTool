/**
 * Character Journey Hook
 * 
 * Fetches complete character journey data including:
 * - Character details
 * - Timeline events
 * - Owned elements
 * - Associated puzzles
 * 
 * This is the primary data source for the journey graph view.
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import logger from '../utils/logger';

/**
 * Fetches complete journey data for a character
 * @param {string} characterId - Character ID
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether query should run
 * @returns {Object} Query result with journey data
 */
export function useCharacterJourney(characterId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['journey', characterId],
    queryFn: async () => {
      // The API interceptor already unwraps the data, so response IS the data
      const data = await api.getJourneyByCharacterId(characterId);
      return data;
    },
    enabled: enabled && !!characterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetches journey data for multiple characters
 * @param {string[]} characterIds - Array of character IDs
 * @param {Object} options - Query options
 * @returns {Object} Query result with journey data for all characters
 */
export function useMultipleCharacterJourneys(characterIds, options = {}) {
  return useQuery({
    queryKey: ['journeys', characterIds],
    queryFn: async () => {
      const promises = characterIds.map(id => api.getJourneyByCharacterId(id));
      const journeyDataArray = await Promise.all(promises);
      
      // Create a map of character ID to journey data
      const journeyMap = {};
      journeyDataArray.forEach((data, index) => {
        // The API interceptor already unwraps the data
        journeyMap[characterIds[index]] = data;
      });
      
      return journeyMap;
    },
    enabled: options.enabled !== false && characterIds.length > 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches all characters with basic info for overview
 * @param {Object} options - Query options
 * @returns {Object} Query result with all characters
 */
export function useAllCharacters(options = {}) {
  return useQuery({
    queryKey: ['characters', 'all'],
    queryFn: async () => {
      logger.debug('🔍 useAllCharacters: Fetching characters...');
      // The API interceptor already unwraps the data, so response IS the data
      const data = await api.getCharacters();
      logger.debug('🔍 useAllCharacters: Received data:', {
        isArray: Array.isArray(data),
        length: data?.length,
        sample: data?.[0]
      });
      return data;
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}