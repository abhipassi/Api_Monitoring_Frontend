import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/cn.js'

const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-8' }

export function Spinner({ size = 'md', className, label }) {
  return (
    <output aria-label={label} className="inline-flex">
      <Loader2 aria-hidden="true" className={cn('animate-spin text-current', sizes[size], className)} />
    </output>
  )
}

export function Skeleton({ className }) {
  return <span aria-hidden="true" className={cn('block animate-pulse rounded-md bg-surface-muted', className)} />
}
