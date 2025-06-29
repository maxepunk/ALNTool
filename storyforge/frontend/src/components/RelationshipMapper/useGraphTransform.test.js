import { renderHook } from '@testing-library/react-hooks'; // For testing hooks
import { useGraphTransform } from './useGraphTransform'; // Adjust path
import {
  MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT, 
  DETAILED_MOCK_CHARACTER_GRAPH_DATA,       
  DETAILED_MOCK_PUZZLE_GRAPH_DATA,          
  MOCK_GRAPH_DATA_NO_PARENT_ASSIGNMENT,
} from './__mocks__/graphData.mock'; // Assume mock data is in a separate file

const mockTransformedElementsOriginal = jest.requireActual('./transformToGraphElements').transformToGraphElements;

const mockTransformToGraphElementsModule = (graphData) => {
    if (!graphData || !graphData.nodes) return { nodes: [], edges: [] };
    // Call the original transformToGraphElements to get the base structure,
    // then ensure parentId is undefined initially for testing its assignment by the hook.
    const originalResult = mockTransformedElementsOriginal(graphData);
    return {
        nodes: originalResult.nodes.map(n => ({ ...n, data: { ...n.data, parentId: undefined } })),
        edges: originalResult.edges,
    };
};

jest.mock('./transformToGraphElements', () => ({
  transformToGraphElements: jest.fn(mockTransformToGraphElementsModule),
}));

const mockFilterGraphElements = jest.fn((nodes, edges, centerNodeId, filterSettings) => ({ 
  filteredNodes: nodes, 
  filteredEdges: edges 
}));
jest.mock('./filterGraph', () => ({
  filterGraphElements: mockFilterGraphElements,
}));

describe('useGraphTransform', () => {
  beforeEach(() => {
    require('./transformToGraphElements').transformToGraphElements.mockClear();
    mockFilterGraphElements.mockClear();
    // Reset to default mock implementation for transformToGraphElements for most tests
    require('./transformToGraphElements').transformToGraphElements.mockImplementation(mockTransformToGraphElementsModule);
  });

  it('should call transformToGraphElements with graphData and then filterGraphElements with its result and settings', () => {
    const mockGraphData = MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT;
    const layout = 'dagre';
    const filterSettings = { activeFilters: { entityTypes: ['Character'] }, spocSettings: { simplify: true }, depth: 2 };
    
    renderHook(() => useGraphTransform(mockGraphData, layout, filterSettings));

    expect(require('./transformToGraphElements').transformToGraphElements).toHaveBeenCalledWith(mockGraphData);
    
    const transformedResult = require('./transformToGraphElements').transformToGraphElements.mock.results[0].value;
    expect(mockFilterGraphElements).toHaveBeenCalledWith(
      transformedResult.nodes,
      transformedResult.edges,
      mockGraphData.center?.id,
      filterSettings
    );
  });

  describe('Parent ID Assignment (Dagre Layout)', () => {
    const layout = 'dagre';
    const baseFilterSettings = { activeFilters: {}, spocSettings: { simplify: false }, depth: 2 }; // Added default depth

    it('assigns parentId for Puzzle -> Element (Requires/Rewards)', () => {
      const { result } = renderHook(() => useGraphTransform(DETAILED_MOCK_PUZZLE_GRAPH_DATA, layout, baseFilterSettings));
      const { nodes } = result.current;
      
      const dataHeistPuzzle = nodes.find(n => n.id === 'puzzle-data-heist');
      const accessCard = nodes.find(n => n.id === 'elem-access-card');
      const decryptionKey = nodes.find(n => n.id === 'elem-decryption-key');
      const extractedData = nodes.find(n => n.id === 'elem-extracted-data');

      expect(dataHeistPuzzle.data.parentId).toBeUndefined();
      expect(accessCard.data.parentId).toBe('puzzle-data-heist');
      expect(decryptionKey.data.parentId).toBe('puzzle-data-heist');
      expect(extractedData.data.parentId).toBe('puzzle-data-heist');
    });

    it('assigns parentId for Puzzle -> Sub-Puzzle (Has Sub-Puzzle)', () => {
      const { result } = renderHook(() => useGraphTransform(DETAILED_MOCK_PUZZLE_GRAPH_DATA, layout, baseFilterSettings));
      const { nodes } = result.current;

      const dataHeistPuzzle = nodes.find(n => n.id === 'puzzle-data-heist');
      const bypassSecurityPuzzle = nodes.find(n => n.id === 'puzzle-bypass-security');
      
      expect(dataHeistPuzzle.data.parentId).toBeUndefined();
      expect(bypassSecurityPuzzle.data.parentId).toBe('puzzle-data-heist');
    });

    it('assigns parentId for Element (Container) -> Element (Contents) (Contains)', () => {
      const { result } = renderHook(() => useGraphTransform(DETAILED_MOCK_CHARACTER_GRAPH_DATA, layout, baseFilterSettings));
      const { nodes } = result.current;

      const backpack = nodes.find(n => n.id === 'elem-backpack'); 
      const laptop = nodes.find(n => n.id === 'elem-laptop');     

      expect(backpack.data.parentId).toBeUndefined();
      expect(laptop.data.parentId).toBe('elem-backpack');
    });

    it('should NOT assign parentId if layout is not Dagre', () => {
      const { result } = renderHook(() => 
        useGraphTransform(DETAILED_MOCK_PUZZLE_GRAPH_DATA, 'radial', baseFilterSettings)
      );
      const { nodes } = result.current;
      nodes.forEach(node => {
        expect(node.data.parentId).toBeUndefined();
      });
    });
  
    it('should not assign parentId if no relevant shortLabels are present for parenting', () => {
      const { result } = renderHook(() => 
        useGraphTransform(MOCK_GRAPH_DATA_NO_PARENT_ASSIGNMENT, layout, baseFilterSettings)
      );
      const { nodes } = result.current;
      nodes.forEach(node => {
        expect(node.data.parentId).toBeUndefined();
      });
    });

    it('should not assign parentId if the identified parent node is not in graphData.nodes', () => {
      const mockDataWithMissingParent = {
        center: { id: 'elem-child-1', type:'Element', name:'Child' },
        nodes: [
          { id: 'elem-child-1', name: 'Child Element 1', type: 'Element' },
        ],
        edges: [
          { source: 'puzz-non-existent-parent', target: 'elem-child-1', label: 'Rewards Element', data: { shortLabel: 'Rewards' } },
        ],
      };
      
      // Specific mock for transformToGraphElements for this test case
      require('./transformToGraphElements').transformToGraphElements.mockImplementationOnce((graphData) => ({
          nodes: graphData.nodes.map(n => ({ id: n.id, data: { ...n, properties: {...n}, parentId: undefined }, position: {x:0,y:0}, width:100, height:50 })),
          edges: graphData.edges.map(e => ({ ...e, data: { ...e.data }, id:`${e.source}-${e.target}-${e.data.shortLabel}`, source:e.source, target:e.target, label:e.data.shortLabel })),
      }));

      const { result } = renderHook(() => useGraphTransform(mockDataWithMissingParent, layout, baseFilterSettings));
      const childNode = result.current.nodes.find(n => n.id === 'elem-child-1');
      expect(childNode.data.parentId).toBeUndefined();
    });
  });

  it('returns the nodes and edges from filterGraphElements', () => {
    const mockGraphData = MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT;
    const layout = 'dagre';
    const filterSettings = { activeFilters: {}, spocSettings: { simplify: false }, depth: 2 };
    
    const distinctFilteredNodes = [{id: 'filtered-node', data: {}, position:{x:0,y:0}, width:100,height:50}];
    const distinctFilteredEdges = [{id: 'filtered-edge', source:'', target:'', data:{}}];
    mockFilterGraphElements.mockReturnValueOnce({ 
      filteredNodes: distinctFilteredNodes, 
      filteredEdges: distinctFilteredEdges 
    });

    const { result } = renderHook(() => useGraphTransform(mockGraphData, layout, filterSettings));
    expect(result.current.nodes).toBe(distinctFilteredNodes);
    expect(result.current.edges).toBe(distinctFilteredEdges);
  });

  // TODO: Add tests for filtering logic if useGraphTransform is responsible for it directly
  //       (PRD mentions filterGraph.js, so useGraphTransform might just orchestrate)
  // TODO: Test SPOC (Single Point of Connection) filtering if applied by this hook
  // TODO: Test different combinations of edge.data.shortLabel that trigger parentId assignment
  //       (e.g., "Container" -> "Contents", different puzzle IO labels if they vary)
  // TODO: Test behavior when parent node is not present in the graphData.nodes (should not assign parentId or handle gracefully)
});

