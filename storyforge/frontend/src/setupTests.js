// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock logger globally for all tests
jest.mock('./utils/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    system: jest.fn(),
    time: jest.fn(),
    timeEnd: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
    table: jest.fn(),
  }
}));

// Mock apiLogger to avoid import.meta issues in tests
jest.mock('./utils/apiLogger', () => ({
  __esModule: true,
  logApiResponse: jest.fn(),
  logComponentData: jest.fn(),
  wrapFetch: (fetch) => fetch
}));

// MSW setup for API mocking in tests
import { setupMockServer } from './test-utils/mocks/server.js';

// Setup MSW server for all tests
setupMockServer();

// Mock the API service
jest.mock('./services/api.js');

// Mock ResizeObserver for ReactFlow
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));


// Optional: Mock global browser APIs if needed (e.g., fetch, localStorage)
/*
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ test: 100 }),
  })
);
*/

// Silence console.error and console.warn during tests to keep output clean
// You might want to enable them temporarily when debugging specific tests.

let originalError;
let originalWarn;

beforeAll(() => {
  originalError = console.error;
  originalWarn = console.warn;
  console.error = (...args) => {
    // Suppress specific React 18 hydration errors or other known noisy errors
    // if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.hydrate is no longer supported in React 18')) {
    //   return;
    // }
    originalError(...args);
  };
  // console.warn = jest.fn(); // Keep warnings for now, or make more specific like error
});

afterAll(() => {
  console.error = originalError;
  // console.warn = originalWarn;
}); 