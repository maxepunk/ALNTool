import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FallbackGraph from './FallbackGraph';

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('FallbackGraph', () => {
  const defaultProps = {
    entityType: 'Character',
    entityName: 'Test Character',
    relationshipData: {},
  };

  it('renders warning alert', () => {
    renderWithRouter(<FallbackGraph {...defaultProps} />);
    expect(screen.getByText('Visual map error. Displaying relationships as lists:')).toBeInTheDocument();
  });

  it('renders entity name and type', () => {
    renderWithRouter(<FallbackGraph {...defaultProps} />);
    expect(screen.getByText('Test Character (Character)')).toBeInTheDocument();
  });

  it('shows no relationships message when data is empty', () => {
    renderWithRouter(<FallbackGraph {...defaultProps} />);
    expect(screen.getByText('No direct relationships found in data for this fallback view.')).toBeInTheDocument();
  });

  describe('Character relationships', () => {
    it('renders owned elements', () => {
      const props = {
        ...defaultProps,
        relationshipData: {
          ownedElements: [
            { id: 'elem-1', name: 'Element 1' },
            { id: 'elem-2', name: 'Element 2' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Owned Elements (2)')).toBeInTheDocument();
      expect(screen.getByText('Element 1')).toBeInTheDocument();
      expect(screen.getByText('Element 2')).toBeInTheDocument();
    });

    it('renders associated elements', () => {
      const props = {
        ...defaultProps,
        relationshipData: {
          associatedElements: [
            { id: 'elem-3', name: 'Element 3' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Associated Elements (1)')).toBeInTheDocument();
      expect(screen.getByText('Element 3')).toBeInTheDocument();
    });

    it('renders timeline events', () => {
      const props = {
        ...defaultProps,
        relationshipData: {
          events: [
            { id: 'event-1', description: 'Event 1' },
            { id: 'event-2', description: 'Event 2' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Timeline Events (2)')).toBeInTheDocument();
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    it('renders puzzles', () => {
      const props = {
        ...defaultProps,
        relationshipData: {
          puzzles: [
            { id: 'puzzle-1', puzzle: 'Puzzle 1' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Puzzles (1)')).toBeInTheDocument();
      expect(screen.getByText('Puzzle 1')).toBeInTheDocument();
    });
  });

  describe('Element relationships', () => {
    it('renders owner', () => {
      const props = {
        ...defaultProps,
        entityType: 'Element',
        entityName: 'Test Element',
        relationshipData: {
          owner: { id: 'char-1', name: 'Owner Character' },
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Owner (1)')).toBeInTheDocument();
      expect(screen.getByText('Owner Character')).toBeInTheDocument();
    });

    it('renders associated characters', () => {
      const props = {
        ...defaultProps,
        entityType: 'Element',
        entityName: 'Test Element',
        relationshipData: {
          associatedCharacters: [
            { id: 'char-2', name: 'Associated Character' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Associated Characters (1)')).toBeInTheDocument();
      expect(screen.getByText('Associated Character')).toBeInTheDocument();
    });

    it('renders timeline events', () => {
      const props = {
        ...defaultProps,
        entityType: 'Element',
        entityName: 'Test Element',
        relationshipData: {
          timelineEvents: [
            { id: 'event-3', description: 'Element Event' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Timeline Events (1)')).toBeInTheDocument();
      expect(screen.getByText('Element Event')).toBeInTheDocument();
    });

    it('renders puzzle relationships', () => {
      const props = {
        ...defaultProps,
        entityType: 'Element',
        entityName: 'Test Element',
        relationshipData: {
          requiredForPuzzle: [
            { id: 'puzzle-2', puzzle: 'Required Puzzle' },
          ],
          rewardedByPuzzle: [
            { id: 'puzzle-3', puzzle: 'Reward Puzzle' },
          ],
          containerPuzzle: { id: 'puzzle-4', puzzle: 'Container Puzzle' },
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Required For Puzzles (1)')).toBeInTheDocument();
      expect(screen.getByText('Required Puzzle')).toBeInTheDocument();
      expect(screen.getByText('Rewarded By Puzzles (1)')).toBeInTheDocument();
      expect(screen.getByText('Reward Puzzle')).toBeInTheDocument();
      expect(screen.getByText('Container Puzzle (1)')).toBeInTheDocument();
      expect(screen.getByText('Container Puzzle', { selector: '[class*="MuiListItemText-primary"]' })).toBeInTheDocument();
    });

    it('renders container relationships', () => {
      const props = {
        ...defaultProps,
        entityType: 'Element',
        entityName: 'Test Element',
        relationshipData: {
          container: { id: 'elem-4', name: 'Container Element' },
          contents: [
            { id: 'elem-5', name: 'Content 1' },
            { id: 'elem-6', name: 'Content 2' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Container (Inside) (1)')).toBeInTheDocument();
      expect(screen.getByText('Container Element')).toBeInTheDocument();
      expect(screen.getByText('Contents (2)')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('Puzzle relationships', () => {
    it('renders owner and locked item', () => {
      const props = {
        ...defaultProps,
        entityType: 'Puzzle',
        entityName: 'Test Puzzle',
        relationshipData: {
          owner: { id: 'char-3', name: 'Puzzle Owner' },
          lockedItem: { id: 'elem-7', name: 'Locked Item' },
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Owner (1)')).toBeInTheDocument();
      expect(screen.getByText('Puzzle Owner')).toBeInTheDocument();
      expect(screen.getByText('Locks Item (1)')).toBeInTheDocument();
      expect(screen.getByText('Locked Item')).toBeInTheDocument();
    });

    it('renders puzzle elements and rewards', () => {
      const props = {
        ...defaultProps,
        entityType: 'Puzzle',
        entityName: 'Test Puzzle',
        relationshipData: {
          puzzleElements: [
            { id: 'elem-8', name: 'Required Element' },
          ],
          rewards: [
            { id: 'elem-9', name: 'Reward Element' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Requires Elements (1)')).toBeInTheDocument();
      expect(screen.getByText('Required Element')).toBeInTheDocument();
      expect(screen.getByText('Rewards Elements (1)')).toBeInTheDocument();
      expect(screen.getByText('Reward Element')).toBeInTheDocument();
    });

    it('renders parent and sub puzzles', () => {
      const props = {
        ...defaultProps,
        entityType: 'Puzzle',
        entityName: 'Test Puzzle',
        relationshipData: {
          parentItem: { id: 'puzzle-5', puzzle: 'Parent Puzzle' },
          subPuzzles: [
            { id: 'puzzle-6', puzzle: 'Sub Puzzle 1' },
            { id: 'puzzle-7', puzzle: 'Sub Puzzle 2' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Parent Puzzle (1)')).toBeInTheDocument();
      expect(screen.getByText('Parent Puzzle', { selector: '[class*="MuiListItemText-primary"]' })).toBeInTheDocument();
      expect(screen.getByText('Sub-Puzzles (2)')).toBeInTheDocument();
      expect(screen.getByText('Sub Puzzle 1')).toBeInTheDocument();
      expect(screen.getByText('Sub Puzzle 2')).toBeInTheDocument();
    });
  });

  describe('Timeline relationships', () => {
    it('renders characters involved and memory evidence', () => {
      const props = {
        ...defaultProps,
        entityType: 'Timeline',
        entityName: 'Test Timeline Event',
        relationshipData: {
          charactersInvolved: [
            { id: 'char-4', name: 'Character 1' },
            { id: 'char-5', name: 'Character 2' },
          ],
          memoryEvidence: [
            { id: 'elem-10', name: 'Evidence 1' },
          ],
        },
      };
      renderWithRouter(<FallbackGraph {...props} />);
      expect(screen.getByText('Characters Involved (2)')).toBeInTheDocument();
      expect(screen.getByText('Character 1')).toBeInTheDocument();
      expect(screen.getByText('Character 2')).toBeInTheDocument();
      expect(screen.getByText('Memory/Evidence (1)')).toBeInTheDocument();
      expect(screen.getByText('Evidence 1')).toBeInTheDocument();
    });
  });

  it('handles missing relationshipData gracefully', () => {
    const props = {
      ...defaultProps,
      relationshipData: null,
    };
    renderWithRouter(<FallbackGraph {...props} />);
    expect(screen.getByText('No direct relationships found in data for this fallback view.')).toBeInTheDocument();
  });

  it('renders item IDs as secondary text', () => {
    const props = {
      ...defaultProps,
      relationshipData: {
        ownedElements: [
          { id: 'elem-with-id', name: 'Element With ID' },
        ],
      },
    };
    renderWithRouter(<FallbackGraph {...props} />);
    expect(screen.getByText('ID: elem-with-id')).toBeInTheDocument();
  });

  it('handles items with only IDs (no name/description)', () => {
    const props = {
      ...defaultProps,
      relationshipData: {
        ownedElements: [
          { id: 'elem-only-id' },
        ],
      },
    };
    renderWithRouter(<FallbackGraph {...props} />);
    expect(screen.getByText('elem-only-id')).toBeInTheDocument();
  });

  it('renders dividers between relation groups', () => {
    const props = {
      ...defaultProps,
      relationshipData: {
        ownedElements: [{ id: 'elem-1', name: 'Element 1' }],
        events: [{ id: 'event-1', description: 'Event 1' }],
      },
    };
    const { container } = renderWithRouter(<FallbackGraph {...props} />);
    const dividers = container.querySelectorAll('hr');
    expect(dividers.length).toBe(1); // One divider between two groups
  });
});