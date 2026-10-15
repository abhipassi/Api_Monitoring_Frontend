import { content } from '@/content/index.js'
import { humanize } from '@/lib/format.js'

const text = content.admin.audit

// Which label list a changed field's value should be translated through
const valueLabels = {
  plan: content.enums.plan,
  role: content.enums.role,
  status: { ...content.enums.clientStatus, ...content.enums.employeeStatus },
}

const formatValue = (field, value) => {
  if (value == null || (Array.isArray(value) && value.length === 0)) return text.emptyValue
  if (Array.isArray(value)) return value.join(', ')
  return valueLabels[field]?.[value] ?? String(value)
}

// { plan: { from: 'FREE', to: 'STARTER' } }  ->  ['Plan: Free → Starter']
export const describeChanges = (changes = {}) =>
  Object.entries(changes).map(([field, { from, to }]) => {
    const label = content.enums.auditField[field] ?? humanize(field)
    return from == null ? text.setTo(label, formatValue(field, to)) : text.change(label, formatValue(field, from), formatValue(field, to))
  })

export const actionLabel = (action) => content.enums.auditAction[action] ?? humanize(action)
