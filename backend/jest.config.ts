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
  // Sequelize-era tests for services that have since moved to Firestore; they mock
  // Sequelize models these services no longer call, so they can't pass as-is.
  // farmService/userService/announcementService were rewritten against a Firestore
  // fake (see tests/helpers) and no longer need to be excluded.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    'imageService.test.ts',
    'farmArchive.flow.test.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
};

export default config;
