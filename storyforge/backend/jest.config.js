module.exports = {
  // Test environment for Node.js apps
  testEnvironment: 'node',
  
  // Automatically clear mock calls between every test
  clearMocks: true,
  
  // Collect coverage information
  collectCoverage: true,
  
  // Directory where Jest will output coverage files
  coverageDirectory: 'coverage',
  
  // File patterns for tests
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],
  
  // Transform files - use babel-jest for .js files
  transform: {'^.+\\.js$': 'babel-jest'},
  
  // Test environment setup
  setupFilesAfterEnv: ['./tests/setupTests.js'],
}; 