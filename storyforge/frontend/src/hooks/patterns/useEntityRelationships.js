/**
 * useEntityRelationships - Hook to manage entity relationships in the ALNTool system
 * 
 * @example
 * // Get relationships for a character
 * const { relationships, loading, error } = useEntityRelationships({
 *   entityId: 'char_123',
 *   entityType: 'character'
 * });
 * 
 * @example
 * // Get specific relationship types
 * const { relationships } = useEntityRelationships({
 *   entityId: 'elem_456',
 *   entityType: 'element',
 *   relationshipTypes: ['ownership', 'requirement', 'container']
 * });
 * 
 * @example
 * // With caching and real-time updates
 * const { relationships, refetch } = useEntityRelationships({
 *   entityId: selectedEntity.id,
 *   entityType: selectedEntity.type,
 *   enableRealTimeUpdates: true,
 *   cacheTime: 300000 // 5 minutes
 * });
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

/**
 * Define relationship types in the ALNTool system
 */
const RELATIONSHIP_TYPES = {
  // Character relationships
  CHARACTER_ELEMENT_OWNERSHIP: 'ownership',
  CHARACTER_ELEMENT_ASSOCIATION: 'association',
  CHARACTER_TIMELINE: 'participation',
  
  // Element relationships
  ELEMENT_ELEMENT_CONTAINER: 'container',
  ELEMENT_PUZZLE_REQUIREMENT: 'requirement',
  
  // Puzzle relationships
  PUZZLE_ELEMENT_REWARD: 'reward',
  PUZZLE_PREREQUISITE: 'prerequisite',
  
  // Shared relationships
  NARRATIVE_THREAD: 'narrative_thread',
  ACT_FOCUS: 'act_focus'
};

/**
 * Fetch relationships for an entity
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Relationships data
 */
async function fetchEntityRelationships({ entityId, entityType, relationshipTypes }) {
  // Build query parameters
  const params = {
    entityId,
    entityType,
    ...(relationshipTypes && { types: relationshipTypes.join(',') })
  };
  
  // Use appropriate API endpoint based on entity type
  const endpoint = `/relationships/${entityType}/${entityId}`;
  const response = await api.get(endpoint, { params });
  
  return response.data;
}

/**
 * Hook to manage entity relationships
 * @param {Object} config - Configuration object
 * @param {string} config.entityId - The ID of the entity
 * @param {string} config.entityType - The type of entity
 * @param {Array<string>} config.relationshipTypes - Specific relationship types to fetch
 * @param {boolean} config.enabled - Whether to enable the query
 * @param {boolean} config.enableRealTimeUpdates - Enable real-time updates
 * @param {number} config.cacheTime - Cache time in milliseconds
 * @param {number} config.staleTime - Stale time in milliseconds
 * @returns {Object} Relationships data and control functions
 */
