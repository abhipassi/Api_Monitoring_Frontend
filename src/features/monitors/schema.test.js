import { describe, expect, it } from 'vitest'

import { buildMonitorSchema, toFormValues, toPayload } from './schema.js'

const meta = { limits: { maxNameLength: 100, maxUrlLength: 2048, maxHeaders: 3, maxBodyLength: 50 } }
const schema = buildMonitorSchema(meta)

const valid = {
  name: 'Prod API',
  url: 'https://api.example.com/health',
  method: 'GET',
  expectedStatus: 200,
  intervalSeconds: 300,
  timeoutSeconds: 10,
  headers: [],
  body: '',
}

const errorsFor = (overrides) => {
  const result = schema.safeParse({ ...valid, ...overrides })
  if (result.success) return {}
  // The form shows the first problem per field, so keep the first
  const errors = {}
  for (const issue of result.error.issues) errors[issue.path.join('.')] ??= issue.message
  return errors
}

describe('monitor form validation', () => {
  it('accepts a normal monitor', () => {
    expect(schema.safeParse(valid).success).toBe(true)
  })

  it('needs a real http(s) address', () => {
    expect(errorsFor({ url: 'example.com' }).url).toMatch(/http/)
    expect(errorsFor({ url: 'ftp://example.com' }).url).toMatch(/http/)
    expect(errorsFor({ url: '' }).url).toMatch(/required/)
  })

  it('keeps the timeout shorter than the interval', () => {
    expect(errorsFor({ intervalSeconds: 30, timeoutSeconds: 30 }).timeoutSeconds).toMatch(/shorter/)
  })

  it('only allows a body with POST, PUT or PATCH', () => {
    expect(errorsFor({ method: 'GET', body: '{"a":1}' }).body).toMatch(/POST/)
    expect(errorsFor({ method: 'POST', body: '{"a":1}' }).body).toBeUndefined()
  })

  it('limits and de-duplicates headers', () => {
    const header = (name) => ({ name, value: 'x' })
    expect(errorsFor({ headers: [header('A'), header('a')] }).headers).toMatch(/once/)
    expect(errorsFor({ headers: [header('A'), header('B'), header('C'), header('D')] }).headers).toMatch(/3/)
    expect(errorsFor({ headers: [{ name: '', value: 'x' }] })['headers.0.name']).toMatch(/name/)
  })

  it('enforces the body length from the API config', () => {
    expect(errorsFor({ method: 'POST', body: 'x'.repeat(51) }).body).toMatch(/50/)
  })
})

describe('form <-> API conversion', () => {
  it('starts a new monitor within the plan limits', () => {
    const values = toFormValues(null, { minIntervalSeconds: 600, maxTimeoutSeconds: 5 })
    expect(values.intervalSeconds).toBe(600)
    expect(values.timeoutSeconds).toBe(5)
    expect(values.timeoutSeconds).toBeLessThan(values.intervalSeconds)
  })

  it('round-trips an existing monitor, turning a missing body into an empty box and back', () => {
    const monitor = { ...valid, headers: [{ name: 'X-Key', value: 'abc' }], body: null }
    const values = toFormValues(monitor)
    expect(values.body).toBe('')
    const payload = toPayload({ ...values, name: '  Renamed  ' })
    expect(payload.name).toBe('Renamed')
    expect(payload.body).toBeNull()
    expect(payload.headers).toEqual([{ name: 'X-Key', value: 'abc' }])
  })
})
