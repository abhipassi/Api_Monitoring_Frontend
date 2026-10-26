import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

import { EMAIL_DOMAIN, EMAIL_PREFIX, PASSWORD, PLAN_KEY_PREFIX, QUEUE_PREFIX, backendDir, e2eMongoUri } from './env.js'

// Test data setup/cleanup talks straight to the Backend's database layer. Only ever touches
// zz-e2e-*@example.com records and the private Redis prefix.
const backendRequire = createRequire(path.join(backendDir, 'package.json'))
const load = (specifier) => import(pathToFileURL(backendRequire.resolve(specifier)).href).then((m) => m.default ?? m)
const model = (file) => import(pathToFileURL(path.join(backendDir, 'src/Models', file)).href).then((m) => m.default)

const pattern = new RegExp(`^${EMAIL_PREFIX}.*@${EMAIL_DOMAIN.replace('.', '\\.')}$`)

export const withDatabase = async (work) => {
  backendRequire('dotenv').config({ path: path.join(backendDir, '.env'), quiet: true })
  const mongoose = await load('mongoose')
  await mongoose.connect(e2eMongoUri())
  const models = {
    Client: await model('clients.js'),
    ClientUser: await model('ClientUser.js'),
    Employees: await model('employees.js'),
    Monitor: await model('Monitor.js'),
    CheckResult: await model('CheckResult.js'),
    Incident: await model('Incident.js'),
    PlanRequest: await model('PlanRequest.js'),
    AuditLog: await model('AuditLog.js'),
    Plan: await model('Plan.js'),
  }
  try {
    return await work({ mongoose, models })
  } finally {
    await mongoose.disconnect()
  }
}

export const cleanDatabase = () =>
  withDatabase(async ({ models }) => {
    const clients = await models.Client.find({ email: pattern }).select('_id')
    const clientIds = clients.map((c) => c._id)
    const employees = await models.Employees.find({ email: pattern }).select('_id')
    const employeeIds = employees.map((e) => e._id)

    await Promise.all([
      models.CheckResult.deleteMany({ clientId: { $in: clientIds } }),
      models.Incident.deleteMany({ clientId: { $in: clientIds } }),
      models.Monitor.deleteMany({ clientId: { $in: clientIds } }),
      models.PlanRequest.deleteMany({ clientId: { $in: clientIds } }),
      models.AuditLog.deleteMany({ $or: [{ actorId: { $in: employeeIds } }, { targetId: { $in: [...clientIds, ...employeeIds] } }] }),
    ])
    await models.ClientUser.deleteMany({ $or: [{ clientId: { $in: clientIds } }, { email: pattern }] })
    await models.Client.deleteMany({ _id: { $in: clientIds } })
    await models.Employees.deleteMany({ _id: { $in: employeeIds } })
    await models.Plan.deleteMany({ key: new RegExp(`^${PLAN_KEY_PREFIX}`) })
  })

export const cleanRedis = async () => {
  backendRequire('dotenv').config({ path: path.join(backendDir, '.env'), quiet: true })
  const IORedis = await load('ioredis')
  const redis = new IORedis(process.env.REDIS_URL)
  let cursor = '0'
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', `${QUEUE_PREFIX}:*`, 'COUNT', 500)
    cursor = next
    if (keys.length) await redis.del(...keys)
  } while (cursor !== '0')
  await redis.quit()
}

// The staff accounts the tests sign in with. Phone numbers are unique per run.
export const seedStaff = () =>
  withDatabase(async ({ models }) => {
    const bcrypt = await load('bcryptjs')
    const password = await bcrypt.hash(PASSWORD, 10)
    const make = (name, extra) =>
      models.Employees.create({
        name,
        email: `${EMAIL_PREFIX}${name.toLowerCase().replace(/\s+/g, '-')}@${EMAIL_DOMAIN}`,
        phone: Number(`98${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 90 + 10)}`) + Math.floor(Math.random() * 1000),
        password,
        mustChangePassword: false,
        ...extra,
      })
    await make('Sam Super', { role: 'SUPER_ADMIN' })
    await make('Rita Reader', { role: 'STAFF', permissions: ['clients.read'] })
  })

export const staffEmail = (name) => `${EMAIL_PREFIX}${name.toLowerCase().replace(/\s+/g, '-')}@${EMAIL_DOMAIN}`

// A signed-in-ready customer created straight in the database (faster than the sign-up flow when a test isn't about sign-up)
export const createCustomer = ({ tag, plan = 'FREE', ownerName = 'Olive Owner' }) =>
  withDatabase(async ({ models }) => {
    const bcrypt = await load('bcryptjs')
    const email = `${EMAIL_PREFIX}${tag}@${EMAIL_DOMAIN}`
    const client = await models.Client.create({ name: ownerName, email, companyName: `${tag} Co`, plan })
    await models.ClientUser.create({
      clientId: client._id, name: ownerName, email, role: 'OWNER',
      passwordHash: await bcrypt.hash(PASSWORD, 10), mustChangePassword: false,
    })
    return { email, clientId: String(client._id), companyName: `${tag} Co` }
  })

export const addIncident = ({ clientId, monitorId, monitorName, status = 'OPEN' }) =>
  withDatabase(async ({ models }) => {
    const startedAt = new Date(Date.now() - 20 * 60_000)
    await models.Incident.create({
      clientId, monitorId, monitorName, monitorUrl: 'https://example.org', status, startedAt, failureCount: 3,
      cause: { errorType: 'TIMEOUT', message: 'No response within 10 seconds' },
      ...(status === 'RESOLVED' ? { resolvedAt: new Date(), resolution: 'RECOVERED' } : {}),
    })
  })

// A monitor created straight in the database (the worker is not told about it, so no checks run until it is edited)
export const addMonitor = ({ clientId, name, url = 'https://example.org', status = 'ACTIVE', health = 'UNKNOWN', intervalSeconds = 300 }) =>
  withDatabase(async ({ models }) => {
    const monitor = await models.Monitor.create({
      clientId, createdBy: clientId, name, url, status, intervalSeconds, timeoutSeconds: 10,
      'health.status': health,
    })
    return { id: String(monitor._id), name }
  })

// A day of check history for the charts: one check every 30 minutes, with a short outage
export const addHistory = ({ clientId, monitorId }) =>
  withDatabase(async ({ models }) => {
    const now = Date.now()
    const rows = []
    for (let i = 1; i <= 46; i++) {
      const failed = i >= 10 && i <= 12
      rows.push({
        monitorId, clientId, checkedAt: new Date(now - i * 30 * 60_000), success: !failed,
        statusCode: failed ? 500 : 200, responseTimeMs: 120 + ((i * 37) % 180),
        ...(failed ? { error: { type: 'UNEXPECTED_STATUS', message: 'Expected 200 but got 500' } } : {}),
      })
    }
    await models.CheckResult.insertMany(rows)
  })
