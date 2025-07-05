// Minimal Jest config for specific tests without MSW
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [], // Skip MSW setup
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx)',
  ],
};