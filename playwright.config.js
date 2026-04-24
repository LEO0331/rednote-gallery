const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname);

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4317',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `python3 -m http.server 4317 --bind 127.0.0.1 --directory "${ROOT_DIR}"`,
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
    timeout: 120000
  }
});
