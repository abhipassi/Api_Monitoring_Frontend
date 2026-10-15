import { cn } from '@/lib/cn.js'

const controlBase =
  'block w-full rounded-lg border bg-surface text-fg placeholder:text-fg-subtle transition-colors disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle'

const controlState = (invalid) =>
  invalid ? 'border-danger focus-visible:outline-danger' : 'border-line-strong hover:border-fg-subtle'

const controlSizes = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-11 px-3.5 text-base',
}

export function Input({ invalid = false, size = 'md', className, ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlState(invalid), controlSizes[size], className)}
      {...props}
    />
  )
}

export function Select({ invalid = false, size = 'md', className, children, ...props }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlState(invalid), controlSizes[size], 'pr-8', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ invalid = false, rows = 4, className, ...props }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlState(invalid), 'px-3 py-2 text-sm', className)}
      {...props}
    />
  )
}

export function Checkbox({ className, ...props }) {
  return <input type="checkbox" className={cn('size-4 rounded border-line-strong accent-primary', className)} {...props} />
}
