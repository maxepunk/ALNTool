import { transformToGraphElements } from './transformToGraphElements'; // Adjust path as necessary
import {
    DETAILED_MOCK_CHARACTER_GRAPH_DATA,
    DETAILED_MOCK_ELEMENT_GRAPH_DATA,
    DETAILED_MOCK_PUZZLE_GRAPH_DATA,
    DETAILED_MOCK_TIMELINE_GRAPH_DATA,
    MOCK_EMPTY_GRAPH_DATA // Ensure this is imported if used
} from './__mocks__/graphData.mock'; // Using detailed mocks for comprehensive testing

// Mock graphData that adheres to PRD Section 4.E
const MOCK_EMPTY_GRAPH_DATA = {
  center: null, // Or a minimal center object if that's what an empty graph might have
  nodes: [],
  edges: [],
};

const MOCK_SIMPLE_GRAPH_DATA = {
  center: {
    id: 'char-center',
    name: 'Central Character',
    type: 'Character',
    fullDescription: 'A main char',
    descriptionSnippet: 'Main char',
    tier: 'Core',
    role: 'Player',
    primaryActionSnippet: 'Leads the story'
  },
  nodes: [
    {
      id: 'char-center',
      name: 'Central Character',
      type: 'Character',
      fullDescription: 'A main char',
      descriptionSnippet: 'Main char',
      tier: 'Core',
      role: 'Player',
      primaryActionSnippet: 'Leads the story'
    },
    {
      id: 'elem-related',
      name: 'Related Element',
      type: 'Element',
      fullDescription: 'An important item',
      descriptionSnippet: 'Important item',
      basicType: 'Prop',
      status: 'Done',
      flowSummary: 'Owned by Central Character'
    },
  ],
  edges: [
    {
      source: 'char-center',
      target: 'elem-related',
      label: 'Owns', // Original label from BFF
      data: {
        sourceNodeName: 'Central Character',
        sourceNodeType: 'Character',
        targetNodeName: 'Related Element',
        targetNodeType: 'Element',
        contextualLabel: 'Character Central Character owns Element Related Element',
        shortLabel: 'Owns', // CRITICAL for frontend parentId assignment
      },
    },
  ],
};

// Base setup for simpler graph structure tests, derived from one of the detailed mocks for consistency
const MOCK_BASE_GRAPH_DATA_SETUP = {
  center: DETAILED_MOCK_CHARACTER_GRAPH_DATA.nodes.find(n => n.id === DETAILED_MOCK_CHARACTER_GRAPH_DATA.center.id),
  nodes: [
    DETAILED_MOCK_CHARACTER_GRAPH_DATA.nodes.find(n => n.id === 'char-alex-reeves'), // Character
    DETAILED_MOCK_CHARACTER_GRAPH_DATA.nodes.find(n => n.id === 'elem-backpack'),    // Element
    DETAILED_MOCK_CHARACTER_GRAPH_DATA.nodes.find(n => n.id === 'puzzle-laptop-access'), // Puzzle
    DETAILED_MOCK_CHARACTER_GRAPH_DATA.nodes.find(n => n.id === 'event-interrogation') // Timeline
  ],
  edges: [
    DETAILED_MOCK_CHARACTER_GRAPH_DATA.edges.find(e => e.source === 'char-alex-reeves' && e.target === 'elem-backpack'), // Owns
    DETAILED_MOCK_CHARACTER_GRAPH_DATA.edges.find(e => e.source === 'char-alex-reeves' && e.target === 'puzzle-laptop-access'), // Associated Puzzle (shortLabel: Owns)
    {
      source: 'elem-backpack',
      target: 'puzzle-laptop-access',
      label: 'Required For ES',
      data: {
        sourceNodeName: 'Alex\'s Backpack',
        sourceNodeType: 'Element',
        targetNodeName: 'Access Alex\'s Laptop',
        targetNodeType: 'Puzzle',
        contextualLabel: 'Element Alex\'s Backpack is required for Puzzle Access Alex\'s Laptop',
        shortLabel: 'Requires',
      }
    }
  ].filter(Boolean) // Filter out any undefined if mocks change
};

