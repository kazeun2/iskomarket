import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/playwright',
  timeout: 30 * 1000,
  use: {
    baseURL: process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001',
    headless: true,
    trace: 'on-first-retry',
  },
  // Start the dev server automatically when running tests in CI/local
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: process.env.BASE_URL || process.env.VITE_DEV_URL || 'http://localhost:3001',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
