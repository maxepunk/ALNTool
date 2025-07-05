import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NodeChips from './NodeChips';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('NodeChips', () => {
  it('should render Character type chips', () => {
    const data = {
      type: 'Character',
      properties: {
        tier: 'Core',
        role: 'Hero'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#3f51b5" showChips={true} />);
    
    expect(screen.getByText('Core')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
  });

  it('should render Element type chips', () => {
    const data = {
      type: 'Element',
      properties: {
        basicType: 'Physical Object',
        status: 'Active'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#00897b" showChips={true} />);
    
    expect(screen.getByText('Physical Object')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render Memory Element RFID chip', () => {
    const data = {
      type: 'Element',
      properties: {
        basicType: 'Memory',
        SF_RFID: 'MEM12345'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#2196f3" showChips={true} />);
    
    expect(screen.getByText('RFID: MEM12345')).toBeInTheDocument();
  });

  it('should truncate long RFID values', () => {
    const data = {
      type: 'Element',
      properties: {
        basicType: 'Memory',
        SF_RFID: 'VERYLONGMEMORYID123456'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#2196f3" showChips={true} />);
    
    expect(screen.getByText('RFID: VERYLONG…')).toBeInTheDocument();
  });

  it('should render Puzzle type chips', () => {
    const data = {
      type: 'Puzzle',
      properties: {
        timing: 'Act 2'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#f57c00" showChips={true} />);
    
    expect(screen.getByText('Act 2')).toBeInTheDocument();
  });

  it('should render Timeline type chips', () => {
    const data = {
      type: 'Timeline',
      properties: {
        dateString: '2024-01-15'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#d81b60" showChips={true} />);
    
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('should truncate long chip labels', () => {
    const data = {
      type: 'Character',
      properties: {
        tier: 'Very Long Tier Name That Should Be Truncated'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#3f51b5" showChips={true} />);
    
    expect(screen.getByText('Very Long Ti...')).toBeInTheDocument();
  });

  it('should not render when showChips is false', () => {
    const data = {
      type: 'Character',
      properties: {
        tier: 'Core',
        role: 'Hero'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#3f51b5" showChips={false} />);
    
    expect(screen.queryByText('Core')).not.toBeInTheDocument();
    expect(screen.queryByText('Hero')).not.toBeInTheDocument();
  });

  it('should return null for unknown type', () => {
    const data = {
      type: 'Unknown',
      properties: {}
    };

    const { container } = renderWithTheme(<NodeChips data={data} entityColor="#78909c" showChips={true} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle empty properties', () => {
    const data = {
      type: 'Character',
      properties: {}
    };

    const { container } = renderWithTheme(<NodeChips data={data} entityColor="#3f51b5" showChips={true} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle missing properties', () => {
    const data = {
      type: 'Character'
    };

    const { container } = renderWithTheme(<NodeChips data={data} entityColor="#3f51b5" showChips={true} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should apply correct chip styling', () => {
    const data = {
      type: 'Character',
      properties: {
        tier: 'Core'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#3f51b5" showChips={true} />);
    
    const chip = screen.getByText('Core');
    expect(chip.closest('.MuiChip-root')).toBeInTheDocument();
  });

  it('should handle zoom opacity correctly', () => {
    const data = {
      type: 'Character',
      properties: {
        tier: 'Core'
      }
    };

    renderWithTheme(<NodeChips data={data} entityColor="#3f51b5" showChips={true} zoomOpacity={0.7} />);
    
    const chipContainer = screen.getByText('Core').closest('div').parentElement;
    expect(chipContainer).toHaveStyle('opacity: 0.7');
  });
});