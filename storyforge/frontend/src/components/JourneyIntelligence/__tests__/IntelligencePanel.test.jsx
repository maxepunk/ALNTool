/**
 * Tests for IntelligencePanel component
 * Context-sensitive analysis panel showing entity-specific insights
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../../test-utils/test-utils';
import { setupTestCleanup } from '../../../test-utils/cleanup-utils';
import IntelligencePanel from '../IntelligencePanel';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';

// Mock the API
jest.mock('../../../services/api');
import api from '../../../services/api';

// Setup test cleanup
setupTestCleanup();

describe('IntelligencePanel', () => {
  beforeEach(() => {
    // Reset store
    useJourneyIntelligenceStore.setState({
      selectedEntity: null,
      activeIntelligence: ['story', 'social']
    });
    
    // Mock API responses
    api.getTimelineEvents.mockResolvedValue({
      success: true,
      data: [
        { 
          id: 'timeline-affair', 
          description: 'Marcus and Victoria\'s Affair',
          act_focus: 'Act 1',
          characters: ['char-marcus', 'char-victoria']
        },
        { 
          id: 'timeline-meeting', 
          description: 'Sarah meets Alex',
          act_focus: 'Act 2',
          characters: ['char-sarah-mitchell', 'char-alex']
        }
      ]
    });
    
    // Mock the API endpoint used by usePerformanceElements hook
    // Since the hook now uses api.getElements, we need to mock that instead of api.get

    // Keep the old mock for backwards compatibility if needed
    api.getElements.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'elem-voice-memo',
          name: 'Victoria\'s Voice Memo',
          timeline_event_id: 'timeline-affair',
          calculated_memory_value: 5000,
          type: 'Memory Token Audio'
        },
        {
          id: 'elem-diary',
          name: 'Sarah\'s Diary',
          owner_character_id: 'char-sarah-mitchell',
          calculated_memory_value: 1000,
          type: 'Document'
        },
        {
          id: 'elem-letter',
          name: 'Love Letter',
          owner_character_id: 'char-sarah-mitchell',
          calculated_memory_value: 500,
          type: 'Document'
        }
      ]
    });
  });

  describe('Character Analysis', () => {
    const mockCharacter = {
      id: 'char-sarah-mitchell',
      name: 'Sarah Mitchell',
      type: 'character',
      tier: 'Main',
      logline: 'Grieving widow seeking justice',
      ownedElements: ['elem-diary', 'elem-letter'],
      events: ['timeline-meeting'],
      resolutionPaths: ['Detective', 'Black Market']
    };

    it('should show character analysis when character selected', async () => {
      renderWithQuery(<IntelligencePanel entity={mockCharacter} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Basic info
      expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
      expect(screen.getByText('Main Character')).toBeInTheDocument();
      expect(screen.getByText('Grieving widow seeking justice')).toBeInTheDocument();
      
      // Content analysis
      expect(screen.getByText(/Content Analysis/)).toBeInTheDocument();
    });

    it('should display content gap analysis for character', async () => {
      renderWithQuery(<IntelligencePanel entity={mockCharacter} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      const contentSection = screen.getByTestId('content-analysis');
      
      // Timeline events
      expect(within(contentSection).getByText(/Timeline Events: 1/)).toBeInTheDocument();
      expect(within(contentSection).getByText(/Content Gap: Needs more backstory/)).toBeInTheDocument();
      
      // Memory tokens
      expect(within(contentSection).getByText(/Owned Elements: 2/)).toBeInTheDocument();
      expect(within(contentSection).getByText(/Memory Token Value:/)).toBeInTheDocument();
    });

    it('should show social choreography analysis', async () => {
      // Add collaboration data
      api.getPuzzles.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'puzzle-safe',
            name: 'Sarah\'s Safe',
            required_elements: ['elem-key-alex', 'elem-code-marcus'],
            reward_ids: ['elem-diary']
          }
        ]
      });
      
      renderWithQuery(<IntelligencePanel entity={mockCharacter} />);
      
      await waitFor(() => {
        const socialSection = screen.getByTestId('social-analysis');
        
        expect(within(socialSection).getByText(/Social Load/)).toBeInTheDocument();
        expect(within(socialSection).getByText(/Required Collaborations:/)).toBeInTheDocument();
        expect(within(socialSection).getByText(/Path Access: Detective, Black Market/)).toBeInTheDocument();
      });
    });

    it('should show economic impact for character', async () => {
      renderWithQuery(<IntelligencePanel entity={mockCharacter} />);
      
      await waitFor(() => {
        const economicSection = screen.getByTestId('economic-analysis');
        
        expect(within(economicSection).getByText(/Economic Contribution/)).toBeInTheDocument();
        expect(within(economicSection).getByText(/Token Value:/)).toBeInTheDocument();
        expect(within(economicSection).getByText(/Path Balance:/)).toBeInTheDocument();
      });
    });
  });

  describe('Element Analysis', () => {
    const mockElement = {
      id: 'elem-voice-memo',
      name: 'Victoria\'s Voice Memo',
      type: 'Memory Token Audio',
      owner_character_id: 'char-victoria',
      timeline_event_id: 'timeline-affair',
      calculated_memory_value: 5000,
      rightful_owner: 'Victoria',
      container_element_id: 'elem-jewelry-box'
    };

    it('should show element analysis when element selected', async () => {
      renderWithQuery(<IntelligencePanel entity={mockElement} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Victoria\'s Voice Memo')).toBeInTheDocument();
      expect(screen.getByText('Memory Token Audio')).toBeInTheDocument();
      expect(screen.getByText(/Story Integration/)).toBeInTheDocument();
    });

    it('should display timeline connections for element', async () => {
      renderWithQuery(<IntelligencePanel entity={mockElement} />);
      
      await waitFor(() => {
        const storySection = screen.getByTestId('story-integration');
        
        expect(within(storySection).getByText(/Timeline Event:/)).toBeInTheDocument();
        expect(within(storySection).getByText(/Marcus and Victoria's Affair/)).toBeInTheDocument();
        expect(within(storySection).getByText(/Act 1/)).toBeInTheDocument();
      });
    });

    it('should show accessibility analysis for element', async () => {
      renderWithQuery(<IntelligencePanel entity={mockElement} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      const accessSection = screen.getByTestId('accessibility-analysis');
      
      expect(within(accessSection).getByText(/Owner: char-victoria/)).toBeInTheDocument();
      expect(within(accessSection).getByText(/Container: elem-jewelry-box/)).toBeInTheDocument();
      expect(within(accessSection).getByText(/Access Requirements:/)).toBeInTheDocument();
    });

    it('should display economic impact for element', async () => {
      renderWithQuery(<IntelligencePanel entity={mockElement} />);
      
      await waitFor(() => {
        const economicSection = screen.getByTestId('economic-impact');
        
        expect(within(economicSection).getByText(/Memory Value: \$5,000/)).toBeInTheDocument();
        expect(within(economicSection).getByText(/Rightful Owner: Victoria/)).toBeInTheDocument();
        expect(within(economicSection).getByText(/Path Impact:/)).toBeInTheDocument();
      });
    });
  });

  describe('Puzzle Analysis', () => {
    const mockPuzzle = {
      id: 'puzzle-jewelry-box',
      name: 'Sarah\'s Jewelry Box',
      type: 'puzzle',
      description: 'Combination lock requiring business card',
      required_elements: ['elem-business-card', 'elem-combination'],
      reward_ids: ['elem-voice-memo', 'elem-photo'],
      difficulty: 'Medium'
    };

    it('should show puzzle analysis when puzzle selected', async () => {
      renderWithQuery(<IntelligencePanel entity={mockPuzzle} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Sarah\'s Jewelry Box')).toBeInTheDocument();
      expect(screen.getByText('Combination lock requiring business card')).toBeInTheDocument();
      expect(screen.getByText(/Social Choreography/)).toBeInTheDocument();
    });

    it('should display social requirements for puzzle', async () => {
      renderWithQuery(<IntelligencePanel entity={mockPuzzle} />);
      
      await waitFor(() => {
        const socialSection = screen.getByTestId('social-choreography');
        
        expect(within(socialSection).getByText(/Required Elements: 2/)).toBeInTheDocument();
        expect(within(socialSection).getByText(/elem-business-card/)).toBeInTheDocument();
        expect(within(socialSection).getByText(/elem-combination/)).toBeInTheDocument();
        expect(within(socialSection).getByText(/Collaboration Required/)).toBeInTheDocument();
      });
    });

    it('should show reward impact analysis', async () => {
      renderWithQuery(<IntelligencePanel entity={mockPuzzle} />);
      
      await waitFor(() => {
        const rewardSection = screen.getByTestId('reward-impact');
        
        expect(within(rewardSection).getByText(/Rewards: 2 elements/)).toBeInTheDocument();
        expect(within(rewardSection).getByText(/Total Value:/)).toBeInTheDocument();
        expect(within(rewardSection).getByText(/Path Balance Impact:/)).toBeInTheDocument();
      });
    });
  });

  describe('Timeline Event Analysis', () => {
    const mockTimelineEvent = {
      id: 'timeline-affair',
      name: 'Marcus and Victoria\'s Affair',
      type: 'timeline_event',
      description: 'Secret relationship revealed through evidence',
      act_focus: 'Act 1',
      characters: ['char-marcus', 'char-victoria', 'char-sarah'],
      narrative_weight: 'Critical'
    };

    it('should show timeline event analysis when event selected', async () => {
      renderWithQuery(<IntelligencePanel entity={mockTimelineEvent} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Marcus and Victoria\'s Affair')).toBeInTheDocument();
      expect(screen.getByText('Secret relationship revealed through evidence')).toBeInTheDocument();
      expect(screen.getByText(/Story Integration/)).toBeInTheDocument();
    });

    it('should display revealing elements for timeline event', async () => {
      renderWithQuery(<IntelligencePanel entity={mockTimelineEvent} />);
      
      await waitFor(() => {
        const storySection = screen.getByTestId('story-integration');
        
        expect(within(storySection).getByText(/Revealing Elements:/)).toBeInTheDocument();
        expect(within(storySection).getByText(/Victoria's Voice Memo/)).toBeInTheDocument();
        expect(within(storySection).getByText(/Act Focus: Act 1/)).toBeInTheDocument();
      });
    });

    it('should show content balance analysis', async () => {
      renderWithQuery(<IntelligencePanel entity={mockTimelineEvent} />);
      
      await waitFor(() => {
        const balanceSection = screen.getByTestId('content-balance');
        
        expect(within(balanceSection).getByText(/Narrative Weight: Critical/)).toBeInTheDocument();
        expect(within(balanceSection).getByText(/Discovery Paths:/)).toBeInTheDocument();
        expect(within(balanceSection).getByText(/Integration Opportunities:/)).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Updates', () => {
    it('should update panel content when selected entity changes', async () => {
      const character = {
        id: 'char-1',
        name: 'Character One',
        type: 'character',
        tier: 'Main'
      };
      
      const element = {
        id: 'elem-1',
        name: 'Element One',
        type: 'Prop'
      };
      
      const { rerender } = renderWithQuery(<IntelligencePanel entity={character} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Initially shows character
      expect(screen.getByText('Character One')).toBeInTheDocument();
      expect(screen.getByText('Main Character')).toBeInTheDocument();
      
      // Change to element
      rerender(<IntelligencePanel entity={element} />);
      
      // Wait for loading to complete again
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Now shows element
      expect(screen.getByText('Element One')).toBeInTheDocument();
      expect(screen.getByText('Prop')).toBeInTheDocument();
      expect(screen.queryByText('Character One')).not.toBeInTheDocument();
    });

    it('should show loading state while fetching additional data', async () => {
      // Delay API response
      api.getTimelineEvents.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );
      
      renderWithQuery(<IntelligencePanel entity={{ id: 'test', type: 'character' }} />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
    });

    it('should handle empty data gracefully', async () => {
      api.getTimelineEvents.mockResolvedValue({ success: true, data: [] });
      api.getElements.mockResolvedValue({ success: true, data: [] });
      api.getPuzzles.mockResolvedValue({ success: true, data: [] });
      
      const character = {
        id: 'char-empty',
        name: 'Empty Character',
        type: 'character',
        tier: 'Supporting',
        ownedElements: [],
        events: []
      };
      
      renderWithQuery(<IntelligencePanel entity={character} />);
      
      await waitFor(() => {
        expect(screen.getByText(/No timeline events/)).toBeInTheDocument();
        expect(screen.getByText(/No owned elements/)).toBeInTheDocument();
        expect(screen.getByText(/No collaborations required/)).toBeInTheDocument();
      });
    });
  });
  
  afterAll(() => {
    cleanupQueryClient();
  });
});