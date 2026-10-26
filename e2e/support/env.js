import { readFileSync } from 'node:fs'
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

// The run uses its own database ("<your database>_e2e"), where the API creates its own starting plans.
// Plans you edit in the real database therefore can't break a test, and a test can't change them.
// The address is read from the Backend's .env.
export const e2eMongoUri = () => {
  const line = readFileSync(path.join(backendDir, '.env'), 'utf8').split('\n').find((l) => l.startsWith('MONGODB_URI'))
  const uri = line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : 'mongodb://127.0.0.1:27017/apimon'
  const [base, query = ''] = uri.split('?')
  const withDatabase = /^mongodb(\+srv)?:\/\/[^/]+\/[^/]+$/.test(base) ? `${base}_e2e` : `${base.replace(/\/$/, '')}/apimon_e2e`
  return query ? `${withDatabase}?${query}` : withDatabase
}

// Private Redis key prefix, so a test run never touches anyone else's queue
export const QUEUE_PREFIX = 'apimon-e2e'

export const PASSWORD = 'E2e-pass-123'
export const EMAIL_DOMAIN = 'example.com'
export const EMAIL_PREFIX = 'zz-e2e-'
// Plans made by the tests start with this, and are removed afterwards
export const PLAN_KEY_PREFIX = 'ZZE2E_'

// Environment for the Backend API and its worker during the run
export const backendEnv = () => ({
  ...process.env,
  NODE_ENV: 'test', // switches rate limiting off; a run makes far more requests than a person
  PORT: String(ports.api),
  MONGODB_URI: e2eMongoUri(),
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
