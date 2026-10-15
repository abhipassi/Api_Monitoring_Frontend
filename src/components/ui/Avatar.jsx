import { cn } from '@/lib/cn.js'
import { initials } from '@/lib/format.js'

const sizes = { sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-11 text-base' }

export function Avatar({ name, size = 'md', className }) {
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-soft-fg', sizes[size], className)}>
      {initials(name)}
    </span>
  )
}
