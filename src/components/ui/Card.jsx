import { cn } from '@/lib/cn.js'

export function Card({ as: Tag = 'section', className, children, ...props }) {
  return (
    <Tag className={cn('rounded-xl border border-line bg-surface shadow-card', className)} {...props}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return <div className={cn('flex items-center justify-end gap-3 border-t border-line px-5 py-3', className)}>{children}</div>
}
