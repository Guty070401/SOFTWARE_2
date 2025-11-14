module.exports = {
  collectCoverageFrom: ["<rootDir>/src/**/*.js", "!<rootDir>/src/server.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "text", "lcov", "html", "json-summary"],
  testEnvironment: "node",
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
    },
    {
      displayName: "functional",
      testMatch: ["<rootDir>/tests/functional/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
    },
  ],
};
