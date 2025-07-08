/**
 * Tests for AdaptiveGraphCanvas component
 * The intelligent graph that responds to entity selection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../../test-utils/test-utils';
import AdaptiveGraphCanvas from '../AdaptiveGraphCanvas';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';
import { setupTestCleanup } from '../../../test-utils/cleanup-utils';

// Setup automatic cleanup
setupTestCleanup();

// Mock ReactFlow
jest.mock('@xyflow/react', () => {
  const React = require('react');
  
  // Track current state for the mock
  let currentNodes = [];
  let currentEdges = [];
  
  return {
    __esModule: true,
    ReactFlow: ({ children, nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onNodeMouseEnter, onNodeMouseLeave, onPaneClick, className }) => {
      // Update current state whenever props change
      currentNodes = nodes || [];
      currentEdges = edges || [];
      
      return React.createElement('div', { 
        'data-testid': 'react-flow',
        className,
        onClick: (e) => {
          if (e.target === e.currentTarget) {
            onPaneClick?.();
          }
        }
      },
        currentNodes.map(node => 
          React.createElement('div', {
            key: node.id,
            'data-testid': `node-${node.id}`,
            className: node.className || '',
            style: node.style || {},
            onClick: () => onNodeClick?.(null, node),
            onMouseEnter: (e) => onNodeMouseEnter?.(e, node),
            onMouseLeave: () => onNodeMouseLeave?.()
          }, node.data?.label || node.data?.name || node.id)
        ),
        currentEdges.map(edge =>
          React.createElement('div', {
            key: edge.id,
            'data-testid': `edge-${edge.id}`,
            className: edge.className || ''
          })
        ),
        children
      );
    },
    ReactFlowProvider: ({ children }) => {
      const React = require('react');
      return React.createElement('div', null, children);
    },
    Controls: () => {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'controls' }, 'Controls');
    },
    Background: () => {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'background' }, 'Background');
    },
    MiniMap: () => {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'minimap' }, 'MiniMap');
    },
    useNodesState: (initialNodes) => {
      const React = require('react');
      const [nodes, setNodes] = React.useState(initialNodes || []);
      const onNodesChange = React.useCallback((changes) => {
        // Simple implementation for testing
        setNodes((nds) => nds);
      }, []);
      return [nodes, setNodes, onNodesChange];
    },
    useEdgesState: (initialEdges) => {
      const React = require('react');
      const [edges, setEdges] = React.useState(initialEdges || []);
      const onEdgesChange = React.useCallback((changes) => {
        // Simple implementation for testing
        setEdges((eds) => eds);
      }, []);
      return [edges, setEdges, onEdgesChange];
    },
    useReactFlow: () => ({
      fitView: jest.fn(),
      getViewport: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      getNodes: jest.fn(() => []),
      getEdges: jest.fn(() => [])
    }),
    useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    useStore: () => ({ x: 0, y: 0, zoom: 1 }) // Mock viewport state
  };
});

describe('AdaptiveGraphCanvas', () => {
  const mockCharacters = [
    { 
      id: 'char-sarah-mitchell', 
      name: 'Sarah Mitchell', 
      type: 'character',
      tier: 'Main',
      ownedElements: ['elem-diary', 'elem-letter']
    },
    { 
      id: 'char-marcus-chen', 
      name: 'Marcus Chen', 
      type: 'character',
      tier: 'Main',
      ownedElements: ['elem-photo']
    },
    { 
      id: 'char-alex-rivera', 
      name: 'Alex Rivera', 
      type: 'character',
      tier: 'Supporting',
      ownedElements: ['elem-key']
    }
  ];

  const mockElements = [
    { 
      id: 'elem-diary', 
      name: 'Sarah\'s Diary', 
      type: 'element',
      owner_character_id: 'char-sarah-mitchell',
      container_element_id: null 
    },
    { 
      id: 'elem-letter', 
      name: 'Love Letter', 
      type: 'element',
      owner_character_id: 'char-sarah-mitchell',
      container_element_id: 'elem-diary' 
    },
    { 
      id: 'elem-photo', 
      name: 'Marcus\'s Photo', 
      type: 'element',
      owner_character_id: 'char-marcus-chen',
      container_element_id: null 
    },
    { 
      id: 'elem-key', 
      name: 'Alex\'s Key', 
      type: 'element',
      owner_character_id: 'char-alex-rivera',
      container_element_id: null 
    }
  ];

  // Helper to build graph data from mock data
  const buildGraphData = (characters = mockCharacters, elements = mockElements, connections = []) => {
    const nodes = [
      ...characters.map((char, index) => ({
        id: char.id,
        type: 'default',
        data: { ...char, label: char.name },
        position: { x: index * 200, y: 100 }
      })),
      ...elements.map((elem, index) => ({
        id: elem.id,
        type: 'default',
        data: { ...elem, label: elem.name },
        position: { x: index * 150, y: 300 }
      }))
    ];
    
    const edges = connections.map((conn, index) => ({
      id: `edge-${index}`,
      source: conn.source,
      target: conn.target,
      type: 'smoothstep',
      label: conn.type
    }));
    
    return { 
      nodes, 
      edges, 
      metadata: { 
        characterConnections: connections // Store character connections for getConnectedEntities
      } 
    };
  };

  beforeEach(() => {
    // Reset store state
    useJourneyIntelligenceStore.setState({
      selectedEntity: null,
      viewMode: 'overview',
      focusMode: 'overview',
      visibleNodeCount: 0
    });
  });

  describe('Focus Mode Behavior', () => {
    it('should show all nodes when no entity is selected', async () => {
      const graphData = buildGraphData();
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={mockElements}
        />
      );
      
      // Should render all characters
      await waitFor(() => {
        expect(screen.getByTestId('node-char-sarah-mitchell')).toBeInTheDocument();
        expect(screen.getByTestId('node-char-marcus-chen')).toBeInTheDocument();
        expect(screen.getByTestId('node-char-alex-rivera')).toBeInTheDocument();
      });
      
      // Should render all elements
      expect(screen.getByTestId('node-elem-diary')).toBeInTheDocument();
      expect(screen.getByTestId('node-elem-letter')).toBeInTheDocument();
      expect(screen.getByTestId('node-elem-photo')).toBeInTheDocument();
      expect(screen.getByTestId('node-elem-key')).toBeInTheDocument();
      
      // No nodes should be hidden or dimmed
      const allNodes = screen.getAllByTestId(/^node-/);
      allNodes.forEach(node => {
        expect(node).not.toHaveClass('background');
        expect(node).not.toHaveStyle({ opacity: '0.2' });
      });
    });

    it('should focus on character and their connected entities when character selected', async () => {
      const user = userEvent.setup();
      const connections = [{ source: 'char-sarah-mitchell', target: 'char-marcus-chen', type: 'knows' }];
      const graphData = buildGraphData(mockCharacters, mockElements, connections);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={mockElements}
        />
      );
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('node-char-sarah-mitchell')).toBeInTheDocument();
      });
      
      // Click on Sarah
      await user.click(screen.getByTestId('node-char-sarah-mitchell'));
      
      // Sarah should be highlighted as selected
      await waitFor(() => {
        const sarahNode = screen.getByTestId('node-char-sarah-mitchell');
        expect(sarahNode).toHaveClass('selected');
      });
      
      // Sarah's elements should be highlighted as connected
      expect(screen.getByTestId('node-elem-diary')).toHaveClass('connected');
      expect(screen.getByTestId('node-elem-letter')).toHaveClass('connected');
      
      // Marcus should be visible as secondary connection (they know each other)
      const marcusNode = screen.getByTestId('node-char-marcus-chen');
      expect(marcusNode).toHaveClass('secondary-connected');
      
      // Unconnected nodes should be in background
      expect(screen.getByTestId('node-char-alex-rivera')).toHaveClass('background');
      expect(screen.getByTestId('node-elem-key')).toHaveClass('background');
    });

    it('should focus on element and its relationships when element selected', async () => {
      const user = userEvent.setup();
      const graphData = buildGraphData();
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={mockElements}
        />
      );
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('node-elem-diary')).toBeInTheDocument();
      });
      
      // Click on Sarah's Diary
      await user.click(screen.getByTestId('node-elem-diary'));
      
      // Diary should be selected
      await waitFor(() => {
        const diaryNode = screen.getByTestId('node-elem-diary');
        expect(diaryNode).toHaveClass('selected');
      });
      
      // Owner (Sarah) should be connected
      expect(screen.getByTestId('node-char-sarah-mitchell')).toHaveClass('connected');
      
      // Contained element (Letter) should be connected
      expect(screen.getByTestId('node-elem-letter')).toHaveClass('connected');
      
      // Unrelated entities should be in background
      expect(screen.getByTestId('node-char-alex-rivera')).toHaveClass('background');
      expect(screen.getByTestId('node-elem-key')).toHaveClass('background');
    });

    it('should return to overview when clicking background', async () => {
      const user = userEvent.setup();
      const graphData = buildGraphData();
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={mockElements}
        />
      );
      
      // Select an entity first
      await user.click(screen.getByTestId('node-char-sarah-mitchell'));
      
      // Verify focus mode is active
      await waitFor(() => {
        expect(screen.getByTestId('node-char-sarah-mitchell')).toHaveClass('selected');
      });
      
      // Click on background (ReactFlow pane)
      const reactFlowPane = screen.getByTestId('react-flow');
      await user.click(reactFlowPane);
      
      // Should return to overview - no selected nodes
      await waitFor(() => {
        const sarahNode = screen.getByTestId('node-char-sarah-mitchell');
        expect(sarahNode).not.toHaveClass('selected');
        expect(sarahNode).not.toHaveClass('background');
      });
    });
  });

  describe('Aggregation Behavior (50-node limit)', () => {
    it('should aggregate nodes when total exceeds 50', async () => {
      // Create many entities to exceed 50-node limit
      const manyCharacters = Array.from({ length: 30 }, (_, i) => ({
        id: `char-${i}`,
        name: `Character ${i}`,
        type: 'character',
        tier: i < 5 ? 'Main' : 'Supporting',
        ownedElements: []
      }));
      
      const manyElements = Array.from({ length: 40 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: 'element',
        owner_character_id: `char-${i % 30}`,
        container_element_id: null
      }));
      
      const graphData = buildGraphData(manyCharacters, manyElements);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={manyElements}
        />
      );
      
      // Should show aggregated nodes instead of all 70
      await waitFor(() => {
        // Should have some regular nodes
        expect(screen.getByTestId('node-char-0')).toBeInTheDocument();
        
        // Should have aggregated nodes
        expect(screen.getByTestId('node-aggregated-characters')).toBeInTheDocument();
        expect(screen.getByText(/25 Characters/)).toBeInTheDocument();
        
        expect(screen.getByTestId('node-aggregated-elements')).toBeInTheDocument();
        expect(screen.getByText(/35 Elements/)).toBeInTheDocument();
      });
      
      // Total visible nodes should be <= 50
      const allNodes = screen.getAllByTestId(/^node-/);
      expect(allNodes.length).toBeLessThanOrEqual(50);
    });

    it('should aggregate nodes by type when character with many connections is selected', async () => {
      const user = userEvent.setup();
      
      // Character with many owned elements
      const superCharacter = {
        id: 'char-super',
        name: 'Super Character',
        type: 'character',
        tier: 'Main',
        ownedElements: Array.from({ length: 60 }, (_, i) => `elem-${i}`)
      };
      
      const manyElements = Array.from({ length: 60 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: i < 20 ? 'Memory Token' : (i < 40 ? 'Prop' : 'Document'),
        owner_character_id: 'char-super',
        container_element_id: null
      }));
      
      const graphData = buildGraphData([superCharacter, ...mockCharacters], manyElements);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={manyElements}
        />
      );
      
      // Click the super character
      await user.click(screen.getByTestId('node-char-super'));
      
      // Should show character as selected
      await waitFor(() => {
        expect(screen.getByTestId('node-char-super')).toHaveClass('selected');
      });
      
      // Should aggregate elements by type
      expect(screen.getByTestId('node-aggregated-memory-tokens')).toBeInTheDocument();
      expect(screen.getByText(/20 Memory Tokens/)).toBeInTheDocument();
      
      expect(screen.getByTestId('node-aggregated-props')).toBeInTheDocument();
      expect(screen.getByText(/20 Props/)).toBeInTheDocument();
      
      expect(screen.getByTestId('node-aggregated-documents')).toBeInTheDocument();
      expect(screen.getByText(/20 Documents/)).toBeInTheDocument();
      
      // Should not show individual element nodes
      expect(screen.queryByTestId('node-elem-0')).not.toBeInTheDocument();
    });

    it('should expand aggregated group when clicked', async () => {
      const user = userEvent.setup();
      
      // Setup aggregation scenario
      const manyElements = Array.from({ length: 20 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: i < 10 ? 'Memory Token' : 'Prop',
        owner_character_id: 'char-sarah-mitchell',
        container_element_id: null
      }));
      
      const graphData = buildGraphData(mockCharacters, manyElements);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={manyElements}
        />
      );
      
      // Select Sarah to see her aggregated elements
      await user.click(screen.getByTestId('node-char-sarah-mitchell'));
      
      // Should see aggregated groups
      await waitFor(() => {
        expect(screen.getByTestId('node-aggregated-memory-tokens')).toBeInTheDocument();
      });
      
      // Click aggregated memory tokens to expand
      await user.click(screen.getByTestId('node-aggregated-memory-tokens'));
      
      // Should now show individual memory tokens
      await waitFor(() => {
        expect(screen.getByTestId('node-elem-0')).toBeInTheDocument();
        expect(screen.getByTestId('node-elem-9')).toBeInTheDocument();
        
        // Props should still be aggregated
        expect(screen.getByTestId('node-aggregated-props')).toBeInTheDocument();
        expect(screen.queryByTestId('node-elem-10')).not.toBeInTheDocument();
      });
    });

    it('should maintain 50-node limit even when expanding aggregated groups', async () => {
      const user = userEvent.setup();
      
      // Create scenario where expanding one group would exceed 50 nodes
      const characters = Array.from({ length: 10 }, (_, i) => ({
        id: `char-${i}`,
        name: `Character ${i}`,
        type: 'character',
        tier: 'Main',
        ownedElements: []
      }));
      
      const elements = Array.from({ length: 60 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: i < 30 ? 'Memory Token' : 'Prop',
        owner_character_id: null,
        container_element_id: null
      }));
      
      const graphData = buildGraphData(characters, elements);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={elements}
        />
      );
      
      // Initially should be aggregated
      await waitFor(() => {
        expect(screen.getByTestId('node-aggregated-memory-tokens')).toBeInTheDocument();
      });
      
      // Click to expand memory tokens
      await user.click(screen.getByTestId('node-aggregated-memory-tokens'));
      
      // Should show some memory tokens but maintain limit
      await waitFor(() => {
        const allNodes = screen.getAllByTestId(/^node-/);
        expect(allNodes.length).toBeLessThanOrEqual(50);
        
        // Should show partial expansion with sub-aggregation
        expect(screen.getByText(/Showing 25 of 30 Memory Tokens/)).toBeInTheDocument();
        expect(screen.getByTestId('node-aggregated-remaining-memory-tokens')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Hierarchy with Aggregation', () => {
    it('should apply correct visual hierarchy with aggregated nodes', async () => {
      const user = userEvent.setup();
      
      // Create scenario with mixed node types
      const elements = Array.from({ length: 60 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: 'element',
        owner_character_id: i < 5 ? 'char-sarah-mitchell' : (i < 10 ? 'char-marcus-chen' : null),
        container_element_id: null
      }));
      
      const connections = [{ source: 'char-sarah-mitchell', target: 'char-marcus-chen', type: 'knows' }];
      const graphData = buildGraphData(mockCharacters, elements, connections);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={elements}
        />
      );
      
      // Select Sarah
      await user.click(screen.getByTestId('node-char-sarah-mitchell'));
      
      await waitFor(() => {
        // Sarah - selected
        expect(screen.getByTestId('node-char-sarah-mitchell')).toHaveClass('selected');
        
        // Marcus - secondary connection (knows Sarah)
        expect(screen.getByTestId('node-char-marcus-chen')).toHaveClass('secondary-connected');
        
        // Sarah's elements - connected (but aggregated)
        expect(screen.getByTestId('node-aggregated-sarah-elements')).toHaveClass('connected');
        
        // Marcus's elements - tertiary (aggregated)
        expect(screen.getByTestId('node-aggregated-marcus-elements')).toHaveClass('tertiary');
        
        // Unowned elements - background (aggregated)
        expect(screen.getByTestId('node-aggregated-unowned-elements')).toHaveClass('background');
      });
    });
  });

  describe('Performance and Transitions', () => {
    it('should transition smoothly when switching between aggregated states', async () => {
      const user = userEvent.setup();
      
      const manyElements = Array.from({ length: 60 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: 'element',
        owner_character_id: 'char-sarah-mitchell',
        container_element_id: null
      }));
      
      const graphData = buildGraphData(mockCharacters, manyElements);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={manyElements}
        />
      );
      
      const reactFlow = screen.getByTestId('react-flow');
      
      // Select character with many elements
      await user.click(screen.getByTestId('node-char-sarah-mitchell'));
      
      // Should add transitioning class
      expect(reactFlow).toHaveClass('transitioning');
      
      // After transition completes
      await waitFor(() => {
        expect(reactFlow).not.toHaveClass('transitioning');
      }, { timeout: 600 });
      
      // Elements should be aggregated
      expect(screen.getByTestId('node-aggregated-sarah-elements')).toBeInTheDocument();
    });

    it('should recalculate aggregation when view changes', async () => {
      const user = userEvent.setup();
      
      const elements = Array.from({ length: 60 }, (_, i) => ({
        id: `elem-${i}`,
        name: `Element ${i}`,
        type: 'element',
        owner_character_id: i < 30 ? 'char-sarah-mitchell' : 'char-marcus-chen',
        container_element_id: null
      }));
      
      const graphData = buildGraphData(mockCharacters, elements);
      
      renderWithQuery(
        <AdaptiveGraphCanvas 
          graphData={graphData}
          elements={elements}
        />
      );
      
      // Initially aggregated
      await waitFor(() => {
        expect(screen.getByTestId('node-aggregated-elements')).toBeInTheDocument();
      });
      
      // Select Sarah
      await user.click(screen.getByTestId('node-char-sarah-mitchell'));
      
      // Should show Sarah's elements aggregated, hide others
      await waitFor(() => {
        expect(screen.getByTestId('node-aggregated-sarah-elements')).toBeInTheDocument();
        expect(screen.queryByTestId('node-aggregated-marcus-elements')).not.toBeInTheDocument();
      });
      
      // Click background to return to overview
      await user.click(screen.getByTestId('react-flow'));
      
      // Should return to initial aggregation
      await waitFor(() => {
        expect(screen.getByTestId('node-aggregated-elements')).toBeInTheDocument();
      });
    });
  });
});

// Clean up QueryClient after all tests
afterAll(() => {
  cleanupQueryClient();
});