// Polyfills that must be loaded before anything else
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill fetch API components for MSW
require('whatwg-fetch');

// Polyfill BroadcastChannel for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Also polyfill structuredClone if needed
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock import.meta for Jest compatibility with Vite
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      DEV: false,
      VITE_API_URL: 'http://localhost:3001'
    }
  },
  writable: true
});