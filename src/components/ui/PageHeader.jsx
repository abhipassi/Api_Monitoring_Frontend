import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '@/lib/cn.js'

export function PageHeader({ title, description, actions, back, meta, className }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-3', className)}>
      {back && (
        <Link to={back.to} className="inline-flex w-fit items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-muted">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
