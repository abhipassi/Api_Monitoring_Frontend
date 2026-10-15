import { Activity, Gauge, Plus, Siren, Timer } from 'lucide-react'
import { Link } from 'react-router'

import { QueryError } from '@/components/feedback/states.jsx'
import { ButtonLink } from '@/components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { Meter } from '@/components/ui/Meter.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { StatCard } from '@/components/ui/StatCard.jsx'
import { appConfig } from '@/config/app.js'
import { paths, searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { MonitorHealthBadge } from '@/features/monitors/MonitorHealthBadge.jsx'
import { useMonitors } from '@/features/monitors/api.js'
import { RangeSelector } from '@/features/stats/RangeSelector.jsx'
import { useOverview } from '@/features/stats/api.js'
import { uptimeTone } from '@/features/stats/uptime.js'
import { useTeam } from '@/features/team/api.js'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { formatMs, formatNumber, formatPercent } from '@/lib/format.js'

const text = content.dashboard
const DEFAULTS = { [names.range]: appConfig.defaultStatRange }

export default function DashboardPage() {
  usePageTitle(text.title)
  const [params, setParams] = useListParams(DEFAULTS)
  const range = params[names.range]
  const overview = useOverview(range)
  const usage = useMonitors({ limit: 1 })
  const team = useTeam()
  const data = overview.data
  const { isOwner } = useAuth()

  const columns = [
    {
      key: 'monitor',
      header: text.table.monitor,
      cell: (row) => <Link to={paths.client.monitor(row.id)} className="font-medium text-fg hover:text-link hover:underline">{row.name}</Link>,
    },
    { key: 'health', header: text.table.health, cell: (row) => <MonitorHealthBadge monitor={row} /> },
    { key: 'uptime', header: text.table.uptime, align: 'right', cell: (row) => formatPercent(row.uptimePercent) },
    { key: 'response', header: text.table.response, align: 'right', hideBelow: 'sm', cell: (row) => formatMs(row.avgResponseTimeMs) },
    { key: 'checks', header: text.table.checks, align: 'right', hideBelow: 'md', cell: (row) => formatNumber(row.checks) },
  ]

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.description}
        actions={
          <>
            <RangeSelector value={range} onChange={(value) => setParams({ [names.range]: value })} />
            <ButtonLink to={paths.client.monitorNew} leftIcon={Plus}>{content.monitors.new}</ButtonLink>
          </>
        }
      />

      {overview.isError && !data ? (
        <Card><QueryError error={overview.error} onRetry={overview.refetch} /></Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={text.stats.monitors}
              value={formatNumber(data?.monitors.total)}
              hint={data && text.stats.monitorsHint(data.monitors.up, data.monitors.down)}
              icon={Gauge}
              loading={!data}
            />
            <StatCard
              label={text.stats.uptime}
              value={formatPercent(data?.uptimePercent)}
              hint={data && text.stats.uptimeHint(content.common.pluralize.checks(data.checks.total))}
              icon={Activity}
              tone={uptimeTone(data?.uptimePercent)}
              loading={!data}
            />
            <StatCard
              label={text.stats.response}
              value={formatMs(data?.avgResponseTimeMs)}
              hint={text.stats.responseHint}
              icon={Timer}
              tone="info"
              loading={!data}
            />
            <StatCard
              label={text.stats.incidents}
              value={formatNumber(data?.openIncidents)}
              hint={data && (data.openIncidents > 0 ? text.stats.incidentsHint : text.stats.incidentsNone)}
              icon={Siren}
              tone={data?.openIncidents > 0 ? 'danger' : 'success'}
              loading={!data}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={text.table.title} />
              <DataTable
                columns={columns}
                rows={data?.perMonitor}
                loading={!data}
                empty={
                  <EmptyState
                    icon={Gauge}
                    title={text.empty.title}
                    description={text.empty.description}
                    action={<ButtonLink to={paths.client.monitorNew} leftIcon={Plus}>{text.empty.action}</ButtonLink>}
                  />
                }
              />
            </Card>

            <Card>
              <CardHeader title={text.usage.title} />
              <CardBody className="flex flex-col gap-5">
                {usage.data ? (
                  <Meter label={text.usage.monitors} used={usage.data.usage.used} max={usage.data.usage.maxMonitors} />
                ) : null}
                {team.data ? <Meter label={text.usage.team} used={team.data.seats.used} max={team.data.seats.max} /> : null}
                {isOwner && <ButtonLink to={paths.client.billing} variant="secondary">{text.usage.manage}</ButtonLink>}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
