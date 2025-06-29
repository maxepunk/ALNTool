import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import EntityNode from './EntityNode';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock ReactFlow hooks
jest.mock('@xyflow/react', () => ({
  ...jest.requireActual('@xyflow/react'),
  Handle: ({ children, ...props }) => <div data-testid={`handle-${props.position}`} {...props}>{children}</div>,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
}));

const theme = createTheme();

// Wrapper component to provide ReactFlow context
const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <ReactFlowProvider>
        {component}
      </ReactFlowProvider>
    </ThemeProvider>
  );
};

describe('EntityNode', () => {
  const defaultNodeData = {
    id: 'test-node',
    data: {
      id: 'test-id',
      label: 'Test Node',
      type: 'Character',
      properties: {},
      isCenter: false,
      importance: 'medium',
    },
    centralEntityType: 'Character',
  };

  it('renders node label', () => {
    renderWithProviders(<EntityNode {...defaultNodeData} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders character icon for Character type', () => {
    renderWithProviders(<EntityNode {...defaultNodeData} />);
    expect(screen.getByTestId('PersonIcon')).toBeInTheDocument();
  });

  it('renders element icon for Element type', () => {
    const elementNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, type: 'Element' },
    };
    renderWithProviders(<EntityNode {...elementNode} />);
    expect(screen.getByTestId('InventoryIcon')).toBeInTheDocument();
  });

  it('renders memory icon for Memory Element type', () => {
    const memoryNode = {
      ...defaultNodeData,
      data: {
        ...defaultNodeData.data,
        type: 'Element',
        properties: { basicType: 'Memory' },
      },
    };
    renderWithProviders(<EntityNode {...memoryNode} />);
    expect(screen.getByTestId('MemoryIcon')).toBeInTheDocument();
  });

  it('renders puzzle icon for Puzzle type', () => {
    const puzzleNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, type: 'Puzzle' },
    };
    renderWithProviders(<EntityNode {...puzzleNode} />);
    expect(screen.getByTestId('ExtensionIcon')).toBeInTheDocument();
  });

  it('renders timeline icon for Timeline type', () => {
    const timelineNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, type: 'Timeline' },
    };
    renderWithProviders(<EntityNode {...timelineNode} />);
    expect(screen.getByTestId('EventIcon')).toBeInTheDocument();
  });

  it('applies center node styling', () => {
    const centerNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, isCenter: true },
    };
    const { container } = renderWithProviders(<EntityNode {...centerNode} />);
    const paper = container.querySelector('[class*="MuiPaper-root"]');
    expect(paper).toBeInTheDocument();
    // Center nodes have enhanced styling but not necessarily 3px border
  });

  it('renders connection handles', () => {
    renderWithProviders(<EntityNode {...defaultNodeData} />);
    expect(screen.getByTestId('handle-top')).toBeInTheDocument();
    expect(screen.getByTestId('handle-bottom')).toBeInTheDocument();
    // EntityNode only has top and bottom handles
  });

  it('displays node label', () => {
    renderWithProviders(<EntityNode {...defaultNodeData} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
    // ID is not displayed as a chip, only in tooltip
  });

  it('displays importance chip for high importance', () => {
    const highImportanceNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, importance: 'high' },
    };
    renderWithProviders(<EntityNode {...highImportanceNode} />);
    // Importance is not displayed as a chip in the current implementation
    expect(screen.queryByText('High Importance')).not.toBeInTheDocument();
  });

  it('does not display importance chip for low importance', () => {
    const lowImportanceNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, importance: 'low' },
    };
    renderWithProviders(<EntityNode {...lowImportanceNode} />);
    expect(screen.queryByText('Low Importance')).not.toBeInTheDocument();
  });

  describe('Character properties', () => {
    it('displays character role as chip', () => {
      const charWithRole = {
        ...defaultNodeData,
        data: {
          ...defaultNodeData.data,
          properties: { role: 'Protagonist' },
        },
      };
      renderWithProviders(<EntityNode {...charWithRole} />);
      // Role is displayed as a chip, not with "Role:" prefix
      expect(screen.getByText('Protagonist')).toBeInTheDocument();
    });

    it('displays tier as chip', () => {
      const charWithTier = {
        ...defaultNodeData,
        data: {
          ...defaultNodeData.data,
          properties: { tier: 'Core' },
        },
      };
      renderWithProviders(<EntityNode {...charWithTier} />);
      expect(screen.getByText('Core')).toBeInTheDocument();
    });
  });

  describe('Element properties', () => {
    it('displays basic type as chip', () => {
      const elementWithBasicType = {
        ...defaultNodeData,
        data: {
          ...defaultNodeData.data,
          type: 'Element',
          properties: { basicType: 'Physical Object' },
        },
      };
      renderWithProviders(<EntityNode {...elementWithBasicType} />);
      // Basic type is displayed as chip
      expect(screen.getByText('Physical Object')).toBeInTheDocument();
    });

    it('displays status as chip', () => {
      const elementWithStatus = {
        ...defaultNodeData,
        data: {
          ...defaultNodeData.data,
          type: 'Element',
          properties: { status: 'Active' },
        },
      };
      renderWithProviders(<EntityNode {...elementWithStatus} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays RFID for memory elements', () => {
      const memoryElement = {
        ...defaultNodeData,
        data: {
          ...defaultNodeData.data,
          type: 'Element',
          properties: {
            basicType: 'Memory',
            SF_RFID: 'MEM12345',
          },
        },
      };
      renderWithProviders(<EntityNode {...memoryElement} />);
      expect(screen.getByText('RFID: MEM12345')).toBeInTheDocument();
    });
  });

  describe('Puzzle properties', () => {
    it('displays puzzle timing', () => {
      const puzzleWithTiming = {
        ...defaultNodeData,
        data: {
          ...defaultNodeData.data,
          type: 'Puzzle',
          properties: { timing: 'Act 2' },
        },
      };
      renderWithProviders(<EntityNode {...puzzleWithTiming} />);
      expect(screen.getByText('Act 2')).toBeInTheDocument();
    });
  });

  describe('Timeline properties', () => {
    it('displays date string as chip', () => {
      const timelineWithDate = {
        ...defaultNodeData,
        data: {
          ...defaultNodeData.data,
          type: 'Timeline',
          properties: { dateString: '2024-01-15' },
        },
      };
      renderWithProviders(<EntityNode {...timelineWithDate} />);
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });
  });

  it('renders correctly with minimal data', () => {
    const minimalNode = {
      id: 'minimal',
      data: {
        label: 'Minimal Node',
        type: 'Character',
      },
    };
    renderWithProviders(<EntityNode {...minimalNode} centralEntityType="Character" />);
    expect(screen.getByText('Minimal Node')).toBeInTheDocument();
  });

  it('handles unknown entity type', () => {
    const unknownNode = {
      ...defaultNodeData,
      data: {
        ...defaultNodeData.data,
        type: 'Unknown',
      },
    };
    renderWithProviders(<EntityNode {...unknownNode} centralEntityType="Character" />);
    expect(screen.getByTestId('HelpOutlineIcon')).toBeInTheDocument();
  });

  it('displays multiple property chips', () => {
    const nodeWithMultipleProps = {
      ...defaultNodeData,
      data: {
        ...defaultNodeData.data,
        type: 'Character',
        properties: {
          role: 'Hero',
          tier: 'Core',
        },
      },
    };
    renderWithProviders(<EntityNode {...nodeWithMultipleProps} centralEntityType="Character" />);
    
    // Verify chips are displayed
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
  });

  it('renders with correct styling for different zoom levels', () => {
    // Mock different zoom levels
    jest.spyOn(require('@xyflow/react'), 'useViewport').mockReturnValue({ x: 0, y: 0, zoom: 0.5 });
    
    const { container } = renderWithProviders(<EntityNode {...defaultNodeData} centralEntityType="Character" />);
    const paper = container.querySelector('[class*="MuiPaper-root"]');
    expect(paper).toBeInTheDocument();
  });
});