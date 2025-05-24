import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClusterHull from './ClusterHull';
import { ReactFlowProvider } from '@xyflow/react';

const mockParentNode = {
  id: 'parent-node', 
  width: 100, 
  height: 50, 
  positionAbsolute: { x: 10, y: 10 }, 
  data: { 
    isClusterParent: true, 
    // other properties EntityNode might expect if ClusterHull passes them
    id: 'parent-node',
    name: 'Parent Node',
    type: 'Puzzle' // Example type
  }
};

const mockNodes = [
  mockParentNode,
  { id: 'child-node-1', width: 80, height: 40, positionAbsolute: { x: 20, y: 70 }, data: { parentId: 'parent-node', id: 'child-node-1', name: 'Child 1', type: 'Element' } },
  { id: 'child-node-2', width: 80, height: 40, positionAbsolute: { x: 120, y: 70 }, data: { parentId: 'parent-node', id: 'child-node-2', name: 'Child 2', type: 'Element' } },
  { id: 'unrelated-node', width: 80, height: 40, positionAbsolute: { x: 200, y: 10 }, data: { id: 'unrelated-node', name: 'Unrelated', type: 'Character' } }
];

const mockHubNodeId = 'parent-node';

const renderInSvgWithProvider = (ui) => {
  return render(
    <ReactFlowProvider>
      <svg data-testid="svg-wrapper">
        {ui}
      </svg>
    </ReactFlowProvider>
  );
};

describe('ClusterHull Component', () => {
  it('renders a hull path when valid hub and child nodes are provided', () => {
    renderInSvgWithProvider(
      <ClusterHull hubNodeId={mockHubNodeId} nodes={mockNodes} padding={10} />
    );
    // ClusterHull should render a <path> with a specific data-testid
    const hullPath = screen.getByTestId(`cluster-hull-path-${mockHubNodeId}`);
    expect(hullPath).toBeInTheDocument();
    expect(hullPath.tagName.toLowerCase()).toBe('path');
    expect(hullPath).toHaveAttribute('d'); // Check that it has a path definition
    expect(hullPath.getAttribute('d')).not.toBe('');
  });

  it('does not render if hubNodeId is not found in nodes', () => {
    renderInSvgWithProvider(
      <ClusterHull hubNodeId="non-existent-hub" nodes={mockNodes} padding={10} />
    );
    expect(screen.queryByTestId(/^cluster-hull-path-/)).toBeNull();
  });

  it('does not render if there are no child nodes for the hub', () => {
    const nodesWithNoChildrenForHub = [
      mockParentNode,
      { id: 'other-node', width: 80, height: 40, positionAbsolute: { x: 20, y: 70 }, data: { parentId: 'another-parent', id:'other-node' } },
    ];
    renderInSvgWithProvider(
      <ClusterHull hubNodeId={mockHubNodeId} nodes={nodesWithNoChildrenForHub} padding={10} />
    );
    expect(screen.queryByTestId(/^cluster-hull-path-/)).toBeNull();
  });

  it('applies default styling and can accept a custom className', () => {
    renderInSvgWithProvider(
      <ClusterHull hubNodeId={mockHubNodeId} nodes={mockNodes} padding={10} className="my-custom-hull-class" />
    );
    const hullPath = screen.getByTestId(`cluster-hull-path-${mockHubNodeId}`);
    expect(hullPath).toHaveClass('cluster-hull'); // Assuming a default class
    expect(hullPath).toHaveClass('my-custom-hull-class');
  });

  it('accepts different padding values without crashing and potentially affects path', () => {
    const { rerender } = renderInSvgWithProvider(
      <ClusterHull hubNodeId={mockHubNodeId} nodes={mockNodes} padding={10} />
    );
    const hullPath10 = screen.getByTestId(`cluster-hull-path-${mockHubNodeId}`);
    const d10 = hullPath10.getAttribute('d');

    rerender(
      <ReactFlowProvider>
        <svg data-testid="svg-wrapper">
          <ClusterHull hubNodeId={mockHubNodeId} nodes={mockNodes} padding={20} />
        </svg>
      </ReactFlowProvider>
    );
    const hullPath20 = screen.getByTestId(`cluster-hull-path-${mockHubNodeId}`);
    const d20 = hullPath20.getAttribute('d');

    expect(hullPath20).toBeInTheDocument();
    // The path definition 'd' should ideally change if padding affects the hull calculation.
    // This is a heuristic check, as exact 'd' is complex.
    if (d10 && d20) {
        expect(d10).not.toBe(d20);
    } else {
        // Failsafe if getAttribute returns null, though it shouldn't for 'd' if path is rendered
        expect(d10).toBeDefined();
        expect(d20).toBeDefined();
    }
  });

  it('renders correctly even if hub node has no explicit isClusterParent flag but has children', () => {
    // Test if hull forms based on parentId linkage alone, even if hub isn't explicitly marked.
    // This depends on ClusterHull's internal logic for identifying the hub and its children.
    const hubWithoutFlag = {
        ...mockParentNode,
        data: { ...mockParentNode.data, isClusterParent: undefined }
    };
    const nodesWithImplicitHub = [
        hubWithoutFlag,
        mockNodes[1], // child-node-1
        mockNodes[2], // child-node-2
    ];
    renderInSvgWithProvider(
        <ClusterHull hubNodeId={mockHubNodeId} nodes={nodesWithImplicitHub} padding={10} />
    );
    // Hull should still render if children point to this hubNodeId
    expect(screen.getByTestId(`cluster-hull-path-${mockHubNodeId}`)).toBeInTheDocument();
  });

}); 