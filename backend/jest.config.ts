import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  setupFiles: ['reflect-metadata'],
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
};

export default config;
