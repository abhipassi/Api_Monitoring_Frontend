import { ArrowRight, Building2, ClipboardList, Gauge, ListChecks, Siren, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router'

import { QueryError } from '@/components/feedback/states.jsx'
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { StatCard } from '@/components/ui/StatCard.jsx'
import { paths } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useAdminStats } from '@/features/admin/api.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { PlanBadge } from '@/features/meta/PlanBadge.jsx'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { formatCurrency, formatNumber } from '@/lib/format.js'

const text = content.admin.dashboard

export default function AdminDashboardPage() {
  usePageTitle(text.title)
  const { plans } = useMeta()
  const { can } = useAuth()
  const query = useAdminStats()
  const stats = query.data

  if (query.isError && !stats) {
    return (
      <>
        <PageHeader title={text.title} description={text.description} />
        <Card><QueryError error={query.error} onRetry={query.refetch} /></Card>
      </>
    )
  }

  const revenue = stats?.estimatedMonthlyRevenue
  const loading = !stats

  return (
    <>
      <PageHeader title={text.title} description={text.description} />
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={text.stats.customers} value={formatNumber(stats?.clients.total)} hint={stats && text.stats.customersHint(stats.clients.newLast30Days)} icon={Building2} loading={loading} />
          <StatCard label={text.stats.users} value={formatNumber(stats?.activeUsers)} icon={Users} tone="info" loading={loading} />
          <StatCard label={text.stats.monitors} value={formatNumber(stats?.monitors.total)} hint={stats && text.stats.monitorsHint(stats.monitors.active, stats.monitors.down)} icon={Gauge} loading={loading} />
          <StatCard label={text.stats.incidents} value={formatNumber(stats?.openIncidents)} icon={Siren} tone={stats?.openIncidents > 0 ? 'danger' : 'success'} loading={loading} />
          <StatCard label={text.stats.checks} value={formatNumber(stats?.checksLast24h.total)} hint={stats && text.stats.checksHint(formatNumber(stats.checksLast24h.failed))} icon={ListChecks} loading={loading} />
          <StatCard label={text.stats.requests} value={formatNumber(stats?.pendingPlanRequests)} hint={text.stats.requestsHint} icon={ClipboardList} tone={stats?.pendingPlanRequests > 0 ? 'warning' : 'neutral'} loading={loading} />
          <StatCard
            label={text.stats.revenue}
            value={revenue && formatCurrency(revenue.amount, revenue.currency)}
            hint={revenue?.isSample ? text.stats.revenueSample : text.stats.revenueHint}
            icon={Wallet}
            tone="success"
            loading={loading}
            className="sm:col-span-2"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={text.byPlan.title} />
            <CardBody>
              <ul className="divide-y divide-line">
                {/* Archived plans only appear while someone is still on them */}
                {plans.filter((plan) => plan.isActive || stats?.clients.byPlan[plan.key] > 0).map((plan) => (
                  <li key={plan.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <PlanBadge planKey={plan.key} />
                    <span className="text-sm font-medium text-fg">{formatNumber(stats?.clients.byPlan[plan.key])}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          {can('plan-requests.manage') && stats?.pendingPlanRequests > 0 && (
            <Card>
              <CardHeader title={text.attention.title} />
              <CardBody>
                <Link to={paths.admin.planRequests} className="flex items-center justify-between gap-3 rounded-lg bg-warning-soft px-4 py-3 text-sm font-medium text-warning-soft-fg hover:opacity-90">
                  {text.attention.requests(stats.pendingPlanRequests)}
                  <span className="inline-flex items-center gap-1.5">
                    {text.attention.review}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
