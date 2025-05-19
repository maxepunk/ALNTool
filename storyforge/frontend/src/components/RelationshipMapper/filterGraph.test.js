import { filterGraphElements, applySPOCFilter } from './filterGraph'; // Adjust path as necessary
import { 
    MOCK_COMPLEX_GRAPH_DATA, 
    MOCK_SPOC_ELEMENT_HUB_DATA, // Import new mock for Element hub testing
    DETAILED_MOCK_CHARACTER_GRAPH_DATA // For more complex depth/combo tests
} from './__mocks__/graphData.mock'; 

// Helper to create simplified React Flow like nodes/edges for filter testing
const createTestFlowElements = (graphData) => {
    if (!graphData || !graphData.nodes) return { nodes: [], edges: [] };
    // Ensure nodes have a `data.type` for entity type filtering and `data.properties` for completeness
    // Edges should have `data.shortLabel` or `label` for relationship type filtering
    return {
        nodes: graphData.nodes.map(n => ({ 
            id: n.id, 
            data: { 
                ...n, // Spread all original node properties from mock into data for filtering
                type: n.type, // Explicitly ensure type is at data level if filterGraphElements expects it there
                properties: {...n} // And also nested under properties if transformToGraphElements does that
            },
            // React Flow specific props that might be added by transformToGraphElements but not essential for filter logic itself
            position: { x: 0, y: 0 }, 
            width: 150, 
            height: 50,
            type: 'customEntityNode' 
        })),
        edges: graphData.edges.map(e => ({ 
            id: `${e.source}-${e.target}-${e.data.shortLabel || e.label}`,
            source: e.source, 
            target: e.target, 
            label: e.data.shortLabel || e.label, // Used by relationship type filter
            data: { 
                ...e.data, 
                edgeType: (e.data.shortLabel || e.label)?.toLowerCase().replace(/\s+/g, '-') 
            } 
        })),
    };
};

