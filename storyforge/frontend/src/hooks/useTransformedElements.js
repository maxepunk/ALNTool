/**
 * Transformed Elements Hook
 * 
 * Provides elements with proper data transformations applied
 * Centralizes the API response -> UI format transformation
 */

import { useMemo } from 'react';
import { usePerformanceElements } from './usePerformanceElements';
import { transformElements } from '../utils/dataTransformers';
import logger from '../utils/logger';

/**
 * Fetches and transforms elements for UI consumption
 * @param {Object} options - Query options
 * @returns {Object} Query result with transformed elements
 */
export function useTransformedElements(options = {}) {
  const { data: rawElements, ...queryResult } = usePerformanceElements(options);
  
  // Transform elements when data changes
  const transformedElements = useMemo(() => {
    if (!rawElements) return null;
    
    logger.debug('🔄 Transforming elements:', {
      rawCount: rawElements.length,
      sample: rawElements[0]
    });
    
    const transformed = transformElements(rawElements);
    
    logger.debug('✅ Elements transformed:', {
      transformedCount: transformed.length,
      withOwners: transformed.filter(e => e.owner_character_id).length,
      sample: transformed[0]
    });
    
    return transformed;
  }, [rawElements]);
  
  return {
    ...queryResult,
    data: transformedElements
  };
}

/**
 * Get elements grouped by owner for aggregation views
 * @param {Object} options - Query options
 * @returns {Object} Query result with grouped elements
 */
export function useGroupedElements(options = {}) {
  const { data: elements, ...queryResult } = useTransformedElements(options);
  
  const groupedData = useMemo(() => {
    if (!elements) return {};
    
    const groups = {};
    
    elements.forEach(element => {
      const ownerKey = element.owner_character_id || 'unowned';
      
      if (!groups[ownerKey]) {
        groups[ownerKey] = {
          ownerId: ownerKey,
          ownerName: element.owner_character_name || 'Unowned',
          elements: []
        };
      }
      
      groups[ownerKey].elements.push(element);
    });
    
    return groups;
  }, [elements]);
  
  return {
    ...queryResult,
    data: elements,
    groupedData
  };
}