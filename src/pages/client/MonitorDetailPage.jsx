import { useState } from 'react'
import { ExternalLink, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { ChecksChart } from '@/components/charts/ChecksChart.jsx'
import { ResponseTimeChart } from '@/components/charts/ResponseTimeChart.jsx'
import { PageLoader, QueryError } from '@/components/feedback/states.jsx'
import { useToast } from '@/components/feedback/ToastContext.js'
import { Alert } from '@/components/ui/Alert.jsx'
import { Button, ButtonLink } from '@/components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx'
import { DescriptionList } from '@/components/ui/DescriptionList.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { Skeleton } from '@/components/ui/Spinner.jsx'
import { appConfig } from '@/config/app.js'
import { paths, searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useIncidents } from '@/features/incidents/api.js'
import { IncidentsTable } from '@/features/incidents/IncidentsTable.jsx'
import { ErrorBreakdown } from '@/features/monitors/detail/ErrorBreakdown.jsx'
import { MonitorStatCards } from '@/features/monitors/detail/MonitorStatCards.jsx'
import { RecentChecks } from '@/features/monitors/detail/RecentChecks.jsx'
import { MonitorHealthBadge } from '@/features/monitors/MonitorHealthBadge.jsx'
import { useDeleteMonitor, useMonitor, useMonitorChart, useMonitorResults, useMonitorStats, useUpdateMonitor } from '@/features/monitors/api.js'
import { RangeSelector } from '@/features/stats/RangeSelector.jsx'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { errorMessage } from '@/lib/errors.js'
import { formatDateTime, formatDuration, formatRelative } from '@/lib/format.js'

const text = content.monitors
const DEFAULTS = { [names.range]: appConfig.defaultStatRange }

export default function MonitorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useListParams(DEFAULTS)
  const range = params[names.range]

  const monitorQuery = useMonitor(id)
  const stats = useMonitorStats(id, range)
  const chart = useMonitorChart(id, range)
  const results = useMonitorResults(id)
  const incidents = useIncidents({ monitorId: id, limit: 5 })
  const update = useUpdateMonitor()
  const remove = useDeleteMonitor()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const monitor = monitorQuery.data
  usePageTitle(monitor?.name)

  if (monitorQuery.isPending) return <PageLoader />
  if (monitorQuery.isError) {
    return monitorQuery.error.status === 404 ? (
      <EmptyState title={text.detail.notFound.title} description={text.detail.notFound.description} className="py-24" />
    ) : (
      <QueryError error={monitorQuery.error} onRetry={monitorQuery.refetch} />
    )
  }

  const paused = monitor.status === 'PAUSED'

  const toggle = () =>
    update.mutate(
      { id, status: paused ? 'ACTIVE' : 'PAUSED' },
      { onSuccess: () => toast.success(paused ? text.toasts.resumed : text.toasts.paused), onError: (error) => toast.error(errorMessage(error)) }
    )

  const confirmDelete = () =>
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(text.toasts.deleted)
        navigate(paths.client.monitors, { replace: true })
      },
      onError: (error) => toast.error(errorMessage(error)),
    })

  const settings = [
    { label: text.detail.settings.method, value: monitor.method },
    { label: text.detail.settings.expected, value: monitor.expectedStatus },
    { label: text.detail.settings.interval, value: content.common.every(formatDuration(monitor.intervalSeconds)) },
    { label: text.detail.settings.timeout, value: formatDuration(monitor.timeoutSeconds) },
  ]

  return (
    <>
      <PageHeader
        back={{ to: paths.client.monitors, label: text.title }}
        title={
          <>
            {monitor.name}
            <MonitorHealthBadge monitor={monitor} />
          </>
        }
        description={
          <a href={monitor.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 break-all hover:text-link hover:underline">
            {monitor.url}
            <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
          </a>
        }
        meta={monitor.health.lastCheckedAt && <span>{text.detail.lastChecked(formatRelative(monitor.health.lastCheckedAt))}</span>}
        actions={
          <>
            <ButtonLink to={paths.client.monitorEdit(id)} variant="secondary" leftIcon={Pencil}>{text.actions.edit}</ButtonLink>
            <Button variant="secondary" leftIcon={paused ? Play : Pause} loading={update.isPending} onClick={toggle}>
              {paused ? text.actions.resume : text.actions.pause}
            </Button>
            <Button variant="dangerSoft" leftIcon={Trash2} onClick={() => setConfirmingDelete(true)}>{text.actions.delete}</Button>
          </>
        }
      />

      {paused && <Alert tone="info" className="mb-6">{text.detail.pausedNote}</Alert>}

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeSelector value={range} onChange={(value) => setParams({ [names.range]: value })} />
          {stats.data?.firstCheckAt && <span className="text-sm text-fg-subtle">{text.detail.firstCheckNote(formatDateTime(stats.data.firstCheckAt))}</span>}
        </div>

        <MonitorStatCards stats={stats.data} />

        <Card>
          <CardHeader title={text.detail.charts.responseTitle} description={text.detail.charts.responseDescription} />
          <CardBody>
            {chart.data ? <ResponseTimeChart points={chart.data.points} bucketSeconds={chart.data.bucketSeconds} /> : <Skeleton className="h-64 w-full" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={text.detail.charts.checksTitle} description={text.detail.charts.checksDescription} />
          <CardBody>
            {chart.data ? <ChecksChart points={chart.data.points} bucketSeconds={chart.data.bucketSeconds} /> : <Skeleton className="h-48 w-full" />}
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={text.detail.errors.title} />
            <CardBody>{stats.data ? <ErrorBreakdown errors={stats.data.errors} /> : <Skeleton className="h-16 w-full" />}</CardBody>
          </Card>
          <Card>
            <CardHeader title={text.form.sections.request} />
            <CardBody><DescriptionList items={settings} /></CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title={text.detail.incidents.title} />
          <IncidentsTable showMonitor={false} rows={incidents.data?.incidents} loading={incidents.isPending} empty={<EmptyState title={content.incidents.empty.title} className="py-8" />} />
        </Card>

        <Card>
          <CardHeader title={text.detail.recent.title} />
          <RecentChecks query={results} />
        </Card>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={text.delete.title}
        message={text.delete.message(monitor.name)}
        confirmLabel={text.delete.confirm}
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  )
}
