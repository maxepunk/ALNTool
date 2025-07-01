/**
 * Test to diagnose why journey graph appears empty
 * Focus on data transformation between API and component
 */

describe('Journey Data Transformation', () => {
  const apiResponse = {
    character_id: '18c2f33d-583f-8086-8ff8-fdb97283e1a8',
    character_info: {
      id: '18c2f33d-583f-8086-8ff8-fdb97283e1a8',
      name: 'Alex Reeves',
      tier: 'Core'
    },
    graph: {
      nodes: [
        {
          id: 'event-1b52f33d-583f-8002-b3cd-ee6b89a64045',
          type: 'loreNode',
          data: {
            label: 'Event: Ashe Motoko writes a scathing expose',
            type: 'timeline_event'
          },
          position: { x: 0, y: 0 }
        }
      ],
      edges: []
    }
  };

  test('API response has correct structure for ReactFlow', () => {
    // Verify node structure
    const node = apiResponse.graph.nodes[0];
    
    // ReactFlow requires these fields
    expect(node).toHaveProperty('id');
    expect(node).toHaveProperty('type');
    expect(node).toHaveProperty('position');
    expect(node).toHaveProperty('data');
    
    // Position must be an object with x,y
    expect(node.position).toEqual({ x: 0, y: 0 });
    
    // Type must match our custom node types
    expect(['activityNode', 'discoveryNode', 'loreNode']).toContain(node.type);
  });

  test('nodes with all position at 0,0 need layout', () => {
    // Check if all nodes have same position (indicating need for layout)
    const allAtOrigin = apiResponse.graph.nodes.every(
      node => node.position.x === 0 && node.position.y === 0
    );
    
    expect(allAtOrigin).toBe(true);
    
    // This explains why graph might appear empty - all nodes stacked at origin!
  });

  test('empty edges array is valid for timeline layout', () => {
    // No edges is valid - nodes should be arranged by date
    expect(apiResponse.graph.edges).toEqual([]);
    
    // Frontend should handle this by creating implicit timeline connections
  });
});