module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./src/test-polyfills.js'],
  setupFilesAfterEnv: ['./src/setupTests.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!d3-|dagre|internmap|robust-predicates|msw|@mswjs)/'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^@mswjs/interceptors/ClientRequest$': '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/ClientRequest/index.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',  // Exclude Playwright E2E tests from Jest runs
    '/tests/' // Exclude Playwright tests directory
  ],
  
  // Memory management settings
  maxWorkers: 1,  // Run tests sequentially to reduce memory pressure
  workerIdleMemoryLimit: '512MB',  // Restart worker if memory exceeds this
  
  // Clear mocks between tests to prevent memory buildup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Reduce test timeout to catch hanging tests
  testTimeout: 30000,  // 30 seconds max per test
  
  // Coverage settings (when coverage is enabled)
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test-utils/',
    '/__tests__/',
    '/e2e/',
  ],
  
  // Ensure modules are isolated to prevent cross-test contamination
  resetModules: true,
}; 