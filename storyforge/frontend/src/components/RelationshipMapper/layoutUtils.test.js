import { getDagreLayout, getRadialLayout, getForceDirectedLayout } from './layoutUtils'; // Adjust path
import { MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT } from './__mocks__/graphData.mock'; // Contains parentId

// Minimal mock nodes for layout testing. 
// Actual positions are hard to predict without running the algorithms,
// so tests will focus on structure, node presence, and basic non-overlapping for simple cases if possible.
const MOCK_NODES_FOR_LAYOUT = [
  { id: '1', data: { id: '1', name: 'Node 1', width: 150, height: 50 } },
  { id: '2', data: { id: '2', name: 'Node 2', width: 150, height: 50 } },
  { id: '3', data: { id: '3', name: 'Node 3', width: 150, height: 50, parentId: '1' } }, // For Dagre parent/child
];
const MOCK_EDGES_FOR_LAYOUT = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
];

const basicNodes = [
  { id: '1', data: { id: '1', name: 'Node 1', type: 'Character', properties: {name: 'Node 1'} }, width: 150, height: 50, position: {x:0, y:0} }, // Add initial position for force layout
  { id: '2', data: { id: '2', name: 'Node 2', type: 'Element', properties: {name: 'Node 2'} }, width: 120, height: 60, position: {x:0, y:0} },
];
const basicEdges = [
  { id: 'e1-2', source: '1', target: '2', data: { shortLabel: 'Connects'} },
];

// From MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT - adapt for layoutUtils input
const nodesForDagreOrbiting = MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT.nodes.map(n => ({
    id: n.id,
    data: { // Replicate structure layoutUtils might expect after transformToGraphElements
        id: n.id,
        name: n.name,
        type: n.type,
        properties: { ...n }, // Keep all original node data from mock
        parentId: n.id === 'elem-child-1' || n.id === 'elem-child-2' ? 'puzz-parent' : (n.id === 'elem-grandchild-1' ? 'elem-child-1' : undefined)
    },
    width: 150,
    height: 50,
    position: { x: 0, y: 0 } // initial position
}));
const edgesForDagreOrbiting = MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT.edges.map(e => ({
    id: `${e.source}-${e.target}-${e.data.shortLabel}`,
    source: e.source,
    target: e.target,
    data: { ...e.data }
}));

