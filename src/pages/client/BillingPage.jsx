import { useState } from 'react'
import { Lock } from 'lucide-react'

import { QueryError, PageLoader } from '@/components/feedback/states.jsx'
import { useToast } from '@/components/feedback/ToastContext.js'
import { Alert } from '@/components/ui/Alert.jsx'
import { StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { Meter } from '@/components/ui/Meter.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useBilling, useCancelPlanRequest, useCheckout } from '@/features/billing/api.js'
import { PlanCard } from '@/features/billing/PlanCard.jsx'
import { RequestPlanModal } from '@/features/billing/RequestPlanModal.jsx'
import { usePlans } from '@/features/meta/usePlans.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { errorMessage } from '@/lib/errors.js'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format.js'

const text = content.billing

export default function BillingPage() {
  usePageTitle(text.title)
  const { isOwner } = useAuth()
  const { plans, nameOf, rankOf } = usePlans()
  const toast = useToast()
  const query = useBilling(isOwner)
  const cancel = useCancelPlanRequest()
  const checkout = useCheckout()
  const [requesting, setRequesting] = useState(null)

  if (!isOwner) {
    return <EmptyState icon={Lock} title={text.ownerOnly.title} description={text.ownerOnly.description} className="py-24" />
  }
  if (query.isPending) return <PageLoader />
  if (query.isError) return <QueryError error={query.error} onRetry={query.refetch} />

  const billing = query.data
  const current = billing.plan

  const startCheckout = (plan) =>
    checkout.mutate(plan.key, {
      onSuccess: (body) => window.location.assign(body.url),
      onError: (error) => toast.error(errorMessage(error)),
    })

  const historyColumns = [
    { key: 'when', header: text.history.columns.when, cell: (row) => formatRelative(row.createdAt) },
    {
      key: 'change',
      header: text.history.columns.change,
      cell: (row) => text.history.change(nameOf(row.fromPlan), nameOf(row.toPlan)),
    },
    { key: 'status', header: text.history.columns.status, cell: (row) => <StatusBadge kind="planRequest" value={row.status} /> },
    { key: 'decision', header: text.history.columns.decision, hideBelow: 'md', cell: (row) => row.decisionNote ?? content.common.placeholder },
  ]

  return (
    <>
      <PageHeader title={text.title} description={text.description} />

      <div className="flex flex-col gap-6">
        {billing.pricesAreSample && (
          <Alert tone="info" title={text.sampleNotice.title}>{text.sampleNotice.description}</Alert>
        )}

        {billing.pendingRequest && (
          <Alert tone="warning" title={text.pending.title(nameOf(billing.pendingRequest.toPlan))}>
            <p>{text.pending.description(formatRelative(billing.pendingRequest.createdAt))}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              loading={cancel.isPending}
              onClick={() => cancel.mutate(billing.pendingRequest.id, { onSuccess: () => toast.success(text.toasts.canceled), onError: (error) => toast.error(errorMessage(error)) })}
            >
              {text.pending.cancel}
            </Button>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title={text.current.title} />
            <CardBody className="flex flex-col gap-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-semibold text-fg">{current.name}</span>
                <span className="text-fg-muted">
                  {current.priceMonthly === 0 ? text.current.free : `${formatCurrency(current.priceMonthly, billing.currency)} ${text.current.perMonth}`}
                </span>
              </div>
              {billing.subscription.status !== 'NONE' && billing.subscription.currentPeriodEnd && (
                <p className="text-sm text-fg-muted">{text.current.renews(formatDate(billing.subscription.currentPeriodEnd))}</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={text.current.usageTitle} />
            <CardBody className="flex flex-col gap-5">
              <Meter label={text.current.monitors} used={billing.usage.monitors.used} max={billing.usage.monitors.max} />
              <Meter label={text.current.team} used={billing.usage.teamMembers.used} max={billing.usage.teamMembers.max} />
            </CardBody>
          </Card>
        </div>

        <section aria-labelledby="plans-heading">
          <h2 id="plans-heading" className="mb-4 text-lg font-semibold text-fg">{text.plans.title}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* Archived plans can't be chosen, but the plan you are on is always shown */}
            {plans.filter((plan) => plan.isActive || plan.key === current.key).map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                isCurrent={plan.key === current.key}
                direction={rankOf(plan.key) > rankOf(current.key) ? 'UPGRADE' : 'DOWNGRADE'}
                pending={billing.pendingRequest?.toPlan === plan.key}
                paymentsEnabled={billing.paymentsEnabled}
                requestDisabled={Boolean(billing.pendingRequest)}
                onRequest={setRequesting}
                onCheckout={startCheckout}
                checkoutLoading={checkout.isPending}
              />
            ))}
          </div>
        </section>

        <Card>
          <CardHeader title={text.history.title} />
          <DataTable columns={historyColumns} rows={billing.recentRequests} empty={<EmptyState title={text.history.empty} className="py-8" />} />
        </Card>
      </div>

      <RequestPlanModal key={requesting?.key} plan={requesting} onClose={() => setRequesting(null)} />
    </>
  )
}
