// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for MSW v2 compatibility
import { TextEncoder, TextDecoder } from 'util';

// Make TextEncoder and TextDecoder available globally for MSW
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// MSW setup for API mocking in tests
import { server } from './mocks/server.js'; // Assuming mocks are in src/mocks/

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

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