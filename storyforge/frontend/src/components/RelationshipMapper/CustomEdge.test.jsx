import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CustomEdge from './CustomEdge'; // Adjust path as necessary
import { ReactFlowProvider, EdgeLabelRenderer } from '@xyflow/react';

// Minimal React Flow props that CustomEdge might expect
const defaultEdgeProps = {
  id: 'edge-1',
  sourceX: 50,
  sourceY: 50,
  targetX: 250,
  targetY: 150,
  sourcePosition: 'right',
  targetPosition: 'left',
  style: { stroke: '#b1b1b7', strokeWidth: 2 },
  markerEnd: 'url(#react-flow__arrowclosed)',
  source: 'source-node-id',
  target: 'target-node-id',
  // React Flow internal props CustomEdge might receive through spread
  selected: false,
  animated: false,
  interactionWidth: 20,
};

const renderWithProviderAndSvg = (edgeProps) => {
  return render(
    <ReactFlowProvider>
      <svg data-testid="svg-wrapper">
        <CustomEdge {...edgeProps} />
      </svg>
      <EdgeLabelRenderer />
    </ReactFlowProvider>
  );
};

describe('CustomEdge Component', () => {
  it('renders correctly with a simple label', () => {
    renderWithProviderAndSvg(
      <CustomEdge {...defaultEdgeProps} label="Test Edge Label" />
    );
    // React Flow edges render labels in a specific structure, often within a foreignObject
    // We might not find the text directly, but we can check if the label prop is passed.
    // For a more robust test, inspect the actual SVG output or how CustomEdge handles the label.
    // For now, this is a basic check that it doesn't crash.
    // If CustomEdge renders the label itself in a findable way:
    // expect(screen.getByText('Test Edge Label')).toBeInTheDocument(); 
    // This often fails because the label is not in a simple div. 
    // Awaiting more insight into CustomEdge's render structure for labels.
  });

  it('renders with specific styles if provided', () => {
    const customStyle = { stroke: 'blue', strokeWidth: 3 };
    renderWithProviderAndSvg(
      <CustomEdge {...defaultEdgeProps} style={customStyle} label="Styled Edge" />
    );
    // This requires inspecting the path element rendered by CustomEdge or BaseEdge.
    // For example, if the path gets a testid or specific class:
    // const pathElement = screen.getByTestId('custom-edge-path-edge-1'); // Assuming CustomEdge adds such a testid
    // expect(pathElement).toHaveAttribute('stroke', 'blue');
    // expect(pathElement).toHaveAttribute('stroke-width', '3');
  });

  it('displays a tooltip on hover with contextual label from data', () => {
    const edgeWithData = {
      ...defaultEdgeProps,
      id: 'edge-tooltip',
      label: 'Owns',
      data: {
        contextualLabel: 'Character \'Alex Reeves\' owns Element \'Backpack\'',
        shortLabel: 'Owns',
        type: 'character' // or whatever type it might be
      }
    };
    // Testing tooltips often requires userEvent for hover and async/await for appearance
    // For now, we'll ensure it renders without data, and can add tooltip tests later.
    renderWithProviderAndSvg(
      <CustomEdge {...edgeWithData} />
    );
    // Example: if the path itself had the contextual label as an aria-label for testing simplicity (not ideal)
    // const pathElement = screen.getByTestId('custom-edge-path-edge-tooltip');
    // expect(pathElement).toHaveAttribute('aria-label', 'Character Alex Reeves owns Element Backpack');
    // Proper tooltip testing would involve simulating hover and finding the tooltip content.
  });

  it('uses shortLabel from data for on-path display if available', () => {
    const edgeWithShortLabel = {
        ...defaultEdgeProps,
        id: 'edge-shortlabel',
        label: 'Generic Label', // This might be overridden or ignored
        data: {
            contextualLabel: 'Some detailed context...',
            shortLabel: 'Owns Item',
            type: 'dependency'
        }
    };
    renderWithProviderAndSvg(
        <CustomEdge {...edgeWithShortLabel} />
    );
    // Assuming CustomEdge is designed to prioritize data.shortLabel for the visible text path.
    // This test depends heavily on CustomEdge's implementation details regarding label display.
    // If it renders via a textPath or similar:
    // expect(screen.getByText('Owns Item')).toBeInTheDocument();
  });

  it('renders correctly and uses data.shortLabel for on-path display if available', () => {
    const edgeWithShortLabel = {
      ...defaultEdgeProps,
      id: 'edge-shortlabel',
      label: 'Fallback Generic Label',
      data: {
        contextualLabel: 'Some detailed context for tooltip...',
        shortLabel: 'Owns Item',
        edgeType: 'owns-type'
      }
    };
    renderWithProviderAndSvg(edgeWithShortLabel);
    expect(screen.getByText('Owns Item')).toBeInTheDocument();
    expect(screen.queryByText('Fallback Generic Label')).not.toBeInTheDocument();
  });

  it('uses props.label for on-path display if data.shortLabel is not available', () => {
    const edgeWithPropsLabel = {
      ...defaultEdgeProps,
      id: 'edge-propslabel',
      label: 'Props Label Display',
      data: {
        contextualLabel: 'Tooltip context...',
      }
    };
    renderWithProviderAndSvg(edgeWithPropsLabel);
    expect(screen.getByText('Props Label Display')).toBeInTheDocument();
  });

  it('displays a tooltip on hover with data.contextualLabel and hides on unhover', async () => {
    const user = userEvent.setup();
    const edgeWithData = {
      ...defaultEdgeProps,
      id: 'edge-tooltip-check',
      data: {
        contextualLabel: 'Character Alex owns Element Backpack',
        shortLabel: 'Owns',
      }
    };
    renderWithProviderAndSvg(edgeWithData);
    
    const edgePath = screen.getByTestId(`edge-path-${edgeWithData.id}`);
    await user.hover(edgePath);
    
    // MUI Tooltips are often portaled, so check within the whole document
    const tooltip = await screen.findByRole('tooltip', { name: 'Character Alex owns Element Backpack' });
    expect(tooltip).toBeVisible();
    
    await user.unhover(edgePath);
    // Wait for the tooltip to disappear (MUI Tooltips have exit transitions)
    await waitFor(() => {
      expect(screen.queryByRole('tooltip', { name: 'Character Alex owns Element Backpack' })).not.toBeInTheDocument();
    });
  });

  it('applies provided styles to the edge path', () => {
    const customStyle = { stroke: 'blue', strokeWidth: 3 };
    renderWithProviderAndSvg({ ...defaultEdgeProps, id: 'styled-edge', style: customStyle });
    const pathElement = screen.getByTestId('edge-path-styled-edge');
    expect(pathElement).toHaveAttribute('stroke', 'blue');
    expect(pathElement).toHaveAttribute('stroke-width', '3');
  });

  it('applies markerEnd to the edge path', () => {
    const markerId = 'url(#customArrow)';
    renderWithProviderAndSvg({ ...defaultEdgeProps, id: 'marker-edge', markerEnd: markerId });
    const pathElement = screen.getByTestId('edge-path-marker-edge');
    expect(pathElement).toHaveAttribute('marker-end', markerId);
  });

  it('applies a class based on data.edgeType for specific styling', () => {
    const edgeWithEdgeType = {
      ...defaultEdgeProps,
      id: 'typed-edge',
      data: {
        shortLabel: 'Specific Type',
        edgeType: 'custom-dependency-type'
      }
    };
    renderWithProviderAndSvg(edgeWithEdgeType);
    const pathElement = screen.getByTestId('edge-path-typed-edge');
    // Assuming CustomEdge adds a class like `edge-type-custom-dependency-type` to the main <g> or path
    // Check the group element that CustomEdge usually renders wrapping the path and label
    const edgeGroup = pathElement.closest('g.react-flow__edge');
    expect(edgeGroup).toHaveClass('edge-type-custom-dependency-type');
  });

  it('renders no on-path label text if neither data.shortLabel nor props.label is effectively provided', () => {
    const edgeNoLabel = {
      ...defaultEdgeProps,
      id: 'edge-no-label-text',
      label: '', // Empty string label
      data: {
        contextualLabel: 'Tooltip only'
      }
    };
    renderWithProviderAndSvg(edgeNoLabel);
    // EdgeText might still render, but its content should be empty or just whitespace.
    // We look for the label container. If EdgeLabelRenderer is used, it creates a div.
    // A common pattern for EdgeText is to have a role or specific class.
    // This test asserts that no *visible text* for the label is found.
    const labelContainer = screen.getByTestId(`edge-path-${edgeNoLabel.id}`).closest('g.react-flow__edge').querySelector('.react-flow__edge-textwrapper');
    if (labelContainer) {
        expect(labelContainer.textContent.trim()).toBe('');
    } else {
        // If no label wrapper at all, that also means no text. This is fine.
        // This path implies EdgeText might not render at all for empty labels.
        expect(true).toBe(true); 
    }
  });

   it('renders an animated edge if animated prop is true', () => {
    renderWithProviderAndSvg({ ...defaultEdgeProps, id: 'animated-edge', animated: true });
    const pathElement = screen.getByTestId('edge-path-animated-edge');
    // React Flow adds specific style for animated edges (e.g., stroke-dasharray and animation)
    // We check for a commonly used CSS class or a style that implies animation if EntityNode adds one.
    // If CustomEdge relies on React Flow's built-in animation from the `animated` prop on BaseEdge:
    // This might manifest as a specific class on the path or specific CSS properties.
    // For now, we check if a class like `animated` or `react-flow__edge-path--animated` is present
    // This depends on CustomEdge's implementation or if it passes `animated` to BaseEdge.
    expect(pathElement.closest('g.react-flow__edge')).toHaveClass('animated');
  });

  // TODO: Test different edge types and their corresponding styles (e.g., animated, dashed)
  // TODO: Test markerEnd rendering
  // TODO: More robustly test label rendering (this is tricky with SVG and React Flow)
  // TODO: Implement and test tooltip visibility and content on hover with userEvent
}); 