/**
 * Test cleanup utilities to prevent memory leaks
 * Import this in test files to ensure proper cleanup
 */

import { cleanup } from '@testing-library/react';

/**
 * Sets up automatic cleanup after each test
 * Call this at the top of your test file
 */
export function setupTestCleanup() {
  afterEach(() => {
    // Clean up React Testing Library components
    cleanup();
    
    // Clear all Jest mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
    
    // Clear any pending timers
    if (jest.isMockFunction(setTimeout)) {
      jest.clearAllTimers();
    }
    
    // Force garbage collection if available (when run with --expose-gc)
    if (global.gc) {
      global.gc();
    }
  });
  
  // Also clean up after all tests in the file
  afterAll(() => {
    cleanup();
    jest.resetModules();
    
    // Final garbage collection
    if (global.gc) {
      global.gc();
    }
  });
}

/**
 * Cleanup helper for React Query
 * @param {QueryClient} queryClient - The query client to clean
 */
export function cleanupQueryClient(queryClient) {
  if (queryClient) {
    // Cancel all queries
    queryClient.cancelQueries();
    
    // Clear the cache
    queryClient.clear();
    
    // Remove all listeners
    queryClient.getQueryCache().clear();
    queryClient.getMutationCache().clear();
  }
}

/**
 * Monitor memory usage during tests
 * Call in beforeEach to track memory growth
 */
export function logMemoryUsage(testName) {
  if (process.memoryUsage) {
    const usage = process.memoryUsage();
    const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
    console.log(`[Memory] ${testName}: Heap ${heapMB}MB / Total ${totalMB}MB`);
  }
}

/**
 * Wait for all promises to resolve and React to finish rendering
 * Useful for ensuring async operations complete before cleanup
 */
export async function waitForAsyncCleanup() {
  // Let React finish any pending work
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Let any promises resolve
  await Promise.resolve();
  
  // One more tick for good measure
  await new Promise(resolve => setImmediate ? setImmediate(resolve) : setTimeout(resolve, 0));
}