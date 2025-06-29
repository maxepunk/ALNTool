import '@testing-library/jest-dom';
import { MarkerType } from '@xyflow/react';

// Minimal mock for theme palette colors used in edges
const mockTheme = {
  palette: {
    error: { main: 'red', light: 'lightred' },
    success: { main: 'green', light: 'lightgreen' },
    info: { main: 'blue', light: 'lightblue' },
  },
};

// Replicated/adapted transformation logic from PuzzleFlowPage.jsx
const transformPuzzleFlowDataForGraph = (flowData, theme) => {
  if (!flowData || !flowData.centralPuzzle) return { nodes: [], edges: [] };

  const newNodes = [];
  const newEdges = [];
  const centralPuzzleId = flowData.centralPuzzle.id;
  const centralPuzzleName = flowData.centralPuzzle.name;

  newNodes.push({
    id: centralPuzzleId,
    type: 'flowNode', // As defined in PuzzleFlowPage
    data: { label: centralPuzzleName, flowNodeType: 'centralPuzzle', entityId: centralPuzzleId, entityType: 'Puzzle' },
    position: { x: 0, y: 0 },
  });

  (flowData.inputElements || []).forEach(el => {
    newNodes.push({
      id: el.id,
      type: 'flowNode',
      data: { label: el.name, subLabel: `(${el.basicType || 'Element'})`, flowNodeType: 'inputElement', entityId: el.id, entityType: 'Element' },
      position: { x: 0, y: 0 },
    });
    newEdges.push({
      id: `input-${el.id}-to-${centralPuzzleId}`,
      source: el.id,
      target: centralPuzzleId,
      type: 'custom',
      label: 'requires',
      data: { type: 'dependency', shortLabel: 'requires', contextualLabel: `${el.name} requires ${centralPuzzleName}` },
      markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.error.main },
      style: { stroke: theme.palette.error.light, strokeWidth: 1.5 },
    });
  });

  (flowData.outputElements || []).forEach(el => {
    newNodes.push({
      id: el.id,
      type: 'flowNode',
      data: { label: el.name, subLabel: `(${el.basicType || 'Element'})`, flowNodeType: 'outputElement', entityId: el.id, entityType: 'Element' },
      position: { x: 0, y: 0 },
    });
    newEdges.push({
      id: `reward-${centralPuzzleId}-to-${el.id}`,
      source: centralPuzzleId,
      target: el.id,
      type: 'custom',
      label: 'rewards',
      data: { type: 'default', shortLabel: 'rewards', contextualLabel: `${centralPuzzleName} rewards ${el.name}` },
      markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.success.main },
      style: { stroke: theme.palette.success.light, strokeWidth: 1.5 },
    });
  });

  (flowData.prerequisitePuzzles || []).forEach(p => {
    newNodes.push({
      id: p.id,
      type: 'flowNode',
      data: { label: p.name, subLabel: '(Prerequisite)', flowNodeType: 'linkedPuzzle', entityId: p.id, entityType: 'Puzzle' },
      position: { x: 0, y: 0 },
    });
    newEdges.push({
      id: `prereq-${p.id}-to-${centralPuzzleId}`,
      source: p.id,
      target: centralPuzzleId,
      type: 'custom',
      label: 'unlocks',
      data: { type: 'default', shortLabel: 'unlocks', contextualLabel: `${p.name} unlocks ${centralPuzzleName}` },
      markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.info.main },
      style: { stroke: theme.palette.info.light, strokeDasharray: '5,5', strokeWidth: 1.5 },
    });
  });

  (flowData.unlocksPuzzles || []).forEach(p => {
    newNodes.push({
      id: p.id,
      type: 'flowNode',
      data: { label: p.name, subLabel: '(Unlocks)', flowNodeType: 'linkedPuzzle', entityId: p.id, entityType: 'Puzzle' },
      position: { x: 0, y: 0 },
    });
    newEdges.push({
      id: `unlocks-${centralPuzzleId}-to-${p.id}`,
      source: centralPuzzleId,
      target: p.id,
      type: 'custom',
      label: 'unlocks',
      data: { type: 'default', shortLabel: 'unlocks', contextualLabel: `${centralPuzzleName} unlocks ${p.name}` },
      markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.info.main },
      style: { stroke: theme.palette.info.light, strokeDasharray: '5,5', strokeWidth: 1.5 },
    });
  });

  const uniqueNodes = Array.from(new Map(newNodes.map(node => [node.id, node])).values());
  return { nodes: uniqueNodes, edges: newEdges };
};


