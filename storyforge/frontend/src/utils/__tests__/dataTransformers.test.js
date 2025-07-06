import { 
  transformElement, 
  transformElements,
  transformCharacter,
  transformPuzzle,
  transformTimelineEvent,
  createOwnershipEdges,
  createContainerEdges,
  createPuzzleEdges,
  groupElementsByOwner,
  createAssociationEdges,
  createTimelineEdges
} from '../dataTransformers';

describe('dataTransformers', () => {
  describe('transformElement', () => {
    it('should transform element with owner array to owner_character_id', () => {
      const apiElement = {
        id: 'elem-1',
        name: 'Test Element',
        owner: [{ id: 'char-1', name: 'Character 1' }],
        basicType: 'Memory Token'
      };
      
      const result = transformElement(apiElement);
      
      expect(result.owner_character_id).toBe('char-1');
      expect(result.owner_character_name).toBe('Character 1');
      expect(result.type).toBe('Memory Token');
      expect(result.entityCategory).toBe('element');
    });
    
    it('should handle element without owner', () => {
      const apiElement = {
        id: 'elem-2',
        name: 'Unowned Element',
        owner: [],
        basicType: 'Prop'
      };
      
      const result = transformElement(apiElement);
      
      expect(result.owner_character_id).toBeNull();
      expect(result.owner_character_name).toBeNull();
    });
    
    it('should prefer basicType over type', () => {
      const apiElement = {
        id: 'elem-3',
        name: 'Test',
        type: 'old-type',
        basicType: 'Memory Token Audio'
      };
      
      const result = transformElement(apiElement);
      
      expect(result.type).toBe('Memory Token Audio');
    });
    
    it('should handle null input', () => {
      expect(transformElement(null)).toBeNull();
    });
  });
  
  describe('transformCharacter', () => {
    it('should add entityCategory and ensure tier', () => {
      const apiCharacter = {
        id: 'char-1',
        name: 'Test Character',
        tier: 'Main'
      };
      
      const result = transformCharacter(apiCharacter);
      
      expect(result.entityCategory).toBe('character');
      expect(result.type).toBe('character');
      expect(result.tier).toBe('Main');
    });
    
    it('should default tier to Supporting if missing', () => {
      const apiCharacter = {
        id: 'char-2',
        name: 'Test Character'
      };
      
      const result = transformCharacter(apiCharacter);
      
      expect(result.tier).toBe('Supporting');
    });
  });
  
  describe('createOwnershipEdges', () => {
    it('should create edges for elements with owners', () => {
      const elements = [
        { id: 'elem-1', owner_character_id: 'char-1' },
        { id: 'elem-2', owner_character_id: 'char-2' },
        { id: 'elem-3', owner_character_id: null }
      ];
      
      const edges = createOwnershipEdges(elements);
      
      expect(edges).toHaveLength(2);
      expect(edges[0]).toMatchObject({
        id: 'owner-elem-1',
        source: 'char-1',
        target: 'elem-1',
        data: { type: 'character-element-ownership' }
      });
      expect(edges[1]).toMatchObject({
        id: 'owner-elem-2',
        source: 'char-2',
        target: 'elem-2'
      });
    });
  });
  
  describe('createPuzzleEdges', () => {
    it('should create reward and requirement edges', () => {
      const puzzles = [{
        id: 'puzzle-1',
        rewardIds: ['elem-1', 'elem-2'],
        requiredElements: ['elem-3']
      }];
      
      const edges = createPuzzleEdges(puzzles);
      
      expect(edges).toHaveLength(3);
      
      // Check reward edges
      expect(edges.filter(e => e.data.type === 'puzzle-element-reward')).toHaveLength(2);
      expect(edges[0]).toMatchObject({
        id: 'reward-puzzle-1-elem-1',
        source: 'puzzle-1',
        target: 'elem-1'
      });
      
      // Check requirement edge
      expect(edges.filter(e => e.data.type === 'element-puzzle-requirement')).toHaveLength(1);
      expect(edges[2]).toMatchObject({
        id: 'requires-puzzle-1-elem-3',
        source: 'elem-3',
        target: 'puzzle-1'
      });
    });
  });
  
  describe('groupElementsByOwner', () => {
    it('should group elements by owner with character names', () => {
      const elements = [
        { id: 'elem-1', owner_character_id: 'char-1' },
        { id: 'elem-2', owner_character_id: 'char-1' },
        { id: 'elem-3', owner_character_id: 'char-2' },
        { id: 'elem-4', owner_character_id: null }
      ];
      
      const characters = [
        { id: 'char-1', name: 'Character 1' },
        { id: 'char-2', name: 'Character 2' }
      ];
      
      const groups = groupElementsByOwner(elements, characters);
      
      expect(Object.keys(groups)).toHaveLength(3);
      expect(groups['char-1']).toMatchObject({
        ownerId: 'char-1',
        ownerName: 'Character 1',
        elements: expect.arrayContaining([
          expect.objectContaining({ id: 'elem-1' }),
          expect.objectContaining({ id: 'elem-2' })
        ])
      });
      expect(groups['unowned']).toMatchObject({
        ownerId: 'unowned',
        ownerName: 'Unowned',
        elements: expect.arrayContaining([
          expect.objectContaining({ id: 'elem-4' })
        ])
      });
    });
  });
  
  describe('createAssociationEdges', () => {
    it('should create edges for characters with associated elements', () => {
      const characters = [
        { 
          id: 'char-1', 
          name: 'Sarah Mitchell',
          associated_elements: ['elem-1', 'elem-2'] 
        },
        { 
          id: 'char-2', 
          name: 'Marcus Sterling',
          associated_elements: ['elem-3'] 
        },
        { 
          id: 'char-3', 
          name: 'Victoria Chen',
          associated_elements: [] 
        },
        { 
          id: 'char-4', 
          name: 'Derek Hughes'
          // No associated_elements property
        }
      ];
      
      const edges = createAssociationEdges(characters);
      
      expect(edges).toHaveLength(3);
      
      // Check first character's edges
      expect(edges[0]).toMatchObject({
        id: 'assoc-char-1-elem-1',
        source: 'char-1',
        target: 'elem-1',
        type: 'smoothstep',
        animated: false,
        data: { type: 'character-element-association' },
        style: {
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          strokeDasharray: '2,2'
        }
      });
      
      expect(edges[1]).toMatchObject({
        id: 'assoc-char-1-elem-2',
        source: 'char-1',
        target: 'elem-2',
        data: { type: 'character-element-association' }
      });
      
      // Check second character's edge
      expect(edges[2]).toMatchObject({
        id: 'assoc-char-2-elem-3',
        source: 'char-2',
        target: 'elem-3',
        data: { type: 'character-element-association' }
      });
    });
    
    it('should handle empty array input', () => {
      const edges = createAssociationEdges([]);
      expect(edges).toEqual([]);
    });
    
    it('should handle null input', () => {
      const edges = createAssociationEdges(null);
      expect(edges).toEqual([]);
    });
    
    it('should handle undefined input', () => {
      const edges = createAssociationEdges(undefined);
      expect(edges).toEqual([]);
    });
    
    it('should handle non-array input', () => {
      const edges = createAssociationEdges('not an array');
      expect(edges).toEqual([]);
    });
    
    it('should skip characters with null associated_elements', () => {
      const characters = [
        { id: 'char-1', associated_elements: null },
        { id: 'char-2', associated_elements: ['elem-1'] }
      ];
      
      const edges = createAssociationEdges(characters);
      
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('char-2');
    });
    
    it('should create unique edge IDs', () => {
      const characters = [
        { id: 'char-1', associated_elements: ['elem-1', 'elem-2', 'elem-3'] },
        { id: 'char-2', associated_elements: ['elem-1', 'elem-4'] }
      ];
      
      const edges = createAssociationEdges(characters);
      const edgeIds = edges.map(e => e.id);
      
      // Check all IDs are unique
      expect(new Set(edgeIds).size).toBe(edgeIds.length);
      
      // Check ID format
      expect(edgeIds).toContain('assoc-char-1-elem-1');
      expect(edgeIds).toContain('assoc-char-2-elem-1');
    });
  });
  
  describe('createTimelineEdges', () => {
    it('should create edges for characters with timeline events', () => {
      const characters = [
        { 
          id: 'char-1', 
          name: 'Sarah Mitchell',
          timeline_events: ['timeline-1', 'timeline-2'] 
        },
        { 
          id: 'char-2', 
          name: 'Marcus Sterling',
          timeline_events: ['timeline-3'] 
        },
        { 
          id: 'char-3', 
          name: 'Victoria Chen',
          timeline_events: [] 
        },
        { 
          id: 'char-4', 
          name: 'Derek Hughes'
          // No timeline_events property
        }
      ];
      
      const edges = createTimelineEdges(characters);
      
      expect(edges).toHaveLength(3);
      
      // Check first character's edges
      expect(edges[0]).toMatchObject({
        id: 'timeline-char-1-timeline-1',
        source: 'char-1',
        target: 'timeline-1',
        type: 'smoothstep',
        animated: true,
        data: { type: 'character-timeline-event' },
        style: {
          stroke: '#3b82f6',
          strokeWidth: 2,
          strokeDasharray: '8,4'
        }
      });
      
      expect(edges[1]).toMatchObject({
        id: 'timeline-char-1-timeline-2',
        source: 'char-1',
        target: 'timeline-2',
        data: { type: 'character-timeline-event' }
      });
      
      // Check second character's edge
      expect(edges[2]).toMatchObject({
        id: 'timeline-char-2-timeline-3',
        source: 'char-2',
        target: 'timeline-3',
        data: { type: 'character-timeline-event' }
      });
    });
    
    it('should handle empty array input', () => {
      const edges = createTimelineEdges([]);
      expect(edges).toEqual([]);
    });
    
    it('should handle null input', () => {
      const edges = createTimelineEdges(null);
      expect(edges).toEqual([]);
    });
    
    it('should handle undefined input', () => {
      const edges = createTimelineEdges(undefined);
      expect(edges).toEqual([]);
    });
    
    it('should handle non-array input', () => {
      const edges = createTimelineEdges({ not: 'an array' });
      expect(edges).toEqual([]);
    });
    
    it('should skip characters with null timeline_events', () => {
      const characters = [
        { id: 'char-1', timeline_events: null },
        { id: 'char-2', timeline_events: ['timeline-1'] }
      ];
      
      const edges = createTimelineEdges(characters);
      
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('char-2');
    });
    
    it('should create unique edge IDs', () => {
      const characters = [
        { id: 'char-1', timeline_events: ['timeline-1', 'timeline-2', 'timeline-3'] },
        { id: 'char-2', timeline_events: ['timeline-1', 'timeline-4'] }
      ];
      
      const edges = createTimelineEdges(characters);
      const edgeIds = edges.map(e => e.id);
      
      // Check all IDs are unique
      expect(new Set(edgeIds).size).toBe(edgeIds.length);
      
      // Check ID format
      expect(edgeIds).toContain('timeline-char-1-timeline-1');
      expect(edgeIds).toContain('timeline-char-2-timeline-1');
    });
    
    it('should set animated property to true for timeline edges', () => {
      const characters = [
        { id: 'char-1', timeline_events: ['timeline-1', 'timeline-2'] }
      ];
      
      const edges = createTimelineEdges(characters);
      
      edges.forEach(edge => {
        expect(edge.animated).toBe(true);
      });
    });
    
    it('should have different visual styles than association edges', () => {
      const characters = [
        { id: 'char-1', timeline_events: ['timeline-1'] }
      ];
      
      const timelineEdges = createTimelineEdges(characters);
      
      // Timeline edges should have blue color and larger dash pattern
      expect(timelineEdges[0].style.stroke).toBe('#3b82f6');
      expect(timelineEdges[0].style.strokeDasharray).toBe('8,4');
      expect(timelineEdges[0].style.strokeWidth).toBe(2);
    });
  });
});