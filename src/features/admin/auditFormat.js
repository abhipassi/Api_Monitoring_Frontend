import { content } from '@/content/index.js'
import { humanize } from '@/lib/format.js'

const text = content.admin.audit

// Which label list a changed field's value should be translated through
const valueLabels = {
  role: content.enums.role,
  status: { ...content.enums.clientStatus, ...content.enums.employeeStatus },
}

const formatValue = (field, value, nameOf) => {
  if (value == null || (Array.isArray(value) && value.length === 0)) return text.emptyValue
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? text.yes : text.no
  if (field === 'plan') return nameOf(value)
  return valueLabels[field]?.[value] ?? String(value)
}

// { plan: { from: 'FREE', to: 'STARTER' } }  ->  ['Plan: Free → Starter']
// nameOf turns a plan key into the plan's current name (from usePlans)
export const describeChanges = (changes = {}, nameOf = (key) => key) =>
  Object.entries(changes).map(([field, { from, to }]) => {
    const label = content.enums.auditField[field] ?? humanize(field)
    return from == null ? text.setTo(label, formatValue(field, to, nameOf)) : text.change(label, formatValue(field, from, nameOf), formatValue(field, to, nameOf))
  })

export const actionLabel = (action) => content.enums.auditAction[action] ?? humanize(action)
