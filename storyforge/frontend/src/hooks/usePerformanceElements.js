/**
 * Performance Elements Hook
 * 
 * Fetches elements using the performance-optimized SQLite path.
 * Use this for views that need to display many elements (400+) efficiently.
 * 
 * Returns elements with 'type' field from SQLite database.
 */

import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import logger from '../utils/logger';

/**
 * Fetches elements optimized for performance (400+ elements)
 * @param {Object} options - Query options
 * @param {boolean} options.includeMemoryTokens - Whether to include memory tokens
 * @param {boolean} options.enabled - Whether query should run
 * @returns {Object} Query result with elements array
 */
export function usePerformanceElements({ 
  includeMemoryTokens = true, 
  enabled = true 
} = {}) {
  return useQuery({
    queryKey: ['elements', 'performance', { includeMemoryTokens }],
    queryFn: async () => {
      logger.debug('🔍 usePerformanceElements: Fetching elements...');
      // Use the performance path - remove filterGroup to get ALL elements
      // filterGroup: 'memoryTypes' would only return memory tokens (7 items)
      const response = await api.getElements();
      
      logger.debug('🔍 usePerformanceElements: Raw response:', {
        isArray: Array.isArray(response),
        responseType: typeof response,
        hasData: response?.data !== undefined
      });
      
      // Handle both test environment (where response might be the full object)
      // and production (where interceptor extracts data)
      const elements = Array.isArray(response) ? response : (response?.data || []);
      
      logger.debug('🔍 usePerformanceElements: Processed elements:', {
        isArray: Array.isArray(elements),
        length: elements?.length,
        sample: elements?.[0]
      });
      
      // Performance path returns elements with 'type' field
      return elements;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetches elements grouped by type for aggregation views
 * @param {Object} options - Query options
 * @returns {Object} Query result with grouped elements
 */
export function useGroupedPerformanceElements(options = {}) {
  const { data: elements, ...queryResult } = usePerformanceElements(options);
  
  // Group elements by type for efficient rendering
  const groupedElements = elements?.reduce((acc, element) => {
    const type = element.type || 'element';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(element);
    return acc;
  }, {}) || {};
  
  return {
    ...queryResult,
    data: elements,
    groupedData: groupedElements,
    elementCount: elements?.length || 0
  };
}