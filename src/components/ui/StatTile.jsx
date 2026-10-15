import { cn } from '@/lib/cn.js'

const tones = {
  neutral: 'text-fg',
  success: 'text-success-fg',
  danger: 'text-danger-fg',
  warning: 'text-warning-fg',
}

// A small number with a caption, for compact breakdowns inside a card
export function StatTile({ label, value, tone = 'neutral', className }) {
  return (
    <div className={cn('rounded-lg bg-surface-muted px-3 py-2.5', className)}>
      <p className={cn('text-xl font-semibold', tones[tone])}>{value}</p>
      <p className="text-xs text-fg-muted">{label}</p>
    </div>
  )
}
