/**
 * Contract test to verify Player Journey API response matches component expectations
 * This runs against the already-running backend on port 3001
 */

const BACKEND_PORT = 3001; // Use existing backend

describe('JourneyGraphView API Contract Tests', () => {
  // Check if backend is running
  beforeAll(async () => {
    try {
      const response = await fetch(`http://localhost:${BACKEND_PORT}/api/sync/status`);
      if (!response.ok) {
        throw new Error('Backend not running on port 3001');
      }
    } catch (error) {
      console.error('Backend must be running on port 3001 for these tests');
      throw error;
    }
  });

  test('journey API returns ReactFlow-compatible format', async () => {
    // Test with a real character ID (Alex Reeves)
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/journeys/18c2f33d-583f-8086-8ff8-fdb97283e1a8`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Verify top-level structure
    expect(data).toHaveProperty('character_info');
    expect(data).toHaveProperty('graph');
    
    // Verify character info
    expect(data.character_info).toHaveProperty('id');
    expect(data.character_info).toHaveProperty('name');
    
    // Verify graph structure
    expect(data.graph).toHaveProperty('nodes');
    expect(data.graph).toHaveProperty('edges');
    expect(Array.isArray(data.graph.nodes)).toBe(true);
    expect(Array.isArray(data.graph.edges)).toBe(true);
    
    // If there are nodes, verify ReactFlow format
    if (data.graph.nodes.length > 0) {
      const firstNode = data.graph.nodes[0];
      
      // ReactFlow requires these fields
      expect(firstNode).toHaveProperty('id');
      expect(firstNode).toHaveProperty('position');
      expect(firstNode).toHaveProperty('data');
      expect(firstNode).toHaveProperty('type');
      
      // Position must have x and y
      expect(firstNode.position).toHaveProperty('x');
      expect(firstNode.position).toHaveProperty('y');
      expect(typeof firstNode.position.x).toBe('number');
      expect(typeof firstNode.position.y).toBe('number');
      
      // Data should contain display information
      expect(firstNode.data).toHaveProperty('label');
    }
    
    // If there are edges, verify format
    if (data.graph.edges.length > 0) {
      const firstEdge = data.graph.edges[0];
      
      // ReactFlow requires these fields
      expect(firstEdge).toHaveProperty('id');
      expect(firstEdge).toHaveProperty('source');
      expect(firstEdge).toHaveProperty('target');
    }
    
    // Log the actual structure for debugging
    console.log('Journey API Response Structure:', {
      characterInfo: Object.keys(data.character_info || {}),
      nodeCount: data.graph?.nodes?.length || 0,
      edgeCount: data.graph?.edges?.length || 0,
      sampleNode: data.graph?.nodes?.[0],
      sampleEdge: data.graph?.edges?.[0]
    });
  });

  test('journey nodes have required custom node type fields', async () => {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/journeys/18c2f33d-583f-8086-8ff8-fdb97283e1a8`);
    const data = await response.json();
    
    if (data.graph?.nodes?.length > 0) {
      data.graph.nodes.forEach(node => {
        // Check if node type is one of our custom types
        expect(['activityNode', 'discoveryNode', 'loreNode']).toContain(node.type);
        
        // Verify data fields based on node type
        if (node.type === 'activityNode') {
          expect(node.data).toHaveProperty('activity_type');
        } else if (node.type === 'discoveryNode') {
          expect(node.data).toHaveProperty('discovery_type');
        } else if (node.type === 'loreNode') {
          expect(node.data).toHaveProperty('lore_content');
        }
      });
    }
  });
});