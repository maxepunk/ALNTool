/**
 * TDD-compliant test for Characters component
 * Tests that the component renders properly with error boundary protection
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API before importing component
jest.mock('../../services/api', () => ({
  api: {
    getCharacters: jest.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Character',
        tier: 'Core',
        type: 'Player',
        resolutionPaths: ['Detective'],
        character_links: [{ id: '2', name: 'Connected Character' }],
        ownedElements: [{ properties: { basicType: 'memory_token' } }],
        events: []
      }
    ]),
    getGameConstants: jest.fn().mockResolvedValue({
      CHARACTER_TIERS: {
        'Core': { priority: 1 },
        'Secondary': { priority: 2 },
        'Tertiary': { priority: 3 }
      }
    }),
  },
}));

// Mock game constants hook
jest.mock('../../hooks/useGameConstants', () => ({
  useGameConstants: () => ({
    data: {
      CHARACTER_TIERS: {
        'Core': { priority: 1 },
        'Secondary': { priority: 2 },
        'Tertiary': { priority: 3 }
      },
      CHARACTERS: {
        TYPES: ['Player', 'NPC'],
        TIERS: ['Core', 'Secondary', 'Tertiary']
      },
      RESOLUTION_PATHS: {
        TYPES: ['Black Market', 'Detective', 'Third Path'],
        DEFAULT: 'Unassigned'
      }
    },
    isLoading: false,
    error: null
  }),
  getConstant: (constants, path, defaultValue) => {
    if (path === 'CHARACTERS.TYPES') return ['Player', 'NPC'];
    if (path === 'CHARACTERS.TIERS') return ['Core', 'Secondary', 'Tertiary'];
    if (path === 'RESOLUTION_PATHS.TYPES') return ['Black Market', 'Detective', 'Third Path'];
    if (path === 'RESOLUTION_PATHS.DEFAULT') return 'Unassigned';
    return defaultValue;
  }
}));

// Simple ErrorBoundary mock that passes through children
jest.mock('../../components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children, level }) {
    return <div data-testid={`error-boundary-${level}`}>{children}</div>;
  };
});

import Characters from '../Characters';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
};

const renderWithProviders = (ui, { queryClient = createTestQueryClient() } = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Characters Component TDD Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders with error boundary protection', async () => {
    renderWithProviders(<Characters />);
    
    // Verify error boundary is present
    expect(screen.getByTestId('error-boundary-component')).toBeInTheDocument();
  });

  it('displays main heading correctly', async () => {
    renderWithProviders(<Characters />);

    // Wait for component to load and check for main heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Character Production Hub/i })).toBeInTheDocument();
    });
  });

  it('renders character data successfully', async () => {
    renderWithProviders(<Characters />);

    // Wait for data to load and check for test character
    await waitFor(() => {
      expect(screen.getByText('Test Character')).toBeInTheDocument();
    });
  });

  it('handles refresh button functionality', async () => {
    renderWithProviders(<Characters />);

    // Check that refresh button is present
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  it('displays production analytics cards', async () => {
    renderWithProviders(<Characters />);

    // Wait for analytics to load
    await waitFor(() => {
      expect(screen.getByText('Character Roster')).toBeInTheDocument();
      expect(screen.getByText('Path Balance')).toBeInTheDocument();
      expect(screen.getByText('Memory Economy')).toBeInTheDocument();
      expect(screen.getByText('Production Ready')).toBeInTheDocument();
    });
  });
});