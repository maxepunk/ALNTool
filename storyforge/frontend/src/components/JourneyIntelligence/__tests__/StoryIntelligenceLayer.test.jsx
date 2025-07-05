/**
 * Tests for StoryIntelligenceLayer component
 * Entity-responsive story intelligence overlay
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../../test-utils/test-utils';
import { setupTestCleanup } from '../../../test-utils/cleanup-utils';
import StoryIntelligenceLayer from '../StoryIntelligenceLayer';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';

// Mock our data hooks
jest.mock('../../../hooks/usePerformanceElements');
jest.mock('../../../hooks/useCharacterJourney');
import { usePerformanceElements } from '../../../hooks/usePerformanceElements';
import { useCharacterJourney } from '../../../hooks/useCharacterJourney';

// Setup test cleanup
setupTestCleanup();

describe('StoryIntelligenceLayer', () => {
  const mockElements = [
    {
      id: 'elem-voice-memo',
      name: 'Victoria\'s Voice Memo',
      timeline_event_id: 'timeline-affair',
      calculated_memory_value: 5000,
      story_importance: 'Critical'
    },
    {
      id: 'elem-diary',
      name: 'Sarah\'s Diary',
      timeline_event_id: 'timeline-marriage',
      calculated_memory_value: 3000,
      story_importance: 'High'
    },
    {
      id: 'elem-photo',
      name: 'Wedding Photo',
      timeline_event_id: null,
      calculated_memory_value: 1000,
      story_importance: 'Low'
    }
  ];

  const mockTimelineEvents = [
    {
      id: 'timeline-affair',
      description: 'Marcus and Victoria\'s affair',
      act_focus: 'Act 1',
      narrative_importance: 'Critical',
      revealing_elements: ['elem-voice-memo', 'elem-hotel-receipt']
    },
    {
      id: 'timeline-marriage',
      description: 'Sarah and Marcus wedding',
      act_focus: 'Backstory',
      narrative_importance: 'High',
      revealing_elements: ['elem-diary', 'elem-photo']
    }
  ];

  const mockCharacterJourney = {
    character: {
      id: 'char-sarah-mitchell',
      name: 'Sarah Mitchell',
      type: 'character'
    },
    timelineEvents: mockTimelineEvents,
    ownedElements: ['elem-diary'],
    accessibleElements: ['elem-voice-memo', 'elem-photo']
  };

  const mockNodes = mockElements.map((elem, index) => ({
    id: elem.id,
    type: 'default',
    data: { ...elem, label: elem.name, type: 'element' },
    position: { x: index * 200, y: 100 }
  }));

  beforeEach(() => {
    // Reset store with no entity selected initially
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story'],
      selectedEntity: null
    });
    
    // Mock hook responses
    usePerformanceElements.mockImplementation(() => ({
      data: mockElements,
      isLoading: false,
      error: null
    }));

    useCharacterJourney.mockImplementation(() => ({
      data: mockCharacterJourney,
      isLoading: false,
      error: null
    }));
  });

  it('should not render overlays when no entity selected', async () => {
    renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    // Should NOT show any story indicators when no entity selected
    expect(screen.queryByTestId('story-overlay')).not.toBeInTheDocument();
  });

  it('should show story overlay when element selected', async () => {
    // Select Victoria's Voice Memo element
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('story-overlay')).toBeInTheDocument();
    });
    
    const overlay = screen.getByTestId('story-overlay');
    
    // Should show story intelligence for selected element
    expect(within(overlay).getByText(/Victoria's Voice Memo/)).toBeInTheDocument();
    expect(within(overlay).getByText(/Timeline Connection/)).toBeInTheDocument();
    expect(within(overlay).getByText(/Marcus and Victoria's affair/)).toBeInTheDocument();
    expect(within(overlay).getByText(/Story Importance/)).toBeInTheDocument();
  });

  it('should show narrative importance analysis for element', async () => {
    // Select Victoria's Voice Memo (critical story element)
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('story-overlay');
      
      // Should show narrative importance analysis
      expect(within(overlay).getByText(/Story Importance/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Act 1 - Critical/)).toBeInTheDocument();
    });
  });

  it('should show character story analysis when character selected', async () => {
    // Select a character instead of element
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story'],
      selectedEntity: {
        id: 'char-sarah-mitchell',
        type: 'character',
        name: 'Sarah Mitchell'
      }
    });
    
    renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('story-overlay');
      
      // Should show character story analysis
      expect(within(overlay).getByText(/Sarah Mitchell/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Story Development/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Timeline Events/)).toBeInTheDocument();
    });
  });

  it('should show content gaps and missing connections', async () => {
    // Select element without timeline connection to show gap analysis
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story'],
      selectedEntity: {
        id: 'elem-photo',
        type: 'element',
        name: 'Wedding Photo'
      }
    });
    
    renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('story-overlay');
      
      // Should identify content gaps
      expect(within(overlay).getByText(/Content Opportunities/)).toBeInTheDocument();
      expect(within(overlay).getByText(/No timeline connection/)).toBeInTheDocument();
    });
  });

  it('should only render when story layer is active', () => {
    // Deactivate story layer but select an entity
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['economic', 'social'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    const { container } = renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    // Should not render anything when story layer inactive
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('story-overlay')).not.toBeInTheDocument();
  });

  it('should handle empty selected entity gracefully', () => {
    // Story layer active but no entity selected
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story'],
      selectedEntity: null
    });
    
    renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    // Should not crash and not show overlay
    expect(screen.queryByTestId('story-overlay')).not.toBeInTheDocument();
  });

  it('should show timeline event analysis when timeline event selected', async () => {
    // Select a timeline event
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story'],
      selectedEntity: {
        id: 'timeline-affair',
        type: 'timeline_event',
        name: 'Marcus and Victoria\'s affair'
      }
    });
    
    renderWithQuery(<StoryIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('story-overlay');
      
      // Should show timeline event story analysis
      expect(within(overlay).getByText(/Marcus and Victoria's affair/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Revealing Elements/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Story Arc/)).toBeInTheDocument();
    });
  });
  
  afterAll(() => {
    cleanupQueryClient();
  });
});