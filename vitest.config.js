const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['app.js'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85
      }
    }
  }
});