describe('transformToGraphElements', () => {
  const characterRaw = {
    id: 'char1',
    name: 'Detective',
    ownedElements: [{ id: 'el1', name: 'Gun' }],
    associatedElements: [{ id: 'el2', name: 'Badge' }],
    events: [{ id: 'ev1', description: 'Interrogation' }],
    puzzles: [{ id: 'pz1', puzzle: 'Safe Code' }],
  };
  const elementRaw = {
    id: 'el1',
    name: 'Gun',
    owner: { id: 'char1', name: 'Detective' },
    associatedCharacters: [{ id: 'char2', name: 'Suspect' }],
    timelineEvents: [{ id: 'ev1', description: 'Interrogation' }],
    requiredForPuzzle: [{ id: 'pz1', puzzle: 'Safe Code' }],
    rewardedByPuzzle: [{ id: 'pz2', puzzle: 'Vault' }],
    containerPuzzle: { id: 'pz3', puzzle: 'Box' },
    container: { id: 'el2', name: 'Case' },
    contents: [{ id: 'el3', name: 'Bullet' }],
  };
  const puzzleRaw = {
    id: 'pz1',
    puzzle: 'Safe Code',
    owner: { id: 'char1', name: 'Detective' },
    lockedItem: { id: 'el1', name: 'Gun' },
    puzzleElements: [{ id: 'el2', name: 'Badge' }],
    rewards: [{ id: 'el3', name: 'Bullet' }],
    parentItem: { id: 'pz0', puzzle: 'Master Lock' },
    subPuzzles: [{ id: 'pz2', puzzle: 'Vault' }],
  };
  const timelineRaw = {
    id: 'ev1',
    description: 'Interrogation',
    charactersInvolved: [{ id: 'char1', name: 'Detective' }],
    memoryEvidence: [{ id: 'el1', name: 'Gun' }],
  };

  it('transforms Character rawData to nodes/edges', () => {
    const { nodes, edges } = transformToGraphElements({ entityType: 'Character', entityId: 'char1', entityName: 'Detective', rawData: characterRaw });
    expect(nodes.some(n => n.id === 'Character-char1' && n.data.isCenter)).toBe(true);
    expect(nodes.some(n => n.id === 'Element-el1')).toBe(true);
    expect(edges.some(e => e.label === 'Owns')).toBe(true);
    expect(edges.some(e => e.label === 'Has Puzzle')).toBe(true);
  });

  it('transforms Element rawData to nodes/edges', () => {
    const { nodes, edges } = transformToGraphElements({ entityType: 'Element', entityId: 'el1', entityName: 'Gun', rawData: elementRaw });
    expect(nodes.some(n => n.id === 'Element-el1' && n.data.isCenter)).toBe(true);
    expect(nodes.some(n => n.id === 'Character-char1')).toBe(true);
    expect(edges.some(e => e.label === 'Owned By')).toBe(true);
    expect(edges.some(e => e.label === 'Contains')).toBe(true);
  });

  it('transforms Puzzle rawData to nodes/edges', () => {
    const { nodes, edges } = transformToGraphElements({ entityType: 'Puzzle', entityId: 'pz1', entityName: 'Safe Code', rawData: puzzleRaw });
    expect(nodes.some(n => n.id === 'Puzzle-pz1' && n.data.isCenter)).toBe(true);
    expect(nodes.some(n => n.id === 'Character-char1')).toBe(true);
    expect(edges.some(e => e.label === 'Owned By')).toBe(true);
    expect(edges.some(e => e.label === 'Has Sub-Puzzle')).toBe(true);
  });

  it('transforms Timeline rawData to nodes/edges', () => {
    const { nodes, edges } = transformToGraphElements({ entityType: 'Timeline', entityId: 'ev1', entityName: 'Interrogation', rawData: timelineRaw });
    expect(nodes.some(n => n.id === 'Timeline-ev1' && n.data.isCenter)).toBe(true);
    expect(nodes.some(n => n.id === 'Character-char1')).toBe(true);
    expect(edges.some(e => e.label === 'Involves')).toBe(true);
    expect(edges.some(e => e.label === 'Evidenced By')).toBe(true);
  });

  it('transforms BFF graphData to nodes/edges', () => {
    const graphData = {
      nodes: [
        { id: 'char1', name: 'Detective', type: 'Character' },
        { id: 'el1', name: 'Gun', type: 'Element' },
      ],
      edges: [
        { source: 'char1', target: 'el1', label: 'Owns' },
      ],
      center: { id: 'char1', name: 'Detective', type: 'Character' },
    };
    const { nodes, edges } = transformToGraphElements({ entityType: 'Character', entityId: 'char1', entityName: 'Detective', graphData });
    expect(nodes.some(n => n.id === 'char1' && n.data.isCenter)).toBe(true);
    expect(nodes.some(n => n.id === 'el1')).toBe(true);
    expect(edges.some(e => e.label === 'Owns')).toBe(true);
  });

  it('returns empty arrays for missing data', () => {
    const { nodes, edges } = transformToGraphElements({ entityType: 'Character', entityId: 'char1', entityName: 'Detective' });
    expect(nodes.length).toBe(0);
    expect(edges.length).toBe(0);
  });

  it('handles missing central node in graphData', () => {
    const graphData = {
      nodes: [
        { id: 'el1', name: 'Gun', type: 'Element' },
      ],
      edges: [],
    };
    const { nodes, edges } = transformToGraphElements({ entityType: 'Character', entityId: 'char1', entityName: 'Detective', graphData });
    expect(nodes.some(n => n.id === 'char1')).toBe(false);
    expect(nodes.some(n => n.id === 'el1')).toBe(true);
    expect(edges.length).toBe(0);
  });

  it('should return empty nodes and edges for null or undefined graphData', () => {
    expect(transformToGraphElements(null)).toEqual({ nodes: [], edges: [] });
    expect(transformToGraphElements(undefined)).toEqual({ nodes: [], edges: [] });
  });

  it('should return empty nodes and edges for graphData with empty nodes/edges arrays', () => {
    expect(transformToGraphElements(MOCK_EMPTY_GRAPH_DATA)).toEqual({ nodes: [], edges: [] });
  });

  it('should transform valid graphData into React Flow nodes and edges', () => {
    const { nodes, edges } = transformToGraphElements(MOCK_SIMPLE_GRAPH_DATA);

    // Check nodes
    expect(nodes.length).toBe(MOCK_SIMPLE_GRAPH_DATA.nodes.length);
    const centerNode = nodes.find(n => n.id === 'char-center');
    expect(centerNode).toBeDefined();
    expect(centerNode.type).toBe('customEntityNode'); // Assuming custom node type
    expect(centerNode.data.id).toBe('char-center');
    expect(centerNode.data.name).toBe('Central Character');
    expect(centerNode.data.type).toBe('Character');
    expect(centerNode.data.isCentral).toBe(true);
    expect(centerNode.data.properties).toEqual(MOCK_SIMPLE_GRAPH_DATA.nodes[0]); // or specific props check

    const relatedNode = nodes.find(n => n.id === 'elem-related');
    expect(relatedNode).toBeDefined();
    expect(relatedNode.type).toBe('customEntityNode');
    expect(relatedNode.data.id).toBe('elem-related');
    expect(relatedNode.data.name).toBe('Related Element');
    expect(relatedNode.data.type).toBe('Element');
    expect(relatedNode.data.isCentral).toBe(false);
    expect(relatedNode.data.properties).toEqual(MOCK_SIMPLE_GRAPH_DATA.nodes[1]);

    // Check edges
    expect(edges.length).toBe(MOCK_SIMPLE_GRAPH_DATA.edges.length);
    const flowEdge = edges[0];
    expect(flowEdge.id).toBe('char-center-elem-related-Owns'); // Default ID generation convention
    expect(flowEdge.source).toBe('char-center');
    expect(flowEdge.target).toBe('elem-related');
    expect(flowEdge.label).toBe('Owns'); // shortLabel for display
    expect(flowEdge.type).toBe('customEdge'); // Assuming custom edge type
    expect(flowEdge.data).toEqual(MOCK_SIMPLE_GRAPH_DATA.edges[0].data); // Ensure all edge.data is preserved
    expect(flowEdge.data.edgeType).toBeDefined(); // Should have an edgeType for styling based on shortLabel
  });

  it('should correctly mark the central node based on graphData.center', () => {
    const { nodes } = transformToGraphElements(MOCK_SIMPLE_GRAPH_DATA);
    const centerNode = nodes.find(n => n.id === MOCK_SIMPLE_GRAPH_DATA.center.id);
    const otherNode = nodes.find(n => n.id !== MOCK_SIMPLE_GRAPH_DATA.center.id);
    expect(centerNode.data.isCentral).toBe(true);
    if (otherNode) {
      expect(otherNode.data.isCentral).toBe(false);
    }
  });
  
  it('should not use any rawData fallback if graphData is provided (conceptual test - implementation detail)', () => {
    // This test is more about enforcing the PRD requirement.
    // The function signature should ideally only accept graphData.
    // If graphData is present, even if minimal, it should be the sole source.
    const minimalGraphData = { center: {id: 'test'}, nodes: [{id: 'test', name:'test', type:'Test'}], edges:[]};
    const { nodes } = transformToGraphElements(minimalGraphData);
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('test');
    // We are trusting that the implementation doesn't have a hidden rawData path.
  });

  // TODO: Add tests for:
  // - Different entity types for nodes
  // - Different relationship types for edges and how they might affect edgeType or styling data
  // - graphData with no center node (if that's a valid state)
  // - graphData with nodes but no edges, and vice-versa
  // - Edge ID generation uniqueness if multiple edges exist between same nodes (though typically label would differ)
  // - Preservation of all `node.properties` and `edge.data` from the input `graphData`

  it('should return empty nodes and edges for null, undefined, or invalid graphData input', () => {
    expect(transformToGraphElements(null)).toEqual({ nodes: [], edges: [] });
    expect(transformToGraphElements(undefined)).toEqual({ nodes: [], edges: [] });
    expect(transformToGraphElements({})).toEqual({ nodes: [], edges: [] }); // Invalid structure
    expect(transformToGraphElements(MOCK_EMPTY_GRAPH_DATA)).toEqual({ nodes: [], edges: [] });
  });

  it('should transform valid graphData into React Flow nodes and edges, preserving all properties', () => {
    const { nodes, edges } = transformToGraphElements(MOCK_BASE_GRAPH_DATA_SETUP);

    expect(nodes.length).toBe(MOCK_BASE_GRAPH_DATA_SETUP.nodes.length);

    const centerNodeInput = MOCK_BASE_GRAPH_DATA_SETUP.nodes.find(n => n.id === MOCK_BASE_GRAPH_DATA_SETUP.center.id);
    const centerNodeOutput = nodes.find(n => n.id === MOCK_BASE_GRAPH_DATA_SETUP.center.id);
    expect(centerNodeOutput).toBeDefined();
    expect(centerNodeOutput.type).toBe('customEntityNode');
    expect(centerNodeOutput.data.id).toBe(centerNodeInput.id);
    expect(centerNodeOutput.data.name).toBe(centerNodeInput.name);
    expect(centerNodeOutput.data.type).toBe(centerNodeInput.type);
    expect(centerNodeOutput.data.isCentral).toBe(true);
    expect(centerNodeOutput.data.properties).toEqual(centerNodeInput);
    expect(centerNodeOutput.width).toBeDefined();
    expect(centerNodeOutput.height).toBeDefined();

    const elementNodeInput = MOCK_BASE_GRAPH_DATA_SETUP.nodes.find(n => n.type === 'Element');
    const elementNodeOutput = nodes.find(n => n.id === elementNodeInput.id);
    expect(elementNodeOutput).toBeDefined();
    expect(elementNodeOutput.type).toBe('customEntityNode');
    expect(elementNodeOutput.data.isCentral).toBe(false);
    expect(elementNodeOutput.data.properties).toEqual(elementNodeInput);

    expect(edges.length).toBe(MOCK_BASE_GRAPH_DATA_SETUP.edges.length);

    const edgeInput = MOCK_BASE_GRAPH_DATA_SETUP.edges[0];
    const edgeOutput = edges.find(e => e.id === `${edgeInput.source}-${edgeInput.target}-${edgeInput.data.shortLabel}`);
    expect(edgeOutput).toBeDefined();
    expect(edgeOutput.source).toBe(edgeInput.source);
    expect(edgeOutput.target).toBe(edgeInput.target);
    expect(edgeOutput.label).toBe(edgeInput.data.shortLabel);
    expect(edgeOutput.type).toBe('customEdge');
    expect(edgeOutput.data).toEqual(expect.objectContaining(edgeInput.data));
    expect(edgeOutput.data.edgeType).toBe(edgeInput.data.shortLabel.toLowerCase().replace(/\s+/g, '-'));
  });

  it('should handle graphData with nodes but no edges', () => {
    const data = { ...MOCK_BASE_GRAPH_DATA_SETUP, edges: [] };
    const { nodes, edges } = transformToGraphElements(data);
    expect(nodes.length).toBe(data.nodes.length);
    expect(edges.length).toBe(0);
  });

  it('should handle graphData with edges but no nodes (resulting in no valid edges)', () => {
    const data = { ...MOCK_BASE_GRAPH_DATA_SETUP, nodes: [], center: null };
    const { nodes, edges } = transformToGraphElements(data);
    expect(nodes.length).toBe(0);
    expect(edges.length).toBe(0);
  });

  it('should omit edges if their source or target nodes are not in the provided nodes array', () => {
    const data = {
      ...MOCK_BASE_GRAPH_DATA_SETUP,
      center: MOCK_BASE_GRAPH_DATA_SETUP.center, // ensure center is still valid if nodes array shrinks
      nodes: [MOCK_BASE_GRAPH_DATA_SETUP.nodes[0]], // Only char-alex-reeves
      edges: [
        ...MOCK_BASE_GRAPH_DATA_SETUP.edges, // Includes edges to nodes no longer in the .nodes array
        { source: MOCK_BASE_GRAPH_DATA_SETUP.nodes[0].id, target: 'non-existent-node', label: 'To Ghost', data: { shortLabel: 'To Ghost' } }
      ]
    };
    const { edges } = transformToGraphElements(data);
    // Only edges where both source and target are in the reduced nodes array should remain.
    // In this case, with only 'char-alex-reeves' in nodes, no edges from MOCK_BASE_GRAPH_DATA_SETUP.edges should be valid.
    expect(edges.length).toBe(0); 
    expect(edges.find(e => e.data.shortLabel === 'To Ghost')).toBeUndefined();
  });

  it('should correctly determine edgeType from edge.data.shortLabel (or props.label as fallback)', () => {
    const data = {
      center: { id: 'n1', name: 'N1', type: 'Test' },
      nodes: [{ id: 'n1', name:'N1', type:'Test' }, { id: 'n2', name:'N2', type:'Test' }],
      edges: [
        { source: 'n1', target: 'n2', data: { shortLabel: 'Test Label' } },
        { source: 'n1', target: 'n2', label: 'Fallback Label Prop', data: {} }, // No shortLabel
        { source: 'n1', target: 'n2', data: { shortLabel: 'Another One' } } 
      ]
    };
    const { edges } = transformToGraphElements(data);
    expect(edges[0].data.edgeType).toBe('test-label');
    expect(edges[1].data.edgeType).toBe('fallback-label-prop'); // from props.label
    expect(edges[2].data.edgeType).toBe('another-one'); 
  });

  it('should generate unique edge IDs, even for multiple edges between same nodes if labels differ', () => {
    const data = {
      center: { id: 'n1', name:'N1', type:'Test' },
      nodes: [{ id: 'n1', name:'N1', type:'Test' }, { id: 'n2', name:'N2', type:'Test' }],
      edges: [
        { source: 'n1', target: 'n2', data: { shortLabel: 'Rel1' } },
        { source: 'n1', target: 'n2', data: { shortLabel: 'Rel2' } },
        { source: 'n1', target: 'n2', label: 'Rel3ViaProp', data: {} },
      ]
    };
    const { edges } = transformToGraphElements(data);
    expect(edges[0].id).toBe('n1-n2-Rel1');
    expect(edges[1].id).toBe('n1-n2-Rel2');
    expect(edges[2].id).toBe('n1-n2-Rel3ViaProp');
    expect(new Set(edges.map(e => e.id)).size).toBe(edges.length);
  });

  it('should handle graphData.center being null or its ID not matching any node', () => {
    const dataWithNullCenter = { ...MOCK_BASE_GRAPH_DATA_SETUP, center: null };
    const { nodes: nodes1 } = transformToGraphElements(dataWithNullCenter);
    nodes1.forEach(node => expect(node.data.isCentral).toBe(false));

    const dataWithUnmatchedCenter = { ...MOCK_BASE_GRAPH_DATA_SETUP, center: { id: 'non-existent-center', name:'', type:'' } };
    const { nodes: nodes2 } = transformToGraphElements(dataWithUnmatchedCenter);
    nodes2.forEach(node => expect(node.data.isCentral).toBe(false));
  });

  // Test with detailed, PRD-compliant mock data for each entity type
  const detailedMocks = [
    DETAILED_MOCK_CHARACTER_GRAPH_DATA,
    DETAILED_MOCK_ELEMENT_GRAPH_DATA,
    DETAILED_MOCK_PUZZLE_GRAPH_DATA,
    DETAILED_MOCK_TIMELINE_GRAPH_DATA
  ];

  detailedMocks.forEach((mockData, index) => {
    it(`processes detailed PRD-compliant ${mockData.center?.type || 'N/A'} graphData correctly (Mock ${index + 1})`, () => {
      if (!mockData.center || !mockData.nodes || !mockData.edges) {
        // console.warn(`Skipping detailed test for mock index ${index} due to incomplete mock structure.`);
        return;
      }
      const { nodes, edges } = transformToGraphElements(mockData);
      expect(nodes.length).toBe(mockData.nodes.length);
      expect(edges.length).toBe(mockData.edges.length);

      // Verify center node
      const centerOut = nodes.find(n => n.id === mockData.center.id);
      expect(centerOut).toBeDefined();
      expect(centerOut.data.isCentral).toBe(true);
      const centerIn = mockData.nodes.find(n => n.id === mockData.center.id);
      expect(centerOut.data.properties).toEqual(centerIn);

      // Verify a sample non-center node properties are preserved
      if (mockData.nodes.length > 1) {
        const nonCenterIn = mockData.nodes.find(n => n.id !== mockData.center.id);
        const nonCenterOut = nodes.find(n => n.id === nonCenterIn.id);
        expect(nonCenterOut).toBeDefined();
        expect(nonCenterOut.data.isCentral).toBe(false);
        expect(nonCenterOut.data.properties).toEqual(nonCenterIn);
      }

      // Verify a sample edge data is preserved and label/edgeType set
      if (mockData.edges.length > 0) {
        const edgeIn = mockData.edges[0];
        const expectedEdgeId = `${edgeIn.source}-${edgeIn.target}-${edgeIn.data.shortLabel || edgeIn.label}`;
        const edgeOut = edges.find(e => e.id === expectedEdgeId);
        expect(edgeOut).toBeDefined();
        expect(edgeOut.label).toBe(edgeIn.data.shortLabel || edgeIn.label);
        expect(edgeOut.data).toEqual(expect.objectContaining(edgeIn.data));
        expect(edgeOut.data.edgeType).toBe((edgeIn.data.shortLabel || edgeIn.label).toLowerCase().replace(/\s+/g, '-'));
      }
    });
  });

  it('should NOT use any rawData fallback (conceptual enforcement)', () => {
    const graphDataOnly = { center: {id: 'test', name:'Test', type:'Test'}, nodes: [{id: 'test', name:'test', type:'Test'}], edges:[]};
    // @ts-ignore - Intentionally passing a hypothetical rawData to see if it's ignored
    const { nodes } = transformToGraphElements(graphDataOnly, { someLegacyRawDataField: {} });
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('test');
    // This also implicitly tests that the function signature does not expect rawData
    // by seeing if the second arg (if any) is correctly ignored / doesn't cause type errors or runtime issues.
  });
}); 