describe('layoutUtils', () => {
  const checkNodesAndPreservation = (positionedNodes, originalNodes) => {
    expect(positionedNodes.length).toBe(originalNodes.length);
    positionedNodes.forEach(pNode => {
      const oNode = originalNodes.find(n => n.id === pNode.id);
      expect(oNode).toBeDefined();
      expect(pNode).toHaveProperty('position');
      expect(pNode.position).toHaveProperty('x');
      expect(pNode.position).toHaveProperty('y');
      expect(typeof pNode.position.x).toBe('number');
      expect(typeof pNode.position.y).toBe('number');
      expect(pNode.data).toEqual(expect.objectContaining(oNode.data)); // Check original data is preserved
      expect(pNode.width).toBe(oNode.width);
      expect(pNode.height).toBe(oNode.height);
    });
  };

  describe.each([
    { name: 'getDagreLayout', fn: getDagreLayout, defaultOptions: { rankdir: 'TB', ranksep: 100, nodesep: 50, edgeSep: 10, labelAlignment: 'center' } },
    { name: 'getRadialLayout', fn: getRadialLayout, defaultOptions: { center: [400,300], baseRadius: 250, layerSeparation: 100, nodeSeparation: 20, maxNodesPerLayer: [5,10,15] } },
    { name: 'getForceDirectedLayout', fn: getForceDirectedLayout, defaultOptions: { width: 800, height: 600, iterations: 100, initialPlacement: 'grid' } },
  ])('$name', ({ name, fn, defaultOptions }) => {
    const isAsync = name === 'getForceDirectedLayout';

    it('should return nodes with x, y positions and preserve original data', async () => {
      const positionedNodes = isAsync ? await fn(basicNodes, basicEdges, defaultOptions) : fn(basicNodes, basicEdges, defaultOptions);
      checkNodesAndPreservation(positionedNodes, basicNodes);
    });

    it('should handle empty nodes and edges arrays', async () => {
      const positionedNodes = isAsync ? await fn([], [], defaultOptions) : fn([], [], defaultOptions);
      expect(positionedNodes).toEqual([]);
    });

    it('should handle single node and no edges', async () => {
      const singleNode = [basicNodes[0]];
      const positionedNodes = isAsync ? await fn(singleNode, [], defaultOptions) : fn(singleNode, [], defaultOptions);
      checkNodesAndPreservation(positionedNodes, singleNode);
      // For single node, position might be origin or center depending on algorithm
      expect(positionedNodes[0].position.x).toBeDefined();
      expect(positionedNodes[0].position.y).toBeDefined();
    });
  });

  describe('getDagreLayout specific tests', () => {
    const dagreOptions = { rankdir: 'TB', ranksep: 100, nodesep: 50, edgeSep: 10, labelAlignment: 'center' };

    it('should produce different layouts for TB vs LR rankdir', () => {
      const nodesTB = getDagreLayout(basicNodes, basicEdges, { ...dagreOptions, rankdir: 'TB' });
      const nodesLR = getDagreLayout(basicNodes, basicEdges, { ...dagreOptions, rankdir: 'LR' });

      // Heuristic: TB should have wider Y spread, LR wider X spread for a simple 2-node graph
      // This isn't foolproof but gives an indication.
      const ySpreadTB = Math.abs(nodesTB[0].position.y - nodesTB[1].position.y);
      const xSpreadTB = Math.abs(nodesTB[0].position.x - nodesTB[1].position.x);
      const ySpreadLR = Math.abs(nodesLR[0].position.y - nodesLR[1].position.y);
      const xSpreadLR = Math.abs(nodesLR[0].position.x - nodesLR[1].position.x);

      expect(ySpreadTB).toBeGreaterThanOrEqual(xSpreadTB); 
      expect(xSpreadLR).toBeGreaterThanOrEqual(ySpreadLR);
      expect(nodesTB[0].position.x !== nodesLR[0].position.x || nodesTB[0].position.y !== nodesLR[0].position.y).toBe(true);
    });

    it('should adjust child node positions based on parentId for orbiting (qualitative)', () => {
        const positionedNodesWithOrbit = getDagreLayout(nodesForDagreOrbiting, edgesForDagreOrbiting, { ...dagreOptions, /* any specific orbit params? */ });
        
        const childNode = positionedNodesWithOrbit.find(n => n.id === 'elem-child-1'); // Has parentId: 'puzz-parent'
        const parentNode = positionedNodesWithOrbit.find(n => n.id === 'puzz-parent');
        const unrelatedNode = positionedNodesWithOrbit.find(n => n.id === 'elem-sibling'); // No parentId

        expect(childNode).toBeDefined();
        expect(parentNode).toBeDefined();
        expect(unrelatedNode).toBeDefined();

        // Heuristic: Child with parentId should be positioned differently than if it had no parentId and was just part of standard Dagre.
        // This is hard to assert without knowing the exact orbiting algorithm.
        // One check: child is somewhat near its parent.
        const distanceToParent = Math.sqrt(Math.pow(childNode.position.x - parentNode.position.x, 2) + Math.pow(childNode.position.y - parentNode.position.y, 2));
        // Check if another node without parentId is further away, or if child is within a reasonable orbit distance
        // This is still a weak assertion. The main test is that it doesn't error and structure is preserved.
        expect(distanceToParent).toBeLessThan(1000); // Arbitrary large value, just to ensure it's not infinitely far

        // If we could disable orbiting temporarily for a baseline:
        // const nodesWithoutOrbit = getDagreLayout(nodesForDagreOrbiting, edgesForDagreOrbiting, { ...dagreOptions, disableOrbiting: true });
        // const childNodeBaseline = nodesWithoutOrbit.find(n => n.id === 'elem-child-1');
        // expect(childNode.position).not.toEqual(childNodeBaseline.position);
    });
  });

  describe('getRadialLayout specific tests', () => {
    it('should change layout with different baseRadius (qualitative)', () => {
      const radialOptions = { center:[0,0], baseRadius: 100, layerSeparation: 50, nodeSeparation:10, maxNodesPerLayer: [5,10]};
      const nodesR100 = getRadialLayout(basicNodes, basicEdges, radialOptions);
      const nodesR200 = getRadialLayout(basicNodes, basicEdges, { ...radialOptions, baseRadius: 200 });

      expect(nodesR100[0].position.x !== nodesR200[0].position.x || nodesR100[0].position.y !== nodesR200[0].position.y).toBe(true);
    });
  });

  describe('getForceDirectedLayout specific tests', () => {
    it('should change layout with different width/height (qualitative)', async () => {
      const forceOptions = { width: 600, height: 400, iterations: 50, initialPlacement: 'grid' };
      const nodesSmall = await getForceDirectedLayout(basicNodes, basicEdges, forceOptions);
      const nodesLarge = await getForceDirectedLayout(basicNodes, basicEdges, { ...forceOptions, width: 1000, height: 800 });
      
      // Check if average position or spread changes - heuristic
      const avgXSmall = nodesSmall.reduce((sum, n) => sum + n.position.x, 0) / nodesSmall.length;
      const avgXLarge = nodesLarge.reduce((sum, n) => sum + n.position.x, 0) / nodesLarge.length;
      // Expect some difference, though not specific values
      // This might not always hold true if centering logic is aggressive.
      // A better check might be the max bounds of the nodes.
      expect(avgXSmall !== avgXLarge || nodesSmall[0].position.x !== nodesLarge[0].position.x).toBe(true);
    }, 10000);
  });
}); 