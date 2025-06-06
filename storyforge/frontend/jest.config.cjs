module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/setupTests.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!d3-|dagre|internmap|robust-predicates|msw)/'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
}; 