// Helper: Create a mock __mocks__/graphData.mock.js in the same directory
/*
// storyforge/frontend/src/components/RelationshipMapper/__mocks__/graphData.mock.js
export const MOCK_SIMPLE_GRAPH_DATA_FOR_PARENT_ASSIGNMENT = {
  center: { id: 'puzz-parent', name: 'Parent Puzzle', type: 'Puzzle' },
  nodes: [
    { id: 'puzz-parent', name: 'Parent Puzzle', type: 'Puzzle' },
    { id: 'elem-child-1', name: 'Child Element 1 (Reward)', type: 'Element' },
    { id: 'elem-child-2', name: 'Child Element 2 (Required)', type: 'Element' },
    { id: 'elem-grandchild-1', name: 'Grandchild Element 1 (Contents)', type: 'Element' },
    { id: 'char-unrelated', name: 'Unrelated Character', type: 'Character' },
  ],
  edges: [
    { source: 'puzz-parent', target: 'elem-child-1', label: 'Rewards Element', data: { shortLabel: 'Rewards' } },
    { source: 'puzz-parent', target: 'elem-child-2', label: 'Requires Element', data: { shortLabel: 'Requires' } },
    { source: 'elem-child-1', target: 'elem-grandchild-1', label: 'Contains Element', data: { shortLabel: 'Contains' } },
    { source: 'puzz-parent', target: 'char-unrelated', label: 'Associated With', data: { shortLabel: 'Associated' } },
  ],
};

export const MOCK_GRAPH_DATA_NO_PARENT_ASSIGNMENT = {
    center: { id: 'char-center', name: 'Central Character', type: 'Character' },
    nodes: [
        { id: 'char-center', name: 'Central Character', type: 'Character' },
        { id: 'elem-other', name: 'Other Element', type: 'Element' },
    ],
    edges: [
        { source: 'char-center', target: 'elem-other', label: 'Owns', data: { shortLabel: 'Owns' } }, // 'Owns' does not typically create parent-child for Dagre
    ],
};
*/ 