import { Building2 } from 'lucide-react'
import { Link } from 'react-router'

import { Badge, StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Select } from '@/components/ui/controls.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PagedBody } from '@/components/ui/PagedBody.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { SearchInput } from '@/components/ui/SearchInput.jsx'
import { appConfig } from '@/config/app.js'
import { paths, searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useAdminClients } from '@/features/admin/api.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { formatDate, formatNumber } from '@/lib/format.js'

const text = content.admin.customers
const FILTER_PLAN = 'plan'
const DEFAULTS = { [names.search]: '', [FILTER_PLAN]: '', [names.status]: '' }

export default function AdminCustomersPage() {
  usePageTitle(text.title)
  const { plans, enums } = useMeta()
  const [params, setParams] = useListParams(DEFAULTS)
  const query = useAdminClients({ ...params, limit: appConfig.pageSize })
  const data = query.data
  const filtered = Boolean(params[names.search] || params[FILTER_PLAN] || params[names.status])

  const columns = [
    {
      key: 'customer',
      header: text.columns.customer,
      cell: (row) => (
        <div className="min-w-0">
          <Link to={paths.admin.customer(row.id)} className="font-medium text-fg hover:text-link hover:underline">{row.companyName ?? row.name}</Link>
          <p className="truncate text-xs text-fg-subtle">{row.email}</p>
          {row.hasPendingPlanRequest && <Badge tone="warning" className="mt-1">{text.pendingRequest}</Badge>}
        </div>
      ),
    },
    { key: 'plan', header: text.columns.plan, cell: (row) => <StatusBadge kind="plan" value={row.plan} dot={false} /> },
    { key: 'status', header: text.columns.status, cell: (row) => <StatusBadge kind="clientStatus" value={row.status} /> },
    { key: 'monitors', header: text.columns.monitors, align: 'right', hideBelow: 'sm', cell: (row) => formatNumber(row.monitorCount) },
    { key: 'people', header: text.columns.people, align: 'right', hideBelow: 'md', cell: (row) => formatNumber(row.activeUserCount) },
    { key: 'joined', header: text.columns.joined, hideBelow: 'lg', cell: (row) => formatDate(row.createdAt) },
  ]

  return (
    <>
      <PageHeader title={text.title} description={text.description} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <SearchInput className="w-full sm:w-80" value={params[names.search]} placeholder={text.searchPlaceholder} onChange={(value) => setParams({ [names.search]: value })} />
          <Select size="md" aria-label={text.filters.plan} className="w-auto" value={params[FILTER_PLAN]} onChange={(event) => setParams({ [FILTER_PLAN]: event.target.value })}>
            <option value="">{`${text.filters.plan}${content.common.separator}${content.common.states.all}`}</option>
            {plans.map((plan) => <option key={plan.key} value={plan.key}>{plan.name}</option>)}
          </Select>
          <Select size="md" aria-label={text.filters.status} className="w-auto" value={params[names.status]} onChange={(event) => setParams({ [names.status]: event.target.value })}>
            <option value="">{`${text.filters.status}${content.common.separator}${content.common.states.all}`}</option>
            {enums.clientStatuses.map((value) => <option key={value} value={value}>{content.enums.clientStatus[value] ?? value}</option>)}
          </Select>
        </div>
        <PagedBody query={query} pageSize={appConfig.pageSize} onPageChange={(page) => setParams({ [names.page]: page })}>
            <DataTable
              columns={columns}
              rows={data?.clients}
              loading={!data}
              empty={
                <EmptyState
                  icon={Building2}
                  title={text.empty.title}
                  description={text.empty.description}
                  action={filtered && <Button variant="secondary" onClick={() => setParams({ [names.search]: '', [FILTER_PLAN]: '', [names.status]: '' })}>{content.common.actions.clear}</Button>}
                />
              }
            />
        </PagedBody>
      </Card>
    </>
  )
}
