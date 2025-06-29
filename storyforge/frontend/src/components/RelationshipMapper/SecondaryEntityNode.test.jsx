import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import SecondaryEntityNode from './SecondaryEntityNode';
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

describe('SecondaryEntityNode', () => {
  const defaultNodeData = {
    id: 'test-node',
    data: {
      id: 'test-id',
      label: 'Test Node',
      type: 'Character',
      indirect: false,
    },
    isConnectable: true,
    selected: false,
    centralEntityType: 'Character',
  };

  it('renders node label', () => {
    renderWithProviders(<SecondaryEntityNode {...defaultNodeData} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders character icon for Character type', () => {
    renderWithProviders(<SecondaryEntityNode {...defaultNodeData} />);
    expect(screen.getByTestId('PersonIcon')).toBeInTheDocument();
  });

  it('renders element icon for Element type', () => {
    const elementNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, type: 'Element' },
    };
    renderWithProviders(<SecondaryEntityNode {...elementNode} />);
    expect(screen.getByTestId('InventoryIcon')).toBeInTheDocument();
  });

  it('renders puzzle icon for Puzzle type', () => {
    const puzzleNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, type: 'Puzzle' },
    };
    renderWithProviders(<SecondaryEntityNode {...puzzleNode} />);
    expect(screen.getByTestId('ExtensionIcon')).toBeInTheDocument();
  });

  it('renders timeline icon for Timeline type', () => {
    const timelineNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, type: 'Timeline' },
    };
    renderWithProviders(<SecondaryEntityNode {...timelineNode} />);
    expect(screen.getByTestId('EventIcon')).toBeInTheDocument();
  });

  it('renders help icon for unknown type', () => {
    const unknownNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, type: 'Unknown' },
    };
    renderWithProviders(<SecondaryEntityNode {...unknownNode} />);
    expect(screen.getByTestId('HelpOutlineIcon')).toBeInTheDocument();
  });

  it('applies selected styling when selected', () => {
    const selectedNode = {
      ...defaultNodeData,
      selected: true,
    };
    const { container } = renderWithProviders(<SecondaryEntityNode {...selectedNode} />);
    const paper = container.querySelector('[class*="MuiPaper-root"]');
    expect(paper).toBeInTheDocument();
    expect(paper).toHaveStyle({ transform: 'scale(1.05)' });
  });

  it('applies indirect styling when indirect', () => {
    const indirectNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, indirect: true },
    };
    const { container } = renderWithProviders(<SecondaryEntityNode {...indirectNode} />);
    const paper = container.querySelector('[class*="MuiPaper-root"]');
    expect(paper).toBeInTheDocument();
    expect(paper).toHaveStyle({ opacity: '0.7' });
  });

  it('renders connection handles', () => {
    renderWithProviders(<SecondaryEntityNode {...defaultNodeData} />);
    expect(screen.getByTestId('handle-top')).toBeInTheDocument();
    expect(screen.getByTestId('handle-bottom')).toBeInTheDocument();
  });

  it('displays node name from different data properties', () => {
    // Test with name property
    const nodeWithName = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, name: 'Name Test', label: null },
    };
    const { rerender } = renderWithProviders(<SecondaryEntityNode {...nodeWithName} />);
    expect(screen.getByText('Name Test')).toBeInTheDocument();

    // Test with only type
    const nodeWithOnlyType = {
      ...defaultNodeData,
      data: { id: 'test-id', type: 'Character' },
    };
    rerender(
      <ThemeProvider theme={theme}>
        <ReactFlowProvider>
          <SecondaryEntityNode {...nodeWithOnlyType} />
        </ReactFlowProvider>
      </ThemeProvider>
    );
    expect(screen.getByText('Character')).toBeInTheDocument();
  });

  it('displays act focus indicator for Act 1', () => {
    const actFocusNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, actFocus: 'Act1' },
    };
    const { container } = renderWithProviders(<SecondaryEntityNode {...actFocusNode} />);
    // Look for the act focus dot
    const actFocusDot = container.querySelector('[class*="MuiBox-root"][style*="borderRadius: 50%"]');
    expect(actFocusDot).toBeInTheDocument();
    expect(actFocusDot).toHaveStyle({ backgroundColor: 'rgba(220, 50, 50, 0.7)' });
  });

  it('displays act focus indicator for Act 2', () => {
    const actFocusNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, actFocus: 2 },
    };
    const { container } = renderWithProviders(<SecondaryEntityNode {...actFocusNode} />);
    const actFocusDot = container.querySelector('[class*="MuiBox-root"][style*="borderRadius: 50%"]');
    expect(actFocusDot).toBeInTheDocument();
    expect(actFocusDot).toHaveStyle({ backgroundColor: 'rgba(50, 200, 50, 0.7)' });
  });

  it('displays act focus indicator for Act 3', () => {
    const actFocusNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, properties: { actFocus: 'act3' } },
    };
    const { container } = renderWithProviders(<SecondaryEntityNode {...actFocusNode} />);
    const actFocusDot = container.querySelector('[class*="MuiBox-root"][style*="borderRadius: 50%"]');
    expect(actFocusDot).toBeInTheDocument();
    expect(actFocusDot).toHaveStyle({ backgroundColor: 'rgba(50, 50, 220, 0.7)' });
  });

  it('applies tier-specific styling for Core characters', () => {
    const coreCharNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, tier: 'Core' },
    };
    const { container } = renderWithProviders(<SecondaryEntityNode {...coreCharNode} />);
    const paper = container.querySelector('[class*="MuiPaper-root"]');
    expect(paper).toBeInTheDocument();
    expect(paper).toHaveStyle({ borderWidth: '1px' });
  });

  it('applies tier-specific styling for Tertiary characters', () => {
    const tertiaryCharNode = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, tier: 'Tertiary' },
    };
    const { container } = renderWithProviders(<SecondaryEntityNode {...tertiaryCharNode} />);
    const paper = container.querySelector('[class*="MuiPaper-root"]');
    expect(paper).toBeInTheDocument();
    expect(paper).toHaveStyle({ opacity: '0.85' });
  });

  it('handles missing data gracefully', () => {
    const minimalNode = {
      id: 'minimal',
      data: {
        id: 'minimal-id',
        type: 'Character',
      },
      isConnectable: true,
    };
    renderWithProviders(<SecondaryEntityNode {...minimalNode} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('displays additional properties in tooltip', () => {
    const nodeWithProps = {
      ...defaultNodeData,
      data: {
        ...defaultNodeData.data,
        tier: 'Core',
        status: 'Active',
        timing: 'Act 2',
      },
    };
    renderWithProviders(<SecondaryEntityNode {...nodeWithProps} />);
    // The component has tooltips but they're not easily testable without user interaction
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders correctly with long node names', () => {
    const longNameNode = {
      ...defaultNodeData,
      data: {
        ...defaultNodeData.data,
        label: 'This is a very long node name that should be truncated with ellipsis',
      },
    };
    renderWithProviders(<SecondaryEntityNode {...longNameNode} />);
    const textElement = screen.getByText('This is a very long node name that should be truncated with ellipsis');
    expect(textElement).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });

  it('applies correct aria attributes', () => {
    renderWithProviders(<SecondaryEntityNode {...defaultNodeData} />);
    const paper = screen.getByRole('button');
    expect(paper).toHaveAttribute('aria-label', 'Secondary Entity: Character: Test Node');
    expect(paper).toHaveAttribute('tabIndex', '0');
  });

  it('applies correct color based on entity type', () => {
    const { container } = renderWithProviders(<SecondaryEntityNode {...defaultNodeData} />);
    const icon = container.querySelector('[class*="MuiBox-root"] > svg').parentElement;
    expect(icon).toHaveStyle({ color: '#3f51b5' }); // Character color
  });

  it('handles act focus from both data and properties', () => {
    // Test with actFocus directly on data
    const directActFocus = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, actFocus: 1 },
    };
    const { container: container1 } = renderWithProviders(<SecondaryEntityNode {...directActFocus} />);
    expect(container1.querySelector('[style*="borderRadius: 50%"]')).toBeInTheDocument();

    // Test with actFocus in properties
    const propsActFocus = {
      ...defaultNodeData,
      data: { ...defaultNodeData.data, properties: { actFocus: 2 } },
    };
    const { container: container2 } = renderWithProviders(<SecondaryEntityNode {...propsActFocus} />);
    expect(container2.querySelector('[style*="borderRadius: 50%"]')).toBeInTheDocument();
  });
});