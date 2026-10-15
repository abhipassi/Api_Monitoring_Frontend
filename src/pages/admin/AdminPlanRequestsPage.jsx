import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { Link } from 'react-router'

import { QueryError } from '@/components/feedback/states.jsx'
import { useToast } from '@/components/feedback/ToastContext.js'
import { ErrorList } from '@/components/ui/Alert.jsx'
import { StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { TextareaField } from '@/components/ui/fields.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { Pagination } from '@/components/ui/Pagination.jsx'
import { SegmentedControl } from '@/components/ui/SegmentedControl.jsx'
import { appConfig } from '@/config/app.js'
import { paths, searchParams as names } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useDecidePlanRequest, usePlanRequests } from '@/features/admin/api.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { useListParams } from '@/hooks/useListParams.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { formatRelative } from '@/lib/format.js'

const text = content.admin.planRequests
const DEFAULTS = { [names.status]: 'PENDING' }
const FORM_ID = 'decide-request-form'

export default function AdminPlanRequestsPage() {
  usePageTitle(text.title)
  const { enums } = useMeta()
  const toast = useToast()
  const [params, setParams] = useListParams(DEFAULTS)
  const query = usePlanRequests({ ...params, limit: appConfig.pageSize })
  const decide = useDecidePlanRequest()
  const [deciding, setDeciding] = useState(null) // { request, approve }
  const [note, setNote] = useState('')
  const data = query.data
  const planName = (key) => content.enums.plan[key] ?? key

  const open = (request, approve) => {
    decide.reset()
    setNote('')
    setDeciding({ request, approve })
  }

  const submit = (event) => {
    event.preventDefault()
    const { request, approve } = deciding
    decide.mutate(
      { id: request.id, approve, note: note.trim() },
      {
        onSuccess: () => {
          toast.success(approve ? text.toasts.approved : text.toasts.rejected)
          setDeciding(null)
        },
      }
    )
  }

  const columns = [
    {
      key: 'customer',
      header: text.columns.customer,
      cell: (row) => <Link to={paths.admin.customer(row.clientId)} className="font-medium text-fg hover:text-link hover:underline">{row.clientName}</Link>,
    },
    {
      key: 'change',
      header: text.columns.change,
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          {content.billing.history.change(planName(row.fromPlan), planName(row.toPlan))}
          <StatusBadge kind="direction" value={row.direction} dot={false} />
        </span>
      ),
    },
    {
      key: 'by',
      header: text.columns.requestedBy,
      hideBelow: 'md',
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-fg">{row.requestedBy.name}</p>
          <p className="truncate text-xs text-fg-subtle">{row.requestedBy.email}</p>
          {row.note && <p className="mt-1 max-w-xs text-xs text-fg-muted">{row.note}</p>}
        </div>
      ),
    },
    { key: 'when', header: text.columns.when, hideBelow: 'sm', cell: (row) => formatRelative(row.createdAt) },
    {
      key: 'status',
      header: text.columns.status,
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge kind="planRequest" value={row.status} />
          {row.decidedByName && <span className="text-xs text-fg-subtle">{text.decidedBy(row.decidedByName)}</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">{text.columns.actions}</span>,
      align: 'right',
      cell: (row) =>
        row.status === 'PENDING' ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => open(row, false)}>{text.reject}</Button>
            <Button size="sm" onClick={() => open(row, true)}>{text.approve}</Button>
          </div>
        ) : null,
    },
  ]

  const statusOptions = [
    { value: '', label: content.common.states.all },
    ...enums.planRequestStatuses.map((value) => ({ value, label: content.enums.planRequest[value] ?? value })),
  ]

  return (
    <>
      <PageHeader title={text.title} description={text.description} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <SegmentedControl label={text.filters.status} options={statusOptions} value={params[names.status]} onChange={(value) => setParams({ [names.status]: value })} />
        </div>
        {query.isError && !data ? (
          <QueryError error={query.error} onRetry={query.refetch} />
        ) : (
          <>
            <DataTable columns={columns} rows={data?.requests} loading={!data} empty={<EmptyState icon={ClipboardList} title={text.empty.title} description={text.empty.description} />} />
            {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} pageSize={appConfig.pageSize} onPageChange={(page) => setParams({ [names.page]: page })} />}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(deciding)}
        onClose={() => setDeciding(null)}
        title={deciding ? (deciding.approve ? text.approveTitle(deciding.request.clientName, planName(deciding.request.toPlan)) : text.rejectTitle(deciding.request.clientName)) : ''}
        description={deciding ? (deciding.approve ? text.approveMessage : text.rejectMessage) : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeciding(null)}>{content.common.actions.cancel}</Button>
            <Button submit form={FORM_ID} variant={deciding?.approve ? 'primary' : 'danger'} loading={decide.isPending}>
              {deciding?.approve ? text.approve : text.reject}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={submit} className="flex flex-col gap-4">
          <ErrorList errors={decide.error?.errors} />
          <TextareaField label={text.noteLabel} placeholder={text.notePlaceholder} value={note} onChange={(event) => setNote(event.target.value)} />
        </form>
      </Modal>
    </>
  )
}
