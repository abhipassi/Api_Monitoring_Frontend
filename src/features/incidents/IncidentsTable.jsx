import { Link } from 'react-router'

import { StatusBadge } from '@/components/ui/Badge.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { paths } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { formatDateTime, formatDuration, formatNumber } from '@/lib/format.js'
import { describeCause } from './describeCause.js'

const text = content.incidents

// Used on the Incidents page and inside a monitor's detail page (where the monitor column is redundant)
export function IncidentsTable({ rows, loading, empty, showMonitor = true }) {
  const columns = [
    showMonitor && {
      key: 'monitor',
      header: text.columns.monitor,
      cell: (row) => <Link to={paths.client.monitor(row.monitorId)} className="font-medium text-fg hover:text-link hover:underline">{row.monitorName}</Link>,
    },
    { key: 'status', header: text.columns.status, cell: (row) => <StatusBadge kind="incident" value={row.status} /> },
    { key: 'started', header: text.columns.started, hideBelow: 'sm', cell: (row) => formatDateTime(row.startedAt) },
    {
      key: 'duration',
      header: text.columns.duration,
      cell: (row) => (row.status === 'OPEN' ? <span className="text-danger-fg">{formatDuration(row.durationSeconds)}{content.common.separator}{text.stillOngoing}</span> : formatDuration(row.durationSeconds)),
    },
    { key: 'cause', header: text.columns.cause, hideBelow: 'md', className: 'max-w-xs truncate', cell: (row) => describeCause(row.cause) },
    { key: 'failures', header: text.columns.failures, align: 'right', hideBelow: 'lg', cell: (row) => formatNumber(row.failureCount) },
  ].filter(Boolean)

  return <DataTable columns={columns} rows={rows} loading={loading} empty={empty} />
}
