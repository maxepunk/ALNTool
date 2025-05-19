import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EntityNode from './EntityNode'; // Adjust path as necessary
import { ReactFlowProvider } from '@xyflow/react'; // EntityNode might need this context

// Mock child components or dependencies if they are complex or not relevant to EntityNode's unit tests
jest.mock('./NodeTooltipContent', () => () => <div data-testid="mock-tooltip-content">Mock Tooltip</div>); // If NodeTooltipContent is a separate component

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const baseMockNodeData = {
  isCenter: false,
  // These would be provided by React Flow normally
  selected: false,
  dragging: false,
  zIndex: 1,
  isConnectable: false,
  xPos: 0,
  yPos: 0,
  type: 'entityNode', // Default React Flow type for custom nodes if not overridden
};

const mockCharacterData = {
  ...baseMockNodeData,
  id: 'char-alex-reeves',
  data: {
    id: 'char-alex-reeves',
    label: 'Alex Reeves',
    type: 'Character',
    route: '/characters/char-alex-reeves',
    properties: {
      name: 'Alex Reeves',
      type: 'Character',
      fullDescription: 'Alex Reeves is a talented software engineer...',
      descriptionSnippet: 'Alex Reeves is a talented software engineer...',
      tier: 'Core',
      role: 'Player',
      primaryActionSnippet: 'Investigate Marcus Blackwood\'s death...'
    }
  }
};

const mockElementData = {
  ...baseMockNodeData,
  id: 'elem-backpack',
  data: {
    id: 'elem-backpack',
    label: 'Alex\'s Backpack',
    type: 'Element',
    route: '/elements/elem-backpack',
    properties: {
      name: 'Alex\'s Backpack',
      type: 'Element',
      basicType: 'Container',
      status: 'Ready for Playtest',
      flowSummary: 'Owned by Alex Reeves'
    }
  }
};

const mockPuzzleData = {
  ...baseMockNodeData,
  id: 'puzzle-laptop',
  data: {
    id: 'puzzle-laptop',
    label: 'Laptop Access',
    type: 'Puzzle',
    route: '/puzzles/puzzle-laptop',
    properties: {
      name: 'Laptop Access',
      type: 'Puzzle',
      timing: 'Act 1',
      statusSummary: 'Requires X, Rewards Y'
    }
  }
};

const mockTimelineData = {
  ...baseMockNodeData,
  id: 'event-interrogation',
  data: {
    id: 'event-interrogation',
    label: 'Alex Interrogation',
    type: 'Timeline',
    route: '/timeline/event-interrogation',
    properties: {
      name: 'Alex Interrogation',
      type: 'Timeline',
      dateString: '2025-05-13',
      participantSummary: 'Involves 2 Chars, 1 Elem',
      notesSnippet: 'Key turning point'
    }
  }
};

const renderWithProvider = (ui) => {
  return render(
    <ReactFlowProvider>{ui}</ReactFlowProvider>
  );
};

