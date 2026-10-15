import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { content } from '@/content/index.js'
import { formatDateTime, formatMs, humanize } from '@/lib/format.js'

const text = content.monitors.detail.recent

const columns = [
  { key: 'time', header: text.time, cell: (row) => formatDateTime(row.checkedAt) },
  {
    key: 'result',
    header: text.result,
    cell: (row) => <Badge tone={row.success ? 'success' : 'danger'} dot>{row.success ? text.passed : text.failed}</Badge>,
  },
  { key: 'code', header: text.code, hideBelow: 'sm', cell: (row) => row.statusCode ?? content.common.placeholder },
  { key: 'response', header: text.response, hideBelow: 'sm', cell: (row) => formatMs(row.responseTimeMs) },
  {
    key: 'problem',
    header: text.problem,
    hideBelow: 'md',
    className: 'max-w-xs truncate',
    cell: (row) => (row.error ? (content.enums.checkError[row.error.type] ?? humanize(row.error.type)) : content.common.placeholder),
  },
]

export function RecentChecks({ query }) {
  const rows = query.data?.pages.flatMap((page) => page.results)
  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        loading={query.isPending}
        empty={<EmptyState title={text.empty} className="py-8" />}
      />
      {query.hasNextPage && (
        <div className="flex justify-center border-t border-line p-3">
          <Button variant="secondary" size="sm" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
            {content.common.actions.loadMore}
          </Button>
        </div>
      )}
    </>
  )
}
