import { useId } from 'react'

import { cn } from '@/lib/cn.js'

// A short row of mutually exclusive choices (time range, status filter). options: [{ value, label }]
// Real radio inputs underneath, so arrow keys, focus and screen readers behave natively.
export function SegmentedControl({ options, value, onChange, label, size = 'md', className }) {
  const name = useId()
  return (
    <fieldset className={cn('inline-flex rounded-lg border border-line bg-surface-muted p-0.5', className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span
            className={cn(
              'block whitespace-nowrap rounded-md font-medium text-fg-muted transition-colors hover:text-fg peer-checked:bg-surface peer-checked:text-fg peer-checked:shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-focus',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            )}
          >
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
