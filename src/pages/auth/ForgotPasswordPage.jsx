import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { AuthLayout } from '@/components/layout/AuthLayout.jsx'
import { ErrorList } from '@/components/ui/Alert.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { TextField } from '@/components/ui/fields.jsx'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useForgotPassword } from '@/features/auth/hooks.js'
import { forgotSchema } from '@/features/auth/schemas.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.auth

export default function ForgotPasswordPage() {
  usePageTitle(text.forgot.title)
  const { realm } = useAuth()
  const mutation = useForgotPassword()
  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit((values) => mutation.mutateAsync(values).catch(() => {}))
  const backLink = <Link to={realm.paths.login} className="font-medium text-link hover:underline">{text.shared.backToLogin}</Link>

  return (
    <AuthLayout title={text.forgot.title} description={mutation.isSuccess ? undefined : text.forgot.description} footer={backLink}>
      {mutation.isSuccess ? (
        <EmptyState icon={MailCheck} title={text.forgot.doneTitle} description={text.forgot.doneDescription(getValues('email'))} className="py-4" />
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <ErrorList errors={mutation.error?.errors} />
          <TextField label={text.shared.email} type="email" autoComplete="email" placeholder={text.shared.emailPlaceholder} error={errors.email?.message} {...register('email')} />
          <Button submit loading={mutation.isPending} className="w-full">{text.forgot.submit}</Button>
        </form>
      )}
    </AuthLayout>
  )
}
