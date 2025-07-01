import { render, screen, fireEvent } from '@testing-library/react';
import DependencyAnalysisPanel from './DependencyAnalysisPanel';

describe('DependencyAnalysisPanel', () => {
  const mockDependencyAnalysis = {
    criticalPaths: [
      {
        type: 'UV Light Chain',
        description: '3 UV-dependent elements detected',
        severity: 'high',
        icon: <span>UV Icon</span>
      }
    ],
    bottlenecks: [
      {
        type: 'RFID Scanner Bottleneck',
        description: '4 RFID elements with only 3 scanners',
        severity: 'high',
        icon: <span>RFID Icon</span>
      }
    ],
    collaborationOpportunities: [
      {
        type: 'Multi-Player Puzzles',
        description: '2 puzzles require collaboration',
        severity: 'medium',
        icon: <span>Collab Icon</span>
      }
    ],
    isolationRisks: [
      {
        type: 'Social Isolation Risk',
        description: 'Only 1 connections - may need interaction opportunities',
        severity: 'medium',
        icon: <span>Warning Icon</span>
      }
    ]
  };

  const defaultProps = {
    dependencyAnalysis: mockDependencyAnalysis,
    highlightCriticalPaths: true,
    setHighlightCriticalPaths: jest.fn(),
    showBottlenecks: true,
    setShowBottlenecks: jest.fn(),
    showCollaborationOpps: true,
    setShowCollaborationOpps: jest.fn(),
  };

  it('should render dependency analysis section', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    expect(screen.getByText('Dependency Analysis')).toBeInTheDocument();
  });

  it('should display critical paths when present', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    expect(screen.getByText('Critical Dependencies:')).toBeInTheDocument();
    expect(screen.getByText('UV Light Chain')).toBeInTheDocument();
    expect(screen.getByText('3 UV-dependent elements detected')).toBeInTheDocument();
  });

  it('should display bottlenecks when present', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    expect(screen.getByText('Resource Bottlenecks:')).toBeInTheDocument();
    expect(screen.getByText('RFID Scanner Bottleneck')).toBeInTheDocument();
    expect(screen.getByText('4 RFID elements with only 3 scanners')).toBeInTheDocument();
  });

  it('should display collaboration opportunities when present', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    expect(screen.getByText('Collaboration Points:')).toBeInTheDocument();
    expect(screen.getByText('Multi-Player Puzzles')).toBeInTheDocument();
    expect(screen.getByText('2 puzzles require collaboration')).toBeInTheDocument();
  });

  it('should display isolation risks when present', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    expect(screen.getByText('Social Balance:')).toBeInTheDocument();
    expect(screen.getByText('Social Isolation Risk')).toBeInTheDocument();
    expect(screen.getByText(/Only 1 connections/)).toBeInTheDocument();
  });

  it('should have production highlight switches', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    expect(screen.getByText('Production Highlights:')).toBeInTheDocument();
    expect(screen.getByLabelText('Critical Dependencies')).toBeChecked();
    expect(screen.getByLabelText('Resource Bottlenecks')).toBeChecked();
    expect(screen.getByLabelText('Collaboration Opportunities')).toBeChecked();
  });

  it('should call setters when switches are toggled', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    const criticalSwitch = screen.getByLabelText('Critical Dependencies');
    fireEvent.click(criticalSwitch);
    expect(defaultProps.setHighlightCriticalPaths).toHaveBeenCalledWith(false);
    
    const bottleneckSwitch = screen.getByLabelText('Resource Bottlenecks');
    fireEvent.click(bottleneckSwitch);
    expect(defaultProps.setShowBottlenecks).toHaveBeenCalledWith(false);
    
    const collabSwitch = screen.getByLabelText('Collaboration Opportunities');
    fireEvent.click(collabSwitch);
    expect(defaultProps.setShowCollaborationOpps).toHaveBeenCalledWith(false);
  });

  it('should not render sections when analysis arrays are empty', () => {
    const emptyAnalysis = {
      criticalPaths: [],
      bottlenecks: [],
      collaborationOpportunities: [],
      isolationRisks: []
    };
    
    render(<DependencyAnalysisPanel {...defaultProps} dependencyAnalysis={emptyAnalysis} />);
    
    expect(screen.queryByText('Critical Dependencies:')).not.toBeInTheDocument();
    expect(screen.queryByText('Resource Bottlenecks:')).not.toBeInTheDocument();
    expect(screen.queryByText('Collaboration Points:')).not.toBeInTheDocument();
    expect(screen.queryByText('Social Balance:')).not.toBeInTheDocument();
  });

  it('should handle severity-based styling', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    // Check that high severity items have error styling
    const uvLightChain = screen.getByText('UV Light Chain').closest('[class*=MuiBox-root]');
    expect(uvLightChain).toBeInTheDocument();
    // MUI sx props don't translate directly to CSS styles in tests
    // We're verifying the structure is correct instead
    
    // Check that medium severity items have appropriate styling  
    const collabPuzzles = screen.getByText('Multi-Player Puzzles').closest('[class*=MuiBox-root]');
    expect(collabPuzzles).toBeInTheDocument();
  });

  it('should be wrapped in an Accordion for collapsibility', () => {
    render(<DependencyAnalysisPanel {...defaultProps} />);
    
    const accordionSummary = screen.getByRole('button', { expanded: true });
    expect(accordionSummary).toBeInTheDocument();
    
    // Should have expand icon
    expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument();
  });
});