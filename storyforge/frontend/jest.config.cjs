module.exports = {
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    '/node_modules/(?!d3-|dagre|internmap|robust-predicates)/'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
}; 