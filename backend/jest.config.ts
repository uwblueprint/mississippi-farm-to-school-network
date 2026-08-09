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
  // Sequelize-era service tests; domain services now use Firestore.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    'farmService.test.ts',
    'userService.test.ts',
    'imageService.test.ts',
    'announcementService.test.ts',
    'farmArchive.flow.test.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
};

export default config;