describe('EntityNode Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const getNodeElement = (labelText) => screen.getByText(labelText).closest('div[data-testid^="entity-node-"]');

  it('renders Character node correctly with specific chips', () => {
    renderWithProvider(<EntityNode {...mockCharacterData} />);    
    expect(screen.getByText('Alex Reeves')).toBeInTheDocument();
    expect(screen.getByText('Tier: Core')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument(); // Role
    expect(getNodeElement('Alex Reeves')).toHaveClass('entity-node-character');
  });

  it('renders Element node correctly with specific chips', () => {
    renderWithProvider(<EntityNode {...mockElementData} />); 
    expect(screen.getByText('Alex\'s Backpack')).toBeInTheDocument();
    expect(screen.getByText('Type: Container')).toBeInTheDocument(); // Basic Type
    expect(screen.getByText('Status: Ready for Playtest')).toBeInTheDocument();
    expect(getNodeElement('Alex\'s Backpack')).toHaveClass('entity-node-element');
  });

  it('renders Puzzle node correctly with specific chips', () => {
    renderWithProvider(<EntityNode {...mockPuzzleData} />); 
    expect(screen.getByText('Laptop Access')).toBeInTheDocument();
    expect(screen.getByText('Timing: Act 1')).toBeInTheDocument();
    expect(getNodeElement('Laptop Access')).toHaveClass('entity-node-puzzle');
  });

  it('renders Timeline node correctly with specific chips', () => {
    renderWithProvider(<EntityNode {...mockTimelineData} />);    
    expect(screen.getByText('Alex Interrogation')).toBeInTheDocument();
    expect(screen.getByText('Date: 2025-05-13')).toBeInTheDocument(); // Assuming chip displays dateString
    expect(screen.getByText('Participants: Involves 2 Chars, 1 Elem')).toBeInTheDocument(); // Assuming chip displays participantSummary
    expect(getNodeElement('Alex Interrogation')).toHaveClass('entity-node-timeline');
  });

  it('renders as a center node and applies center class when data.isCenter is true', () => {
    const centerNodeCharacter = { ...mockCharacterData, data: { ...mockCharacterData.data, isCenter: true } };
    renderWithProvider(<EntityNode {...centerNodeCharacter} />);
    const nodeElement = getNodeElement('Alex Reeves');
    expect(nodeElement).toHaveClass('is-center-node');
  });

  it('applies selected class when selected prop is true', () => {
    const selectedNodeCharacter = { ...mockCharacterData, selected: true };
    renderWithProvider(<EntityNode {...selectedNodeCharacter} />);
    const nodeElement = getNodeElement('Alex Reeves');
    expect(nodeElement).toHaveClass('selected'); // React Flow typically adds a 'selected' class
    expect(nodeElement).toHaveAttribute('aria-selected', 'true');
  });

  it('shows tooltip on hover and hides on unhover', async () => {
    const user = userEvent.setup();
    renderWithProvider(<EntityNode {...mockCharacterData} />); 
    const nodeMainContent = screen.getByText('Alex Reeves');
    
    await user.hover(nodeMainContent);
    expect(screen.getByTestId('mock-tooltip-content')).toBeVisible();
    
    await user.unhover(nodeMainContent);
    // Material UI Tooltip might use transition, so it might not be removed immediately.
    // Test for invisibility or absence after a timeout if needed, or check for class that controls visibility.
    // For a simple mock, it might be removed from DOM.
    // If the mock tooltip is always in DOM and visibility is controlled by parent, this check changes.
    // Assuming the mock becomes non-visible or a specific class implies it.
    // For this basic mock, we'll assume it becomes non-visible based on EntityNode logic.
    // This test might need adjustment based on actual Tooltip and EntityNode implementation detail.
    // A more robust approach for MUI tooltips involves waiting for transitions if any.
    expect(screen.queryByTestId('mock-tooltip-content')).not.toBeVisible(); 
  });

  it('navigates on click if route is provided', async () => {
    const user = userEvent.setup();
    renderWithProvider(<EntityNode {...mockCharacterData} />); 
    const nodeMainContent = screen.getByText('Alex Reeves').closest('.react-flow__node'); // Click the whole node area

    if (nodeMainContent) {
        await user.click(nodeMainContent);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(mockCharacterData.data.route);
    } else {
        throw new Error ('Node main content not found for click event');
    }
  });

  it('does not navigate on click if route is not provided', async () => {
    const user = userEvent.setup();
    const noRouteData = { ...mockCharacterData, data: { ...mockCharacterData.data, route: undefined } };
    renderWithProvider(<EntityNode {...noRouteData} />); 
    const nodeMainContent = screen.getByText('Alex Reeves').closest('.react-flow__node');

    if (nodeMainContent) {
        await user.click(nodeMainContent);
        expect(mockNavigate).not.toHaveBeenCalled();
    } else {
        throw new Error ('Node main content not found for click event');
    }
  });

  it('renders correctly when isFullScreen is true (check for class if applicable)', () => {
    renderWithProvider(<EntityNode {...mockCharacterData} isFullScreen={true} />); 
    const nodeElement = getNodeElement('Alex Reeves');
    // Assuming EntityNode might add a class based on isFullScreen for specific styling
    // expect(nodeElement).toHaveClass('fullscreen-node-variant'); // Example
    // For now, just ensure it renders without error and contains core content.
    expect(screen.getByText('Alex Reeves')).toBeInTheDocument();
  });

  it('renders correctly with different centralEntityType (check for chip changes if applicable)', () => {
    // Example: If EntityNode behavior for chips changes based on the central entity of the map
    renderWithProvider(<EntityNode {...mockElementData} centralEntityType="Character" />); 
    // expect(screen.queryByText('Some Chip Specific To ElementNodeInCharacterMap')).toBeInTheDocument(); // Example
    // For now, ensure basic rendering and core chips are present.
    expect(screen.getByText('Alex\'s Backpack')).toBeInTheDocument();
    expect(screen.getByText('Type: Container')).toBeInTheDocument();
  });

}); 