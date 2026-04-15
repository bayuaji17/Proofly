import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    /* Use domcontentloaded instead of load — Vite dev server keeps
       an open HMR EventSource connection that prevents the load
       event from firing in Firefox. */
    navigationTimeout: 30_000,
  },

  /* Increase default test timeout for slower browsers */
  timeout: 60_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter @proofly/api dev',
      port: 3001,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter @proofly/web dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
