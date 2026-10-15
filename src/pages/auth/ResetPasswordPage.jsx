import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'

import { AuthLayout } from '@/components/layout/AuthLayout.jsx'
import { Alert, ErrorList } from '@/components/ui/Alert.jsx'
import { Button, ButtonLink } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { TextField } from '@/components/ui/fields.jsx'
import { searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useResetPassword } from '@/features/auth/hooks.js'
import { resetSchema } from '@/features/auth/schemas.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.auth

// Opened from the link in the reset email: /reset-password?token=...
export default function ResetPasswordPage() {
  usePageTitle(text.reset.title)
  const { realm } = useAuth()
  const { limits } = useMeta()
  const [search] = useSearchParams()
  const token = search.get(names.token)
  const mutation = useResetPassword()
  const schema = useMemo(() => resetSchema(limits.minPasswordLength), [limits.minPasswordLength])
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(({ newPassword }) => mutation.mutateAsync({ token, newPassword }).catch(() => {}))
  const backLink = <Link to={realm.paths.login} className="font-medium text-link hover:underline">{text.shared.backToLogin}</Link>

  if (mutation.isSuccess) {
    return (
      <AuthLayout title={text.reset.doneTitle}>
        <EmptyState
          icon={CheckCircle2}
          title={text.reset.doneTitle}
          description={text.reset.doneDescription}
          action={<ButtonLink to={realm.paths.login}>{text.login.submit}</ButtonLink>}
          className="py-4"
        />
      </AuthLayout>
    )
  }

  if (!token) {
    return (
      <AuthLayout title={text.reset.title} footer={backLink}>
        <Alert tone="warning">{text.reset.missingToken}</Alert>
        <ButtonLink to={realm.paths.forgotPassword} variant="secondary" className="mt-4 w-full">{text.reset.requestNew}</ButtonLink>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={text.reset.title} description={text.reset.description} footer={backLink}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <ErrorList errors={mutation.error?.errors} />
        <TextField label={text.shared.newPassword} type="password" autoComplete="new-password" hint={text.shared.passwordHint(limits.minPasswordLength)} error={errors.newPassword?.message} {...register('newPassword')} />
        <TextField label={text.shared.confirmPassword} type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button submit loading={mutation.isPending} className="w-full">{text.reset.submit}</Button>
      </form>
    </AuthLayout>
  )
}
