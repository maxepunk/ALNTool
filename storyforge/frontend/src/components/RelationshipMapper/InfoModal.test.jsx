import { render, screen, fireEvent } from '@testing-library/react';
import InfoModal from './InfoModal';

describe('InfoModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  it('should render modal when open', () => {
    render(<InfoModal {...defaultProps} />);
    
    expect(screen.getByText('Relationship Mapper Guide')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(<InfoModal {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Relationship Mapper Guide')).not.toBeInTheDocument();
  });

  it('should render navigation instructions', () => {
    render(<InfoModal {...defaultProps} />);
    
    expect(screen.getByText('Navigation:')).toBeInTheDocument();
    expect(screen.getByText(/Click on a node/)).toBeInTheDocument();
    expect(screen.getByText(/Drag the background/)).toBeInTheDocument();
    expect(screen.getByText(/Use mouse wheel/)).toBeInTheDocument();
  });

  it('should render standard controls section', () => {
    render(<InfoModal {...defaultProps} />);
    
    expect(screen.getByText('Standard Controls:')).toBeInTheDocument();
    expect(screen.getByText(/View:/)).toBeInTheDocument();
    expect(screen.getByText(/Exploration Depth:/)).toBeInTheDocument();
    expect(screen.getByText(/Filter Nodes\/Edges:/)).toBeInTheDocument();
    expect(screen.getByText(/Signal Strength:/)).toBeInTheDocument();
  });

  it('should render dependency choreographer section', () => {
    render(<InfoModal {...defaultProps} />);
    
    expect(screen.getByText('Dependency Choreographer Mode:')).toBeInTheDocument();
    expect(screen.getByText(/Production Mode:/)).toBeInTheDocument();
    expect(screen.getByText(/Critical Dependencies:/)).toBeInTheDocument();
    expect(screen.getByText(/Resource Bottlenecks:/)).toBeInTheDocument();
    expect(screen.getByText(/Social Balance:/)).toBeInTheDocument();
  });

  it('should call onClose when Got it button is clicked', () => {
    render(<InfoModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Got it!'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should have proper modal structure', () => {
    render(<InfoModal {...defaultProps} />);
    
    // Check for modal paper
    const modalContent = screen.getByText('Relationship Mapper Guide').closest('[class*=MuiPaper]');
    expect(modalContent).toBeInTheDocument();
    
    // Check for proper heading
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Relationship Mapper Guide');
  });

  it('should render all list items properly', () => {
    render(<InfoModal {...defaultProps} />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(10); // Should have multiple instructions
  });

  it('should have proper accessibility attributes', () => {
    render(<InfoModal {...defaultProps} />);
    
    const modal = screen.getByRole('presentation');
    expect(modal).toHaveAttribute('aria-labelledby', 'info-modal-title');
    expect(modal).toHaveAttribute('aria-describedby', 'info-modal-description');
  });

  it('should call onClose when modal backdrop is clicked', () => {
    render(<InfoModal {...defaultProps} />);
    
    // Click on the backdrop (parent modal element)
    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});