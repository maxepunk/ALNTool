/**
 * Tests for ProductionIntelligenceLayer component
 * Entity-responsive production reality intelligence overlay
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../../test-utils/test-utils';
import { setupTestCleanup } from '../../../test-utils/cleanup-utils';
import ProductionIntelligenceLayer from '../ProductionIntelligenceLayer';
import { useJourneyIntelligenceStore } from '../../../stores/journeyIntelligenceStore';

// Mock our data hooks
jest.mock('../../../hooks/usePerformanceElements');
jest.mock('../../../hooks/useCharacterJourney');
import { usePerformanceElements } from '../../../hooks/usePerformanceElements';
import { useCharacterJourney } from '../../../hooks/useCharacterJourney';

// Setup test cleanup
setupTestCleanup();

describe('ProductionIntelligenceLayer', () => {
  const mockElements = [
    {
      id: 'elem-cease-desist',
      name: 'Cease & Desist Papers',
      owner_character_id: 'char-alex-reeves',
      physical_prop: 'Legal document prop',
      rfid_tag: 'RFID_001',
      production_status: 'Ready',
      container: 'Alex\'s briefcase'
    },
    {
      id: 'elem-scanner',
      name: 'RFID Scanner',
      owner_character_id: null,
      physical_prop: 'Scanner device',
      rfid_tag: null,
      production_status: 'Critical Missing',
      container: null
    },
    {
      id: 'elem-voice-memo',
      name: 'Victoria\'s Voice Memo',
      owner_character_id: 'char-victoria',
      physical_prop: 'Voice recorder prop',
      rfid_tag: 'RFID_023',
      production_status: 'Ready',
      container: 'Jewelry box'
    }
  ];

  const mockPuzzles = [
    {
      id: 'puzzle-jewelry-box',
      name: 'Sarah\'s Jewelry Box',
      physical_props_required: ['Jewelry box', 'Combination lock', 'Business cards'],
      production_complexity: 'Medium',
      critical_dependencies: ['Derek\'s attendance required'],
      setup_time: '15 minutes'
    },
    {
      id: 'puzzle-revelation',
      name: 'Memory Token Revelation',
      physical_props_required: ['RFID scanner', 'Video display', 'Memory tokens'],
      production_complexity: 'High',
      critical_dependencies: ['RFID Scanner - MISSING'],
      setup_time: '30 minutes'
    }
  ];

  const mockCharacters = [
    {
      id: 'char-alex-reeves',
      name: 'Alex Reeves',
      props_required: ['Briefcase', 'Business cards', 'Cease & Desist papers'],
      critical_missing: [],
      production_notes: 'Needs confident actor for investigative role'
    },
    {
      id: 'char-derek',
      name: 'Derek',
      props_required: ['Gym bag', 'Business cards', 'Combination note'],
      critical_missing: ['RFID scanner access'],
      production_notes: 'Athletic wear required'
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
      activeIntelligence: ['production'],
      selectedEntity: null
    });
    
    // Mock hook responses
    usePerformanceElements.mockImplementation(() => ({
      data: mockElements,
      isLoading: false,
      error: null
    }));

    useCharacterJourney.mockImplementation(() => ({
      data: { props_required: [] },
      isLoading: false,
      error: null
    }));
  });

  it('should not render overlays when no entity selected', async () => {
    renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    // Should NOT show any production indicators when no entity selected
    expect(screen.queryByTestId('production-overlay')).not.toBeInTheDocument();
  });

  it('should show production overlay when element selected', async () => {
    // Select element with production data
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['production'],
      selectedEntity: {
        id: 'elem-cease-desist',
        type: 'element',
        name: 'Cease & Desist Papers'
      }
    });
    
    renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('production-overlay')).toBeInTheDocument();
    });
    
    const overlay = screen.getByTestId('production-overlay');
    
    // Should show production intelligence for selected element
    expect(within(overlay).getByText(/Cease & Desist Papers/)).toBeInTheDocument();
    expect(within(overlay).getByText(/Physical Prop/)).toBeInTheDocument();
    expect(within(overlay).getByText(/RFID Status/)).toBeInTheDocument();
  });

  it('should show RFID and container details for element', async () => {
    // Select element with RFID tag
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['production'],
      selectedEntity: {
        id: 'elem-cease-desist',
        type: 'element',
        name: 'Cease & Desist Papers',
        physical_prop: 'Legal document prop',
        rfid_tag: 'RFID_001',
        production_status: 'Ready',
        container: 'Alex\'s briefcase'
      }
    });
    
    renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('production-overlay');
      
      // Should show production details
      expect(within(overlay).getByText(/Legal document prop/)).toBeInTheDocument();
      expect(within(overlay).getByText(/RFID_001/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Alex's briefcase/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Ready/)).toBeInTheDocument();
    });
  });

  it('should show critical missing warning for missing items', async () => {
    // Select element that's missing
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['production'],
      selectedEntity: {
        id: 'elem-scanner',
        type: 'element',
        name: 'RFID Scanner',
        physical_prop: 'Scanner device',
        rfid_tag: null,
        production_status: 'Critical Missing',
        container: null
      }
    });
    
    renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('production-overlay');
      
      // Should show warning for missing item
      expect(within(overlay).getByText(/Critical Missing/)).toBeInTheDocument();
      expect(within(overlay).getByText(/No RFID tag assigned/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Blocks revelation scene/)).toBeInTheDocument();
    });
  });

  it('should show puzzle production requirements when puzzle selected', async () => {
    // Select a puzzle
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['production'],
      selectedEntity: {
        id: 'puzzle-jewelry-box',
        type: 'puzzle',
        name: 'Sarah\'s Jewelry Box',
        physical_props_required: ['Jewelry box', 'Combination lock', 'Business cards'],
        production_complexity: 'Medium',
        critical_dependencies: ['Derek\'s attendance required'],
        setup_time: '15 minutes'
      }
    });
    
    renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('production-overlay');
      
      // Should show puzzle production requirements
      expect(within(overlay).getByText(/Sarah's Jewelry Box/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Physical Props Required/)).toBeInTheDocument();
      expect(within(overlay).getByText(/3 props needed/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Setup Time/)).toBeInTheDocument();
      expect(within(overlay).getByText(/15 minutes/)).toBeInTheDocument();
    });
  });

  it('should show character prop requirements when character selected', async () => {
    // Select a character
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['production'],
      selectedEntity: {
        id: 'char-alex-reeves',
        type: 'character',
        name: 'Alex Reeves',
        props_required: ['Briefcase', 'Business cards', 'Cease & Desist papers'],
        critical_missing: [],
        production_notes: 'Needs confident actor for investigative role'
      }
    });
    
    renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    await waitFor(() => {
      const overlay = screen.getByTestId('production-overlay');
      
      // Should show character production requirements
      expect(within(overlay).getByText(/Alex Reeves/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Props Required/)).toBeInTheDocument();
      expect(within(overlay).getByText(/Production Notes/)).toBeInTheDocument();
      expect(within(overlay).getByText(/confident actor/)).toBeInTheDocument();
    });
  });

  it('should only render when production layer is active', () => {
    // Deactivate production layer but select an entity
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['story', 'social'],
      selectedEntity: {
        id: 'elem-cease-desist',
        type: 'element',
        name: 'Cease & Desist Papers'
      }
    });
    
    const { container } = renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    // Should not render anything when production layer inactive
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('production-overlay')).not.toBeInTheDocument();
  });

  it('should handle empty selected entity gracefully', () => {
    // Production layer active but no entity selected
    useJourneyIntelligenceStore.setState({
      activeIntelligence: ['production'],
      selectedEntity: null
    });
    
    renderWithQuery(<ProductionIntelligenceLayer nodes={mockNodes} />);
    
    // Should not crash and not show overlay
    expect(screen.queryByTestId('production-overlay')).not.toBeInTheDocument();
  });
  
  afterAll(() => {
    cleanupQueryClient();
  });
});