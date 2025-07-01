/**
 * Contract test for Character Detail page
 * Tests against real backend API to verify data expectations
 */

describe('Character Detail API Contract', () => {
  const BACKEND_PORT = 3001;
  const CHARACTER_ID = '18c2f33d-583f-8086-8ff8-fdb97283e1a8'; // Alex Reeves

  beforeAll(async () => {
    // Verify backend is running
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/sync/status`);
    if (!response.ok) {
      throw new Error('Backend must be running on port 3001');
    }
  });

  test('character detail API returns expected format', async () => {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/characters/${CHARACTER_ID}`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Core fields
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('tier');
    expect(data).toHaveProperty('logline');
    
    // Computed fields that frontend expects
    expect(data).toHaveProperty('connections');
    expect(data).toHaveProperty('linkedCharacters');
    expect(data).toHaveProperty('total_memory_value');
    
    // Verify linkedCharacters format
    if (data.linkedCharacters && data.linkedCharacters.length > 0) {
      const firstLink = data.linkedCharacters[0];
      expect(firstLink).toHaveProperty('linked_character_id');
      expect(firstLink).toHaveProperty('linked_character_name');
      expect(firstLink).toHaveProperty('link_type');
      expect(firstLink).toHaveProperty('link_count');
    }
    
    console.log('Character API Response:', {
      name: data.name,
      connections: data.connections,
      linkedCharactersCount: data.linkedCharacters?.length || 0,
      totalMemoryValue: data.total_memory_value
    });
  });

  test('character graph API returns sociogram data', async () => {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/characters/${CHARACTER_ID}/graph`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Graph structure
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('edges');
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
    
    // Node format for sociogram
    if (data.nodes.length > 0) {
      const firstNode = data.nodes[0];
      expect(firstNode).toHaveProperty('id');
      expect(firstNode).toHaveProperty('label');
      expect(firstNode).toHaveProperty('type');
      
      // Check if it's character or other entity
      if (firstNode.type === 'character') {
        expect(firstNode).toHaveProperty('tier');
      }
    }
    
    // Edge format
    if (data.edges.length > 0) {
      const firstEdge = data.edges[0];
      expect(firstEdge).toHaveProperty('source');
      expect(firstEdge).toHaveProperty('target');
      expect(firstEdge).toHaveProperty('type');
    }
    
    console.log('Character Graph Response:', {
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length,
      nodeTypes: [...new Set(data.nodes.map(n => n.type))]
    });
  });

  test('puzzle count calculation matches reality', async () => {
    // Get character data
    const charResponse = await fetch(`http://localhost:${BACKEND_PORT}/api/characters/${CHARACTER_ID}`);
    const charData = await charResponse.json();
    
    // Get all puzzles
    const puzzlesResponse = await fetch(`http://localhost:${BACKEND_PORT}/api/puzzles`);
    const allPuzzles = await puzzlesResponse.json();
    
    // Count puzzles that reference this character
    const characterPuzzles = allPuzzles.filter(puzzle => {
      try {
        const charIds = JSON.parse(puzzle.character_ids || '[]');
        return charIds.includes(CHARACTER_ID);
      } catch {
        return false;
      }
    });
    
    console.log('Puzzle Count Verification:', {
      frontendExpects: '???', // What does the UI show?
      actualPuzzleCount: characterPuzzles.length,
      samplePuzzle: characterPuzzles[0]?.name
    });
  });
});