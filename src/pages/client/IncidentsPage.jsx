import { Siren } from 'lucide-react'

import { QueryError } from '@/components/feedback/states.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { Pagination } from '@/components/ui/Pagination.jsx'
import { SegmentedControl } from '@/components/ui/SegmentedControl.jsx'
import { appConfig } from '@/config/app.js'
import { searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useIncidents } from '@/features/incidents/api.js'
import { IncidentsTable } from '@/features/incidents/IncidentsTable.jsx'
import { useMeta } from '@/features/meta/MetaContext.js'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.incidents
const DEFAULTS = { [names.status]: '' }

export default function IncidentsPage() {
  usePageTitle(text.title)
  const { enums } = useMeta()
  const [params, setParams] = useListParams(DEFAULTS)
  const query = useIncidents({ ...params, limit: appConfig.pageSize })
  const data = query.data
  const filtered = Boolean(params[names.status])

  const statusOptions = [
    { value: '', label: content.common.states.all },
    ...enums.incidentStatuses.map((value) => ({ value, label: content.enums.incident[value] ?? value })),
  ]

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.description}
        meta={data && <span>{data.openCount > 0 ? text.openCount(data.openCount) : text.noneOpen}</span>}
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <SegmentedControl label={text.filters.status} options={statusOptions} value={params[names.status]} onChange={(value) => setParams({ [names.status]: value })} />
        </div>
        {query.isError && !data ? (
          <QueryError error={query.error} onRetry={query.refetch} />
        ) : (
          <>
            <IncidentsTable
              rows={data?.incidents}
              loading={!data}
              empty={<EmptyState icon={Siren} title={filtered ? text.empty.filteredTitle : text.empty.title} description={filtered ? undefined : text.empty.description} />}
            />
            {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} pageSize={appConfig.pageSize} onPageChange={(page) => setParams({ [names.page]: page })} />}
          </>
        )}
      </Card>
    </>
  )
}
