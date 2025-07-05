/**
 * Tests for EconomicLayer component
 * Entity-responsive economic intelligence overlay
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../../test-utils/test-utils';
import { setupTestCleanup } from '../../../test-utils/cleanup-utils';
import EconomicLayer from '../EconomicLayer';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';

// Mock our data hooks instead of direct API
jest.mock('../../../hooks/usePerformanceElements');
import { usePerformanceElements } from '../../../hooks/usePerformanceElements';

// Setup test cleanup
setupTestCleanup();

describe('EconomicLayer', () => {
  const mockElements = [
    {
      id: 'elem-voice-memo',
      name: 'Victoria\'s Voice Memo',
      calculated_memory_value: 5000,
      memory_group: 'Victoria Memories',
      group_multiplier: 1.5,
      rightful_owner: 'Victoria'
    },
    {
      id: 'elem-diary',
      name: 'Sarah\'s Diary',
      calculated_memory_value: 3000,
      memory_group: 'Sarah Memories',
      group_multiplier: 1.2,
      rightful_owner: 'Sarah'
    },
    {
      id: 'elem-photo',
      name: 'Wedding Photo',
      calculated_memory_value: 1000,
      memory_group: null,
      group_multiplier: 1,
      rightful_owner: 'Marcus'
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
      activeIntelligence: ['economic'],
      selectedEntity: null
    });
    
    // Mock hook responses
    usePerformanceElements.mockImplementation(() => ({
      data: mockElements,
      isLoading: false,
      error: null
    }));
  });

  it('should not render overlays when no entity selected', async () => {
    renderWithQuery(<EconomicLayer nodes={mockNodes} />);
    
    // Should NOT show any value indicators when no entity selected
    expect(screen.queryByTestId('economic-value-elem-voice-memo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('economic-value-elem-diary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('economic-value-elem-photo')).not.toBeInTheDocument();
  });

  it('should show economic overlay when element selected', async () => {
    // Select Victoria's Voice Memo element
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['economic'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    renderWithQuery(<EconomicLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      // Should show economic overlay (not individual node indicators)
      expect(screen.getByTestId('economic-overlay')).toBeInTheDocument();
    });
    
    const overlay = screen.getByTestId('economic-overlay');
    
    // Should show economic intelligence for selected element
    expect(within(overlay).getByText(/Victoria's Voice Memo/)).toBeInTheDocument();
    expect(within(overlay).getByText('$5,000')).toBeInTheDocument(); // More specific - matches h5 element
    expect(within(overlay).getByText(/Victoria Memories/)).toBeInTheDocument();
    expect(within(overlay).getByText(/1.5x/)).toBeInTheDocument();
  });

  it('should show path pressure analysis for high-value element', async () => {
    // Select high-value element 
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['economic'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    renderWithQuery(<EconomicLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('economic-overlay');
      
      // Should show path pressure analysis for high-value token
      expect(within(overlay).getByText(/Choice Pressure: High/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Black Market path/)).toBeInTheDocument();
    });
  });

  it('should show different analysis for character selection', async () => {
    // Select a character instead of element
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['economic'],
      selectedEntity: {
        id: 'char-sarah-mitchell',
        type: 'character',
        name: 'Sarah Mitchell'
      }
    });
    
    renderWithQuery(<EconomicLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('economic-overlay');
      
      // Should show character economic analysis instead of element analysis
      expect(within(overlay).getByText(/Sarah Mitchell/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Token Portfolio/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Economic Role/)).toBeInTheDocument();
    });
  });

  it('should show rightful owner and return path analysis', async () => {
    // Select element to see return path analysis
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['economic'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    renderWithQuery(<EconomicLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('economic-overlay');
      expect(within(overlay).getByText(/Return: Victoria/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Return Path/)).toBeInTheDocument();
    });
  });

  it('should only render when economic layer is active', () => {
    // Deactivate economic layer but select an entity
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story', 'social'],
      selectedEntity: {
        id: 'elem-voice-memo',
        type: 'element',
        name: 'Victoria\'s Voice Memo'
      }
    });
    
    const { container } = renderWithQuery(<EconomicLayer nodes={mockNodes} />);
    
    // Should not render anything when economic layer inactive
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('economic-overlay')).not.toBeInTheDocument();
  });

  it('should handle empty selected entity gracefully', () => {
    // Economic layer active but no entity selected
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['economic'],
      selectedEntity: null
    });
    
    renderWithQuery(<EconomicLayer nodes={mockNodes} />);
    
    // Should not crash and not show overlay
    expect(screen.queryByTestId('economic-overlay')).not.toBeInTheDocument();
  });
  
  afterAll(() => {
    cleanupQueryClient();
  });
});