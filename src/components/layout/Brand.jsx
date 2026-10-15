import { Radar } from 'lucide-react'
import { Link } from 'react-router'

import { useMeta } from '@/features/meta/MetaContext.js'
import { cn } from '@/lib/cn.js'

export function Brand({ to, className }) {
  const { appName } = useMeta()
  const inner = (
    <>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-fg-inverse">
        <Radar aria-hidden="true" className="size-5" />
      </span>
      <span className="truncate text-base font-semibold tracking-tight text-fg">{appName}</span>
    </>
  )
  const classes = cn('flex items-center gap-2.5', className)
  return to ? <Link to={to} className={classes}>{inner}</Link> : <div className={classes}>{inner}</div>
}
