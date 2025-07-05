// REFACTOR PHASE: Comprehensive tests for NarrativeImpactSection component
// Following TDD principles - test user-facing behavior and rendered output

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import NarrativeImpactSection from './NarrativeImpactSection';

describe('NarrativeImpactSection', () => {
  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  const mockPuzzle = {
    storyReveals: 'Important story revelation about the character\'s past',
    impactedCharacters: [
      { id: 'char1', name: 'John Doe' },
      { id: 'char2', name: 'Jane Smith' }
    ],
    relatedTimelineEvents: [
      { id: 'event1', name: 'The Incident' },
      { id: 'event2', name: 'The Discovery' }
    ],
    resolutionPaths: [
      { id: 'path1', name: 'Detective Path' },
      { id: 'path2', name: 'Black Market Path' }
    ]
  };

  describe('component rendering', () => {
    test('should render main heading', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      expect(screen.getByText(/narrative impact & cohesion/i)).toBeInTheDocument();
    });

    test('should render story reveals when present', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      expect(screen.getByText(/key story reveals/i)).toBeInTheDocument();
      expect(screen.getByText(/important story revelation about the character's past/i)).toBeInTheDocument();
    });

    test('should render impacted characters section', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      expect(screen.getByText(/impacted characters/i)).toBeInTheDocument();
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    });

    test('should render related timeline events section', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      expect(screen.getByText(/related timeline events/i)).toBeInTheDocument();
      expect(screen.getByText(/the incident/i)).toBeInTheDocument();
      expect(screen.getByText(/the discovery/i)).toBeInTheDocument();
    });

    test('should render resolution path contributions section', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      expect(screen.getByText(/resolution path contributions/i)).toBeInTheDocument();
      expect(screen.getByText(/detective path/i)).toBeInTheDocument();
      expect(screen.getByText(/black market path/i)).toBeInTheDocument();
    });
  });

  describe('empty state handling', () => {
    test('should show "None specified" for empty impacted characters', () => {
      const puzzleWithoutCharacters = {
        ...mockPuzzle,
        impactedCharacters: []
      };

      renderWithRouter(<NarrativeImpactSection puzzle={puzzleWithoutCharacters} />);

      expect(screen.getByText(/impacted characters/i)).toBeInTheDocument();
      expect(screen.getByText(/none specified/i)).toBeInTheDocument();
    });

    test('should show "None specified" for empty timeline events', () => {
      const puzzleWithoutEvents = {
        ...mockPuzzle,
        relatedTimelineEvents: []
      };

      renderWithRouter(<NarrativeImpactSection puzzle={puzzleWithoutEvents} />);

      expect(screen.getByText(/related timeline events/i)).toBeInTheDocument();
      expect(screen.getByText(/none specified/i)).toBeInTheDocument();
    });

    test('should show "None specified" for empty resolution paths', () => {
      const puzzleWithoutPaths = {
        ...mockPuzzle,
        resolutionPaths: []
      };

      renderWithRouter(<NarrativeImpactSection puzzle={puzzleWithoutPaths} />);

      expect(screen.getByText(/resolution path contributions/i)).toBeInTheDocument();
      expect(screen.getByText(/none specified/i)).toBeInTheDocument();
    });

    test('should not render story reveals section when missing', () => {
      const puzzleWithoutStoryReveals = {
        ...mockPuzzle,
        storyReveals: null
      };

      renderWithRouter(<NarrativeImpactSection puzzle={puzzleWithoutStoryReveals} />);

      expect(screen.queryByText(/key story reveals/i)).not.toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    test('should create proper character links', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      const johnLink = screen.getByText(/john doe/i).closest('a');
      expect(johnLink).toHaveAttribute('href', '/characters/char1');

      const janeLink = screen.getByText(/jane smith/i).closest('a');
      expect(janeLink).toHaveAttribute('href', '/characters/char2');
    });

    test('should create proper timeline event links', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      const incidentLink = screen.getByText(/the incident/i).closest('a');
      expect(incidentLink).toHaveAttribute('href', '/timelines/event1');

      const discoveryLink = screen.getByText(/the discovery/i).closest('a');
      expect(discoveryLink).toHaveAttribute('href', '/timelines/event2');
    });
  });

  describe('edge cases and error handling', () => {
    test('should return null when puzzle is null', () => {
      const { container } = renderWithRouter(<NarrativeImpactSection puzzle={null} />);
      expect(container.firstChild).toBeNull();
    });

    test('should return null when puzzle is undefined', () => {
      const { container } = renderWithRouter(<NarrativeImpactSection puzzle={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    test('should handle malformed data gracefully', () => {
      const malformedPuzzle = {
        impactedCharacters: null,
        relatedTimelineEvents: undefined,
        resolutionPaths: 'not an array'
      };

      renderWithRouter(<NarrativeImpactSection puzzle={malformedPuzzle} />);

      expect(screen.getByText(/narrative impact & cohesion/i)).toBeInTheDocument();
      expect(screen.getAllByText(/none specified/i)).toHaveLength(3);
    });
  });

  describe('accessibility and usability', () => {
    test('should have proper heading structure', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      expect(screen.getByRole('heading', { name: /narrative impact & cohesion/i })).toBeInTheDocument();
    });

    test('should have clickable list items for navigation', () => {
      renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      // Material-UI ListItemButton with RouterLink renders as links
      const navigationLinks = screen.getAllByRole('link');
      expect(navigationLinks.length).toBeGreaterThan(0);

      navigationLinks.forEach(link => {
        expect(link).toBeVisible();
      });
    });

    test('should render content in a paper container', () => {
      const { container } = renderWithRouter(<NarrativeImpactSection puzzle={mockPuzzle} />);

      const paperElement = container.querySelector('.MuiPaper-root');
      expect(paperElement).toBeInTheDocument();
    });
  });
});