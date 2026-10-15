import { useState } from 'react'
import { Ban, RotateCcw } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { PageLoader, QueryError } from '@/components/feedback/states.jsx'
import { useToast } from '@/components/feedback/ToastContext.js'
import { Alert } from '@/components/ui/Alert.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { DescriptionList } from '@/components/ui/DescriptionList.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { Meter } from '@/components/ui/Meter.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { StatTile } from '@/components/ui/StatTile.jsx'
import { SelectField } from '@/components/ui/fields.jsx'
import { paths } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { useAdminClient, useAuditLogs, useUpdateClient } from '@/features/admin/api.js'
import { AuditLogTable } from '@/features/admin/AuditLogTable.jsx'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useMeta } from '@/features/meta/MetaContext.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { errorMessage } from '@/lib/errors.js'
import { formatDate, formatNumber, formatRelative } from '@/lib/format.js'

const text = content.admin.customer

export default function AdminCustomerPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const { plans } = useMeta()
  const toast = useToast()
  const query = useAdminClient(id)
  const update = useUpdateClient()
  const audit = useAuditLogs({ targetType: 'CLIENT', targetId: id, limit: 10 }, can('audit.read'))
  const [chosenPlan, setChosenPlan] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [warnings, setWarnings] = useState([])

  const client = query.data?.client
  usePageTitle(client?.companyName ?? client?.name)

  if (query.isPending) return <PageLoader />
  if (query.isError) {
    return query.error.status === 404 ? (
      <EmptyState title={text.notFound.title} description={text.notFound.description} className="py-24" />
    ) : (
      <QueryError error={query.error} onRetry={query.refetch} />
    )
  }

  const { users, usage, monitors, openIncidents, pendingPlanRequest } = query.data
  const canManage = can('clients.manage')
  const selectedPlan = chosenPlan ?? client.plan
  const suspended = client.status === 'SUSPENDED'
  const displayName = client.companyName ?? client.name
  const planName = (key) => content.enums.plan[key] ?? key

  const run = (values, message) =>
    update.mutate(
      { id, ...values },
      {
        onSuccess: (body) => {
          toast.success(message)
          setWarnings(body.warnings ?? [])
          setChosenPlan(null)
        },
        onError: (error) => toast.error(errorMessage(error)),
        onSettled: () => setConfirming(false),
      }
    )

  const userColumns = [
    {
      key: 'person',
      header: text.userColumns.person,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-fg">{row.name}</p>
            <p className="truncate text-xs text-fg-subtle">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: text.userColumns.role, cell: (row) => <StatusBadge kind="role" value={row.role} dot={false} /> },
    { key: 'status', header: text.userColumns.status, hideBelow: 'sm', cell: (row) => <StatusBadge kind="memberStatus" value={row.status} /> },
    { key: 'last', header: text.userColumns.lastLogin, hideBelow: 'md', cell: (row) => (row.lastLoginAt ? formatRelative(row.lastLoginAt) : content.common.states.never) },
  ]

  const details = [
    { label: text.fields.company, value: client.companyName },
    { label: text.fields.contact, value: client.name },
    { label: text.fields.email, value: client.email },
    { label: text.fields.joined, value: formatDate(client.createdAt) },
    { label: text.fields.subscription, value: <StatusBadge kind="plan" value={client.plan} dot={false} /> },
    { label: text.fields.incidents, value: formatNumber(openIncidents) },
  ]

  return (
    <>
      <PageHeader
        back={{ to: paths.admin.customers, label: text.back }}
        title={
          <>
            {displayName}
            <StatusBadge kind="clientStatus" value={client.status} />
          </>
        }
        description={client.email}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title={text.sections.details} />
            <CardBody><DescriptionList items={details} columns={3} /></CardBody>
          </Card>

          <Card>
            <CardHeader title={text.sections.usage} />
            <CardBody className="flex flex-col gap-5">
              <Meter label={content.billing.current.monitors} used={usage.monitors.used} max={usage.monitors.max} />
              <Meter label={content.billing.current.team} used={usage.teamMembers.used} max={usage.teamMembers.max} />
              <div>
                <p className="mb-2 text-sm font-medium text-fg">{text.sections.monitors}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <StatTile label={text.health.total} value={formatNumber(monitors.total)} />
                  <StatTile label={text.health.up} value={formatNumber(monitors.up)} tone="success" />
                  <StatTile label={text.health.down} value={formatNumber(monitors.down)} tone={monitors.down > 0 ? 'danger' : 'neutral'} />
                  <StatTile label={text.health.unknown} value={formatNumber(monitors.unknown)} />
                  <StatTile label={text.health.paused} value={formatNumber(monitors.paused)} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={text.sections.people} />
            <DataTable columns={userColumns} rows={users} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={text.sections.manage} />
            <CardBody className="flex flex-col gap-5">
              {!canManage && <Alert tone="info">{text.manage.noPermission}</Alert>}

              {pendingPlanRequest && (
                <Alert tone="warning">
                  <p>{text.manage.pendingRequest(planName(pendingPlanRequest.fromPlan), planName(pendingPlanRequest.toPlan))}</p>
                  {can('plan-requests.manage') && (
                    <Link to={paths.admin.planRequests} className="mt-1 inline-block font-medium underline">{text.manage.reviewRequest}</Link>
                  )}
                </Alert>
              )}

              {warnings.length > 0 && (
                <Alert tone="warning" title={text.warningsTitle} onDismiss={() => setWarnings([])}>
                  <ul className="list-disc space-y-1 pl-4">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                </Alert>
              )}

              <div className="flex flex-col gap-3">
                <SelectField label={text.manage.planLabel} hint={text.manage.planHint} value={selectedPlan} disabled={!canManage} onChange={(event) => setChosenPlan(event.target.value)}>
                  {plans.map((plan) => <option key={plan.key} value={plan.key}>{plan.name}</option>)}
                </SelectField>
                <Button
                  variant="secondary"
                  disabled={!canManage || selectedPlan === client.plan}
                  loading={update.isPending && !confirming}
                  onClick={() => run({ plan: selectedPlan }, text.toasts.planChanged)}
                >
                  {text.manage.applyPlan}
                </Button>
              </div>

              <div className="border-t border-line pt-5">
                <p className="mb-3 text-sm text-fg-muted">{suspended ? text.manage.restoreHint : text.manage.suspendHint}</p>
                <Button variant={suspended ? 'secondary' : 'dangerSoft'} leftIcon={suspended ? RotateCcw : Ban} disabled={!canManage} onClick={() => setConfirming(true)}>
                  {suspended ? text.manage.restore : text.manage.suspend}
                </Button>
              </div>
            </CardBody>
          </Card>

          {can('audit.read') && (
            <Card>
              <CardHeader title={text.sections.history} />
              <AuditLogTable compact rows={audit.data?.logs} loading={audit.isPending} empty={<EmptyState title={text.historyEmpty} className="py-8" />} />
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={suspended ? text.confirm.restoreTitle : text.confirm.suspendTitle}
        message={suspended ? text.confirm.restoreMessage(displayName) : text.confirm.suspendMessage(displayName)}
        confirmLabel={suspended ? text.confirm.restoreAction : text.confirm.suspendAction}
        tone={suspended ? 'primary' : 'danger'}
        loading={update.isPending}
        onConfirm={() => run({ status: suspended ? 'ACTIVE' : 'SUSPENDED' }, suspended ? text.toasts.restored : text.toasts.suspended)}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
