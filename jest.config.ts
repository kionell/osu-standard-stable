import type { Config } from 'jest';

export default async (): Promise<Config> => {
  return {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.m?jsx?$': 'jest-esm-transformer',
      '^.+\\.tsx?$': 'ts-jest',
    },
    transformIgnorePatterns: [
      'node_modules/(?!(osu-classes|osu-parsers)/.*)',
    ],
    testMatch: [
      '**/?(*.)+(spec|test).[jt]s',
    ],
  };
}
