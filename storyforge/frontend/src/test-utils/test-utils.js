/**
 * Test utilities for testing components and hooks with TanStack Query
 * Based on TanStack Query testing best practices
 */

import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Single QueryClient instance per test file to prevent memory leaks
let globalQueryClient = null;

/**
 * Creates a new QueryClient for testing with optimized settings
 * Disables retries and caching for faster, more predictable tests
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries for tests
        retry: false,
        // Disable cache for fresh test state
        cacheTime: 0,
        staleTime: 0,
        // Disable background refetching
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
      mutations: {
        // Disable retries for mutations
        retry: false,
      },
    },
    // Silence console errors during tests
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Get or create the global QueryClient for tests
 * Reuses the same instance to prevent memory leaks
 */
function getGlobalQueryClient() {
  if (!globalQueryClient) {
    globalQueryClient = createTestQueryClient();
  }
  // Clear before each test
  globalQueryClient.clear();
  globalQueryClient.cancelQueries();
  return globalQueryClient;
}

/**
 * Creates a wrapper component with QueryClient for testing hooks and components
 * @param {QueryClient} [queryClient] - Optional custom QueryClient
 * @returns {Function} Wrapper component for testing
 */
export function createQueryWrapper(queryClient = createTestQueryClient()) {
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with QueryClient
 * Use this instead of @testing-library/react's render for components using TanStack Query
 */
export function renderWithQuery(ui, options = {}) {
  // Use global client by default to prevent memory leaks
  const { queryClient = getGlobalQueryClient(), ...renderOptions } = options;
  
  const wrapper = createQueryWrapper(queryClient);
  
  return {
    ...render(ui, { wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Default test constants for mocking game constants API responses
 * These match the structure expected by our GameConstants.js
 */
export const mockGameConstants = {
  MEMORY_VALUE: {
    BASE_VALUES: {
      1: 100,
      2: 500,
      3: 1000,
      4: 5000,
      5: 10000
    },
    TYPE_MULTIPLIERS: {
      'Personal': 2.0,
      'Business': 5.0,
      'Technical': 10.0
    },
    GROUP_COMPLETION_MULTIPLIER: 10.0,
    TARGET_TOKEN_COUNT: 55,
    MIN_TOKEN_COUNT: 50,
    MAX_TOKEN_COUNT: 60,
    BALANCE_WARNING_THRESHOLD: 0.3,
    MEMORY_ELEMENT_TYPES: [
      'Memory Token Video',
      'Memory Token Audio',
      'Memory Token Physical',
      'Corrupted Memory RFID',
      'Memory Fragment'
    ]
  },
  RESOLUTION_PATHS: {
    TYPES: ['Black Market', 'Detective', 'Third Path'],
    DEFAULT: 'Unassigned'
  },
  ACTS: {
    TYPES: ['Act 1', 'Act 2'],
    DEFAULT: 'Unassigned'
  },
  CHARACTERS: {
    TYPES: ['Player', 'NPC'],
    TIERS: ['Core', 'Secondary', 'Tertiary'],
    DEFAULT_TYPE: 'NPC',
    DEFAULT_TIER: 'Tertiary',
    UNASSIGNED_WARNING_THRESHOLD: 0.2,
    ISOLATED_WARNING_THRESHOLD: 0.15,
    PATH_IMBALANCE_THRESHOLD: 0.4
  },
  ELEMENTS: {
    STATUS_TYPES: [
      'Ready for Playtest',
      'Done',
      'In development',
      'Idea/Placeholder',
      'Source Prop/print',
      'To Design',
      'To Build',
      'Needs Repair'
    ],
    MEMORY_TOKEN_WARNING_THRESHOLD: 45,
    MEMORY_READINESS_THRESHOLD: 0.8,
    OVERALL_READINESS_THRESHOLD: 0.7,
    CATEGORIES: [
      'Prop',
      'Set Dressing',
      'Memory Token Video',
      'Memory Token Audio',
      'Memory Token Physical',
      'Corrupted Memory RFID',
      'Memory Fragment'
    ]
  },
  PUZZLES: {
    HIGH_COMPLEXITY_OWNERS_THRESHOLD: 1,
    HIGH_COMPLEXITY_REWARDS_THRESHOLD: 2,
    MEDIUM_COMPLEXITY_REWARDS_THRESHOLD: 1,
    UNASSIGNED_WARNING_THRESHOLD: 0.3,
    NO_REWARDS_WARNING_THRESHOLD: 0.2,
    NO_NARRATIVE_THREADS_WARNING_THRESHOLD: 0.4
  },
  DASHBOARD: {
    PATH_IMBALANCE_THRESHOLD: 3,
    MEMORY_COMPLETION_WARNING_THRESHOLD: 50,
    UNASSIGNED_EVENTS_WARNING_THRESHOLD: 5
  }
};

/**
 * Helper function to wait for queries to settle during tests
 * @param {QueryClient} queryClient 
 */
export async function waitForQueriesToSettle(queryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
}

/**
 * Clean up the global QueryClient
 * Call this in afterAll() to prevent memory leaks
 */
export function cleanupQueryClient() {
  if (globalQueryClient) {
    globalQueryClient.clear();
    globalQueryClient.cancelQueries();
    globalQueryClient.getQueryCache().clear();
    globalQueryClient.getMutationCache().clear();
    globalQueryClient = null;
  }
}