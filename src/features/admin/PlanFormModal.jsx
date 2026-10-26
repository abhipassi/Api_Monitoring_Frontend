import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { useToast } from '@/components/feedback/ToastContext.js'
import { Alert, ErrorList } from '@/components/ui/Alert.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { CheckboxField, TextareaField, TextField } from '@/components/ui/fields.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { content } from '@/content/index.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { useCreatePlan, useUpdatePlan } from './api.js'
import { featureLines, planSchema } from './planSchema.js'

const text = content.admin.plans
const FORM_ID = 'plan-form'
const LIMIT_FIELDS = ['maxMonitors', 'minIntervalSeconds', 'maxTimeoutSeconds', 'maxTeamMembers', 'retentionDays']

// Create (plan = null) or edit a plan. The key is fixed once the plan exists.
export function PlanFormModal({ open, plan, onClose }) {
  const { limits, plans } = useMeta()
  const toast = useToast()
  const create = useCreatePlan()
  const update = useUpdatePlan()
  const editing = Boolean(plan)
  const mutation = editing ? update : create
  const schema = useMemo(() => planSchema({ editing, ranges: limits.planLimits }), [editing, limits.planLimits])

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      key: plan?.key ?? '',
      name: plan?.name ?? '',
      description: plan?.description ?? '',
      priceMonthly: plan?.priceMonthly ?? 0,
      ...Object.fromEntries(LIMIT_FIELDS.map((field) => [field, plan?.limits[field] ?? undefined])),
      features: (plan?.features ?? []).join('\n'),
      sortOrder: plan?.sortOrder ?? plans.length,
      isRecommended: plan?.isRecommended ?? false,
      isDefault: plan?.isDefault ?? false,
      isActive: plan?.isActive ?? true,
    },
  })

  const retention = Number(useWatch({ control, name: 'retentionDays' }))
  const shortensHistory = editing && retention < plan.limits.retentionDays && plan.customerCount > 0

  const onSubmit = handleSubmit((values) => {
    const body = {
      name: values.name,
      description: values.description,
      priceMonthly: values.priceMonthly,
      limits: Object.fromEntries(LIMIT_FIELDS.map((field) => [field, values[field]])),
      features: featureLines(values.features),
      sortOrder: values.sortOrder,
      isRecommended: values.isRecommended,
      isDefault: values.isDefault,
      isActive: values.isActive,
    }
    const request = editing ? update.mutateAsync({ key: plan.key, ...body }) : create.mutateAsync({ key: values.key, ...body })
    return request.then(
      (response) => {
        const impact = response.impact && text.toasts.impact(response.impact)
        if (impact) toast.info(impact)
        else toast.success(editing ? text.toasts.updated : text.toasts.created)
        onClose()
      },
      () => {}
    )
  })

  // The default plan is changed by making another plan the default, and it can't be archived
  const isCurrentDefault = editing && plan.isDefault

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? text.form.editTitle(plan.name) : text.form.createTitle}
      description={editing ? undefined : text.form.createDescription}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{content.common.actions.cancel}</Button>
          <Button submit form={FORM_ID} loading={mutation.isPending}>{editing ? text.form.submitEdit : text.form.submitCreate}</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <ErrorList errors={mutation.error?.errors} />
        {editing && plan.customerCount > 0 && <Alert tone="info">{text.form.affected(plan.customerCount)}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={text.form.key} required disabled={editing} placeholder={text.form.keyPlaceholder} hint={editing ? undefined : text.form.keyHint} error={errors.key?.message} {...register('key')} />
          <TextField label={text.form.name} required error={errors.name?.message} {...register('name')} />
        </div>
        <TextField label={text.form.description} hint={text.form.descriptionHint} error={errors.description?.message} {...register('description')} />
        <TextField label={text.form.price} required type="number" step="0.01" min="0" hint={text.form.priceHint(plans[0]?.currency)} error={errors.priceMonthly?.message} {...register('priceMonthly', { valueAsNumber: true })} />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-fg">{text.form.limitsTitle}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {LIMIT_FIELDS.map((field) => (
              <TextField key={field} label={text.form.limits[field]} required type="number" error={errors[field]?.message} {...register(field, { valueAsNumber: true })} />
            ))}
          </div>
          {shortensHistory && <Alert tone="warning">{text.form.shorterHistory}</Alert>}
        </fieldset>

        <TextareaField label={text.form.features} hint={text.form.featuresHint} rows={4} error={errors.features?.message} {...register('features')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={text.form.order} required type="number" hint={text.form.orderHint} error={errors.sortOrder?.message} {...register('sortOrder', { valueAsNumber: true })} />
        </div>

        <div className="flex flex-col gap-3">
          <CheckboxField label={text.form.recommended} hint={text.form.recommendedHint} {...register('isRecommended')} />
          <CheckboxField label={text.form.isDefault} hint={text.form.defaultHint} disabled={isCurrentDefault} {...register('isDefault')} />
          <CheckboxField label={text.form.isActive} hint={text.form.activeHint} disabled={isCurrentDefault} {...register('isActive')} />
        </div>
      </form>
    </Modal>
  )
}
