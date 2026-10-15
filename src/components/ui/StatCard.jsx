import { cn } from '@/lib/cn.js'
import { Card } from './Card.jsx'
import { Skeleton } from './Spinner.jsx'

const iconTones = {
  neutral: 'bg-neutral-soft text-neutral-soft-fg',
  primary: 'bg-primary-soft text-primary-soft-fg',
  success: 'bg-success-soft text-success-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
  info: 'bg-info-soft text-info-soft-fg',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'neutral', loading = false, className }) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-fg">{value}</p>
          )}
          {hint && !loading && <p className="mt-1 text-sm text-fg-subtle">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', iconTones[tone])}>
            <Icon aria-hidden="true" className="size-5" />
          </span>
        )}
      </div>
    </Card>
  )
}
