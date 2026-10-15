import { useState } from 'react'
import { Pencil, UserCog, UserPlus } from 'lucide-react'

import { QueryError } from '@/components/feedback/states.jsx'
import { ActionMenu } from '@/components/ui/ActionMenu.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { Badge, StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Select } from '@/components/ui/controls.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { Pagination } from '@/components/ui/Pagination.jsx'
import { SearchInput } from '@/components/ui/SearchInput.jsx'
import { appConfig } from '@/config/app.js'
import { searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useEmployees } from '@/features/admin/api.js'
import { EmployeeFormModal } from '@/features/admin/EmployeeFormModal.jsx'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { formatRelative } from '@/lib/format.js'

const text = content.admin.employees
const FILTER_ROLE = 'role'
const DEFAULTS = { [names.search]: '', [FILTER_ROLE]: '', [names.status]: '' }

export default function AdminEmployeesPage() {
  usePageTitle(text.title)
  const { user } = useAuth()
  const { enums, permissions } = useMeta()
  const [params, setParams] = useListParams(DEFAULTS)
  const query = useEmployees({ ...params, limit: appConfig.pageSize })
  const [form, setForm] = useState({ open: false, employee: null })
  const data = query.data
  const permissionLabels = Object.fromEntries(permissions.map((p) => [p.key, p.description]))

  const columns = [
    {
      key: 'person',
      header: text.columns.person,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-fg">
              <span className="truncate">{row.name}</span>
              {row.id === user.id && <Badge>{content.common.states.you}</Badge>}
            </p>
            <p className="truncate text-xs text-fg-subtle">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: text.columns.role, cell: (row) => <StatusBadge kind="role" value={row.role} dot={false} /> },
    { key: 'status', header: text.columns.status, cell: (row) => <StatusBadge kind="employeeStatus" value={row.status} /> },
    {
      key: 'permissions',
      header: text.columns.permissions,
      hideBelow: 'lg',
      className: 'max-w-xs',
      cell: (row) =>
        row.role === 'SUPER_ADMIN' ? (
          text.allPermissions
        ) : row.permissions.length === 0 ? (
          <span className="text-fg-subtle">{text.noPermissions}</span>
        ) : (
          <span className="text-sm text-fg-muted">{row.permissions.map((key) => permissionLabels[key] ?? key).join(', ')}</span>
        ),
    },
    {
      key: 'last',
      header: text.columns.lastLogin,
      hideBelow: 'md',
      cell: (row) => (row.lastLoginAt ? formatRelative(row.lastLoginAt) : <span className="text-fg-subtle">{row.pendingFirstLogin ? text.pending : content.common.states.never}</span>),
    },
    {
      key: 'actions',
      header: <span className="sr-only">{text.columns.actions}</span>,
      align: 'right',
      cell: (row) => <ActionMenu items={[{ key: 'edit', label: text.edit, icon: Pencil, onSelect: () => setForm({ open: true, employee: row }) }]} />,
    },
  ]

  return (
    <>
      <PageHeader title={text.title} description={text.description} actions={<Button leftIcon={UserPlus} onClick={() => setForm({ open: true, employee: null })}>{text.add}</Button>} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <SearchInput className="w-full sm:w-80" value={params[names.search]} placeholder={text.searchPlaceholder} onChange={(value) => setParams({ [names.search]: value })} />
          <Select aria-label={text.filters.role} className="w-auto" value={params[FILTER_ROLE]} onChange={(event) => setParams({ [FILTER_ROLE]: event.target.value })}>
            <option value="">{`${text.filters.role}${content.common.separator}${content.common.states.all}`}</option>
            {enums.employeeRoles.map((role) => <option key={role} value={role}>{content.enums.role[role] ?? role}</option>)}
          </Select>
          <Select aria-label={text.filters.status} className="w-auto" value={params[names.status]} onChange={(event) => setParams({ [names.status]: event.target.value })}>
            <option value="">{`${text.filters.status}${content.common.separator}${content.common.states.all}`}</option>
            {enums.employeeStatuses.map((status) => <option key={status} value={status}>{content.enums.employeeStatus[status] ?? status}</option>)}
          </Select>
        </div>
        {query.isError && !data ? (
          <QueryError error={query.error} onRetry={query.refetch} />
        ) : (
          <>
            <DataTable columns={columns} rows={data?.employees} loading={!data} empty={<EmptyState icon={UserCog} title={text.empty.title} description={text.empty.description} />} />
            {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} pageSize={appConfig.pageSize} onPageChange={(page) => setParams({ [names.page]: page })} />}
          </>
        )}
      </Card>

      <EmployeeFormModal key={form.employee?.id ?? 'new'} open={form.open} employee={form.employee} onClose={() => setForm((current) => ({ ...current, open: false }))} />
    </>
  )
}
