import dagre from 'dagre';

describe('useAutoLayout with no edges', () => {
  test('dagre handles nodes without edges', () => {
    const nodes = [
      { id: 'node-1', position: { x: 0, y: 0 } },
      { id: 'node-2', position: { x: 0, y: 0 } },
      { id: 'node-3', position: { x: 0, y: 0 } }
    ];
    const edges = [];

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 172, height: 36 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      console.log(`Node ${node.id} position:`, { x: nodeWithPosition.x, y: nodeWithPosition.y });
      return {
        ...node,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      };
    });

    // Check if nodes have different positions
    const positions = layoutedNodes.map(n => `${n.position.x},${n.position.y}`);
    const uniquePositions = new Set(positions);
    
    console.log('All positions:', positions);
    console.log('Unique positions:', uniquePositions.size);
    
    // With no edges, dagre might stack nodes or place them in a line
    expect(uniquePositions.size).toBeGreaterThan(0);
  });

  test('dagre with timeline-based layout', () => {
    // Simulate what should happen - nodes arranged by date
    const nodes = [
      { id: 'event-1', data: { date: '2020-01-22' }, position: { x: 0, y: 0 } },
      { id: 'event-2', data: { date: '2020-02-15' }, position: { x: 0, y: 0 } },
      { id: 'event-3', data: { date: '2020-03-10' }, position: { x: 0, y: 0 } }
    ];

    // Sort by date and create linear edges
    const sortedNodes = [...nodes].sort((a, b) => 
      new Date(a.data.date) - new Date(b.data.date)
    );
    
    const edges = [];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      edges.push({
        id: `edge-${i}`,
        source: sortedNodes[i].id,
        target: sortedNodes[i + 1].id
      });
    }

    console.log('Created edges:', edges);

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 172, height: 36 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      };
    });

    console.log('Timeline-based layout positions:', layoutedNodes.map(n => ({
      id: n.id,
      date: n.data.date,
      position: n.position
    })));

    // With edges, nodes should have different Y positions
    const yPositions = layoutedNodes.map(n => n.position.y);
    const uniqueYPositions = new Set(yPositions);
    expect(uniqueYPositions.size).toBeGreaterThan(1);
  });
});