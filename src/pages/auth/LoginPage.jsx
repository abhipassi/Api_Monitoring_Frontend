import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { Alert, ErrorList } from '@/components/ui/Alert.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { TextField } from '@/components/ui/fields.jsx'
import { AuthLayout } from '@/components/layout/AuthLayout.jsx'
import { paths } from '@/config/routes.js'
import { REALM_KEYS } from '@/config/realms.js'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { loginSchema } from '@/features/auth/schemas.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.auth

// Shared by customers and staff: the realm decides the wording and where the links go
export default function LoginPage() {
  const { realm, login, sessionExpired } = useAuth()
  const isAdmin = realm.key === REALM_KEYS.admin
  const [error, setError] = useState(null)
  usePageTitle(isAdmin ? text.login.adminTitle : text.login.title)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // On success the session changes and the route guard moves the person on
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null)
    await login(email, password).catch(setError)
  })

  return (
    <AuthLayout
      title={isAdmin ? text.login.adminTitle : text.login.title}
      description={isAdmin ? text.login.adminDescription : text.login.description}
      footer={
        isAdmin ? (
          <Link to={paths.client.login} className="font-medium text-link hover:underline">{text.login.clientLink}</Link>
        ) : (
          <>
            <span>{text.login.noAccount} </span>
            <Link to={paths.client.register} className="font-medium text-link hover:underline">{text.login.createAccount}</Link>
            <span className="mx-2">{content.common.separator}</span>
            <Link to={paths.admin.login} className="text-fg-muted hover:text-fg hover:underline">{text.login.adminLink}</Link>
          </>
        )
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {sessionExpired && <Alert tone="warning">{content.errors.byStatus[401]}</Alert>}
        <ErrorList errors={error?.errors} />
        <TextField label={text.shared.email} type="email" autoComplete="email" placeholder={text.shared.emailPlaceholder} error={errors.email?.message} {...register('email')} />
        <TextField label={text.shared.password} type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="flex justify-end">
          <Link to={realm.paths.forgotPassword} className="text-sm font-medium text-link hover:underline">{text.login.forgot}</Link>
        </div>
        <Button submit loading={isSubmitting} className="w-full">{text.login.submit}</Button>
      </form>
    </AuthLayout>
  )
}
