import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'

import { Button, IconButton } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/controls.jsx'
import { content } from '@/content/index.js'

const text = content.monitors.form

// Rows of header name + value. Works inside any react-hook-form form that has a `headers` array.
export function HeadersEditor({ control, register, errors, max }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'headers' })
  const listError = errors.headers?.message ?? errors.headers?.root?.message

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <div>
              <Input aria-label={text.headerName} placeholder={text.headerNamePlaceholder} invalid={Boolean(errors.headers?.[index]?.name)} {...register(`headers.${index}.name`)} />
              {errors.headers?.[index]?.name && <p className="mt-1 text-sm text-danger-fg">{errors.headers[index].name.message}</p>}
            </div>
            <div>
              <Input aria-label={text.headerValue} placeholder={text.headerValuePlaceholder} invalid={Boolean(errors.headers?.[index]?.value)} {...register(`headers.${index}.value`)} />
              {errors.headers?.[index]?.value && <p className="mt-1 text-sm text-danger-fg">{errors.headers[index].value.message}</p>}
            </div>
          </div>
          <IconButton icon={Trash2} label={text.removeHeader} onClick={() => remove(index)} />
        </div>
      ))}
      {listError && <p className="text-sm text-danger-fg">{listError}</p>}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" leftIcon={Plus} disabled={fields.length >= max} onClick={() => append({ name: '', value: '' })}>
          {text.addHeader}
        </Button>
        <span className="text-sm text-fg-subtle">{text.headersLimit(max)}</span>
      </div>
    </div>
  )
}
