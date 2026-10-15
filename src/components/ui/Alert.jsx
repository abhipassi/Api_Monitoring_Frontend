import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'

const tones = {
  info: { box: 'border-info/30 bg-info-soft text-info-soft-fg', icon: Info },
  success: { box: 'border-success/30 bg-success-soft text-success-soft-fg', icon: CheckCircle2 },
  warning: { box: 'border-warning/30 bg-warning-soft text-warning-soft-fg', icon: AlertTriangle },
  danger: { box: 'border-danger/30 bg-danger-soft text-danger-soft-fg', icon: XCircle },
}

export function Alert({ tone = 'info', title, onDismiss, className, children }) {
  const { box, icon: Icon } = tones[tone]
  return (
    <div role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-3.5 text-sm', box, className)}>
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label={content.common.actions.dismiss} className="-m-1 h-fit rounded p-1 hover:bg-surface/40">
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  )
}

// A list of problems from the API (e.g. every reason a monitor was rejected)
export function ErrorList({ errors, className }) {
  if (!errors?.length) return null
  if (errors.length === 1) return <Alert tone="danger" className={className}>{errors[0]}</Alert>
  return (
    <Alert tone="danger" className={className}>
      <ul className="list-disc space-y-0.5 pl-4">
        {errors.map((message) => <li key={message}>{message}</li>)}
      </ul>
    </Alert>
  )
}
