import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { ErrorList } from '@/components/ui/Alert.jsx'
import { Button, ButtonLink } from '@/components/ui/Button.jsx'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card.jsx'
import { SelectField, TextareaField, TextField } from '@/components/ui/fields.jsx'
import { appConfig } from '@/config/app.js'
import { content } from '@/content/index.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { formatDuration } from '@/lib/format.js'
import { HeadersEditor } from './HeadersEditor.jsx'
import { buildMonitorSchema, toFormValues, toPayload } from './schema.js'

const text = content.monitors.form

// Preset choices the plan allows, always keeping the monitor's current value so editing never silently changes it
const options = (presets, current, allowed) => {
  const values = new Set(presets.filter(allowed))
  if (current != null) values.add(current)
  return [...values].sort((a, b) => a - b)
}

/*
 * Create and edit share this form. `planLimits` is the customer's plan ({ minIntervalSeconds, maxTimeoutSeconds }),
 * `monitor` is present when editing, and `onSubmit` receives the API payload.
 */
export function MonitorForm({ monitor, planLimits, onSubmit, submitting, error, cancelTo, submitLabel }) {
  const meta = useMeta()
  const schema = useMemo(() => buildMonitorSchema(meta), [meta])
  const defaultValues = useMemo(() => toFormValues(monitor, planLimits), [monitor, planLimits])

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const method = useWatch({ control, name: 'method' })
  const allowsBody = appConfig.methodsWithBody.includes(method)

  // Switching to GET/HEAD/DELETE drops any body so it can't be sent by accident
  useEffect(() => {
    if (!allowsBody) setValue('body', '')
  }, [allowsBody, setValue])

  const intervals = options(appConfig.intervalPresetsSeconds, monitor?.intervalSeconds, (s) => s >= (planLimits?.minIntervalSeconds ?? 0))
  const timeouts = options(appConfig.timeoutPresetsSeconds, monitor?.timeoutSeconds, (s) => s <= (planLimits?.maxTimeoutSeconds ?? Infinity))

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(toPayload(values)))} noValidate className="flex flex-col gap-6">
      <ErrorList errors={error?.errors} />

      <Card>
        <CardHeader title={text.sections.basics} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <TextField label={text.name} required placeholder={text.namePlaceholder} hint={text.nameHint} error={errors.name?.message} {...register('name')} />
          <TextField label={text.url} required type="url" placeholder={text.urlPlaceholder} hint={text.urlHint} error={errors.url?.message} {...register('url')} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={text.sections.request} />
        <CardBody className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={text.method} error={errors.method?.message} {...register('method')}>
              {meta.enums.httpMethods.map((value) => <option key={value} value={value}>{value}</option>)}
            </SelectField>
            <TextField label={text.expectedStatus} type="number" inputMode="numeric" hint={text.expectedStatusHint} error={errors.expectedStatus?.message} {...register('expectedStatus', { valueAsNumber: true })} />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-fg">{text.headers}</legend>
            <p className="text-sm text-fg-subtle">{text.headersHint}</p>
            <HeadersEditor control={control} register={register} errors={errors} max={meta.limits.maxHeaders} />
            <p className="text-sm text-fg-subtle">{text.secretsNote}</p>
          </fieldset>
          {allowsBody && <TextareaField label={text.body} rows={5} placeholder={text.bodyPlaceholder} hint={text.bodyHint} error={errors.body?.message} className="font-mono" {...register('body')} />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={text.sections.schedule} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={text.interval}
            hint={planLimits && text.intervalHint(formatDuration(planLimits.minIntervalSeconds))}
            error={errors.intervalSeconds?.message}
            {...register('intervalSeconds', { valueAsNumber: true })}
          >
            {intervals.map((seconds) => <option key={seconds} value={seconds}>{formatDuration(seconds)}</option>)}
          </SelectField>
          <SelectField label={text.timeout} hint={text.timeoutHint} error={errors.timeoutSeconds?.message} {...register('timeoutSeconds', { valueAsNumber: true })}>
            {timeouts.map((seconds) => <option key={seconds} value={seconds}>{formatDuration(seconds)}</option>)}
          </SelectField>
        </CardBody>
        <CardFooter>
          <ButtonLink to={cancelTo} variant="secondary">{content.common.actions.cancel}</ButtonLink>
          <Button submit loading={submitting}>{submitLabel}</Button>
        </CardFooter>
      </Card>
    </form>
  )
}
