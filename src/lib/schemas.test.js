import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { emailField, passwordField, requiredText, withMatchingPasswords, wholeNumber } from './schemas.js'

const messages = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('form building blocks', () => {
  it('requires text and enforces a maximum', () => {
    const schema = requiredText('Name', { max: 5 })
    expect(messages(schema, '   ')).toEqual(['Name is required'])
    expect(messages(schema, 'abcdef')).toEqual(['Name must be at most 5 characters'])
    expect(schema.parse('  ok  ')).toBe('ok')
  })

  it('checks emails', () => {
    expect(messages(emailField(), '')[0]).toMatch(/required/)
    expect(messages(emailField(), 'nope')).toEqual(['Enter a valid email address'])
    expect(messages(emailField(), 'a@b.co')).toEqual([])
  })

  it('checks password length', () => {
    expect(messages(passwordField('Password', 8), 'short')).toEqual(['Password must be at least 8 characters'])
    expect(messages(passwordField('Password', 8), 'longenough')).toEqual([])
  })

  it('rejects blanks and decimals in whole-number fields', () => {
    const schema = wholeNumber('Timeout', { min: 1, max: 60 })
    expect(messages(schema, NaN)).toEqual(['Timeout must be a whole number'])
    expect(messages(schema, 1.5)).toEqual(['Timeout must be a whole number'])
    expect(messages(schema, 0)).toEqual(['Timeout must be at least 1'])
    expect(messages(schema, 61)).toEqual(['Timeout must be at most 60'])
    expect(messages(schema, 30)).toEqual([])
  })

  it('reports mismatched passwords on the confirmation field', () => {
    const schema = withMatchingPasswords({ newPassword: z.string(), confirmPassword: z.string() })
    const result = schema.safeParse({ newPassword: 'a', confirmPassword: 'b' })
    expect(result.error.issues[0].path).toEqual(['confirmPassword'])
    expect(schema.safeParse({ newPassword: 'a', confirmPassword: 'a' }).success).toBe(true)
  })
})
