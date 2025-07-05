import { render, screen } from '@testing-library/react';
import PathBalanceOverview from './PathBalanceOverview';

describe('PathBalanceOverview', () => {
  const mockGameConstants = {
    RESOLUTION_PATHS: {
      TYPES: ['Black Market', 'Detective', 'Third Path'],
      THEMES: {
        'Black Market': { color: 'error', theme: 'Underground Economy' },
        'Detective': { color: 'info', theme: 'Investigative' },
        'Third Path': { color: 'success', theme: 'Community' }
      }
    }
  };

  const mockPathAnalysis = {
    pathDistribution: {
      'Black Market': [{ id: '1', name: 'Character 1' }],
      'Detective': [{ id: '2', name: 'Character 2' }, { id: '3', name: 'Character 3' }],
      'Third Path': [{ id: '4', name: 'Character 4' }],
      'Unassigned': [{ id: '5', name: 'Character 5' }]
    },
    pathResources: {
      'Black Market': {
        characters: 1,
        elements: 5,
        puzzles: 2,
        memoryTokens: 3,
        readyElements: 4,
        timelineEvents: 1
      },
      'Detective': {
        characters: 2,
        elements: 8,
        puzzles: 3,
        memoryTokens: 4,
        readyElements: 6,
        timelineEvents: 2
      },
      'Third Path': {
        characters: 1,
        elements: 3,
        puzzles: 1,
        memoryTokens: 2,
        readyElements: 3,
        timelineEvents: 0
      }
    },
    balanceMetrics: {
      characterBalance: 75,
      crossPathComplexity: 3
    },
    crossPathDependencies: [
      { type: 'Shared Puzzle', name: 'Puzzle 1' },
      { type: 'Cross-Path Character', name: 'Character X' },
      { type: 'Shared Element', name: 'Element Y' }
    ]
  };

  it('should render path balance overview section', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('Three-Path Balance Overview')).toBeInTheDocument();
  });

  it('should display all resolution paths', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('Black Market')).toBeInTheDocument();
    expect(screen.getByText('Detective')).toBeInTheDocument();
    expect(screen.getByText('Third Path')).toBeInTheDocument();
  });

  it('should show character counts for each path', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    // Check that each path card displays its character count
    const blackMarketCard = screen.getByText('Black Market').closest('.MuiCard-root');
    expect(blackMarketCard).toHaveTextContent('1');
    expect(blackMarketCard).toHaveTextContent('Characters');

    const detectiveCard = screen.getByText('Detective').closest('.MuiCard-root');
    expect(detectiveCard).toHaveTextContent('2');
    expect(detectiveCard).toHaveTextContent('Characters');

    const thirdPathCard = screen.getByText('Third Path').closest('.MuiCard-root');
    expect(thirdPathCard).toHaveTextContent('1');
    expect(thirdPathCard).toHaveTextContent('Characters');
  });

  it('should display resource counts for each path', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    // Check element counts
    expect(screen.getByText('Elements: 5')).toBeInTheDocument(); // Black Market
    expect(screen.getByText('Elements: 8')).toBeInTheDocument(); // Detective
    expect(screen.getByText('Elements: 3')).toBeInTheDocument(); // Third Path

    // Check puzzle counts
    expect(screen.getByText('Puzzles: 2')).toBeInTheDocument(); // Black Market
    expect(screen.getByText('Puzzles: 3')).toBeInTheDocument(); // Detective
    expect(screen.getByText('Puzzles: 1')).toBeInTheDocument(); // Third Path
  });

  it('should show production readiness progress bars', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    // Find progress bars within the path cards specifically
    const blackMarketCard = screen.getByText('Black Market').closest('.MuiCard-root');
    const detectiveCard = screen.getByText('Detective').closest('.MuiCard-root');
    const thirdPathCard = screen.getByText('Third Path').closest('.MuiCard-root');
    
    expect(blackMarketCard.querySelector('[role="progressbar"]')).toBeInTheDocument();
    expect(detectiveCard.querySelector('[role="progressbar"]')).toBeInTheDocument();
    expect(thirdPathCard.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should display balance metrics panel', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('Balance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Character Balance')).toBeInTheDocument();
    expect(screen.getByText('75% balanced')).toBeInTheDocument();
  });

  it('should show cross-path dependencies count', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('Cross-Path Dependencies')).toBeInTheDocument();
    expect(screen.getByText('3 dependencies')).toBeInTheDocument();
  });

  it('should display unassigned characters count', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('Unassigned Characters')).toBeInTheDocument();
    // The unassigned count is displayed as a large number
    const unassignedSection = screen.getByText('Unassigned Characters').parentElement.parentElement;
    expect(unassignedSection).toHaveTextContent('1');
    expect(unassignedSection).toHaveTextContent('Need path assignment');
  });

  it('should apply correct color themes to path cards', () => {
    render(
      <PathBalanceOverview 
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    // Cards should have the appropriate bgcolor class
    const blackMarketCard = screen.getByText('Black Market').closest('.MuiCard-root');
    expect(blackMarketCard).toBeInTheDocument();
    
    const detectiveCard = screen.getByText('Detective').closest('.MuiCard-root');
    expect(detectiveCard).toBeInTheDocument();
    
    const thirdPathCard = screen.getByText('Third Path').closest('.MuiCard-root');
    expect(thirdPathCard).toBeInTheDocument();
  });

  it('should handle missing data gracefully', () => {
    const emptyAnalysis = {
      pathDistribution: {},
      pathResources: {},
      balanceMetrics: { characterBalance: 0, crossPathComplexity: 0 },
      crossPathDependencies: []
    };

    render(
      <PathBalanceOverview 
        pathAnalysis={emptyAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    // Component should still render without errors
    expect(screen.getByText('Three-Path Balance Overview')).toBeInTheDocument();
    expect(screen.getByText('Balance Metrics')).toBeInTheDocument();
  });
});