export function useEntityRelationships(config = {}) {
  const {
    entityId,
    entityType,
    relationshipTypes,
    enabled = true,
    enableRealTimeUpdates = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000 // 30 seconds
  } = config;
  
  const queryClient = useQueryClient();
  
  // Query key for caching
  const queryKey = ['entity-relationships', entityType, entityId, relationshipTypes];
  
  // Fetch relationships
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => fetchEntityRelationships({ entityId, entityType, relationshipTypes }),
    enabled: enabled && !!entityId && !!entityType,
    cacheTime,
    staleTime,
    refetchOnWindowFocus: enableRealTimeUpdates
  });
  
  // Process relationships into structured format
  const relationships = useMemo(() => {
    if (!data) return null;
    
    return {
      // Direct relationships
      direct: {
        ownership: data.ownership || [],
        associations: data.associations || [],
        requirements: data.requirements || [],
        rewards: data.rewards || [],
        containers: data.containers || [],
        contained: data.contained || [],
        timeline: data.timeline || []
      },
      
      // Computed relationships
      computed: {
        narrativeThreads: data.narrativeThreads || [],
        actFocus: data.actFocus || [],
        socialConnections: data.socialConnections || []
      },
      
      // Metadata
      meta: {
        totalCount: data.totalCount || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      }
    };
  }, [data]);
  
  // Get related entities grouped by type
  const relatedEntities = useMemo(() => {
    if (!relationships) return { characters: [], elements: [], puzzles: [], timeline: [] };
    
    const entities = {
      characters: new Map(),
      elements: new Map(),
      puzzles: new Map(),
      timeline: new Map()
    };
    
    // Helper to add entity to appropriate map
    const addEntity = (entity, type) => {
      if (!entity) return;
      const map = entities[type];
      if (map && !map.has(entity.id)) {
        map.set(entity.id, entity);
      }
    };
    
    // Process all relationship types
    Object.values(relationships.direct).forEach(relArray => {
      relArray.forEach(rel => {
        if (rel.character) addEntity(rel.character, 'characters');
        if (rel.element) addEntity(rel.element, 'elements');
        if (rel.puzzle) addEntity(rel.puzzle, 'puzzles');
        if (rel.timelineEvent) addEntity(rel.timelineEvent, 'timeline');
      });
    });
    
    // Convert maps to arrays
    return {
      characters: Array.from(entities.characters.values()),
      elements: Array.from(entities.elements.values()),
      puzzles: Array.from(entities.puzzles.values()),
      timeline: Array.from(entities.timeline.values())
    };
  }, [relationships]);
  
  // Get relationship edges for graph visualization
  const edges = useMemo(() => {
    if (!relationships || !entityId) return [];
    
    const edges = [];
    
    // Ownership edges
    relationships.direct.ownership.forEach(rel => {
      edges.push({
        id: `ownership-${entityId}-${rel.element.id}`,
        source: entityId,
        target: rel.element.id,
        type: 'ownership',
        label: 'owns',
        style: { stroke: '#2196F3', strokeWidth: 2 }
      });
    });
    
    // Association edges
    relationships.direct.associations.forEach(rel => {
      edges.push({
        id: `association-${entityId}-${rel.element.id}`,
        source: entityId,
        target: rel.element.id,
        type: 'association',
        label: 'associated',
        style: { stroke: '#9C27B0', strokeDasharray: '5 5' }
      });
    });
    
    // Container edges
    relationships.direct.containers.forEach(rel => {
      edges.push({
        id: `container-${rel.container.id}-${rel.contained.id}`,
        source: rel.container.id,
        target: rel.contained.id,
        type: 'container',
        label: 'contains',
        style: { stroke: '#4CAF50' }
      });
    });
    
    // Requirement edges
    relationships.direct.requirements.forEach(rel => {
      edges.push({
        id: `requirement-${rel.puzzle.id}-${rel.element.id}`,
        source: rel.puzzle.id,
        target: rel.element.id,
        type: 'requirement',
        label: 'requires',
        style: { stroke: '#FF9800', strokeDasharray: '10 5' }
      });
    });
    
    return edges;
  }, [relationships, entityId]);
  
  // Invalidate related queries when relationships change
  const invalidateRelated = useCallback(() => {
    queryClient.invalidateQueries(['entity-relationships']);
    if (entityType === 'character') {
      queryClient.invalidateQueries(['character-journey', entityId]);
    }
  }, [queryClient, entityType, entityId]);
  
  // Set up real-time updates if enabled
  useEffect(() => {
    if (!enableRealTimeUpdates || !entityId) return;
    
    // Simulate real-time updates with polling
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, entityId, refetch]);
  
  return {
    relationships,
    relatedEntities,
    edges,
    loading: isLoading,
    fetching: isFetching,
    error,
    refetch,
    invalidateRelated,
    
    // Utility functions
    hasRelationships: relationships?.meta?.totalCount > 0,
    getRelationshipCount: (type) => relationships?.direct?.[type]?.length || 0,
    
    // Constants
    RELATIONSHIP_TYPES
  };
}

/**
 * Hook to check if two entities are related
 * @param {string} entityId1 - First entity ID
 * @param {string} entityId2 - Second entity ID
 * @returns {Object} Relationship check result
 */
export function useAreEntitiesRelated(entityId1, entityId2) {
  const { relationships: rel1 } = useEntityRelationships({
    entityId: entityId1,
    entityType: 'auto' // API should auto-detect type
  });
  
  const isRelated = useMemo(() => {
    if (!rel1 || !entityId2) return false;
    
    // Check all relationship arrays for entityId2
    return Object.values(rel1.direct).some(relArray =>
      relArray.some(rel => 
        rel.character?.id === entityId2 ||
        rel.element?.id === entityId2 ||
        rel.puzzle?.id === entityId2 ||
        rel.timelineEvent?.id === entityId2
      )
    );
  }, [rel1, entityId2]);
  
  return { isRelated, relationships: rel1 };
}

// Default export
export default useEntityRelationships;