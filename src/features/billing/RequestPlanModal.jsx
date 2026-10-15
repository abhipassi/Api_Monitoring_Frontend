import { useForm } from 'react-hook-form'

import { useToast } from '@/components/feedback/ToastContext.js'
import { Alert, ErrorList } from '@/components/ui/Alert.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { TextareaField } from '@/components/ui/fields.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { content } from '@/content/index.js'
import { useCreatePlanRequest } from './api.js'

const text = content.billing.request
const FORM_ID = 'plan-request-form'

// Two steps in one dialog: write the request, then (if the change has side effects) read the warnings
export function RequestPlanModal({ plan, onClose }) {
  const toast = useToast()
  const mutation = useCreatePlanRequest()
  const { register, handleSubmit } = useForm({ defaultValues: { note: '' } })

  const onSubmit = handleSubmit(({ note }) =>
    mutation.mutateAsync({ plan: plan.key, note: note.trim() || undefined }).then(
      (body) => {
        toast.success(content.billing.toasts.sent)
        if (body.warnings.length === 0) onClose()
      },
      () => {}
    )
  )

  const warnings = mutation.data?.warnings ?? []

  return (
    <Modal
      open={Boolean(plan)}
      onClose={onClose}
      title={plan ? (mutation.isSuccess ? text.sentTitle : text.title(plan.name)) : ''}
      description={mutation.isSuccess ? undefined : text.description}
      footer={
        mutation.isSuccess ? (
          <Button onClick={onClose}>{content.common.actions.close}</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>{content.common.actions.cancel}</Button>
            <Button submit form={FORM_ID} loading={mutation.isPending}>{text.submit}</Button>
          </>
        )
      }
    >
      {mutation.isSuccess ? (
        <Alert tone="warning" title={text.warningsTitle}>
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </Alert>
      ) : (
        <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-4">
          <ErrorList errors={mutation.error?.errors} />
          <TextareaField label={text.note} placeholder={text.notePlaceholder} {...register('note')} />
        </form>
      )}
    </Modal>
  )
}
