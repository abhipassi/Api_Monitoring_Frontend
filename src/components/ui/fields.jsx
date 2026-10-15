import { useId } from 'react'

import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'
import { Checkbox, Input, Select, Textarea } from './controls.jsx'

// Label + control + hint + error, wired together for screen readers. The control gets the generated
// id and aria-describedby from the render function, so every field type reuses this.
export function Field({ label, hint, error, required = false, id, className, children }) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-fg">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-danger-fg">{content.common.requiredMark}</span>}
        </label>
      )}
      {children({ id: fieldId, 'aria-describedby': describedBy, invalid: Boolean(error), required })}
      {error && <p id={errorId} className="text-sm text-danger-fg">{error}</p>}
      {hint && !error && <p id={hintId} className="text-sm text-fg-subtle">{hint}</p>}
    </div>
  )
}

// Each of these takes the same label/hint/error props plus whatever the underlying control takes,
// including the {...register('name')} spread from react-hook-form.
export function TextField({ label, hint, error, required, className, ...inputProps }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={inputProps.id} className={className}>
      {(aria) => <Input {...aria} {...inputProps} />}
    </Field>
  )
}

export function SelectField({ label, hint, error, required, className, children, ...selectProps }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={selectProps.id} className={className}>
      {(aria) => <Select {...aria} {...selectProps}>{children}</Select>}
    </Field>
  )
}

export function TextareaField({ label, hint, error, required, className, ...textareaProps }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={textareaProps.id} className={className}>
      {(aria) => <Textarea {...aria} {...textareaProps} />}
    </Field>
  )
}

export function CheckboxField({ label, hint, className, ...checkboxProps }) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Checkbox id={id} className="mt-0.5" aria-describedby={hint ? `${id}-hint` : undefined} {...checkboxProps} />
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
        {hint && <span id={`${id}-hint`} className="text-sm text-fg-subtle">{hint}</span>}
      </div>
    </div>
  )
}
