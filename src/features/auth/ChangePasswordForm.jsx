import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { ErrorList } from '@/components/ui/Alert.jsx'
import { TextField } from '@/components/ui/fields.jsx'
import { content } from '@/content/index.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { changePasswordSchema } from './schemas.js'
import { useChangePassword } from './hooks.js'

const text = content.auth

// Used on the forced "choose your own password" page and on the Account page
export function ChangePasswordForm({ onDone }) {
  const { limits } = useMeta()
  const mutation = useChangePassword()
  const schema = useMemo(() => changePasswordSchema(limits.minPasswordLength), [limits.minPasswordLength])
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values).then(
      () => {
        reset()
        onDone?.()
      },
      () => {} // the error is shown below
    )
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <ErrorList errors={mutation.error?.errors} />
      <TextField label={text.shared.currentPassword} type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
      <TextField label={text.shared.newPassword} type="password" autoComplete="new-password" hint={text.shared.passwordHint(limits.minPasswordLength)} error={errors.newPassword?.message} {...register('newPassword')} />
      <TextField label={text.shared.confirmPassword} type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button submit loading={mutation.isPending} className="mt-2 w-full">{text.change.submit}</Button>
    </form>
  )
}
