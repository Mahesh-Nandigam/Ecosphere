export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js', '!**/e2e/**/*.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
