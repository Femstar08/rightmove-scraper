module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/*.test.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(got)/)'
  ]
};
