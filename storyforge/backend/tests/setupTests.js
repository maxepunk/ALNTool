// This file runs before all tests in Jest

// Load environment variables for tests
require('dotenv').config({ path: '.env.test' });

// Add global test utilities or mocks here if needed
global.console = {
  ...console,
  // Make tests less noisy by not logging expected errors during tests
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Remove the helper that was causing issues - tests will create their own express apps 