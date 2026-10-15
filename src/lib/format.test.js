import { describe, expect, it } from 'vitest'

import { formatCurrency, formatDuration, formatMs, formatNumber, formatPercent, formatRelative, humanize, initials } from './format.js'

// Output depends on the machine's language, so these check content (digits, units) rather than exact punctuation.
describe('formatting', () => {
  it('shows the placeholder for missing values', () => {
    for (const fn of [formatNumber, formatPercent, formatMs, formatDuration, formatRelative]) expect(fn(null)).toBe('—')
    expect(formatCurrency(null, 'USD')).toBe('—')
  })

  it('formats uptime given as 0-100', () => {
    expect(formatPercent(99.95)).toMatch(/99.95/)
    expect(formatPercent(100)).toMatch(/100/)
  })

  it('switches from milliseconds to seconds', () => {
    expect(formatMs(250)).toMatch(/250/)
    expect(formatMs(1500)).toMatch(/1.5/)
  })

  it('shows the two largest units of a duration', () => {
    const text = formatDuration(3725)
    expect(text).toMatch(/1/)
    expect(text).toMatch(/2/)
    expect(text).not.toMatch(/5/) // seconds are dropped once hours and minutes are shown
    expect(formatDuration(0)).toMatch(/0/)
    expect(formatDuration(45)).toMatch(/45/)
  })

  it('describes the past relative to now', () => {
    const now = Date.UTC(2026, 0, 10, 12, 0, 0)
    expect(formatRelative(now - 5 * 60_000, now)).toMatch(/5/)
    expect(formatRelative(now - 3 * 3_600_000, now)).toMatch(/3/)
  })

  it('formats whole prices without decimals', () => {
    expect(formatCurrency(19, 'USD')).not.toMatch(/\.00|,00/)
    expect(formatCurrency(19, 'USD')).toMatch(/19/)
  })

  it('turns API values into readable text', () => {
    expect(humanize('SUPER_ADMIN')).toBe('Super admin')
    expect(humanize('plan-request')).toBe('Plan request')
    expect(humanize('')).toBe('—')
    expect(initials('alex morgan')).toBe('AM')
    expect(initials('Cher')).toBe('C')
  })
})
