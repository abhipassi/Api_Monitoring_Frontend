import { describe, expect, it } from 'vitest'

import { featureLines, planSchema } from './planSchema.js'

const ranges = {
  maxMonitors: { min: 1, max: 1000 },
  minIntervalSeconds: { min: 5, max: 86400 },
  maxTimeoutSeconds: { min: 1, max: 300 },
  maxTeamMembers: { min: 1, max: 1000 },
  retentionDays: { min: 1, max: 365 },
}

const valid = {
  key: 'TEAM',
  name: 'Team',
  description: '',
  priceMonthly: 29,
  maxMonitors: 10,
  minIntervalSeconds: 60,
  maxTimeoutSeconds: 30,
  maxTeamMembers: 5,
  retentionDays: 30,
  features: 'Email alerts\nPriority support',
  sortOrder: 1,
  isRecommended: false,
  isDefault: false,
  isActive: true,
}

const firstErrors = (schema, overrides) => {
  const result = schema.safeParse({ ...valid, ...overrides })
  const errors = {}
  if (!result.success) for (const issue of result.error.issues) errors[issue.path.join('.')] ??= issue.message
  return errors
}

describe('plan form validation', () => {
  const schema = planSchema({ editing: false, ranges })

  it('accepts a normal plan', () => {
    expect(schema.safeParse(valid).success).toBe(true)
  })

  it('needs a key only when creating', () => {
    expect(firstErrors(schema, { key: '  ' }).key).toMatch(/required/)
    expect(firstErrors(planSchema({ editing: true, ranges }), { key: '' }).key).toBeUndefined()
  })

  it('keeps every limit inside the range the server allows', () => {
    expect(firstErrors(schema, { maxMonitors: 0 }).maxMonitors).toMatch(/at least 1/)
    expect(firstErrors(schema, { retentionDays: 400 }).retentionDays).toMatch(/at most 365/)
    expect(firstErrors(schema, { maxTeamMembers: 2.5 }).maxTeamMembers).toMatch(/whole number/)
    expect(firstErrors(schema, { minIntervalSeconds: NaN }).minIntervalSeconds).toMatch(/whole number/)
  })

  it('checks the price', () => {
    expect(firstErrors(schema, { priceMonthly: NaN }).priceMonthly).toMatch(/number/)
    expect(firstErrors(schema, { priceMonthly: -1 }).priceMonthly).toMatch(/at least 0/)
    expect(firstErrors(schema, { priceMonthly: 0 }).priceMonthly).toBeUndefined()
  })

  it('limits the number and length of features', () => {
    expect(firstErrors(schema, { features: Array.from({ length: 11 }, (_, i) => `f${i}`).join('\n') }).features).toMatch(/at most 10/)
    expect(firstErrors(schema, { features: 'x'.repeat(81) }).features).toMatch(/at most 80/)
  })

  it('turns typed lines into a feature list, ignoring blanks', () => {
    expect(featureLines(' One \n\n  Two  \n')).toEqual(['One', 'Two'])
    expect(featureLines('')).toEqual([])
  })
})
