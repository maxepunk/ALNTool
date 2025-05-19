import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RelationshipMapper } from './RelationshipMapper'; // Adjust path
import { server } from '../../mocks/server'; // MSW server for API mocking
import { rest } from 'msw';

// Mock specific child components to simplify RelationshipMapper tests if they are complex
// or to prevent issues with their own internal state/rendering (e.g., React Flow internals)
jest.mock('@xyflow/react', () => ({
  ...jest.requireActual('@xyflow/react'),
  ReactFlow: jest.fn(({ children, nodes, edges }) => (
    // Simple mock to render nodes and edges count for verification
    // Or just render children if you trust child components are tested elsewhere
    <div data-testid="mock-react-flow">
      <div data-testid="rf-nodes-count">{nodes?.length || 0} Nodes</div>
      <div data-testid="rf-edges-count">{edges?.length || 0} Edges</div>
      {children}
    </div>
  )),
  Background: jest.fn(() => <div data-testid="mock-rf-background" />),
  Controls: jest.fn(() => <div data-testid="mock-rf-controls" />),
  MiniMap: jest.fn(() => <div data-testid="mock-rf-minimap" />),
  useNodesState: jest.fn((initialNodes) => [initialNodes, jest.fn(), jest.fn()]),
  useEdgesState: jest.fn((initialEdges) => [initialEdges, jest.fn(), jest.fn()]),
  useReactFlow: jest.fn(() => ({
    project: jest.fn(xy => xy), // Simple pass-through for project
    fitView: jest.fn(),
    setViewport: jest.fn(),
    getViewport: jest.fn(() => ({ x:0, y:0, zoom:1})),
  })),
}));

// Mock custom child components if needed, e.g., EntityNode, CustomEdge
jest.mock('./EntityNode', () => jest.fn(() => <div data-testid="mock-entity-node" />));
jest.mock('./CustomEdge', () => jest.fn(() => null)); // Edges are often just SVGs, harder to assert content

const mockGraphDataCharacter = {
    center: { id: 'char-123', name: 'Test Character', type: 'Character', tier: 'Core', role: 'Player' },
    nodes: [
        { id: 'char-123', name: 'Test Character', type: 'Character', tier: 'Core', role: 'Player' },
        { id: 'elem-abc', name: 'Test Element', type: 'Element', basicType: 'Prop' }
    ],
    edges: [
        { source: 'char-123', target: 'elem-abc', label: 'Owns', data: { shortLabel: 'Owns', contextualLabel: 'Test Character Owns Test Element' } }
    ]
};

describe('RelationshipMapper', () => {
  beforeEach(() => {
    // Reset any runtime request handlers tests may use.
    server.resetHandlers();
    // Clear all other mocks
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    render(<RelationshipMapper graphData={null} centralEntityId="char-123" centralEntityType="Character" isLoading={true} error={null} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // MUI CircularProgress
  });

  it('should display error state if error is provided', () => {
    render(<RelationshipMapper graphData={null} centralEntityId="char-123" centralEntityType="Character" isLoading={false} error={{ message: 'Failed to load' }} />);
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('should display "No graph data available" when graphData is empty or invalid after loading', () => {
    render(<RelationshipMapper graphData={{ nodes:[], edges:[] }} centralEntityId="char-123" centralEntityType="Character" isLoading={false} error={null} />);
    expect(screen.getByText(/no graph data available/i)).toBeInTheDocument(); 
  });

  it('should render ReactFlow with nodes and edges when valid graphData is provided', async () => {
    render(<RelationshipMapper graphData={mockGraphDataCharacter} centralEntityId="char-123" centralEntityType="Character" isLoading={false} error={null} />);
    
    // Check that the mock ReactFlow component is rendered
    expect(screen.getByTestId('mock-react-flow')).toBeInTheDocument();

    // Check if nodes and edges are passed (using our mock ReactFlow's output)
    // These assertions depend on the mock implementation of ReactFlow
    await waitFor(() => {
        expect(screen.getByTestId('rf-nodes-count')).toHaveTextContent(`${mockGraphDataCharacter.nodes.length} Nodes`);
        expect(screen.getByTestId('rf-edges-count')).toHaveTextContent(`${mockGraphDataCharacter.edges.length} Edges`);
    });
    
    // More specific checks could involve querying for mocked EntityNode instances if the ReactFlow mock passes them through
    // For example, if EntityNode renders something identifiable:
    // expect(screen.getAllByTestId('mock-entity-node').length).toBe(mockGraphDataCharacter.nodes.length);
  });
  
  it('should display layout controls (mocked)', () => {
    render(<RelationshipMapper graphData={mockGraphDataCharacter} centralEntityId="char-123" centralEntityType="Character" isLoading={false} error={null} />);
    expect(screen.getByTestId('mock-rf-controls')).toBeInTheDocument();
    // Further tests could simulate interaction with these controls if they are not deeply mocked
  });

  // TODO: Test layout switching logic if controlled by RelationshipMapper state
  // TODO: Test filter application UI if present within RelationshipMapper
  // TODO: Test interactions with nodes/edges (e.g., onClick leading to navigation if part of this component directly)
  //       This might be better for integration tests of the Detail Page containing the mapper.
}); 