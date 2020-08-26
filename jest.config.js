module.exports = {
  preset: 'ts-jest',
  clearMocks: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  errorOnDeprecated: true,
  testRunner: 'jest-circus/runner',
  collectCoverageFrom: ['src/index.ts'],
  setupFilesAfterEnv: ['./testSetup.ts']
}
