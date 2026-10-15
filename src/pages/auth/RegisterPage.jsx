import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { AuthLayout } from '@/components/layout/AuthLayout.jsx'
import { ErrorList } from '@/components/ui/Alert.jsx'
import { Button, ButtonLink } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { TextField } from '@/components/ui/fields.jsx'
import { paths } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useRegister } from '@/features/auth/hooks.js'
import { registerSchema } from '@/features/auth/schemas.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.auth

export default function RegisterPage() {
  usePageTitle(text.register.title)
  const mutation = useRegister()
  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', companyName: '' },
  })

  const onSubmit = handleSubmit((values) => mutation.mutateAsync(values).catch(() => {}))

  if (mutation.isSuccess) {
    return (
      <AuthLayout title={text.register.doneTitle}>
        <EmptyState
          icon={MailCheck}
          title={getValues('email')}
          description={text.register.doneDescription(getValues('email'))}
          action={<ButtonLink to={paths.client.login}>{text.register.doneAction}</ButtonLink>}
          className="py-4"
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={text.register.title}
      description={text.register.description}
      footer={
        <>
          <span>{text.register.haveAccount} </span>
          <Link to={paths.client.login} className="font-medium text-link hover:underline">{text.login.submit}</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <ErrorList errors={mutation.error?.errors} />
        <TextField label={text.register.name} autoComplete="name" placeholder={text.register.namePlaceholder} error={errors.name?.message} {...register('name')} />
        <TextField label={text.register.company} autoComplete="organization" placeholder={text.register.companyPlaceholder} error={errors.companyName?.message} {...register('companyName')} />
        <TextField label={text.shared.email} type="email" autoComplete="email" placeholder={text.shared.emailPlaceholder} error={errors.email?.message} {...register('email')} />
        <Button submit loading={mutation.isPending} className="mt-2 w-full">{text.register.submit}</Button>
      </form>
    </AuthLayout>
  )
}
