import { Navigate, Outlet, useLocation } from 'react-router'
import { ShieldOff } from 'lucide-react'

import { PageLoader } from '@/components/feedback/states.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { content } from '@/content/index.js'
import { AUTH_STATUS, useAuth } from './AuthContext.js'

// Signed-in pages. A person still on the emailed temporary password may only see the change-password page.
export function RequireAuth({ allowPendingPasswordChange = false }) {
  const { status, user, realm } = useAuth()
  const location = useLocation()

  if (status === AUTH_STATUS.loading) return <PageLoader className="min-h-dvh" />
  if (status === AUTH_STATUS.anonymous) return <Navigate to={realm.paths.login} state={{ from: location }} replace />
  if (user.mustChangePassword && !allowPendingPasswordChange) return <Navigate to={realm.paths.changePassword} replace />
  return <Outlet />
}

// Login-type pages: someone already signed in is sent on to where they belong
export function GuestOnly() {
  const { status, user, realm } = useAuth()
  const location = useLocation()

  if (status === AUTH_STATUS.loading) return <PageLoader className="min-h-dvh" />
  if (status === AUTH_STATUS.authenticated) {
    const destination = user.mustChangePassword ? realm.paths.changePassword : (location.state?.from?.pathname ?? realm.homePath)
    return <Navigate to={destination} replace />
  }
  return <Outlet />
}

export function Forbidden() {
  return <EmptyState icon={ShieldOff} title={content.errors.forbidden.title} description={content.errors.forbidden.description} className="py-24" />
}

// Staff pages that need a specific permission (or, for owner-only customer pages, ownership)
export function RequirePermission({ permission }) {
  const { can } = useAuth()
  return can(permission) ? <Outlet /> : <Forbidden />
}

export function RequireSuperAdmin() {
  const { isSuperAdmin } = useAuth()
  return isSuperAdmin ? <Outlet /> : <Forbidden />
}
