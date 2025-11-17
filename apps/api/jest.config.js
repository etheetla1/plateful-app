module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@plateful/shared/src/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@plateful/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@plateful/shared$': '<rootDir>/../../packages/shared/src',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@plateful)/)',
  ],
  collectCoverageFrom: [
    'api/**/*.ts',
    'services/**/*.ts',
    'lib/**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: false,
  silent: false,
  reporters: ['<rootDir>/__tests__/custom-reporter.js'],
};

