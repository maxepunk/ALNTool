import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Puzzles from './Puzzles';
import { api } from '../services/api';
import { useGameConstants } from '../hooks/useGameConstants';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the API
jest.mock('../services/api', () => ({
  api: {
    getPuzzles: jest.fn(),
    getCharacters: jest.fn(),
    getCharacterRelationships: jest.fn()
  }
}));

// Mock useGameConstants hook
jest.mock('../hooks/useGameConstants', () => ({
  useGameConstants: jest.fn(),
  getConstant: jest.fn((constants, path, defaultValue) => {
    const paths = path.split('.');
    let value = constants;
    for (const p of paths) {
      value = value?.[p];
    }
    return value ?? defaultValue;
  })
}));

// Mock DataTable component
// Temporarily disabled DataTable mock to test real component integration
// jest.mock('../components/DataTable', () => ({
//   default: ({ data, columns, onRowClick }) => (
//     <div data-testid="data-table">
//       {data?.map((row, index) => (
//         <div key={index} onClick={() => onRowClick?.(row)} data-testid={`row-${index}`}>
//           {columns.map(col => {
//             const value = col.id.includes('.') 
//               ? col.id.split('.').reduce((obj, key) => obj?.[key], row)
//               : row[col.id];
//             return (
//               <span key={col.id} data-testid={`${row.id}-${col.id}`}>
//                 {typeof col.format === 'function' ? col.format(value, row) : value}
//               </span>
//             );
//           })}
//         </div>
//       ))}
//     </div>
//   )
// }));

