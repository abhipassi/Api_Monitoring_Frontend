import { Badge } from '@/components/ui/Badge.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { content } from '@/content/index.js'
import { formatDateTime, humanize } from '@/lib/format.js'
import { usePlans } from '@/features/meta/usePlans.js'
import { actionLabel, describeChanges } from './auditFormat.js'

const text = content.admin.audit

// Used on the Audit log page and in a customer's "recent changes"
export function AuditLogTable({ rows, loading, empty, compact = false }) {
  const { nameOf } = usePlans()
  const columns = [
    { key: 'when', header: text.columns.when, cell: (row) => formatDateTime(row.createdAt) },
    {
      key: 'who',
      header: text.columns.who,
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-fg">{row.actor.name}</p>
          {!compact && <p className="truncate text-xs text-fg-subtle">{row.actor.email}</p>}
        </div>
      ),
    },
    !compact && { key: 'action', header: text.columns.action, hideBelow: 'sm', cell: (row) => actionLabel(row.action) },
    !compact && {
      key: 'target',
      header: text.columns.target,
      hideBelow: 'md',
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge>{content.enums.auditTarget[row.targetType] ?? humanize(row.targetType)}</Badge>
          {row.targetLabel && <span className="text-sm text-fg-muted">{row.targetLabel}</span>}
        </div>
      ),
    },
    {
      key: 'changes',
      header: text.columns.changes,
      cell: (row) => {
        const lines = describeChanges(row.changes, nameOf)
        return lines.length ? (
          <ul className="space-y-0.5 text-sm text-fg-muted">{lines.map((line) => <li key={line}>{line}</li>)}</ul>
        ) : (
          content.common.placeholder
        )
      },
    },
  ].filter(Boolean)

  return <DataTable columns={columns} rows={rows} loading={loading} empty={empty} />
}
