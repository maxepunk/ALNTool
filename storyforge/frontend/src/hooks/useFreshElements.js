/**
 * Fresh Elements Hook
 * 
 * Fetches elements directly from Notion for the most up-to-date data.
 * Use this for detail views, editing, or when you need real-time accuracy.
 * 
 * Returns elements with 'basicType' field from Notion.
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Fetches fresh element data from Notion
 * @param {string|string[]} elementIds - Single ID or array of IDs to fetch
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether query should run
 * @returns {Object} Query result with fresh element data
 */
export function useFreshElements(elementIds, { enabled = true } = {}) {
  const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
  
  return useQuery({
    queryKey: ['elements', 'fresh', ids],
    queryFn: async () => {
      // Fetch each element individually from Notion path
      const promises = ids.map(id => api.getElementById(id));
      const responses = await Promise.all(promises);
      
      // Handle both test and production response formats
      const elements = responses.map(response => {
        // In production, interceptor extracts data; in tests, we might get full object
        const element = Array.isArray(response) ? response[0] : (response?.data || response);
        return element;
      }).filter(Boolean);
      
      // Return array for multiple IDs, single element for single ID
      return Array.isArray(elementIds) ? elements : elements[0];
    },
    enabled: enabled && ids.length > 0,
    staleTime: 30 * 1000, // 30 seconds - fresh data updates frequently
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetches fresh element with computed fields
 * @param {string} elementId - Element ID to fetch
 * @param {Object} options - Query options
 * @returns {Object} Query result with computed element data
 */
export function useFreshElementWithComputed(elementId, options = {}) {
  return useQuery({
    queryKey: ['elements', 'fresh-computed', elementId],
    queryFn: async () => {
      // This endpoint includes computed memory values and groupings
      // Note: We might need to add this endpoint to the API service
      const response = await api.getElementById(elementId);
      
      // Handle both test and production response formats
      const element = Array.isArray(response) ? response[0] : (response?.data || response);
      
      if (!element) {
        throw new Error('Failed to fetch element');
      }
      
      return element;
    },
    enabled: options.enabled !== false && !!elementId,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
}