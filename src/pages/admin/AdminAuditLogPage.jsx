import { FileClock } from 'lucide-react'

import { QueryError } from '@/components/feedback/states.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Select } from '@/components/ui/controls.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { Pagination } from '@/components/ui/Pagination.jsx'
import { appConfig } from '@/config/app.js'
import { searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useAuditLogs } from '@/features/admin/api.js'
import { AuditLogTable } from '@/features/admin/AuditLogTable.jsx'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.admin.audit
const FILTER_TARGET = 'targetType'
const DEFAULTS = { [FILTER_TARGET]: '' }

export default function AdminAuditLogPage() {
  usePageTitle(text.title)
  const [params, setParams] = useListParams(DEFAULTS)
  const query = useAuditLogs({ ...params, limit: appConfig.auditPageSize })
  const data = query.data

  return (
    <>
      <PageHeader title={text.title} description={text.description} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <Select aria-label={text.filters.target} className="w-auto" value={params[FILTER_TARGET]} onChange={(event) => setParams({ [FILTER_TARGET]: event.target.value })}>
            <option value="">{`${text.filters.target}${content.common.separator}${content.common.states.all}`}</option>
            {Object.entries(content.enums.auditTarget).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        {query.isError && !data ? (
          <QueryError error={query.error} onRetry={query.refetch} />
        ) : (
          <>
            <AuditLogTable rows={data?.logs} loading={!data} empty={<EmptyState icon={FileClock} title={text.empty.title} description={text.empty.description} />} />
            {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} pageSize={appConfig.auditPageSize} onPageChange={(page) => setParams({ [names.page]: page })} />}
          </>
        )}
      </Card>
    </>
  )
}
