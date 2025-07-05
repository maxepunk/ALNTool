import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PathAnalysisTabs from './PathAnalysisTabs';

describe('PathAnalysisTabs', () => {
  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  const mockGameConstants = {
    RESOLUTION_PATHS: {
      TYPES: ['Black Market', 'Detective', 'Third Path'],
      DEFAULT: 'Unassigned',
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
        timelineEvents: 1,
        totalValue: 1500
      },
      'Detective': {
        characters: 2,
        elements: 8,
        puzzles: 3,
        memoryTokens: 4,
        readyElements: 6,
        timelineEvents: 2,
        totalValue: 2200
      },
      'Third Path': {
        characters: 1,
        elements: 3,
        puzzles: 1,
        memoryTokens: 2,
        readyElements: 3,
        timelineEvents: 0,
        totalValue: 800
      }
    },
    crossPathDependencies: [
      {
        type: 'Shared Puzzle',
        name: 'Puzzle 1',
        paths: ['Black Market', 'Detective'],
        impact: 'high',
        description: 'Puzzle accessible from multiple paths'
      },
      {
        type: 'Cross-Path Character',
        name: 'Character X',
        paths: ['Detective', 'Third Path'],
        impact: 'medium',
        description: 'Character participates in multiple resolution paths'
      }
    ]
  };

  it('should render tabs', () => {
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByRole('tab', { name: 'Resource Distribution' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cross-Path Dependencies' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Character Assignments' })).toBeInTheDocument();
  });

  it('should show resource distribution tab by default', () => {
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('Resource Allocation by Path')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should display resource data in table', () => {
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    // Check table headers
    expect(screen.getByText('Resolution Path')).toBeInTheDocument();
    expect(screen.getByText('Elements')).toBeInTheDocument();
    expect(screen.getByText('Memory Tokens')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Production Ready')).toBeInTheDocument();

    // Check data for Black Market
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument(); // ready elements

    // Check data for Detective
    expect(screen.getByText('$2,200')).toBeInTheDocument();
    expect(screen.getByText('6/8')).toBeInTheDocument();
  });

  it('should switch to cross-path dependencies tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    await user.click(screen.getByRole('tab', { name: 'Cross-Path Dependencies' }));

    expect(screen.getByRole('heading', { name: 'Cross-Path Dependencies' })).toBeInTheDocument();
    expect(screen.getByText('Elements and characters that affect multiple resolution paths')).toBeInTheDocument();
  });

  it('should display cross-path dependencies', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    await user.click(screen.getByRole('tab', { name: 'Cross-Path Dependencies' }));

    expect(screen.getByText('Shared Puzzle')).toBeInTheDocument();
    expect(screen.getByText('Puzzle 1')).toBeInTheDocument();
    expect(screen.getByText('Puzzle accessible from multiple paths')).toBeInTheDocument();

    expect(screen.getByText('Cross-Path Character')).toBeInTheDocument();
    expect(screen.getByText('Character X')).toBeInTheDocument();
  });

  it('should show path chips for dependencies', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    await user.click(screen.getByRole('tab', { name: 'Cross-Path Dependencies' }));

    // Should show path chips for each dependency
    const blackMarketChips = screen.getAllByText('Black Market');
    const detectiveChips = screen.getAllByText('Detective');
    const thirdPathChips = screen.getAllByText('Third Path');

    expect(blackMarketChips.length).toBeGreaterThan(0);
    expect(detectiveChips.length).toBeGreaterThan(0);
    expect(thirdPathChips.length).toBeGreaterThan(0);
  });

  it('should switch to character assignments tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    await user.click(screen.getByRole('tab', { name: 'Character Assignments' }));

    expect(screen.getByRole('heading', { name: 'Character Path Assignments' })).toBeInTheDocument();
  });

  it('should show unassigned character warning', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    await user.click(screen.getByRole('tab', { name: 'Character Assignments' }));

    // Wait for the tab content to be visible
    await screen.findByRole('heading', { name: 'Character Path Assignments' });

    expect(screen.getByText('1 characters need resolution path assignment')).toBeInTheDocument();
  });

  it('should display character counts per path', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    await user.click(screen.getByRole('tab', { name: 'Character Assignments' }));

    // Wait for the tab content to be visible
    await screen.findByRole('heading', { name: 'Character Path Assignments' });

    // Each path should show its character count
    const blackMarketSection = screen.getByText('Black Market').parentElement.parentElement;
    expect(blackMarketSection).toHaveTextContent('1');
    expect(blackMarketSection).toHaveTextContent('characters assigned');

    const detectiveSection = screen.getByText('Detective').parentElement.parentElement;
    expect(detectiveSection).toHaveTextContent('2');
    expect(detectiveSection).toHaveTextContent('characters assigned');
  });

  it('should handle empty cross-path dependencies', async () => {
    const user = userEvent.setup();
    const emptyDepsAnalysis = {
      ...mockPathAnalysis,
      crossPathDependencies: []
    };

    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={emptyDepsAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    await user.click(screen.getByRole('tab', { name: 'Cross-Path Dependencies' }));

    expect(screen.getByText('No cross-path dependencies detected. All paths are independent.')).toBeInTheDocument();
  });

  it('should preserve tab selection', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PathAnalysisTabs
        pathAnalysis={mockPathAnalysis}
        gameConstants={mockGameConstants}
      />
    );

    // Switch to dependencies tab
    await user.click(screen.getByRole('tab', { name: 'Cross-Path Dependencies' }));
    expect(screen.getByText('Elements and characters that affect multiple resolution paths')).toBeInTheDocument();

    // Verify it stays on dependencies tab
    expect(screen.queryByText('Resource Allocation by Path')).not.toBeInTheDocument();
  });
});