import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'

// Label/value pairs. Missing values show the shared placeholder instead of a blank.
export function DescriptionList({ items, columns = 2, className }) {
  const grid = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return (
    <dl className={cn('grid grid-cols-1 gap-x-8 gap-y-4', grid, className)}>
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="text-sm text-fg-muted">{label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-fg">{value ?? content.common.placeholder}</dd>
        </div>
      ))}
    </dl>
  )
}
