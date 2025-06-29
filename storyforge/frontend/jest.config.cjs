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
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/'  // Exclude Playwright E2E tests from Jest runs
  ],
}; 