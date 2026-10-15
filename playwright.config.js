import { defineConfig, devices } from '@playwright/test'

import { backendDir, backendEnv, ports, urls } from './e2e/support/env.js'

// End-to-end tests drive the real website in a real browser against the real API, worker, MongoDB and Redis.
// Mail is caught by a local fake SMTP server; nothing leaves the machine.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  // One shared database, mail box and monitored API: run one test at a time
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: './e2e/.results',
  globalSetup: './e2e/support/globalSetup.js',
  globalTeardown: './e2e/support/globalTeardown.js',
  use: {
    baseURL: urls.frontend,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/support/server.mjs',
      url: `${urls.control}/ready`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'node server.js',
      cwd: backendDir,
      env: backendEnv(),
      url: `${urls.api}/health-check`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${ports.frontend} --strictPort`,
      env: { ...process.env, VITE_API_URL: urls.api },
      url: urls.frontend,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
