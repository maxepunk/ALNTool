/**
 * MSW server setup for Node.js environment (Jest tests)
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Setup MSW server with our default handlers
export const server = setupServer(...handlers);

// Helper functions for tests
export function setupMockServer() {
  // Start server before all tests
  beforeAll(() => {
    server.listen({ 
      onUnhandledRequest: 'warn' // Warn about unhandled requests rather than error
    });
  });

  // Reset handlers after each test to ensure test isolation
  afterEach(() => {
    server.resetHandlers();
  });

  // Close server after all tests
  afterAll(() => {
    server.close();
  });
}

export { handlers } from './handlers.js';