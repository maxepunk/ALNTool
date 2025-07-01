import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecommendationsPanel from './RecommendationsPanel';

describe('RecommendationsPanel', () => {
  const mockRecommendations = [
    {
      type: 'character-balance',
      severity: 'warning',
      message: 'Character distribution is unbalanced across paths',
      action: 'Redistribute characters to achieve better path balance'
    },
    {
      type: 'production-readiness',
      severity: 'warning',
      message: 'Black Market path only 60% production ready',
      action: 'Prioritize completion of Black Market path elements'
    },
    {
      type: 'memory-economy',
      severity: 'info',
      message: 'Detective path has low memory token density (0.5 per character)',
      action: 'Consider adding more memory tokens to Detective path'
    }
  ];

  it('should render recommendations accordion', () => {
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    expect(screen.getByText(/Production Recommendations/)).toBeInTheDocument();
    expect(screen.getByText('Production Recommendations (3)')).toBeInTheDocument();
  });

  it('should show TrendingUpIcon', () => {
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });

  it('should expand to show recommendations when clicked', async () => {
    const user = userEvent.setup();
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    const accordionSummary = screen.getByRole('button', { name: /Production Recommendations/ });
    await user.click(accordionSummary);
    
    expect(screen.getByText('Character distribution is unbalanced across paths')).toBeInTheDocument();
    expect(screen.getByText('Black Market path only 60% production ready')).toBeInTheDocument();
    expect(screen.getByText('Detective path has low memory token density (0.5 per character)')).toBeInTheDocument();
  });

  it('should display action text for each recommendation', async () => {
    const user = userEvent.setup();
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    await user.click(screen.getByRole('button', { name: /Production Recommendations/ }));
    
    expect(screen.getByText('Redistribute characters to achieve better path balance')).toBeInTheDocument();
    expect(screen.getByText('Prioritize completion of Black Market path elements')).toBeInTheDocument();
    expect(screen.getByText('Consider adding more memory tokens to Detective path')).toBeInTheDocument();
  });

  it('should apply correct severity styles', async () => {
    const user = userEvent.setup();
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    await user.click(screen.getByRole('button', { name: /Production Recommendations/ }));
    
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(3);
    
    // MUI Alert components have severity as a prop, not directly in the class
    expect(alerts[0]).toHaveClass('MuiAlert-standardWarning');
    expect(alerts[1]).toHaveClass('MuiAlert-standardWarning');
    expect(alerts[2]).toHaveClass('MuiAlert-standardInfo');
  });

  it('should show view details buttons', async () => {
    const user = userEvent.setup();
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    await user.click(screen.getByRole('button', { name: /Production Recommendations/ }));
    
    // Wait for the accordion to expand and content to appear
    await waitFor(() => {
      const viewDetailsButtons = screen.getAllByText('View Details');
      expect(viewDetailsButtons).toHaveLength(3);
    });
  });

  it('should handle empty recommendations array', () => {
    render(<RecommendationsPanel recommendations={[]} />);
    
    expect(screen.getByText(/Production Recommendations/)).toBeInTheDocument();
    expect(screen.getByText('Production Recommendations (0)')).toBeInTheDocument();
  });

  it('should start collapsed by default', () => {
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    const accordionSummary = screen.getByRole('button', { name: /Production Recommendations/ });
    expect(accordionSummary).toHaveAttribute('aria-expanded', 'false');
  });

  it('should have expand icon', () => {
    render(<RecommendationsPanel recommendations={mockRecommendations} />);
    
    expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument();
  });
});