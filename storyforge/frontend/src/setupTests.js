// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill for MSW - Node.js environment doesn't have TransformStream
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor() {
      this.readable = {
        pipeTo: jest.fn(),
        getReader: jest.fn(() => ({
          read: jest.fn(() => Promise.resolve({ done: true })),
          releaseLock: jest.fn()
        }))
      };
      this.writable = {
        getWriter: jest.fn(() => ({
          write: jest.fn(),
          close: jest.fn(),
          releaseLock: jest.fn()
        }))
      };
    }
  };
}

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

// Temporarily disable MSW to fix test execution - we'll use manual mocks
// This allows tests to run while we work on stabilization
// TODO: Re-enable MSW after resolving Node.js compatibility issues

// // MSW setup for API mocking in tests
// import { setupMockServer } from './test-utils/mocks/server.js';
// 
// // Setup MSW server for all tests
// setupMockServer();

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