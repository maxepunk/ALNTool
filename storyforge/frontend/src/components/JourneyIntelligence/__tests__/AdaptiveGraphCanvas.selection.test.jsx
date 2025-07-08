/**
 * Test for AdaptiveGraphCanvas entity selection fix
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithQuery } from '../../../test-utils/test-utils';
import AdaptiveGraphCanvas from '../AdaptiveGraphCanvas';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';

// Mock ReactFlow with minimal implementation
jest.mock('@xyflow/react', () => ({
  ReactFlow: ({ onNodeClick, onNodeMouseEnter, onNodeMouseLeave, nodes = [] }) => (
    <div data-testid="react-flow">
      {nodes.map(node => (
        <div
          key={node.id}
          data-testid={`node-${node.id}`}
          onClick={() => onNodeClick?.(null, node)}
          onMouseEnter={(e) => onNodeMouseEnter?.(e, node)}
          onMouseLeave={() => onNodeMouseLeave?.()}
        >
          {node.data?.label || node.id}
        </div>
      ))}
    </div>
  ),
  Controls: () => <div>Controls</div>,
  Background: () => <div>Background</div>,
  MiniMap: () => <div>MiniMap</div>,
  useNodesState: (initial) => [initial || [], jest.fn(), jest.fn()],
  useEdgesState: (initial) => [initial || [], jest.fn(), jest.fn()],
  useReactFlow: () => ({ fitView: jest.fn() }),
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  useStore: () => ({ x: 0, y: 0, zoom: 1 })
}));

// Mock the graph layout hook
jest.mock('../../../hooks/useGraphLayout', () => ({
  __esModule: true,
  default: () => ({ layoutReady: true })
}));

// Mock the graph processing utils
jest.mock('../../../utils/graphProcessingUtils', () => ({
  processNodes: (graphData) => graphData.nodes || [],
  processEdges: (graphData) => graphData.edges || [],
  getNodeColor: () => '#666'
}));

describe('AdaptiveGraphCanvas Entity Selection', () => {
  const mockSelectEntity = jest.fn();
  
  beforeEach(() => {
    // Reset store
    useJourneyIntelligenceStore.setState({
      selectedEntity: null,
      selectEntity: mockSelectEntity,
      viewMode: 'overview',
      activeIntelligence: ['story'],
      updateNodeCount: jest.fn()
    });
    
    jest.clearAllMocks();
  });

  it('should extract clean entity data when node is clicked', () => {
    const graphData = {
      nodes: [{
        id: 'char-1',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {
          id: 'char-1',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Main',
          // Graph-specific fields that should be filtered out
          visualState: { isSelected: false },
          size: 50,
          label: 'Sarah',
          relationshipCount: 5
        }
      }],
      edges: []
    };

    renderWithQuery(
      <AdaptiveGraphCanvas graphData={graphData} elements={[]} />
    );

    // Click the node
    const node = screen.getByTestId('node-char-1');
    fireEvent.click(node);

    // Verify only clean entity data was passed
    expect(mockSelectEntity).toHaveBeenCalledWith({
      id: 'char-1',
      name: 'Sarah Mitchell',
      type: 'character',
      tier: 'Main'
    });
    
    // Verify graph-specific fields were not included
    const passedData = mockSelectEntity.mock.calls[0][0];
    expect(passedData).not.toHaveProperty('visualState');
    expect(passedData).not.toHaveProperty('size');
    expect(passedData).not.toHaveProperty('label');
    expect(passedData).not.toHaveProperty('relationshipCount');
  });

  it('should handle nodes with entity nested in data', () => {
    const graphData = {
      nodes: [{
        id: 'elem-1',
        type: 'element',
        position: { x: 0, y: 0 },
        data: {
          entity: {
            id: 'elem-1',
            name: 'Important Letter',
            type: 'element',
            status: 'Active'
          },
          visualState: { isSelected: false }
        }
      }],
      edges: []
    };

    renderWithQuery(
      <AdaptiveGraphCanvas graphData={graphData} elements={[]} />
    );

    const node = screen.getByTestId('node-elem-1');
    fireEvent.click(node);

    expect(mockSelectEntity).toHaveBeenCalledWith({
      id: 'elem-1',
      name: 'Important Letter',
      type: 'element',
      status: 'Active'
    });
  });

  it('should not call selectEntity with invalid entity data', () => {
    const graphData = {
      nodes: [{
        id: 'invalid-1',
        type: 'unknown',
        position: { x: 0, y: 0 },
        data: {
          // Missing required fields
          visualState: { isSelected: false },
          size: 50
        }
      }],
      edges: []
    };

    renderWithQuery(
      <AdaptiveGraphCanvas graphData={graphData} elements={[]} />
    );

    const node = screen.getByTestId('node-invalid-1');
    fireEvent.click(node);

    expect(mockSelectEntity).not.toHaveBeenCalled();
  });

  it('should show tooltip on hover', () => {
    const graphData = {
      nodes: [{
        id: 'char-1',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {
          id: 'char-1',
          name: 'Sarah Mitchell',
          type: 'character'
        }
      }],
      edges: []
    };

    renderWithQuery(
      <AdaptiveGraphCanvas graphData={graphData} elements={[]} />
    );

    const node = screen.getByTestId('node-char-1');
    
    // Hover over node
    fireEvent.mouseEnter(node);

    // Check tooltip appears with correct content
    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
    expect(screen.getByText('character')).toBeInTheDocument();

    // Mouse leave should hide tooltip
    fireEvent.mouseLeave(node);
    expect(screen.queryByText('Sarah Mitchell')).not.toBeInTheDocument();
  });
});