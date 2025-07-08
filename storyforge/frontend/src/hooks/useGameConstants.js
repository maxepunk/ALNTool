import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

/**
 * Custom hook to fetch and cache game constants from the backend
 * Uses React Query for caching and state management
 * 
 * @returns {Object} Query result containing game constants
 * @returns {Object} result.data - The game constants object
 * @returns {boolean} result.isLoading - Loading state
 * @returns {Error} result.error - Error state if fetch failed
 * @returns {boolean} result.isSuccess - Success state
 */
export function useGameConstants() {
  return useQuery({
    queryKey: ['gameConstants'],
    queryFn: () => api.getGameConstants(),
    // Cache for 24 hours since game constants rarely change
    staleTime: 24 * 60 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
    // Always keep in cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Retry on failure
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Helper function to safely access nested game constants
 * @param {Object} gameConstants - The game constants object
 * @param {string} path - Dot-separated path (e.g. 'MEMORY_VALUE.BASE_VALUES')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} The value at the path or defaultValue
 */
export function getConstant(gameConstants, path, defaultValue = null) {
  if (!gameConstants) return defaultValue;
  
  const keys = path.split('.');
  let value = gameConstants;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}