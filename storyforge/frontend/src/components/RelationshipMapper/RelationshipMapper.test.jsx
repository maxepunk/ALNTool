import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RelationshipMapper from './RelationshipMapper';
import '@testing-library/jest-dom';

const baseProps = {
  title: 'Test Map',
  entityType: 'Character',
  entityId: 'char1',
  entityName: 'Detective',
  relationshipData: {
    id: 'char1',
    name: 'Detective',
    ownedElements: [{ id: 'el1', name: 'Gun' }],
    associatedElements: [{ id: 'el2', name: 'Badge' }],
    events: [{ id: 'ev1', description: 'Interrogation' }],
    puzzles: [{ id: 'pz1', puzzle: 'Safe Code' }],
  },
  isLoading: false,
  error: null,
};

describe('RelationshipMapper', () => {
  // beforeEach(() => {
  //   jest.useFakeTimers();
  // });
  // afterEach(() => {
  //   jest.runOnlyPendingTimers();
  //   jest.useRealTimers();
  // });

  it('renders loading state', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} isLoading={true} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading Relationship Map/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} error={{ message: 'Test error' }} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Error loading relationship data/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} relationshipData={null} />
      </MemoryRouter>
    );
    expect(screen.getByText(/No direct relationships found/i)).toBeInTheDocument();
  });

  it('renders nodes and edges from relationshipData', async () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} />
      </MemoryRouter>
    );
    // The main entity node label
    expect(screen.getByText('Detective')).toBeInTheDocument();
    // Related nodes
    expect(screen.getByText('Gun')).toBeInTheDocument();
    expect(screen.getByText('Badge')).toBeInTheDocument();
    expect(screen.getByText('Interrogation')).toBeInTheDocument();
    expect(screen.getByText('Safe Code')).toBeInTheDocument();
  });

  it('toggles node filter and updates UI', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} />
      </MemoryRouter>
    );
    // Open filter menu
    fireEvent.click(screen.getByLabelText(/filter nodes/i));
    // Uncheck 'Element' node type
    const elementMenuItem = screen.getByText('Element').closest('li');
    fireEvent.click(elementMenuItem);
    // Close menu
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    // 'Gun' and 'Badge' should not be visible
    expect(screen.queryByText('Gun')).not.toBeInTheDocument();
    expect(screen.queryByText('Badge')).not.toBeInTheDocument();
    // 'Detective' should still be visible
    expect(screen.getByText('Detective')).toBeInTheDocument();
  });

  it('changes view mode and updates UI', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} />
      </MemoryRouter>
    );
    // Open filter menu
    fireEvent.click(screen.getByLabelText(/filter nodes/i));
    // Select 'Puzzle Connections' view mode
    const puzzleMode = screen.getByText('Puzzle Connections').closest('li');
    fireEvent.click(puzzleMode);
    // The chip should update
    expect(screen.getByText(/Puzzle Connections|Puzzle/i)).toBeInTheDocument();
  });

  it('opens and closes info modal', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} />
      </MemoryRouter>
    );
    // Open info modal
    fireEvent.click(screen.getByLabelText(/info/i));
    expect(screen.getByText(/Relationship Map Information/i)).toBeInTheDocument();
    // Close info modal
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText(/Relationship Map Information/i)).not.toBeInTheDocument();
  });

  it('toggles fullscreen mode', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} />
      </MemoryRouter>
    );
    const fullscreenBtn = screen.getByLabelText(/full screen/i);
    fireEvent.click(fullscreenBtn);
    // The button should now be for exit fullscreen
    expect(screen.getByLabelText(/exit full screen/i)).toBeInTheDocument();
  });

  it('shows snackbar on layout change', () => {
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} />
      </MemoryRouter>
    );
    // Open layout panel and change layout
    const layoutBtn = screen.getByLabelText(/toggle fullscreen/i); // Use any layout control
    fireEvent.click(layoutBtn); // Toggle fullscreen to trigger snackbar
    // Flush timers to allow Snackbar to appear and auto-dismiss
    // jest.runOnlyPendingTimers();
    // Snackbar should appear
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('navigates to detail page on node click (mocked)', () => {
    // Mock useNavigate
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);
    render(
      <MemoryRouter>
        <RelationshipMapper {...baseProps} />
      </MemoryRouter>
    );
    // Find a node (e.g., 'Gun') and simulate click
    const gunNode = screen.getByText('Gun');
    fireEvent.click(gunNode);
    // Should call navigate with the correct route
    expect(mockNavigate).toHaveBeenCalledWith('/elements/el1');
    jest.restoreAllMocks();
  });
}); 