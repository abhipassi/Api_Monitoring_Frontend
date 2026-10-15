import { toneFor } from '@/constants/tones.js'
import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'
import { humanize } from '@/lib/format.js'

const tones = {
  neutral: 'bg-neutral-soft text-neutral-soft-fg',
  primary: 'bg-primary-soft text-primary-soft-fg',
  success: 'bg-success-soft text-success-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
  info: 'bg-info-soft text-info-soft-fg',
}

const dots = {
  neutral: 'bg-fg-subtle',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}

export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {dot && <span aria-hidden="true" className={cn('size-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  )
}

// The same status always looks the same: tone from constants/tones.js, wording from content/enums.js.
// `kind` is one of the keys in those two files (health, incident, role, plan, ...).
export function StatusBadge({ kind, value, label, dot = true, className }) {
  const text = label ?? content.enums[kind]?.[value] ?? humanize(value)
  return (
    <Badge tone={toneFor(kind, value)} dot={dot} className={className}>
      {text}
    </Badge>
  )
}
