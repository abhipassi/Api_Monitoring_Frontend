import { useState } from 'react'
import { Layers, Pencil, Plus } from 'lucide-react'

import { QueryError } from '@/components/feedback/states.jsx'
import { ActionMenu } from '@/components/ui/ActionMenu.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { content } from '@/content/index.js'
import { useAdminPlans } from '@/features/admin/api.js'
import { PlanFormModal } from '@/features/admin/PlanFormModal.jsx'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { formatCurrency, formatDuration, formatNumber } from '@/lib/format.js'

const text = content.admin.plans

export default function AdminPlansPage() {
  usePageTitle(text.title)
  const query = useAdminPlans()
  const [form, setForm] = useState({ open: false, plan: null })

  const columns = [
    {
      key: 'plan',
      header: text.columns.plan,
      cell: (row) => (
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
            {row.name}
            {row.isDefault && <Badge tone="primary">{text.badges.default}</Badge>}
            {row.isRecommended && <Badge tone="success">{text.badges.recommended}</Badge>}
            {!row.isActive && <Badge>{text.badges.archived}</Badge>}
          </p>
          <p className="truncate text-xs text-fg-subtle">{row.key}</p>
        </div>
      ),
    },
    { key: 'price', header: text.columns.price, cell: (row) => (row.priceMonthly === 0 ? text.free : formatCurrency(row.priceMonthly, row.currency)) },
    { key: 'monitors', header: text.columns.monitors, align: 'right', hideBelow: 'sm', cell: (row) => formatNumber(row.limits.maxMonitors) },
    { key: 'interval', header: text.columns.interval, hideBelow: 'md', cell: (row) => formatDuration(row.limits.minIntervalSeconds) },
    { key: 'team', header: text.columns.team, align: 'right', hideBelow: 'md', cell: (row) => formatNumber(row.limits.maxTeamMembers) },
    { key: 'history', header: text.columns.history, hideBelow: 'lg', cell: (row) => text.days(row.limits.retentionDays) },
    { key: 'customers', header: text.columns.customers, align: 'right', cell: (row) => formatNumber(row.customerCount) },
    {
      key: 'actions',
      header: <span className="sr-only">{text.columns.actions}</span>,
      align: 'right',
      cell: (row) => <ActionMenu items={[{ key: 'edit', label: text.edit, icon: Pencil, onSelect: () => setForm({ open: true, plan: row }) }]} />,
    },
  ]

  return (
    <>
      <PageHeader title={text.title} description={text.description} actions={<Button leftIcon={Plus} onClick={() => setForm({ open: true, plan: null })}>{text.new}</Button>} />
      <Card>
        {query.isError && !query.data ? (
          <QueryError error={query.error} onRetry={query.refetch} />
        ) : (
          <DataTable columns={columns} rows={query.data} rowKey={(row) => row.key} loading={query.isPending} empty={<EmptyState icon={Layers} title={text.empty.title} description={text.empty.description} />} />
        )}
      </Card>

      <PlanFormModal key={form.plan?.key ?? 'new'} open={form.open} plan={form.plan} onClose={() => setForm((current) => ({ ...current, open: false }))} />
    </>
  )
}
