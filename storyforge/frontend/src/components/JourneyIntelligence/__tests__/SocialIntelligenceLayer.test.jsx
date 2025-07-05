/**
 * Tests for SocialIntelligenceLayer component
 * Entity-responsive social choreography intelligence overlay
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../../test-utils/test-utils';
import { setupTestCleanup } from '../../../test-utils/cleanup-utils';
import SocialIntelligenceLayer from '../SocialIntelligenceLayer';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';

// Mock our data hooks
jest.mock('../../../hooks/usePerformanceElements');
jest.mock('../../../hooks/useCharacterJourney');
import { usePerformanceElements } from '../../../hooks/usePerformanceElements';
import { useCharacterJourney } from '../../../hooks/useCharacterJourney';

// Setup test cleanup
setupTestCleanup();

describe('SocialIntelligenceLayer', () => {
  const mockElements = [
    {
      id: 'elem-voice-memo',
      name: 'Victoria\'s Voice Memo',
      owner_character_id: 'char-victoria',
      required_for_puzzles: ['puzzle-jewelry-box'],
      social_access_requirements: ['Derek\'s business card', 'Alex collaboration']
    },
    {
      id: 'elem-business-card',
      name: 'Derek\'s Business Card',
      owner_character_id: 'char-derek',
      required_for_puzzles: ['puzzle-safe-combination'],
      social_access_requirements: ['Direct from Derek']
    },
    {
      id: 'elem-diary',
      name: 'Sarah\'s Diary',
      owner_character_id: 'char-sarah',
      required_for_puzzles: [],
      social_access_requirements: ['Sarah owns - no collaboration needed']
    }
  ];

  const mockPuzzles = [
    {
      id: 'puzzle-jewelry-box',
      name: 'Sarah\'s Jewelry Box',
      required_elements: ['elem-business-card', 'elem-combination'],
      required_collaborators: ['char-alex', 'char-derek'],
      social_complexity: 'High',
      collaboration_type: 'Sequential'
    },
    {
      id: 'puzzle-safe-combination',
      name: 'Office Safe',
      required_elements: ['elem-business-card'],
      required_collaborators: ['char-derek'],
      social_complexity: 'Medium',
      collaboration_type: 'Direct'
    }
  ];

  const mockCharacters = [
    {
      id: 'char-alex-reeves',
      name: 'Alex Reeves',
      collaboration_count: 8,
      social_load: 'Overloaded',
      personality_requirements: ['Confident', 'Investigative']
    },
    {
      id: 'char-derek',
      name: 'Derek',
      collaboration_count: 3,
      social_load: 'Balanced',
      personality_requirements: ['Cooperative', 'Business-oriented']
    },
    {
      id: 'char-sarah',
      name: 'Sarah Mitchell',
      collaboration_count: 2,
      social_load: 'Light',
      personality_requirements: ['Emotional', 'Family-focused']
    }
  ];

  const mockCharacterJourney = {
    character: {
      id: 'char-alex-reeves',
      name: 'Alex Reeves',
      type: 'character'
    },
    collaborationRequirements: ['Derek', 'Sarah', 'Marcus', 'Victoria'],
    ownedElements: ['elem-investigation-notes'],
    accessiblePuzzles: ['puzzle-jewelry-box', 'puzzle-safe-combination']
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
      activeIntelligence: ['social'],
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
    renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    // Should NOT show any social indicators when no entity selected
    expect(screen.queryByTestId('social-overlay')).not.toBeInTheDocument();
  });

  it('should show social overlay when element selected', async () => {
    // Select Victoria's Voice Memo element
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['social'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('social-overlay')).toBeInTheDocument();
    });
    
    const overlay = screen.getByTestId('social-overlay');
    
    // Should show social intelligence for selected element
    expect(within(overlay).getByText(/Victoria's Voice Memo/)).toBeInTheDocument();
    expect(within(overlay).getByText(/Access Requirements/)).toBeInTheDocument();
    expect(within(overlay).getByText(/Required Collaborations/)).toBeInTheDocument();
  });

  it('should show collaboration analysis for element', async () => {
    // Select element that requires multiple collaborations
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['social'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('social-overlay');
      
      // Should show collaboration requirements analysis
      expect(within(overlay).getByText(/Derek's business card/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Alex collaboration/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Multiple characters required/)).toBeInTheDocument();
    });
  });

  it('should show character social analysis when character selected', async () => {
    // Select a character instead of element
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['social'],
      selectedEntity: {
        id: 'char-alex-reeves',
        type: 'character',
        name: 'Alex Reeves',
        collaboration_count: 8,
        social_load: 'Overloaded',
        personality_requirements: ['Confident', 'Investigative']
      }
    });
    
    renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('social-overlay');
      
      // Should show character social analysis
      expect(within(overlay).getByText(/Alex Reeves/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Collaboration Load/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Social Requirements/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Overloaded/)).toBeInTheDocument(); // Based on mock data
    });
  });

  it('should show puzzle social choreography when puzzle selected', async () => {
    // Select a puzzle to see collaboration requirements
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['social'],
      selectedEntity: {
        id: 'puzzle-jewelry-box',
        type: 'puzzle',
        name: 'Sarah\'s Jewelry Box',
        required_elements: ['elem-business-card', 'elem-combination'],
        required_collaborators: ['char-alex', 'char-derek'],
        social_complexity: 'High',
        collaboration_type: 'Sequential'
      }
    });
    
    renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('social-overlay');
      
      // Should show puzzle collaboration analysis
      expect(within(overlay).getByText(/Sarah's Jewelry Box/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Required Collaborators/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Social Complexity/)).toBeInTheDocument();
      expect(within(overlay).getByText(/High complexity/)).toBeInTheDocument();
    });
  });

  it('should show social load warnings for overloaded characters', async () => {
    // Select character with high social load
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['social'],
      selectedEntity: {
        id: 'char-alex-reeves',
        type: 'character',
        name: 'Alex Reeves',
        collaboration_count: 8,
        social_load: 'Overloaded',
        personality_requirements: ['Confident', 'Investigative']
      }
    });
    
    renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('social-overlay');
      
      // Should show warning for overloaded social requirements
      expect(within(overlay).getByText(/8 collaborations required/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Consider redistributing/)).toBeInTheDocument();
    });
  });

  it('should only render when social layer is active', () => {
    // Deactivate social layer but select an entity
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story', 'economic'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    const { container } = renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    // Should not render anything when social layer inactive
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('social-overlay')).not.toBeInTheDocument();
  });

  it('should handle empty selected entity gracefully', () => {
    // Social layer active but no entity selected
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['social'],
      selectedEntity: null
    });
    
    renderWithQuery(<SocialIntelligenceLayer nodes={mockNodes} />);
    
    // Should not crash and not show overlay
    expect(screen.queryByTestId('social-overlay')).not.toBeInTheDocument();
  });
  
  afterAll(() => {
    cleanupQueryClient();
  });
});