describe('PuzzleFlowPage Data Transformation', () => {
  const mockFlowDataBasic = {
    centralPuzzle: { id: 'pz-center', name: 'Central Puzzle', properties: {} },
    inputElements: [{ id: 'el-in', name: 'Input Element', type: 'Element', basicType: 'Key Item' }],
    outputElements: [{ id: 'el-out', name: 'Output Element', type: 'Element', basicType: 'Reward' }],
    prerequisitePuzzles: [{ id: 'pz-prereq', name: 'Prereq Puzzle', type: 'Puzzle' }],
    unlocksPuzzles: [{ id: 'pz-unlocks', name: 'Unlocks Puzzle', type: 'Puzzle' }],
  };

  it('should create correct nodes and edges for a basic flow', () => {
    const { nodes, edges } = transformPuzzleFlowDataForGraph(mockFlowDataBasic, mockTheme);

    expect(nodes.length).toBe(5); // Center + 1 of each type
    expect(edges.length).toBe(4);

    // Central Puzzle Node
    expect(nodes.find(n => n.id === 'pz-center').data.flowNodeType).toBe('centralPuzzle');
    // Input Element Node & Edge
    expect(nodes.find(n => n.id === 'el-in').data.flowNodeType).toBe('inputElement');
    expect(edges.find(e => e.id === 'input-el-in-to-pz-center')).toEqual(expect.objectContaining({
      source: 'el-in', target: 'pz-center', label: 'requires'
    }));
    // Output Element Node & Edge
    expect(nodes.find(n => n.id === 'el-out').data.flowNodeType).toBe('outputElement');
    expect(edges.find(e => e.id === 'reward-pz-center-to-el-out')).toEqual(expect.objectContaining({
      source: 'pz-center', target: 'el-out', label: 'rewards'
    }));
    // Prerequisite Puzzle Node & Edge
    expect(nodes.find(n => n.id === 'pz-prereq').data.flowNodeType).toBe('linkedPuzzle');
    expect(nodes.find(n => n.id === 'pz-prereq').data.subLabel).toBe('(Prerequisite)');
    expect(edges.find(e => e.id === 'prereq-pz-prereq-to-pz-center')).toEqual(expect.objectContaining({
      source: 'pz-prereq', target: 'pz-center', label: 'unlocks'
    }));
    // Unlocks Puzzle Node & Edge
    expect(nodes.find(n => n.id === 'pz-unlocks').data.flowNodeType).toBe('linkedPuzzle');
    expect(nodes.find(n => n.id === 'pz-unlocks').data.subLabel).toBe('(Unlocks)');
    expect(edges.find(e => e.id === 'unlocks-pz-center-to-pz-unlocks')).toEqual(expect.objectContaining({
      source: 'pz-center', target: 'pz-unlocks', label: 'unlocks'
    }));
  });

  it('should handle empty arrays for connections', () => {
    const mockEmptyFlow = {
      centralPuzzle: { id: 'pz-solo', name: 'Solo Puzzle', properties: {} },
      inputElements: [],
      outputElements: [],
      prerequisitePuzzles: [],
      unlocksPuzzles: [],
    };
    const { nodes, edges } = transformPuzzleFlowDataForGraph(mockEmptyFlow, mockTheme);
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('pz-solo');
    expect(edges.length).toBe(0);
  });

  it('should handle null or undefined connection arrays', () => {
    const mockNullFlow = {
      centralPuzzle: { id: 'pz-nulls', name: 'Nulls Puzzle', properties: {} },
      inputElements: null,
      outputElements: undefined,
      // prerequisitePuzzles and unlocksPuzzles will default to [] if not provided by API due to || []
    };
     const { nodes, edges } = transformPuzzleFlowDataForGraph(mockNullFlow, mockTheme);
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('pz-nulls');
    expect(edges.length).toBe(0);
  });

  it('should correctly set data properties for nodes and edges', () => {
    const { nodes, edges } = transformPuzzleFlowDataForGraph(mockFlowDataBasic, mockTheme);
    const inputEdge = edges.find(e => e.label === 'requires');
    expect(inputEdge.data.type).toBe('dependency');
    expect(inputEdge.data.shortLabel).toBe('requires');
    expect(inputEdge.markerEnd.type).toBe(MarkerType.ArrowClosed);
    expect(inputEdge.style.stroke).toBe(mockTheme.palette.error.light);

    const centralNode = nodes.find(n=>n.id === 'pz-center');
    expect(centralNode.data.entityType).toBe('Puzzle');
    expect(centralNode.data.entityId).toBe('pz-center');
  });
});
