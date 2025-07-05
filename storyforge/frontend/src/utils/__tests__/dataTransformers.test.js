import { 
  transformElement, 
  transformElements,
  transformCharacter,
  transformPuzzle,
  transformTimelineEvent,
  createOwnershipEdges,
  createContainerEdges,
  createPuzzleEdges,
  groupElementsByOwner
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
});