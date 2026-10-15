import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useToast } from '@/components/feedback/ToastContext.js'
import { ErrorList } from '@/components/ui/Alert.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { SelectField, TextField } from '@/components/ui/fields.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { content } from '@/content/index.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { useAddMember } from './api.js'
import { addMemberSchema } from './schema.js'

const text = content.team.addForm
const FORM_ID = 'add-member-form'

export function AddMemberModal({ open, onClose }) {
  const { enums, limits } = useMeta()
  const toast = useToast()
  const mutation = useAddMember()
  const schema = useMemo(() => addMemberSchema(limits), [limits])
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', role: enums.clientRoles.at(-1) },
  })

  const onSubmit = handleSubmit((values) =>
    mutation.mutateAsync(values).then(
      () => {
        toast.success(content.team.toasts.added)
        onClose()
      },
      () => {}
    )
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={text.title}
      description={text.description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{content.common.actions.cancel}</Button>
          <Button submit form={FORM_ID} loading={mutation.isPending}>{text.submit}</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <ErrorList errors={mutation.error?.errors} />
        <TextField label={text.name} required placeholder={text.namePlaceholder} error={errors.name?.message} {...register('name')} />
        <TextField label={text.email} required type="email" placeholder={text.emailPlaceholder} error={errors.email?.message} {...register('email')} />
        <SelectField label={text.role} hint={text.roleHint} error={errors.role?.message} {...register('role')}>
          {enums.clientRoles.map((role) => <option key={role} value={role}>{content.enums.role[role] ?? role}</option>)}
        </SelectField>
      </form>
    </Modal>
  )
}
