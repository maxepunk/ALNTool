import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Puzzles from './Puzzles';

// Minimal mocks
jest.mock('../services/api', () => ({
  api: { getPuzzles: jest.fn(() => Promise.resolve([])) }
}));

jest.mock('../hooks/useGameConstants', () => ({
  useGameConstants: jest.fn(() => ({ data: {}, isLoading: false })),
  getConstant: jest.fn(() => [])
}));

jest.mock('../components/DataTable', () => ({
  default: () => <div>DataTable</div>
}));

jest.mock('../components/PageHeader', () => ({
  default: () => <div>PageHeader</div>
}));

describe('Puzzles Simple', () => {
  it('renders after loading', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Puzzles />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('PageHeader')).toBeInTheDocument();
    });
  });
});