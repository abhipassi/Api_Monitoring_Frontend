import { LogOut } from 'lucide-react'

import { useToast } from '@/components/feedback/ToastContext.js'
import { StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx'
import { DescriptionList } from '@/components/ui/DescriptionList.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm.jsx'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.account

// The same page for customers and staff: their own details, password and sign out
export default function AccountPage() {
  usePageTitle(text.title)
  const { user, account, logout } = useAuth()
  const toast = useToast()

  const details = [
    { label: text.profile.name, value: user.name },
    { label: text.profile.email, value: user.email },
    { label: text.profile.role, value: <StatusBadge kind="role" value={user.role} dot={false} /> },
    account && { label: text.profile.company, value: account.companyName },
  ].filter(Boolean)

  return (
    <>
      <PageHeader title={text.title} description={text.description} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={text.profile.title} />
            <CardBody><DescriptionList items={details} /></CardBody>
          </Card>
          <Card>
            <CardHeader title={text.signOut.title} description={text.signOut.description} />
            <CardBody><Button variant="secondary" leftIcon={LogOut} onClick={logout}>{content.common.actions.signOut}</Button></CardBody>
          </Card>
        </div>
        <Card>
          <CardHeader title={text.password.title} description={text.password.description} />
          <CardBody><ChangePasswordForm onDone={() => toast.success(content.auth.change.updated)} /></CardBody>
        </Card>
      </div>
    </>
  )
}