// Mock PageHeader component
jest.mock('../components/PageHeader', () => ({
  default: ({ title, action }) => (
    <div>
      <h1>{title}</h1>
      <div>{action}</div>
    </div>
  )
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockGameConstants = {
  PRODUCTION_STATUS: {
    WARNING_THRESHOLD: 0.3,
    DANGER_THRESHOLD: 0.5
  },
  RESOLUTION_PATHS: {
    TYPES: ['Detective', 'Black Market', 'Third Path']
  }
};

const mockPuzzles = [
  {
    id: 1,
    puzzle: 'The Missing Evidence',
    properties: {
      actFocus: 'Act 1',
      themes: ['Mystery', 'Investigation'],
      isPlotCritical: true,
      status: 'Ready'
    },
    owner: [{ id: 1, name: 'Detective Stone' }],
    rewards: [{ id: 1, name: 'Clue Token' }],
    narrativeThreads: ['Main Mystery'],
    resolutionPaths: ['Detective']
  },
  {
    id: 2,
    puzzle: 'The Black Market Deal',
    properties: {
      actFocus: 'Act 2',
      themes: ['Crime', 'Underworld'],
      status: 'To Build'
    },
    owner: [{ id: 2, name: 'Mob Boss' }],
    rewards: [],
    narrativeThreads: ['Crime Ring'],
    resolutionPaths: ['Black Market']
  },
  {
    id: 3,
    puzzle: 'The Final Confrontation',
    properties: {
      actFocus: 'Act 3',
      themes: ['Climax', 'Resolution'],
      status: 'To Design'
    },
    owner: [],
    rewards: [{ id: 2, name: 'Victory' }, { id: 3, name: 'Truth' }],
    narrativeThreads: ['Main Mystery', 'Crime Ring'],
    resolutionPaths: ['Detective', 'Black Market']
  }
];

const mockCharacters = [
  { id: 1, name: 'Detective Stone' },
  { id: 2, name: 'Mob Boss' }
];

describe('Puzzles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    useGameConstants.mockReturnValue({
      data: mockGameConstants,
      isLoading: false
    });
    api.getPuzzles.mockResolvedValue(mockPuzzles);
    api.getCharacters.mockResolvedValue(mockCharacters);
    api.getCharacterRelationships.mockResolvedValue([]);
  });

  it('should render loading state when game constants are loading', () => {
    useGameConstants.mockReturnValue({
      data: null,
      isLoading: true
    });
    
    render(<Puzzles />, { wrapper: createWrapper() });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading Puzzles...')).toBeInTheDocument();
  });

  it('should render puzzle data after loading', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Total Puzzles')).toBeInTheDocument();
    });

    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('should display production dashboard cards', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Total Puzzles')).toBeInTheDocument();
    });

    // Check for all dashboard cards (following established Character/Element patterns)
    expect(screen.getByText('Total Puzzles')).toBeInTheDocument();
    expect(screen.getByText('Act Distribution')).toBeInTheDocument();
    expect(screen.getByText('Reward Economy')).toBeInTheDocument();
    expect(screen.getByText('Production Ready')).toBeInTheDocument();
    
    // Check total puzzles count
    const totalPuzzlesCard = screen.getByText('Total Puzzles').closest('.MuiCard-root');
    expect(totalPuzzlesCard).toHaveTextContent('3');
  });

  it('should calculate and display production issues', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Production Issues Detected/)).toBeInTheDocument();
    });

    // Should detect puzzles not ready (2 out of 3 are not ready)
    expect(screen.getByText(/66.7% of puzzles not production ready/)).toBeInTheDocument();
  });

  it('should filter puzzles by act focus', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Act Focus')).toBeInTheDocument();
    });

    const actSelect = screen.getByLabelText('Act Focus');
    fireEvent.mouseDown(actSelect);
    
    const act1Option = await screen.findByRole('option', { name: 'Act 1' });
    fireEvent.click(act1Option);

    // After filtering, only Act 1 puzzle should be visible
    await waitFor(() => {
      expect(screen.getByText('The Missing Evidence')).toBeInTheDocument();
      expect(screen.queryByText('The Black Market Deal')).not.toBeInTheDocument();
    });
  });

  it('should filter puzzles by theme', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    });

    // Theme filtering works via clickable chips, not a select dropdown
    const mysteryChip = await screen.findByRole('button', { name: /Mystery/i });
    fireEvent.click(mysteryChip);

    // After filtering, only Mystery puzzle should be visible
    await waitFor(() => {
      expect(screen.getByText('The Missing Evidence')).toBeInTheDocument();
      expect(screen.queryByText('The Black Market Deal')).not.toBeInTheDocument();
    });
  });

  it('should navigate to puzzle detail on row click', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    // Click on first puzzle row
    const firstRow = screen.getByTestId('row-0');
    fireEvent.click(firstRow);

    expect(mockNavigate).toHaveBeenCalledWith('/puzzles/1');
  });

  it('should handle API errors gracefully', async () => {
    api.getPuzzles.mockRejectedValue(new Error('API Error'));
    
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading puzzles/)).toBeInTheDocument();
    });
  });

  it('should display correct analytics for act distribution', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Act Distribution')).toBeInTheDocument();
    });

    // Find the act distribution - check for proper act counts
    const actCard = screen.getByText('Act Distribution').closest('.MuiCard-root');
    expect(actCard).toHaveTextContent('Act 1');
    expect(actCard).toHaveTextContent('Act 2');
    expect(actCard).toHaveTextContent('Act 3');
  });

  it('should display correct analytics for reward economy', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Reward Economy')).toBeInTheDocument();
    });

    // Find the reward economy - check total rewards (3 puzzles with 1+0+2 = 3 rewards)
    const rewardCard = screen.getByText('Reward Economy').closest('.MuiCard-root');
    expect(rewardCard).toHaveTextContent('3');
  });

  it('should display correct production status distribution', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Production Ready')).toBeInTheDocument();
    });

    // Find the production ready count (only puzzles with status='Ready' + owner + resolutionPaths)
    const productionCard = screen.getByText('Production Ready').closest('.MuiCard-root');
    // Based on mock data: only "The Missing Evidence" has status='Ready' + owner + resolutionPaths
    expect(productionCard).toHaveTextContent('1');
  });

  it('should handle empty puzzle list', async () => {
    api.getPuzzles.mockResolvedValue([]);
    
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Total Puzzles')).toBeInTheDocument();
    });

    expect(screen.getByText('0')).toBeInTheDocument();
    // Should not show production issues when no puzzles
    expect(screen.queryByText(/Production Issues Detected/)).not.toBeInTheDocument();
  });

  it('should refresh data when refresh button is clicked', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Refresh data')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh data');
    fireEvent.click(refreshButton);

    // Should refetch puzzles
    await waitFor(() => {
      expect(api.getPuzzles).toHaveBeenCalledTimes(2);
    });
  });

  it('should show loading state when refetching', async () => {
    render(<Puzzles />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Refresh data')).toBeInTheDocument();
    });

    // Make the API call slow
    api.getPuzzles.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockPuzzles), 100)));
    
    const refreshButton = screen.getByLabelText('Refresh data');
    fireEvent.click(refreshButton);

    // Should show loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});