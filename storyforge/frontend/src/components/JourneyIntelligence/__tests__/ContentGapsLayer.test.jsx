/**
 * Tests for ContentGapsLayer component
 * Entity-responsive content gap intelligence overlay
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../../test-utils/test-utils';
import { setupTestCleanup } from '../../../test-utils/cleanup-utils';
import ContentGapsLayer from '../ContentGapsLayer';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';

// Mock our data hooks
jest.mock('../../../hooks/usePerformanceElements');
jest.mock('../../../hooks/useCharacterJourney');
import { usePerformanceElements } from '../../../hooks/usePerformanceElements';
import { useCharacterJourney } from '../../../hooks/useCharacterJourney';

// Setup test cleanup
setupTestCleanup();

describe('ContentGapsLayer', () => {
  const mockElements = [
    {
      id: 'elem-voice-memo',
      name: 'Victoria\'s Voice Memo',
      timeline_event_id: 'timeline-001', // Connected to timeline
      owner_character_id: 'char-victoria',
      content_completeness: 'Complete'
    },
    {
      id: 'elem-business-card',
      name: 'Derek\'s Business Card',
      timeline_event_id: null, // No timeline connection - GAP
      owner_character_id: 'char-derek',
      content_completeness: 'Missing Story'
    },
    {
      id: 'elem-backpack',
      name: 'Alex\'s Backpack',
      timeline_event_id: null, // No timeline connection - GAP
      owner_character_id: 'char-alex',
      content_completeness: 'Missing Story'
    }
  ];

  const mockCharacters = [
    {
      id: 'char-alex-reeves',
      name: 'Alex Reeves',
      timeline_event_count: 2, // Minimal backstory - GAP
      element_count: 1,
      content_status: 'Underdeveloped',
      missing_content: ['Backstory', 'Motivation', 'Memory tokens']
    },
    {
      id: 'char-howie',
      name: 'Howie',
      timeline_event_count: 0, // No backstory - MAJOR GAP
      element_count: 0,
      content_status: 'No Content Written',
      missing_content: ['Everything - character has no story']
    },
    {
      id: 'char-victoria',
      name: 'Victoria',
      timeline_event_count: 8,
      element_count: 5,
      content_status: 'Well Developed',
      missing_content: []
    }
  ];

  const mockTimelineEvents = [
    {
      id: 'timeline-001',
      name: 'Victoria records voice memo',
      revealing_elements: ['elem-voice-memo'],
      content_status: 'Complete'
    },
    {
      id: 'timeline-002',
      name: 'Marcus and Victoria meet',
      revealing_elements: [], // No revealing elements - GAP
      content_status: 'Missing Evidence',
      suggested_elements: ['Hotel receipt', 'Text messages']
    }
  ];

  const mockNodes = mockElements.map((elem, index) => ({
    id: elem.id,
    type: 'default',
    data: { ...elem, label: elem.name, type: 'element' },
    position: { x: index * 200, y: 100 }
  }));

  beforeEach(() => {
    // Reset store with no entity selected initially
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['gaps'],
      selectedEntity: null
    });
    
    // Mock hook responses
    usePerformanceElements.mockImplementation(() => ({
      data: mockElements,
      isLoading: false,
      error: null
    }));

    useCharacterJourney.mockImplementation(() => ({
      data: {},
      isLoading: false,
      error: null
    }));
  });

  it('should not render overlays when no entity selected', async () => {
    renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    // Should NOT show any gaps indicators when no entity selected
    expect(screen.queryByTestId('gaps-overlay')).not.toBeInTheDocument();
  });

  it('should show gaps overlay when element selected', async () => {
    // Select element with gaps
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['gaps'],
      selectedEntity: {
        id: 'elem-business-card',
        type: 'element',
        name: 'Derek\'s Business Card'
      }
    });
    
    renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('gaps-overlay')).toBeInTheDocument();
    });
    
    const overlay = screen.getByTestId('gaps-overlay');
    
    // Should show gaps intelligence for selected element
    expect(within(overlay).getByText(/Derek's Business Card/)).toBeInTheDocument();
    expect(within(overlay).getByText(/Content Gaps Identified/)).toBeInTheDocument();
  });

  it('should identify missing timeline connections for elements', async () => {
    // Select element without timeline connection
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['gaps'],
      selectedEntity: {
        id: 'elem-business-card',
        type: 'element',
        name: 'Derek\'s Business Card',
        timeline_event_id: null,
        content_completeness: 'Missing Story'
      }
    });
    
    renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('gaps-overlay');
      
      // Should identify missing timeline connection
      expect(within(overlay).getByText(/No timeline event/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Consider creating/)).toBeInTheDocument();
      // Check for the specific backstory message in the alert
      const alerts = within(overlay).getAllByRole('alert');
      const timelineAlert = alerts.find(alert => within(alert).queryByText(/Consider creating a backstory event/));
      expect(timelineAlert).toBeInTheDocument();
    });
  });

  it('should show character content gaps when character selected', async () => {
    // Select character with minimal content
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['gaps'],
      selectedEntity: {
        id: 'char-alex-reeves',
        type: 'character',
        name: 'Alex Reeves',
        timeline_event_count: 2,
        element_count: 1,
        content_status: 'Underdeveloped',
        missing_content: ['Backstory', 'Motivation', 'Memory tokens']
      }
    });
    
    renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('gaps-overlay');
      
      // Should show character content gaps
      expect(within(overlay).getByText(/Alex Reeves/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Content Development Status/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Underdeveloped/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Backstory/)).toBeInTheDocument();
    });
  });

  it('should highlight major gaps for empty characters', async () => {
    // Select character with no content
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['gaps'],
      selectedEntity: {
        id: 'char-howie',
        type: 'character',
        name: 'Howie',
        timeline_event_count: 0,
        element_count: 0,
        content_status: 'No Content Written',
        missing_content: ['Everything - character has no story']
      }
    });
    
    renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('gaps-overlay');
      
      // Should show major gap warning
      expect(within(overlay).getByText(/No Content Written/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Character needs complete development/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Everything/)).toBeInTheDocument();
    });
  });

  it('should show timeline event content gaps', async () => {
    // Select timeline event without revealing elements
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['gaps'],
      selectedEntity: {
        id: 'timeline-002',
        type: 'timeline_event',
        name: 'Marcus and Victoria meet',
        revealing_elements: [],
        content_status: 'Missing Evidence',
        suggested_elements: ['Hotel receipt', 'Text messages']
      }
    });
    
    renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('gaps-overlay');
      
      // Should show timeline gaps
      expect(within(overlay).getByText(/Marcus and Victoria meet/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Missing Evidence/)).toBeInTheDocument();
      expect(within(overlay).getByText(/No revealing elements/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Hotel receipt/)).toBeInTheDocument();
    });
  });

  it('should only render when gaps layer is active', () => {
    // Deactivate gaps layer but select an entity
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story', 'social'],
      selectedEntity: {
        id: 'elem-business-card',
        type: 'element',
        name: 'Derek\'s Business Card'
      }
    });
    
    const { container } = renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    // Should not render anything when gaps layer inactive
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('gaps-overlay')).not.toBeInTheDocument();
  });

  it('should handle empty selected entity gracefully', () => {
    // Gaps layer active but no entity selected
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['gaps'],
      selectedEntity: null
    });
    
    renderWithQuery(<ContentGapsLayer nodes={mockNodes} />);
    
    // Should not crash and not show overlay
    expect(screen.queryByTestId('gaps-overlay')).not.toBeInTheDocument();
  });
  
  afterAll(() => {
    cleanupQueryClient();
  });
});