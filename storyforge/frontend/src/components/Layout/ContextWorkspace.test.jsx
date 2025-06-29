import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContextWorkspace from './ContextWorkspace';
import useJourneyStore from '../../stores/journeyStore';

// Mock the useJourneyStore hook
jest.mock('../../stores/journeyStore');

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ContextWorkspace', () => {
  let mockSelectedNode;

  // Helper to setup mock implementations
  const setupMockStore = () => {
    useJourneyStore.mockImplementation(selector => {
      const mockState = {
        selectedNode: mockSelectedNode,
      };
      return selector(mockState);
    });
  };

  beforeEach(() => {
    // Reset mocks for each test
    mockSelectedNode = null;
    mockNavigate.mockClear();
    setupMockStore(); // Apply default mocks
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays "Select a node..." when selectedNode is null', () => {
    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    expect(screen.getByText(/Select a node in the journey graph to see its details./i)).toBeInTheDocument();
  });

  test('displays activity node details when selected', () => {
    mockSelectedNode = {
      id: 'puzzle-123',
      type: 'activityNode',
      data: {
        label: 'Locked Safe Puzzle',
        timing: 'Act 1',
        prerequisiteIds: ['elem-1', 'elem-2'],
        rewardIds: ['elem-3'],
        difficulty: 'Medium'
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Locked Safe Puzzle')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument(); // Chip label
    expect(screen.getByText(/Timing:/)).toBeInTheDocument();
    expect(screen.getByText('Act 1')).toBeInTheDocument();
    expect(screen.getByText(/Prerequisites:/)).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText(/Rewards:/)).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();
    expect(screen.getByText(/Difficulty:/)).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  test('displays discovery node details when selected', () => {
    mockSelectedNode = {
      id: 'element-456',
      type: 'discoveryNode',
      data: {
        label: 'CEO Badge',
        type: 'Evidence',
        memoryType: 'Business',
        memoryValue: 5,
        owner: 'Marcus Blackwood',
        container: 'Briefcase'
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    expect(screen.getByText('CEO Badge')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument(); // Chip label
    expect(screen.getByText(/Element Type:/)).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText(/Memory Type:/)).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText(/Memory Value:/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/Owner:/)).toBeInTheDocument();
    expect(screen.getByText('Marcus Blackwood')).toBeInTheDocument();
    expect(screen.getByText(/Container:/)).toBeInTheDocument();
    expect(screen.getByText('Briefcase')).toBeInTheDocument();
  });

  test('displays lore node details when selected', () => {
    mockSelectedNode = {
      id: 'event-789',
      type: 'loreNode',
      data: {
        label: 'Marcus and Sarah Wedding',
        date: '2020-06-15',
        actFocus: 'Act 2',
        characterCount: 5,
        description: 'A lavish wedding ceremony attended by all major characters'
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Marcus and Sarah Wedding')).toBeInTheDocument();
    expect(screen.getByText('Lore')).toBeInTheDocument(); // Chip label
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText('2020-06-15')).toBeInTheDocument();
    expect(screen.getByText(/Act Focus:/)).toBeInTheDocument();
    expect(screen.getByText('Act 2')).toBeInTheDocument();
    expect(screen.getByText(/Characters Involved:/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/Description:/)).toBeInTheDocument();
    expect(screen.getByText(/A lavish wedding ceremony/)).toBeInTheDocument();
  });

  test('displays node connections when present', () => {
    mockSelectedNode = {
      id: 'puzzle-123',
      type: 'activityNode',
      data: {
        label: 'Test Puzzle',
        incomingEdges: [
          { source: 'elem-1', sourceLabel: 'UV Light', label: 'requires' },
          { source: 'elem-2', sourceLabel: 'Key Card', label: 'requires' }
        ],
        outgoingEdges: [
          { target: 'elem-3', targetLabel: 'Secret Document', label: 'rewards' }
        ]
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText(/Incoming \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('UV Light')).toBeInTheDocument();
    expect(screen.getByText('Key Card')).toBeInTheDocument();
    expect(screen.getByText(/Outgoing \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Secret Document')).toBeInTheDocument();
  });

  test('truncates long connection lists', () => {
    mockSelectedNode = {
      id: 'puzzle-123',
      type: 'activityNode',
      data: {
        label: 'Test Puzzle',
        incomingEdges: [
          { source: 'elem-1', sourceLabel: 'Item 1', label: 'requires' },
          { source: 'elem-2', sourceLabel: 'Item 2', label: 'requires' },
          { source: 'elem-3', sourceLabel: 'Item 3', label: 'requires' },
          { source: 'elem-4', sourceLabel: 'Item 4', label: 'requires' },
          { source: 'elem-5', sourceLabel: 'Item 5', label: 'requires' }
        ]
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Incoming \(5\)/)).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    expect(screen.queryByText('Item 4')).not.toBeInTheDocument();
    expect(screen.getByText(/\.\.\.and 2 more/)).toBeInTheDocument();
  });

  test('navigates to detail view when View Details is clicked', () => {
    mockSelectedNode = {
      id: 'puzzle-abc-123',
      type: 'activityNode',
      data: {
        label: 'Test Puzzle'
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    const viewDetailsButton = screen.getByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/puzzles/abc-123');
  });

  test('detects node type from ID prefix when type field is missing', () => {
    mockSelectedNode = {
      id: 'element-456',
      // no type field
      data: {
        label: 'Test Element'
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    // Should detect as discovery node from 'element-' prefix
    expect(screen.getByText('Discovery')).toBeInTheDocument();
  });

  test('shows node ID in the details', () => {
    mockSelectedNode = {
      id: 'puzzle-complex-id-123',
      type: 'activityNode',
      data: {
        label: 'Test Node'
      }
    };
    setupMockStore();

    render(
      <BrowserRouter>
        <ContextWorkspace />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/ID: puzzle-complex-id-123/)).toBeInTheDocument();
  });
});
