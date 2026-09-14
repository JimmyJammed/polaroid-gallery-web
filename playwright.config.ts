import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '*.spec.ts', timeout: 30000, fullyParallel: true, workers: 3,
  use: { baseURL: process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:5199', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { ...devices['iPhone 13'], viewport: { width: 320, height: 568 } } }
  ],
  webServer: process.env.VERIFY_BASE_URL ? undefined : { command: 'npm run build && npm run preview -- --port 5199 --strictPort', url: 'http://127.0.0.1:5199', reuseExistingServer: !process.env.CI }
});
