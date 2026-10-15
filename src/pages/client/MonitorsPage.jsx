import { useState } from 'react'
import { Eye, Gauge, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { QueryError } from '@/components/feedback/states.jsx'
import { useToast } from '@/components/feedback/ToastContext.js'
import { ActionMenu } from '@/components/ui/ActionMenu.jsx'
import { Alert } from '@/components/ui/Alert.jsx'
import { Button, ButtonLink } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { Pagination } from '@/components/ui/Pagination.jsx'
import { SearchInput } from '@/components/ui/SearchInput.jsx'
import { SegmentedControl } from '@/components/ui/SegmentedControl.jsx'
import { appConfig } from '@/config/app.js'
import { paths, searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { MonitorHealthBadge } from '@/features/monitors/MonitorHealthBadge.jsx'
import { useDeleteMonitor, useMonitors, useUpdateMonitor } from '@/features/monitors/api.js'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { errorMessage } from '@/lib/errors.js'
import { formatDuration, formatRelative } from '@/lib/format.js'

const text = content.monitors
const DEFAULTS = { [names.search]: '', [names.status]: '' }

export default function MonitorsPage() {
  usePageTitle(text.title)
  const navigate = useNavigate()
  const toast = useToast()
  const { isOwner } = useAuth()
  const { enums } = useMeta()
  const [params, setParams] = useListParams(DEFAULTS)
  const query = useMonitors({ ...params, limit: appConfig.pageSize })
  const update = useUpdateMonitor()
  const remove = useDeleteMonitor()
  const [toDelete, setToDelete] = useState(null)

  const data = query.data
  const usage = data?.usage
  const atLimit = usage && usage.used >= usage.maxMonitors
  const filtered = Boolean(params[names.search] || params[names.status])

  const toggle = (monitor) => {
    const pausing = monitor.status === 'ACTIVE'
    update.mutate(
      { id: monitor.id, status: pausing ? 'PAUSED' : 'ACTIVE' },
      { onSuccess: () => toast.success(pausing ? text.toasts.paused : text.toasts.resumed), onError: (error) => toast.error(errorMessage(error)) }
    )
  }

  const confirmDelete = () =>
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(text.toasts.deleted)
        setToDelete(null)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })

  const columns = [
    {
      key: 'monitor',
      header: text.list.columns.monitor,
      className: 'max-w-sm',
      cell: (row) => (
        <div className="min-w-0">
          <Link to={paths.client.monitor(row.id)} className="font-medium text-fg hover:text-link hover:underline">{row.name}</Link>
          <p className="truncate text-xs text-fg-subtle">{row.url}</p>
        </div>
      ),
    },
    { key: 'health', header: text.list.columns.health, cell: (row) => <MonitorHealthBadge monitor={row} /> },
    { key: 'interval', header: text.list.columns.interval, hideBelow: 'md', cell: (row) => content.common.every(formatDuration(row.intervalSeconds)) },
    {
      key: 'last',
      header: text.list.columns.lastChecked,
      hideBelow: 'lg',
      cell: (row) => (row.health.lastCheckedAt ? formatRelative(row.health.lastCheckedAt) : <span className="text-fg-subtle">{text.list.neverChecked}</span>),
    },
    {
      key: 'actions',
      header: <span className="sr-only">{text.list.columns.actions}</span>,
      align: 'right',
      cell: (row) => (
        <ActionMenu
          items={[
            { key: 'view', label: text.actions.view, icon: Eye, onSelect: () => navigate(paths.client.monitor(row.id)) },
            { key: 'edit', label: text.actions.edit, icon: Pencil, onSelect: () => navigate(paths.client.monitorEdit(row.id)) },
            { key: 'toggle', label: row.status === 'ACTIVE' ? text.actions.pause : text.actions.resume, icon: row.status === 'ACTIVE' ? Pause : Play, onSelect: () => toggle(row) },
            { key: 'delete', label: text.actions.delete, icon: Trash2, tone: 'danger', onSelect: () => setToDelete(row) },
          ]}
        />
      ),
    },
  ]

  const statusOptions = [
    { value: '', label: content.common.states.all },
    ...enums.monitorStatuses.map((value) => ({ value, label: content.enums.monitorStatus[value] ?? value })),
  ]

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.description}
        meta={usage && <span>{text.list.usage(usage.used, usage.maxMonitors)}</span>}
        actions={<ButtonLink to={paths.client.monitorNew} leftIcon={Plus}>{text.new}</ButtonLink>}
      />

      {atLimit && (
        <Alert tone="warning" className="mb-4">
          {text.list.limitReached(usage.maxMonitors)}{' '}
          {isOwner && <Link to={paths.client.billing} className="font-medium underline">{text.list.limitUpgrade}</Link>}
        </Alert>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <SearchInput className="w-full sm:w-72" value={params[names.search]} placeholder={text.list.searchPlaceholder} onChange={(value) => setParams({ [names.search]: value })} />
          <SegmentedControl label={text.list.statusFilter} options={statusOptions} value={params[names.status]} onChange={(value) => setParams({ [names.status]: value })} />
        </div>

        {query.isError && !data ? (
          <QueryError error={query.error} onRetry={query.refetch} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.monitors}
              loading={!data}
              empty={
                <EmptyState
                  icon={Gauge}
                  title={filtered ? text.list.empty.filteredTitle : text.list.empty.title}
                  description={filtered ? text.list.empty.filteredDescription : text.list.empty.description}
                  action={
                    filtered ? (
                      <Button variant="secondary" onClick={() => setParams({ [names.search]: '', [names.status]: '' })}>{content.common.actions.clear}</Button>
                    ) : (
                      <ButtonLink to={paths.client.monitorNew} leftIcon={Plus}>{text.new}</ButtonLink>
                    )
                  }
                />
              }
            />
            {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} pageSize={appConfig.pageSize} onPageChange={(page) => setParams({ [names.page]: page })} />}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={text.delete.title}
        message={toDelete && text.delete.message(toDelete.name)}
        confirmLabel={text.delete.confirm}
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
