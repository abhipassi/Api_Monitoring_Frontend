import { useNavigate } from 'react-router'

import { AuthLayout } from '@/components/layout/AuthLayout.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm.jsx'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.auth

// Shown to anyone still on the temporary password from their welcome email
export default function ChangePasswordPage() {
  usePageTitle(text.change.title)
  const { logout, realm } = useAuth()
  const navigate = useNavigate()
  return (
    <AuthLayout
      title={text.change.title}
      description={text.change.description}
      footer={<Button variant="link" onClick={logout}>{content.common.actions.signOut}</Button>}
    >
      <ChangePasswordForm onDone={() => navigate(realm.homePath, { replace: true })} />
    </AuthLayout>
  )
}
