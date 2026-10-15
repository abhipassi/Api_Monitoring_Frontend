import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { useToast } from '@/components/feedback/ToastContext.js'
import { ErrorList } from '@/components/ui/Alert.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { CheckboxField, SelectField, TextField } from '@/components/ui/fields.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { content } from '@/content/index.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { useCreateEmployee, useUpdateEmployee } from './api.js'
import { employeeSchema } from './employeeSchema.js'

const text = content.admin.employees
const FORM_ID = 'employee-form'

// Add (employee = null) or edit a staff member. Email and phone are fixed once created.
export function EmployeeFormModal({ open, employee, onClose }) {
  const { enums, limits, permissions } = useMeta()
  const toast = useToast()
  const create = useCreateEmployee()
  const update = useUpdateEmployee()
  const editing = Boolean(employee)
  const mutation = editing ? update : create
  const schema = useMemo(() => employeeSchema({ editing, limits }), [editing, limits])

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: employee?.name ?? '',
      email: employee?.email ?? '',
      phone: employee?.phone ? String(employee.phone) : '',
      role: employee?.role ?? enums.employeeRoles.at(-1),
      status: employee?.status ?? enums.employeeStatuses[0],
      permissions: employee?.permissions ?? [],
    },
  })

  const isSuperAdmin = useWatch({ control, name: 'role' }) === 'SUPER_ADMIN'

  const onSubmit = handleSubmit((values) => {
    const permissionList = isSuperAdmin ? [] : values.permissions
    const request = editing
      ? update.mutateAsync({ id: employee.id, name: values.name, role: values.role, status: values.status, permissions: permissionList })
      : create.mutateAsync({ name: values.name, email: values.email, phone: values.phone.replace(/[\s-]/g, ''), role: values.role, permissions: permissionList })
    return request.then(
      () => {
        toast.success(editing ? text.toasts.updated : text.toasts.created)
        onClose()
      },
      () => {}
    )
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? text.form.editTitle : text.form.createTitle}
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
        <TextField label={text.form.name} required error={errors.name?.message} {...register('name')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={text.form.email} required type="email" disabled={editing} error={errors.email?.message} {...register('email')} />
          <TextField label={text.form.phone} required inputMode="numeric" placeholder={text.form.phonePlaceholder} disabled={editing} hint={editing ? undefined : text.form.phoneHint} error={errors.phone?.message} {...register('phone')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={text.form.role} hint={text.form.roleHint} {...register('role')}>
            {enums.employeeRoles.map((role) => <option key={role} value={role}>{content.enums.role[role] ?? role}</option>)}
          </SelectField>
          {editing && (
            <SelectField label={text.form.status} {...register('status')}>
              {enums.employeeStatuses.map((status) => <option key={status} value={status}>{content.enums.employeeStatus[status] ?? status}</option>)}
            </SelectField>
          )}
        </div>
        <fieldset disabled={isSuperAdmin} className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-fg">{text.form.permissions}</legend>
          <p className="text-sm text-fg-subtle">{text.form.permissionsHint}</p>
          {permissions.map(({ key, description }) => (
            <CheckboxField key={key} label={description} value={key} {...register('permissions')} />
          ))}
        </fieldset>
      </form>
    </Modal>
  )
}
