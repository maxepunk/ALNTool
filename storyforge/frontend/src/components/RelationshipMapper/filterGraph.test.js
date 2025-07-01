import filterGraph from './filterGraph'; // Corrected import
// Mock data will need to be adjusted or new mocks created for the new filter properties
// For now, let's define some simple mock data structures here.

const createMockNode = (id, type, properties = {}, isCenter = false) => ({
  id,
  data: {
    id,
    type, // e.g., 'Character', 'Element'
    isCenter,
    properties: { // This is where actFocus, themes, memorySets will reside
      name: `Node ${id}`,
      ...properties,
    },
  },
  // other reactflow props if needed by filterGraph (like position, width, height are not used by filter logic)
});

const createMockEdge = (id, source, target, type = 'default', shortLabel = '') => ({
  id,
  source,
  target,
  data: { type, shortLabel }, // type here is edgeCategory like 'dependency', 'containment'
});


describe('filterGraph', () => {
  // Commenting out SPOC tests as SPOC logic is disabled in filterGraph.js
  /*
  describe('applySPOCFilter (Single Point of Connection)', () => {
    // ... SPOC tests would go here if re-enabled ...
  });
  */

  describe('filterGraph (Main Logic with New Filters)', () => {
    const centerNodeId = 'center';
    const nodes = [
      createMockNode(centerNodeId, 'Character', { actFocus: 'Act 1', themes: ['ThemeA'], memorySets: ['SetX'] }, true),
      createMockNode('nodeA1', 'Element', { actFocus: 'Act 1', themes: ['ThemeA', 'ThemeB'], memorySets: ['SetX'] }),
      createMockNode('nodeA2', 'Puzzle', { actFocus: 'Act 2', themes: ['ThemeB'], memorySets: [] }),
      createMockNode('nodeA3', 'Character', { actFocus: 'Act 1', themes: ['ThemeC'], memorySets: ['SetY'] }),
      createMockNode('nodeB1', 'Element', { actFocus: 'Act 1', themes: ['ThemeA'], memorySets: ['SetX', 'SetY'] }),
      createMockNode('nodeB2', 'Timeline', { actFocus: 'Act 2', themes: ['ThemeA', 'ThemeC'] }), // No memorySets property
      createMockNode('nodeC1', 'Element', { themes: ['ThemeB'] }), // No actFocus, no memorySets
      createMockNode('nodeC2', 'Puzzle', { actFocus: 'Act 3' }), // No themes, no memorySets
    ];
    const edges = [
      createMockEdge('e1', centerNodeId, 'nodeA1'),
      createMockEdge('e2', centerNodeId, 'nodeA2'),
      createMockEdge('e3', 'nodeA1', 'nodeA3'),
      createMockEdge('e4', 'nodeA2', 'nodeB2'),
      createMockEdge('e5', centerNodeId, 'nodeB1'), // Connect nodeB1 to center for reachability
      createMockEdge('e6', 'nodeB1', 'nodeC1'),   // nodeB1 connects to nodeC1
      createMockEdge('e7', centerNodeId, 'nodeC2'),
    ];

    it('should return all nodes and edges if no filters are active (besides default depth)', () => {
      const options = { centerNodeId, depth: 3 }; // High enough depth to include all test nodes
      const { nodes: filteredNodes, edges: filteredEdges } = filterGraph(nodes, edges, options);
      // Depth filter might still remove some if not connected, adjust expectation or mock data for full connectivity
      // For this simple flat mock, assuming depth 3 includes all.
      expect(filteredNodes.length).toBe(nodes.length);
      expect(filteredEdges.length).toBe(edges.length);
    });

    // Act Focus Filter Tests
    describe('Act Focus Filtering', () => {
      it('should filter by "Act 1"', () => {
        const options = { centerNodeId, depth: 3, actFocusFilter: 'Act 1' };
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        const expectedNodeIds = [centerNodeId, 'nodeA1', 'nodeA3', 'nodeB1'];
        expect(filteredNodes.map(n => n.id).sort()).toEqual(expectedNodeIds.sort());
        filteredNodes.forEach(n => {
          if (n.id !== centerNodeId) {
            expect(n.data.properties.actFocus).toBe('Act 1');
          }
        });
      });
      it('should return only center node if no other nodes match Act Focus', () => {
        const options = { centerNodeId, depth: 3, actFocusFilter: 'Act NonExistent' };
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        expect(filteredNodes.length).toBe(1);
        expect(filteredNodes[0].id).toBe(centerNodeId);
      });
    });

    // Theme Filter Tests
    describe('Theme Filtering', () => {
      it('should filter by a single theme "ThemeA"', () => {
        const options = { centerNodeId, depth: 3, themeFilters: { 'ThemeA': true } };
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        const expectedNodeIds = [centerNodeId, 'nodeA1', 'nodeB1', 'nodeB2'];
        expect(filteredNodes.map(n => n.id).sort()).toEqual(expectedNodeIds.sort());
        filteredNodes.forEach(n => {
          if (n.id !== centerNodeId) {
            expect(n.data.properties.themes).toContain('ThemeA');
          }
        });
      });
      it('should filter by multiple themes ("ThemeB" OR "ThemeC")', () => {
        const options = { centerNodeId, depth: 3, themeFilters: { 'ThemeB': true, 'ThemeC': true } };
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        // center (ThemeA), nodeA1 (A,B), nodeA2 (B), nodeA3 (C), nodeB2 (A,C), nodeC1 (B)
        const expectedNodeIds = [centerNodeId, 'nodeA1', 'nodeA2', 'nodeA3', 'nodeB2', 'nodeC1'];
        expect(filteredNodes.map(n => n.id).sort()).toEqual(expectedNodeIds.sort());
      });
      it('should return only center node if no nodes match active themes', () => {
        const options = { centerNodeId, depth: 3, themeFilters: { 'ThemeNonExistent': true } };
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        expect(filteredNodes.length).toBe(1);
        expect(filteredNodes[0].id).toBe(centerNodeId);
      });
       it('should not filter if themeFilters is empty or all false', () => {
        const optionsEmpty = { centerNodeId, depth: 3, themeFilters: {} };
        const { nodes: fnodesEmpty } = filterGraph(nodes, edges, optionsEmpty);
        expect(fnodesEmpty.length).toEqual(nodes.length);
        
        const optionsAllFalse = { centerNodeId, depth: 3, themeFilters: {'ThemeA': false, 'ThemeB': false} };
        const { nodes: fnodesAllFalse } = filterGraph(nodes, edges, optionsAllFalse);
        expect(fnodesAllFalse.length).toEqual(nodes.length); // Current logic: if no theme is true, no theme filter applies
      });
    });

    // Memory Set Filter Tests
    describe('Memory Set Filtering', () => {
      it('should filter by memory set "SetX"', () => {
        const options = { centerNodeId, depth: 3, memorySetFilter: 'SetX' };
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        const expectedNodeIds = [centerNodeId, 'nodeA1', 'nodeB1'];
        expect(filteredNodes.map(n => n.id).sort()).toEqual(expectedNodeIds.sort());
        filteredNodes.forEach(n => {
          if (n.id !== centerNodeId) {
            expect(n.data.properties.memorySets).toContain('SetX');
          }
        });
      });
      it('should filter by memory set "SetY"', () => {
        const options = { centerNodeId, depth: 3, memorySetFilter: 'SetY' };
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        const expectedNodeIds = [centerNodeId, 'nodeA3', 'nodeB1']; // center has SetX, nodeB1 has SetX and SetY
        expect(filteredNodes.map(n => n.id).sort()).toEqual(expectedNodeIds.sort());
      });
    });

    // Combined Filters Test
    it('should correctly apply combination of Act Focus, Theme, and Memory Set filters', () => {
      const options = {
        centerNodeId,
        depth: 3,
        actFocusFilter: 'Act 1',
        themeFilters: { 'ThemeA': true },
        memorySetFilter: 'SetX'
      };
      // Expected: centerNodeId (Act 1, ThemeA, SetX)
      // nodeA1 (Act 1, ThemeA/B, SetX) -> kept
      // nodeA3 (Act 1, ThemeC, SetY) -> no ThemeA or SetX
      // nodeB1 (Act 1, ThemeA, SetX/Y) -> kept
      const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
      const expectedNodeIds = [centerNodeId, 'nodeA1', 'nodeB1'];
      expect(filteredNodes.map(n => n.id).sort()).toEqual(expectedNodeIds.sort());
    });

    // Test edge filtering based on node filtering
    it('should filter edges when nodes are removed', () => {
      const options = { centerNodeId, depth: 3, actFocusFilter: 'Act 3' }; // Keeps centerNodeId, nodeC2
      const { nodes: filteredNodes, edges: filteredEdges } = filterGraph(nodes, edges, options);
      expect(filteredNodes.map(n=>n.id).sort()).toEqual([centerNodeId, 'nodeC2'].sort());
      // Only edge e7 (center -> nodeC2) should remain
      expect(filteredEdges.length).toBe(1);
      expect(filteredEdges[0].id).toBe('e7');
    });

    // Test existing Node Type and Edge Type filters in conjunction with new filters
    it('should correctly apply new filters WITH existing Node Type filters', () => {
        const options = {
            centerNodeId,
            depth: 3,
            actFocusFilter: 'Act 1', // Center, nodeA1, nodeA3, nodeB1
            nodeFilters: { 'Element': true } // Keep only Elements + Center (Character)
        };
        // After Act Focus: center, nodeA1(E), nodeA3(C), nodeB1(E)
        // After Node Type: center, nodeA1(E), nodeB1(E)
        const { nodes: filteredNodes } = filterGraph(nodes, edges, options);
        const expectedNodeIds = [centerNodeId, 'nodeA1', 'nodeB1'];
        expect(filteredNodes.map(n => n.id).sort()).toEqual(expectedNodeIds.sort());
        filteredNodes.forEach(n => {
            if(n.id !== centerNodeId) expect(n.data.type).toBe('Element');
        });
    });

  });
});