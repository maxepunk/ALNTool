import { 
  transformCharacter, 
  transformPuzzle, 
  createOwnershipEdges, 
  createContainerEdges, 
  createAssociationEdges, 
  createPuzzleEdges,
  createTimelineEdges
} from './dataTransformers';
import { calculateNodeSize, calculateEdgeStyle } from './nodeSizeCalculator';
import { generateInitialPositions } from './layoutUtils';
import logger from './logger';

/**
 * Processes graph data for the Journey Intelligence View
 * Handles both journey (focused character) and overview modes
 * 
 * @param {Object} params - Parameters for graph processing
 * @param {string} params.focusedCharacterId - ID of the focused character (journey mode)
 * @param {Object} params.journeyData - Pre-computed journey data from backend
 * @param {Array} params.characters - Array of character entities
 * @param {Array} params.elements - Array of element entities
 * @param {Array} params.puzzles - Array of puzzle entities
 * @param {Array} params.timelineEvents - Array of timeline event entities
 * @param {Array} params.characterLinks - Character relationship links
 * @param {Array} params.loadedEntityTypes - Types of entities currently loaded
 * @param {Object} params.selectedEntity - Currently selected entity
 * @returns {Object} Processed graph data with nodes, edges, and metadata
 */
export function processGraphData({
  focusedCharacterId,
  journeyData,
  characters,
  elements,
  puzzles,
  timelineEvents,
  characterLinks,
  loadedEntityTypes,
  selectedEntity
}) {
  if (focusedCharacterId && journeyData) {
    // Use pre-computed journey graph from backend
    // Map backend node types to our frontend types
    const mappedNodes = journeyData.graph.nodes.map(node => {
      // Map backend types to frontend types
      let mappedType = node.type;
      if (node.type === 'loreNode') {
        mappedType = 'timeline_event';
      } else if (node.type === 'discoveryNode') {
        mappedType = 'element';
      } else if (node.type === 'activityNode') {
        mappedType = 'puzzle';
      }
      
      return {
        ...node,
        type: mappedType
      };
    });
    
    // Filter out edges that reference non-existent nodes
    const nodeIds = new Set(mappedNodes.map(n => n.id));
    const validEdges = journeyData.graph.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    // Apply edge styling to valid journey edges
    const styledEdges = validEdges.map(edge => ({
      ...edge,
      style: calculateEdgeStyle(edge)
    }));
    
    return {
      nodes: mappedNodes,
      edges: styledEdges,
      metadata: {
        characterInfo: journeyData.character_info,
        isJourneyView: true
      }
    };
  } else {
    // Build overview showing ONLY characters initially
    // This addresses the critical UX issue of overwhelming initial load
    const nodes = [];
    const edges = [];
    
    // Create initial nodes - we'll set positions after creating all nodes
    if (characters && characters.length > 0) {
      // First, calculate relationship counts for each character
      const relationshipCounts = {};
      if (characterLinks && characterLinks.length > 0) {
        characterLinks.forEach(link => {
          relationshipCounts[link.source] = (relationshipCounts[link.source] || 0) + 1;
          relationshipCounts[link.target] = (relationshipCounts[link.target] || 0) + 1;
        });
      }
      
      characters.forEach((char, index) => {
        // Transform character data
        const transformedChar = transformCharacter(char);
        
        const nodeData = {
          ...transformedChar,
          label: char.name,
          relationshipCount: relationshipCounts[char.id] || 0
        };
        
        const node = {
          id: char.id,
          type: 'character', // Use custom character node type
          data: nodeData,
          position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
        };
        
        // Calculate and store the size in the node data
        node.data.size = calculateNodeSize(node);
        
        nodes.push(node);
      });
    }
    
    // Add character relationship edges
    logger.debug('processGraphData: Processing character links', {
      hasCharacterLinks: !!characterLinks,
      characterLinksLength: characterLinks?.length || 0,
      characterCount: characters?.length || 0
    });
    
    if (characterLinks && characterLinks.length > 0) {
      characterLinks.forEach(link => {
        logger.debug('processGraphData: Creating edge', {
          linkId: link.id,
          source: link.source,
          target: link.target
        });
        
        const edge = {
          id: link.id,
          source: link.source,
          target: link.target,
          type: 'smoothstep',
          animated: false,
          data: {
            strength: link.strength || 1,
            type: link.type || 'character-character'
          }
        };
        
        // Apply dynamic edge styling based on type and strength
        edge.style = calculateEdgeStyle(edge);
        
        edges.push(edge);
      });
    }
    
    // Store other entities for progressive loading
    const hiddenEntities = {
      elements: elements || [],
      puzzles: puzzles || [],
      timelineEvents: timelineEvents || []
    };
    
    // Add progressively loaded entities with temporary positions
    // Pre-layout will organize them properly
    if (loadedEntityTypes.includes('elements') && elements) {
      // Elements are already transformed by useTransformedElements hook
      elements.forEach((elem, index) => {
        const node = {
          id: elem.id,
          type: 'element', // Use custom element node type
          data: {
            ...elem,
            label: elem.name || `Element ${elem.id}`
          },
          position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
        };
        
        // Calculate and store the size in the node data
        node.data.size = calculateNodeSize(node);
        
        nodes.push(node);
      });
      
      // Create ownership and container edges using utility functions
      edges.push(...createOwnershipEdges(elements));
      edges.push(...createContainerEdges(elements));
      
      // Create association edges between characters and elements
      // Build association data from elements that have associated_character_ids
      // First, create a map of character associations
      const characterAssociations = {};
      elements.forEach(element => {
        if (element.associated_character_ids && Array.isArray(element.associated_character_ids)) {
          element.associated_character_ids.forEach(charId => {
            if (!characterAssociations[charId]) {
              characterAssociations[charId] = [];
            }
            characterAssociations[charId].push(element.id);
          });
        }
      });
      
      // Enrich characters with their associated elements
      const charactersWithAssociations = characters.map(char => ({
        ...char,
        associated_elements: characterAssociations[char.id] || []
      }));
      
      // Now create the association edges
      edges.push(...createAssociationEdges(charactersWithAssociations));
    }
    
    if (loadedEntityTypes.includes('puzzles') && puzzles) {
      puzzles.forEach((puzzle, index) => {
        // Transform puzzle data
        const transformedPuzzle = transformPuzzle(puzzle);
        
        const node = {
          id: puzzle.id,
          type: 'puzzle', // Use custom puzzle node type
          data: {
            ...transformedPuzzle,
            label: puzzle.puzzle || puzzle.name || `Puzzle ${puzzle.id}`
          },
          position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
        };
        
        // Calculate and store the size in the node data
        node.data.size = calculateNodeSize(node);
        
        nodes.push(node);
      });
      
      // Create puzzle edges using utility function
      edges.push(...createPuzzleEdges(puzzles.map(transformPuzzle)));
    }
    
    if (loadedEntityTypes.includes('timelineEvents') && timelineEvents) {
      timelineEvents.forEach((event, index) => {
        const node = {
          id: event.id,
          type: 'timeline_event', // Use custom timeline event node type
          data: {
            ...event,
            label: event.description || `Timeline Event ${event.id}`,
            type: 'timeline_event',
            entityCategory: 'timeline_event'
          },
          position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
        };
        
        // Calculate and store the size in the node data
        node.data.size = calculateNodeSize(node);
        
        nodes.push(node);
      });
      
      // Create timeline edges using the character_ids from events
      // First, create a map of character timeline events
      const characterTimelineEvents = {};
      timelineEvents.forEach(event => {
        if (event.character_ids && Array.isArray(event.character_ids)) {
          event.character_ids.forEach(charId => {
            if (!characterTimelineEvents[charId]) {
              characterTimelineEvents[charId] = [];
            }
            characterTimelineEvents[charId].push(event.id);
          });
        }
      });
      
      // Enrich characters with their timeline events
      const charactersWithTimeline = characters.map(char => ({
        ...char,
        timeline_events: characterTimelineEvents[char.id] || []
      }));
      
      // Now create the timeline edges using the utility function
      edges.push(...createTimelineEdges(charactersWithTimeline));
    }
    
    // Apply pre-layout positions to prevent clustering
    const viewportWidth = window.innerWidth * (selectedEntity ? 0.7 : 1); // Account for panel
    const viewportHeight = window.innerHeight - 100; // Account for control bar
    
    const initialPositions = generateInitialPositions(nodes, {
      width: viewportWidth,
      height: viewportHeight
    });
    
    // Update node positions with pre-layout
    nodes.forEach(node => {
      const position = initialPositions[node.id];
      if (position) {
        node.position = position;
      }
    });
    
    // Filter edges to only include those where both source and target nodes exist
    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdges = edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    // Log any edges that were filtered out for debugging
    const filteredOutCount = edges.length - validEdges.length;
    if (filteredOutCount > 0) {
      logger.debug(`Filtered out ${filteredOutCount} edges with missing nodes`);
    }
    
    // Final debug logging
    logger.debug('processGraphData: Final graph data', {
      totalNodes: nodes.length,
      totalEdges: validEdges.length,
      sampleEdge: validEdges[0],
      nodeIds: nodes.map(n => n.id).slice(0, 5),
      edgeSourceTargets: validEdges.slice(0, 5).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
    });
    
    return {
      nodes,
      edges: validEdges,
      metadata: {
        isOverviewMode: true,
        isCharactersOnly: loadedEntityTypes.length === 0,
        totalCharacters: characters?.length || 0,
        totalEntities: (characters?.length || 0) + 
                      (elements?.length || 0) + 
                      (puzzles?.length || 0) + 
                      (timelineEvents?.length || 0),
        hiddenEntities,
        loadedTypes: loadedEntityTypes,
        // Add counts for EntityTypeLoader
        characterCount: characters?.length || 0,
        elementCount: elements?.length || 0,
        puzzleCount: puzzles?.length || 0,
        timelineEventCount: timelineEvents?.length || 0
      }
    };
  }
}