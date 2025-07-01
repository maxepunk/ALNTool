import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ElementDetail from './ElementDetail';
import { api } from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  api: {
    getElementById: jest.fn(),
    getElementGraph: jest.fn()
  }
}));

// Mock child components that will be extracted
jest.mock('../components/PageHeader', () => ({
  __esModule: true,
  default: ({ title }) => <div data-testid="page-header">{title}</div>
}));

jest.mock('../components/RelationshipMapper', () => ({
  __esModule: true,
  default: () => <div data-testid="relationship-mapper">Relationship Mapper</div>
}));

const mockElement = {
  id: 'elem1',
  name: 'Test Element',
  basicType: 'Memory',
  description: 'Test description',
  productionNotes: 'Test notes',
  status: 'In Production',
  associatedCharacters: [
    { id: 'char1', name: 'Character 1', tier: 'Main' }
  ],
  timelineEvents: [
    { id: 'event1', description: 'Event 1', date: '2024-01-01' }
  ],
  requiredFor: [
    { id: 'puzzle1', name: 'Puzzle 1' }
  ],
  rewardedBy: [
    { id: 'puzzle2', name: 'Puzzle 2' }
  ],
  container: null,
  contents: []
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/elements/elem1']}>
        <Routes>
          <Route path="/elements/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ElementDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getElementById.mockResolvedValue(mockElement);
    api.getElementGraph.mockResolvedValue({ nodes: [], edges: [] });
  });

  it('should render loading state initially', () => {
    render(<ElementDetail />, { wrapper: createWrapper() });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render element details after loading', async () => {
    render(<ElementDetail />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toHaveTextContent('Test Element');
    });
    
    expect(api.getElementById).toHaveBeenCalledWith('elem1');
  });

  it('should render error state when API fails', async () => {
    const error = new Error('Failed to load');
    api.getElementById.mockRejectedValue(error);
    
    render(<ElementDetail />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading element/)).toBeInTheDocument();
    });
  });

  it('should render all tabs', async () => {
    render(<ElementDetail />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument();
    });
    
    // Check for tab labels with counts
    expect(screen.getByRole('tab', { name: 'Associated Characters (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Timeline Events (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Required For Puzzles (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rewarded By Puzzles (1)' })).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    render(<ElementDetail />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument();
    });
    
    // Associated Characters tab should be active by default
    const charactersTab = screen.getByRole('tab', { name: 'Associated Characters (1)' });
    expect(charactersTab).toHaveAttribute('aria-selected', 'true');
    
    // Click Timeline Events tab
    const timelineTab = screen.getByRole('tab', { name: 'Timeline Events (1)' });
    await user.click(timelineTab);
    
    // Check that Timeline tab is now selected
    expect(timelineTab).toHaveAttribute('aria-selected', 'true');
    expect(charactersTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should show Container tab for elements with containers', async () => {
    const elementWithContainer = {
      ...mockElement,
      container: { id: 'cont1', name: 'Container 1' }
    };
    api.getElementById.mockResolvedValue(elementWithContainer);
    
    render(<ElementDetail />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Container' })).toBeInTheDocument();
    });
  });

  it('should show Contents tab for elements with contents', async () => {
    const elementWithContents = {
      ...mockElement,
      contents: [{ id: 'item1', name: 'Item 1' }]
    };
    api.getElementById.mockResolvedValue(elementWithContents);
    
    render(<ElementDetail />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Contents/i })).toBeInTheDocument();
    });
  });

  it('should handle elements not found', async () => {
    api.getElementById.mockResolvedValue(null);
    
    render(<ElementDetail />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText(/Element data not available or element not found/)).toBeInTheDocument();
    });
  });
});