describe('filterGraph', () => {
  describe('applySPOCFilter (Single Point of Connection)', () => {
    const { nodes: initialNodesComplex, edges: initialEdgesComplex } = createTestFlowElements(MOCK_COMPLEX_GRAPH_DATA);
    const centerNodeIdComplex = MOCK_COMPLEX_GRAPH_DATA.center.id; // char-main

    it('should prune a weak direct edge if a strong indirect path exists via a Puzzle hub', () => {
      const { edges: spocEdges } = applySPOCFilter(initialNodesComplex, initialEdgesComplex, centerNodeIdComplex, true);
      const directWeakEdge = spocEdges.find(e => 
        e.source === 'char-main' && e.target === 'elem-needed' && e.label === 'Associated With (Weak)'
      );
      expect(directWeakEdge).toBeUndefined();
      expect(spocEdges.find(e => e.source === 'char-main' && e.target === 'puzzle-hub')).toBeDefined();
      expect(spocEdges.find(e => e.source === 'puzzle-hub' && e.target === 'elem-needed' && e.label === 'Requires')).toBeDefined();
    });

    it('should prune a weak direct edge if a strong indirect path exists via an Element hub (Container)', () => {
      const { nodes: elementHubNodes, edges: elementHubEdges } = createTestFlowElements(MOCK_SPOC_ELEMENT_HUB_DATA);
      const centerNodeIdElementHub = MOCK_SPOC_ELEMENT_HUB_DATA.center.id; // char-player
      
      const { edges: spocEdges } = applySPOCFilter(elementHubNodes, elementHubEdges, centerNodeIdElementHub, true);

      const directWeakEdgeToInsideItem = spocEdges.find(e => 
        e.source === 'char-player' && e.target === 'elem-inside-item' && e.label === 'Knows About (Weak)'
      );
      expect(directWeakEdgeToInsideItem).toBeUndefined(); // This edge should be pruned

      // Ensure the path via the Element hub remains
      expect(spocEdges.find(e => e.source === 'char-player' && e.target === 'elem-container-hub' && e.label === 'Owns Container')).toBeDefined();
      expect(spocEdges.find(e => e.source === 'elem-container-hub' && e.target === 'elem-inside-item' && e.label === 'Contains Item')).toBeDefined();
      // Ensure other unrelated direct edges from center remain
      expect(spocEdges.find(e => e.source === 'char-player' && e.target === 'elem-other-item' && e.label === 'Owns Other')).toBeDefined();
    });

    it('should handle complex indirect hub paths (C -> H1 -> H2 -> N)', () => {
        const centerId = 'C';
        const nodes = [
            {id: 'C', data:{id:'C', type:'Character'}},
            {id: 'H1', data:{id:'H1', type:'Puzzle'}}, // Hub 1
            {id: 'H2', data:{id:'H2', type:'Element', basicType:'Container'}}, // Hub 2
            {id: 'N', data:{id:'N', type:'Element'}}
        ].map(n => ({...n, position:{x:0,y:0},width:10,height:10,type:'customEntityNode', data: {...n.data, properties:{...n.data}}}));
        const edges = [
            {id:'c-h1', source:'C', target:'H1', data:{shortLabel:'Owns'}},         // Strong to Hub1
            {id:'h1-h2', source:'H1', target:'H2', data:{shortLabel:'Rewards'}},    // Strong Hub1 to Hub2
            {id:'h2-n', source:'H2', target:'N', data:{shortLabel:'Contains'}},     // Strong Hub2 to N
            {id:'c-n', source:'C', target:'N', data:{shortLabel:'Associated'}}   // Weak direct C to N
        ].map(e => ({...e, label: e.data.shortLabel, data: {...e.data, edgeType: e.data.shortLabel.toLowerCase()}}));

        const {edges: spocEdges} = applySPOCFilter(nodes, edges, centerId, true);
        expect(spocEdges.find(e => e.id === 'c-n')).toBeUndefined(); // Weak direct edge pruned
        expect(spocEdges.length).toBe(3);
    });

    it('should NOT prune edges if SPOC simplification is disabled', () => {
      const { edges: spocEdges } = applySPOCFilter(initialNodesComplex, initialEdgesComplex, centerNodeIdComplex, false);
      expect(spocEdges.length).toBe(initialEdgesComplex.length);
    });

    it('should preserve essential weak links if no stronger indirect path exists', () => {
        const modifiedEdges = initialEdgesComplex.filter(e => 
            !(e.source === 'char-main' && e.target === 'puzzle-hub') && 
            !(e.source === 'puzzle-hub' && e.target === 'elem-needed')
        );
        const { edges: spocEdges } = applySPOCFilter(initialNodesComplex, modifiedEdges, centerNodeIdComplex, true);
        const directWeakEdge = spocEdges.find(e => 
            e.source === 'char-main' && e.target === 'elem-needed' && e.label === 'Associated With (Weak)'
        );
        expect(directWeakEdge).toBeDefined();
    });
  });

  describe('filterGraphElements (Orchestrator)', () => {
    const { nodes: baseNodes, edges: baseEdges } = createTestFlowElements(DETAILED_MOCK_CHARACTER_GRAPH_DATA);
    const centerNodeId = DETAILED_MOCK_CHARACTER_GRAPH_DATA.center.id; // char-alex-reeves

    it('should apply SPOC filter if spocSettings.simplify is true', () => {
        const filterSettings = {
            activeFilters: { entityTypes: [], relationshipTypes: [] },
            spocSettings: { simplify: true, showSimplifiedRelationships: false },
            depth: 3 
        };
        // MOCK_COMPLEX_GRAPH_DATA is better for direct SPOC check here
        const { nodes: complexNodes, edges: complexEdges } = createTestFlowElements(MOCK_COMPLEX_GRAPH_DATA);
        const complexCenterId = MOCK_COMPLEX_GRAPH_DATA.center.id;
        const { filteredEdges } = filterGraphElements(complexNodes, complexEdges, complexCenterId, filterSettings);
        
        const directWeakEdge = filteredEdges.find(e => 
            e.source === 'char-main' && e.target === 'elem-needed' && e.label === 'Associated With (Weak)'
        );
        expect(directWeakEdge).toBeUndefined();
    });

    it('should apply entity type filters correctly', () => {
        const filterSettings = {
            activeFilters: { entityTypes: ['Character', 'Puzzle'], relationshipTypes: [] },
            spocSettings: { simplify: false },
            depth: 3 
        };
        const { filteredNodes, filteredEdges } = filterGraphElements(baseNodes, baseEdges, centerNodeId, filterSettings);
        
        // From DETAILED_MOCK_CHARACTER_GRAPH_DATA (center: char-alex-reeves):
        // Nodes: char-alex-reeves (Character), elem-backpack (Element), elem-laptop (Element), puzzle-laptop-access (Puzzle), event-interrogation (Timeline)
        // Expected after filter: char-alex-reeves, puzzle-laptop-access
        expect(filteredNodes.map(n => n.id).sort()).toEqual(['char-alex-reeves', 'puzzle-laptop-access'].sort());
        filteredNodes.forEach(node => expect(['Character', 'Puzzle']).toContain(node.data.type));
        
        // Edges should only connect remaining nodes
        filteredEdges.forEach(edge => {
            expect(filteredNodes.find(n => n.id === edge.source)).toBeDefined();
            expect(filteredNodes.find(n => n.id === edge.target)).toBeDefined();
        });
    });

    it('should apply relationship type filters correctly', () => {
        const filterSettings = {
            activeFilters: { entityTypes: [], relationshipTypes: ['Owns', 'Contains'] }, // Case-sensitive match on label/shortLabel
            spocSettings: { simplify: false },
            depth: 3
        };
        const { filteredNodes, filteredEdges } = filterGraphElements(baseNodes, baseEdges, centerNodeId, filterSettings);
        
        // Expected edges from DETAILED_MOCK_CHARACTER_GRAPH_DATA with shortLabel 'Owns' or 'Contains'
        // 1. char-alex-reeves -> elem-backpack (Owns)
        // 2. elem-backpack -> elem-laptop (Contains)
        // (Character -> Puzzle edge has 'Owns' as shortLabel in mock, so it stays)
        expect(filteredEdges.length).toBe(3); 
        filteredEdges.forEach(edge => {
            expect(['Owns', 'Contains']).toContain(edge.label); // edge.label is set to shortLabel by createTestFlowElements
        });
        // Nodes connected by these edges + center node should remain (check specific IDs based on mock and filter)
        const expectedNodeIds = ['char-alex-reeves', 'elem-backpack', 'elem-laptop', 'puzzle-laptop-access'].sort(); // puzzle-laptop-access because char-alex-reeves --Owns--> puzzle-laptop-access
        expect(filteredNodes.map(n=>n.id).sort()).toEqual(expectedNodeIds);
    });

    it('should apply depth filtering correctly', () => {
        // Using DETAILED_MOCK_CHARACTER_GRAPH_DATA (center: char-alex-reeves)
        // Depth 0: char-alex-reeves
        // Depth 1: char-alex-reeves, elem-backpack, puzzle-laptop-access, event-interrogation
        //          Edges: (AR->Backpack), (AR->LaptopPuzzle), (AR->EventInterrogation)
        // Depth 2: All nodes in this mock, as elem-laptop is child of backpack (depth 2 from AR)
        
        let filterSettings = { activeFilters: {}, spocSettings: { simplify: false }, depth: 0 };
        let { filteredNodes: nodesD0, filteredEdges: edgesD0 } = filterGraphElements(baseNodes, baseEdges, centerNodeId, filterSettings);
        expect(nodesD0.map(n => n.id)).toEqual([centerNodeId]);
        expect(edgesD0.length).toBe(0);

        filterSettings = { ...filterSettings, depth: 1 };
        let { filteredNodes: nodesD1, filteredEdges: edgesD1 } = filterGraphElements(baseNodes, baseEdges, centerNodeId, filterSettings);
        const expectedD1Nodes = ['char-alex-reeves', 'elem-backpack', 'puzzle-laptop-access', 'event-interrogation'].sort();
        expect(nodesD1.map(n => n.id).sort()).toEqual(expectedD1Nodes);
        expect(edgesD1.length).toBe(3); // AR->Backpack, AR->LaptopPuzzle, AR->Event

        filterSettings = { ...filterSettings, depth: 2 };
        let { filteredNodes: nodesD2 } = filterGraphElements(baseNodes, baseEdges, centerNodeId, filterSettings);
        expect(nodesD2.length).toBe(baseNodes.length); // All nodes in this mock are within depth 2
    });

    it('should correctly apply a combination of all filters', () => {
        const filterSettings = {
            activeFilters: { 
                entityTypes: ['Character', 'Element'], // Filter out Puzzle, Timeline initially
                relationshipTypes: ['Owns'] // Only 'Owns' relationships
            },
            spocSettings: { simplify: true }, // SPOC is on, but might not have effect after other filters
            depth: 1 // Depth 1 from center
        };
        // MOCK_COMPLEX_GRAPH_DATA (center: char-main)
        // Nodes: char-main (C), puzzle-hub (P), elem-needed (E), elem-reward (E), event-linked (T), char-secondary (C), elem-far (E)
        // Edges: C->P (Owns), P->E_needed (Requires), P->E_reward (Rewards), C->T_linked (Participates), T_linked->C_secondary (Involves), C->E_needed (Associated), C_secondary->E_far (Owns)

        const { nodes: complexNodes, edges: complexEdges } = createTestFlowElements(MOCK_COMPLEX_GRAPH_DATA);
        const complexCenterId = MOCK_COMPLEX_GRAPH_DATA.center.id;

        const { filteredNodes, filteredEdges } = filterGraphElements(complexNodes, complexEdges, complexCenterId, filterSettings);

        // 1. Depth 1 from 'char-main': 
        //    Nodes: char-main, puzzle-hub, event-linked, elem-needed
        //    Edges: C->P (Owns), C->T_linked (Participates), C->E_needed (Associated)
        // 2. Entity Types ['Character', 'Element']:
        //    Nodes: char-main, elem-needed (puzzle-hub, event-linked are filtered out)
        //    Edges: C->E_needed (Associated) - (C->P and C->T are removed as P, T are gone)
        // 3. Relationship Type ['Owns']:
        //    Nodes: char-main (elem-needed might become disconnected if 'Associated' is filtered)
        //    Edges: No 'Owns' edges remain directly from char-main to an Element at depth 1 after other filters.
        //          (C->P(Owns) is gone due to Puzzle type filter. C_sec->E_far(Owns) is at depth > 1 or C_sec filtered)
        // Result should be only char-main if no 'Owns' edge connects to a Character/Element at depth 1.
        // Let's re-evaluate MOCK_COMPLEX_GRAPH_DATA for this combo.
        // C(char-main) -> P(puzzle-hub) [Owns]. puzzle-hub is type Puzzle. Filtered by Entity Type.
        // So, char-main has no 'Owns' edges to a Character or Element within Depth 1.
        
        // Expected: only char-main should remain after all filters in this specific scenario with MOCK_COMPLEX_GRAPH_DATA
        expect(filteredNodes.map(n => n.id)).toEqual([complexCenterId]);
        expect(filteredEdges.length).toBe(0);
    });

    it('should handle empty initial nodes/edges gracefully', () => {
        const filterSettings = { activeFilters: {}, spocSettings: { simplify: false }, depth: 2 };
        const { filteredNodes, filteredEdges } = filterGraphElements([], [], 'some-center', filterSettings);
        expect(filteredNodes.length).toBe(0);
        expect(filteredEdges.length).toBe(0);
    });

    it('should always preserve the centerNodeId if depth >= 0, even if filters would otherwise remove it', () => {
        const filterSettings = {
            activeFilters: { entityTypes: ['Puzzle'], relationshipTypes: [] }, // Filter out Character type
            spocSettings: { simplify: false },
            depth: 1 
        };
        // Center node is 'char-alex-reeves' (Character)
        const { filteredNodes } = filterGraphElements(baseNodes, baseEdges, centerNodeId, filterSettings);
        expect(filteredNodes.find(n => n.id === centerNodeId)).toBeDefined();
    });
  });
}); 