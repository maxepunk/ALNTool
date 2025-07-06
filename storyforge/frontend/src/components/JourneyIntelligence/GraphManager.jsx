/**
 * GraphManager - Handles graph data preparation and configuration
 * Extracted from JourneyIntelligenceView to reduce complexity
 */

import { useMemo } from 'react';
import { processGraphData } from '../../utils/graphDataProcessor';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import logger from '../../utils/logger';

const useGraphManager = ({
  journeyData,
  characters,
  elements,
  puzzles,
  timelineEvents,
  characterLinks,
  loadedEntityTypes
}) => {
  const { selectedEntity } = useJourneyIntelligenceStore();
  
  // Determine focus mode
  const isCharacterFocused = selectedEntity?.type === 'character';
  const focusedCharacterId = isCharacterFocused ? selectedEntity.id : null;
  
  // Prepare data for AdaptiveGraphCanvas based on mode
  const graphData = useMemo(() => {
    const processed = processGraphData({
      focusedCharacterId,
      journeyData,
      characters,
      elements,
      puzzles,
      timelineEvents,
      characterLinks,
      loadedEntityTypes,
      selectedEntity
    });
    
    logger.debug('GraphManager: Processed graph data', {
      totalNodes: processed.nodes.length,
      totalEdges: processed.edges.length,
      focusedCharacterId,
      hasSelectedEntity: !!selectedEntity
    });
    
    return processed;
  }, [
    focusedCharacterId, 
    journeyData, 
    characters, 
    elements, 
    puzzles, 
    timelineEvents, 
    characterLinks, 
    loadedEntityTypes, 
    selectedEntity
  ]);

  // Check if we have data
  const hasData = (characters && characters.length > 0) || 
                  (elements && elements.length > 0) || 
                  (puzzles && puzzles.length > 0) || 
                  (timelineEvents && timelineEvents.length > 0);
  
  return {
    graphData,
    hasData,
    focusedCharacterId
  };
};

export default useGraphManager;