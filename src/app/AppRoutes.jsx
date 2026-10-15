import { lazy } from 'react'
import { Route, Routes } from 'react-router'

import { AppShell } from '@/components/layout/AppShell.jsx'
import { adminNavigation, clientNavigation } from '@/components/layout/navigation.js'
import { content } from '@/content/index.js'
import { REALM_KEYS } from '@/config/realms.js'
import { paths, patterns } from '@/config/routes.js'
import { GuestOnly, RequireAuth, RequirePermission, RequireSuperAdmin } from '@/features/auth/guards.jsx'
import { RealmRoot } from './RealmRoot.jsx'

// Each page loads when first visited, so the charts library and admin screens aren't in the first download
const LoginPage = lazy(() => import('@/pages/auth/LoginPage.jsx'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage.jsx'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage.jsx'))
const ChangePasswordPage = lazy(() => import('@/pages/auth/ChangePasswordPage.jsx'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'))
const AccountPage = lazy(() => import('@/pages/shared/AccountPage.jsx'))

const DashboardPage = lazy(() => import('@/pages/client/DashboardPage.jsx'))
const MonitorsPage = lazy(() => import('@/pages/client/MonitorsPage.jsx'))
const MonitorDetailPage = lazy(() => import('@/pages/client/MonitorDetailPage.jsx'))
const NewMonitorPage = lazy(() => import('@/pages/client/MonitorFormPages.jsx').then((m) => ({ default: m.NewMonitorPage })))
const EditMonitorPage = lazy(() => import('@/pages/client/MonitorFormPages.jsx').then((m) => ({ default: m.EditMonitorPage })))
const IncidentsPage = lazy(() => import('@/pages/client/IncidentsPage.jsx'))
const TeamPage = lazy(() => import('@/pages/client/TeamPage.jsx'))
const BillingPage = lazy(() => import('@/pages/client/BillingPage.jsx'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage.jsx'))
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage.jsx'))
const AdminCustomerPage = lazy(() => import('@/pages/admin/AdminCustomerPage.jsx'))
const AdminPlanRequestsPage = lazy(() => import('@/pages/admin/AdminPlanRequestsPage.jsx'))
const AdminEmployeesPage = lazy(() => import('@/pages/admin/AdminEmployeesPage.jsx'))
const AdminAuditLogPage = lazy(() => import('@/pages/admin/AdminAuditLogPage.jsx'))

const { client, admin } = paths

// Paths inside <Route> are relative to the parent, and the parents here are layout routes without a path, so absolute is used
export function AppRoutes() {
  return (
    <Routes>
      {/* ---------- customer area ---------- */}
      <Route element={<RealmRoot realm={REALM_KEYS.client} />}>
        <Route element={<GuestOnly />}>
          <Route path={client.login} element={<LoginPage />} />
          <Route path={client.register} element={<RegisterPage />} />
        </Route>
        <Route path={client.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={client.resetPassword} element={<ResetPasswordPage />} />

        <Route element={<RequireAuth allowPendingPasswordChange />}>
          <Route path={client.changePassword} element={<ChangePasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell navigation={clientNavigation} areaLabel={content.nav.areaLabel.client} />}>
            <Route path={client.dashboard} element={<DashboardPage />} />
            <Route path={client.monitors} element={<MonitorsPage />} />
            <Route path={client.monitorNew} element={<NewMonitorPage />} />
            <Route path={patterns.monitor} element={<MonitorDetailPage />} />
            <Route path={patterns.monitorEdit} element={<EditMonitorPage />} />
            <Route path={client.incidents} element={<IncidentsPage />} />
            <Route path={client.team} element={<TeamPage />} />
            <Route path={client.billing} element={<BillingPage />} />
            <Route path={client.account} element={<AccountPage />} />
          </Route>
        </Route>
      </Route>

      {/* ---------- staff area ---------- */}
      <Route element={<RealmRoot realm={REALM_KEYS.admin} />}>
        <Route element={<GuestOnly />}>
          <Route path={admin.login} element={<LoginPage />} />
        </Route>
        <Route path={admin.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={admin.resetPassword} element={<ResetPasswordPage />} />

        <Route element={<RequireAuth allowPendingPasswordChange />}>
          <Route path={admin.changePassword} element={<ChangePasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell navigation={adminNavigation} areaLabel={content.nav.areaLabel.admin} />}>
            <Route element={<RequirePermission permission="clients.read" />}>
              <Route path={admin.dashboard} element={<AdminDashboardPage />} />
              <Route path={admin.customers} element={<AdminCustomersPage />} />
              <Route path={patterns.customer} element={<AdminCustomerPage />} />
            </Route>
            <Route element={<RequirePermission permission="plan-requests.manage" />}>
              <Route path={admin.planRequests} element={<AdminPlanRequestsPage />} />
            </Route>
            <Route element={<RequireSuperAdmin />}>
              <Route path={admin.employees} element={<AdminEmployeesPage />} />
            </Route>
            <Route element={<RequirePermission permission="audit.read" />}>
              <Route path={admin.auditLog} element={<AdminAuditLogPage />} />
            </Route>
            <Route path={admin.account} element={<AccountPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage homePath={client.dashboard} />} />
    </Routes>
  )
}
