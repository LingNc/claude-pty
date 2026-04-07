/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        allowImportingTsExtensions: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(bun-pty)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^bun-pty$': '<rootDir>/__mocks__/bun-pty.ts',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
