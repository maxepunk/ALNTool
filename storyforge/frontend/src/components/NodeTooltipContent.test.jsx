import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NodeTooltipContent from './NodeTooltipContent';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('NodeTooltipContent', () => {
  it('should render basic tooltip content', () => {
    const data = {
      label: 'Test Node',
      type: 'Character',
      properties: {
        name: 'Test Character',
        tier: 'Core',
        role: 'Hero'
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText(/Type: Character/)).toBeInTheDocument();
    expect(screen.getByText(/Tier:/)).toBeInTheDocument();
    expect(screen.getByText(/Role:/)).toBeInTheDocument();
  });

  it('should handle Character type properties', () => {
    const data = {
      label: 'Character Node',
      type: 'Character',
      properties: {
        name: 'Hero Character',
        tier: 'Core',
        role: 'Protagonist',
        primaryActionSnippet: 'Saves the day'
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Hero Character')).toBeInTheDocument();
    expect(screen.getByText(/Tier:/)).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
    expect(screen.getByText(/Role:/)).toBeInTheDocument();
    expect(screen.getByText('Protagonist')).toBeInTheDocument();
    expect(screen.getByText(/Primary Action Snippet:/)).toBeInTheDocument();
    expect(screen.getByText('Saves the day')).toBeInTheDocument();
  });

  it('should handle Element type properties', () => {
    const data = {
      label: 'Element Node',
      type: 'Element',
      properties: {
        name: 'Magic Sword',
        basicType: 'Physical Object',
        status: 'Active'
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
    expect(screen.getByText(/Basic Type:/)).toBeInTheDocument();
    expect(screen.getByText('Physical Object')).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should handle Puzzle type properties', () => {
    const data = {
      label: 'Puzzle Node',
      type: 'Puzzle',
      properties: {
        name: 'Mystery Box',
        timing: 'Act 2',
        ownerName: 'Detective Smith'
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Mystery Box')).toBeInTheDocument();
    expect(screen.getByText(/Timing:/)).toBeInTheDocument();
    expect(screen.getByText('Act 2')).toBeInTheDocument();
    expect(screen.getByText(/Owner Name:/)).toBeInTheDocument();
    expect(screen.getByText('Detective Smith')).toBeInTheDocument();
  });

  it('should handle Timeline type properties', () => {
    const data = {
      label: 'Timeline Node',
      type: 'Timeline',
      properties: {
        name: 'Key Event',
        dateString: '2024-01-15',
        participantSummary: 'Main characters'
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Key Event')).toBeInTheDocument();
    expect(screen.getByText(/Date String:/)).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText(/Participant Summary:/)).toBeInTheDocument();
    expect(screen.getByText('Main characters')).toBeInTheDocument();
  });

  it('should handle filter attributes section', () => {
    const data = {
      label: 'Test Node',
      type: 'Character',
      properties: {
        name: 'Test Character',
        actFocus: 1,
        themes: ['Mystery', 'Romance'],
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Filter Attributes')).toBeInTheDocument();
    expect(screen.getByText(/Act Focus:/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/Themes:/)).toBeInTheDocument();
    expect(screen.getByText('Mystery, Romance')).toBeInTheDocument();
  });

  it('should handle memory sets for Element type', () => {
    const data = {
      label: 'Memory Element',
      type: 'Element',
      properties: {
        name: 'Memory Card',
        memorySets: ['Set A', 'Set B']
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText(/Memory Sets:/)).toBeInTheDocument();
    expect(screen.getByText('Set A, Set B')).toBeInTheDocument();
  });

  it('should handle full description section', () => {
    const data = {
      label: 'Test Node',
      type: 'Character',
      properties: {
        name: 'Test Character',
        fullDescription: 'This is a very detailed description of the character.'
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('This is a very detailed description of the character.')).toBeInTheDocument();
  });

  it('should handle different internal type', () => {
    const data = {
      label: 'Test Node',
      type: 'Character',
      properties: {
        name: 'Test Character',
        type: 'NPC' // Different from general type
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText(/Type: Character \(NPC\)/)).toBeInTheDocument();
  });

  it('should handle missing or empty properties gracefully', () => {
    const data = {
      label: 'Minimal Node',
      type: 'Character',
      properties: {}
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Minimal Node')).toBeInTheDocument();
    expect(screen.getByText(/Type: Character/)).toBeInTheDocument();
  });

  it('should fallback to label when name is not available', () => {
    const data = {
      label: 'Fallback Label',
      type: 'Character',
      properties: {
        tier: 'Core'
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Fallback Label')).toBeInTheDocument();
  });

  it('should filter out null and undefined values', () => {
    const data = {
      label: 'Test Node',
      type: 'Character',
      properties: {
        name: 'Test Character',
        tier: null,
        role: undefined,
        primaryActionSnippet: ''
      }
    };

    renderWithTheme(<NodeTooltipContent data={data} />);
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.queryByText(/Tier:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Role:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Primary Action Snippet:/)).not.toBeInTheDocument();
  });
});