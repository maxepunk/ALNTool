import { 
  createOwnershipEdges,
  createAssociationEdges,
  createTimelineEdges,
  createPuzzleEdges,
  createContainerEdges
} from '../dataTransformers';

describe('dataTransformers integration', () => {
  it('should create all edge types from realistic game data', () => {
    // Sample game data structure
    const characters = [
      {
        id: 'char-sarah-mitchell',
        name: 'Sarah Mitchell',
        associated_elements: ['elem-voice-memo', 'elem-jewelry-box-key'],
        timeline_events: ['timeline-victoria-affair', 'timeline-sarah-discovery']
      },
      {
        id: 'char-marcus-sterling',
        name: 'Marcus Sterling',
        associated_elements: ['elem-business-card', 'elem-prenup'],
        timeline_events: ['timeline-victoria-affair', 'timeline-marcus-meeting']
      }
    ];
    
    const elements = [
      {
        id: 'elem-voice-memo',
        name: "Victoria's Voice Memo",
        owner_character_id: 'char-sarah-mitchell',
        container_element_id: 'elem-jewelry-box'
      },
      {
        id: 'elem-business-card',
        name: "Marcus's Business Card",
        owner_character_id: 'char-marcus-sterling',
        container_element_id: null
      },
      {
        id: 'elem-jewelry-box',
        name: "Sarah's Jewelry Box",
        owner_character_id: 'char-sarah-mitchell',
        container_element_id: null
      }
    ];
    
    const puzzles = [
      {
        id: 'puzzle-jewelry-box',
        name: "Sarah's Jewelry Box Puzzle",
        requiredElements: ['elem-business-card'],
        rewardIds: ['elem-voice-memo', 'elem-prenup']
      }
    ];
    
    // Create all edge types
    const ownershipEdges = createOwnershipEdges(elements);
    const associationEdges = createAssociationEdges(characters);
    const timelineEdges = createTimelineEdges(characters);
    const puzzleEdges = createPuzzleEdges(puzzles);
    const containerEdges = createContainerEdges(elements);
    
    // Verify edge counts
    expect(ownershipEdges).toHaveLength(3); // 3 elements with owners
    expect(associationEdges).toHaveLength(4); // 2 + 2 associations
    expect(timelineEdges).toHaveLength(4); // 2 + 2 timeline events
    expect(puzzleEdges).toHaveLength(3); // 1 requirement + 2 rewards
    expect(containerEdges).toHaveLength(1); // 1 element in container
    
    // Verify no duplicate edge IDs across all edge types
    const allEdges = [
      ...ownershipEdges,
      ...associationEdges,
      ...timelineEdges,
      ...puzzleEdges,
      ...containerEdges
    ];
    
    const allEdgeIds = allEdges.map(e => e.id);
    expect(new Set(allEdgeIds).size).toBe(allEdgeIds.length);
    
    // Verify edge type consistency
    expect(ownershipEdges.every(e => e.data.type === 'character-element-ownership')).toBe(true);
    expect(associationEdges.every(e => e.data.type === 'character-element-association')).toBe(true);
    expect(timelineEdges.every(e => e.data.type === 'character-timeline-event')).toBe(true);
    expect(puzzleEdges.some(e => e.data.type === 'puzzle-element-reward')).toBe(true);
    expect(puzzleEdges.some(e => e.data.type === 'element-puzzle-requirement')).toBe(true);
    expect(containerEdges.every(e => e.data.type === 'element-element-container')).toBe(true);
    
    // Verify visual distinction between edge types
    const edgeStyles = {
      ownership: ownershipEdges[0].style,
      association: associationEdges[0].style,
      timeline: timelineEdges[0].style,
      puzzle: puzzleEdges[0].style,
      container: containerEdges[0].style
    };
    
    // Each edge type should have unique visual characteristics
    expect(edgeStyles.ownership.stroke).toBe('#10b981'); // Green
    expect(edgeStyles.association.stroke).toBe('#8b5cf6'); // Purple
    expect(edgeStyles.timeline.stroke).toBe('#3b82f6'); // Blue
    expect(edgeStyles.container.stroke).toBe('#64748b'); // Gray
    
    // Animation differences
    expect(ownershipEdges[0].animated).toBe(false);
    expect(associationEdges[0].animated).toBe(false);
    expect(timelineEdges[0].animated).toBe(true); // Timeline edges are animated
  });
  
  it('should handle complex relationships without conflicts', () => {
    // Test scenario where same entities are connected in multiple ways
    const characters = [
      {
        id: 'char-1',
        associated_elements: ['elem-1', 'elem-2'],
        timeline_events: ['timeline-1']
      }
    ];
    
    const elements = [
      {
        id: 'elem-1',
        owner_character_id: 'char-1', // Same character owns and is associated
        container_element_id: 'elem-2'
      },
      {
        id: 'elem-2',
        owner_character_id: 'char-1',
        container_element_id: null
      }
    ];
    
    const puzzles = [
      {
        id: 'puzzle-1',
        requiredElements: ['elem-1'],
        rewardIds: ['elem-2'] // Creates elem-1 -> puzzle-1 -> elem-2 chain
      }
    ];
    
    // Create all edges
    const ownershipEdges = createOwnershipEdges(elements);
    const associationEdges = createAssociationEdges(characters);
    const containerEdges = createContainerEdges(elements);
    const puzzleEdges = createPuzzleEdges(puzzles);
    
    // All edges should have unique IDs even with overlapping relationships
    const allEdgeIds = [
      ...ownershipEdges,
      ...associationEdges,
      ...containerEdges,
      ...puzzleEdges
    ].map(e => e.id);
    
    expect(new Set(allEdgeIds).size).toBe(allEdgeIds.length);
    
    // Verify specific edge relationships
    expect(ownershipEdges.find(e => e.id === 'owner-elem-1')).toMatchObject({
      source: 'char-1',
      target: 'elem-1'
    });
    
    expect(associationEdges.find(e => e.id === 'assoc-char-1-elem-1')).toMatchObject({
      source: 'char-1',
      target: 'elem-1'
    });
    
    // Different edge types can connect same nodes
    const char1ToElem1Edges = [
      ...ownershipEdges,
      ...associationEdges
    ].filter(e => e.source === 'char-1' && e.target === 'elem-1');
    
    expect(char1ToElem1Edges).toHaveLength(2);
    expect(char1ToElem1Edges[0].data.type).not.toBe(char1ToElem1Edges[1].data.type);
  });
});