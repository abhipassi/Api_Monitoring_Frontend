import path from 'node:path'
import { fileURLToPath } from 'node:url'

// One place for the addresses the end-to-end run uses, so the config, the support server and the tests agree.
export const ports = Object.freeze({ frontend: 5180, api: 3994, smtp: 2599, control: 2598, target: 2597 })

export const urls = Object.freeze({
  frontend: `http://localhost:${ports.frontend}`,
  api: `http://localhost:${ports.api}`,
  control: `http://127.0.0.1:${ports.control}`,
  // The "customer API" that monitors in the tests point at
  target: `http://127.0.0.1:${ports.target}/ok`,
})

export const here = path.dirname(fileURLToPath(import.meta.url))
export const backendDir = path.resolve(here, '../../../Backend')

// Private Redis key prefix, so a test run never touches anyone else's queue
export const QUEUE_PREFIX = 'apimon-e2e'

export const PASSWORD = 'E2e-pass-123'
export const EMAIL_DOMAIN = 'example.com'
export const EMAIL_PREFIX = 'zz-e2e-'

// Environment for the Backend API and its worker during the run
export const backendEnv = () => ({
  ...process.env,
  NODE_ENV: 'test', // switches rate limiting off; a run makes far more requests than a person
  PORT: String(ports.api),
  FRONTEND_URL: urls.frontend,
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: String(ports.smtp),
  SMTP_USER: 'alerts@test',
  SMTP_PASS: 'x',
  MAIL_FROM: 'Alerts <alerts@test>',
  QUEUE_PREFIX,
  ALLOW_PRIVATE_MONITOR_URLS: 'true', // the monitored API in the tests lives on 127.0.0.1
  INCIDENT_FAILURE_THRESHOLD: '3',
  SALES_EMAIL: `${EMAIL_PREFIX}sales@${EMAIL_DOMAIN}`,
})
