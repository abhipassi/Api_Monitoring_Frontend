import { content } from '@/content/index.js'

// All formatting uses the browser's own language and time zone (locale `undefined`), and Intl's
// built-in unit names, so no word or format is typed by hand here.
const missing = content.common.placeholder

const number = (options) => new Intl.NumberFormat(undefined, options)

export const formatNumber = (value) => (value == null ? missing : number().format(value))

// Uptime values arrive as 0-100 (99.95), not 0-1
export const formatPercent = (value) =>
  value == null ? missing : number({ style: 'percent', maximumFractionDigits: 2 }).format(value / 100)

export const formatMs = (value) => {
  if (value == null) return missing
  if (value < 1000) return number({ style: 'unit', unit: 'millisecond', unitDisplay: 'short', maximumFractionDigits: 0 }).format(value)
  return number({ style: 'unit', unit: 'second', unitDisplay: 'short', maximumFractionDigits: 2 }).format(value / 1000)
}

const DURATION_UNITS = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
]

// 3725 -> "1 hr, 2 min": the two largest non-zero units
export const formatDuration = (seconds) => {
  if (seconds == null) return missing
  let remaining = Math.max(0, Math.round(seconds))
  const parts = []
  for (const [unit, size] of DURATION_UNITS) {
    const amount = Math.floor(remaining / size)
    remaining -= amount * size
    if (amount > 0 && parts.length < 2) {
      parts.push(number({ style: 'unit', unit, unitDisplay: 'short' }).format(amount))
    }
  }
  return parts.length ? parts.join(' ') : number({ style: 'unit', unit: 'second', unitDisplay: 'short' }).format(0)
}

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
const timeOnly = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' })
const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const dayAndTime = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

const toDate = (value) => (value == null ? null : new Date(value))

export const formatDateTime = (value) => (value == null ? missing : dateTime.format(toDate(value)))
export const formatDate = (value) => (value == null ? missing : dateOnly.format(toDate(value)))
export const formatTime = (value) => (value == null ? missing : timeOnly.format(toDate(value)))
export const formatShortDate = (value) => (value == null ? missing : shortDate.format(toDate(value)))
export const formatDayAndTime = (value) => (value == null ? missing : dayAndTime.format(toDate(value)))

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const RELATIVE_UNITS = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

// "5 minutes ago", "yesterday"
export const formatRelative = (value, now = Date.now()) => {
  if (value == null) return missing
  const seconds = Math.round((toDate(value).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  for (const [unit, size] of RELATIVE_UNITS) {
    if (abs >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return relative.format(seconds, 'second')
}

export const formatCurrency = (amount, currency) => {
  if (amount == null) return missing
  return number({
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

// SUPER_ADMIN -> "Super admin": fallback label for any value the interface has no text for
export const humanize = (value) => {
  if (!value) return missing
  const text = String(value).replace(/[_-]+/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
