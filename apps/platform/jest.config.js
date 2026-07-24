/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...require('@secretflow/testing/config/react'),
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@@/(.*)$': '<rootDir>/src/.umi/$1',
  },
  // Coverage thresholds / 覆盖率门禁
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/.umi/**', '!src/**/*.d.ts'],
};
