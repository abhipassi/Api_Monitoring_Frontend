import { Check } from 'lucide-react'

import { Badge, StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'
import { formatCurrency, formatDuration } from '@/lib/format.js'

const text = content.billing.plans

// One plan in the comparison grid. Its features are written from the plan's limits, never typed.
export function PlanCard({ plan, isCurrent, direction, pending, paymentsEnabled, requestDisabled, onRequest, onCheckout, checkoutLoading }) {
  const { limits } = plan
  const features = [
    text.features.monitors(limits.maxMonitors),
    text.features.interval(formatDuration(limits.minIntervalSeconds)),
    text.features.timeout(formatDuration(limits.maxTimeoutSeconds)),
    text.features.team(limits.maxTeamMembers),
  ]
  const upgrading = direction === 'UPGRADE'

  return (
    <Card className={cn('flex flex-col p-6', isCurrent && 'border-primary ring-1 ring-primary')}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-fg">{plan.name}</h3>
        {isCurrent && <Badge tone="primary">{text.current}</Badge>}
      </div>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-fg">{plan.priceMonthly === 0 ? text.free : formatCurrency(plan.priceMonthly, plan.currency)}</span>
        {plan.priceMonthly > 0 && <span className="text-sm text-fg-muted">{text.perMonth}</span>}
      </p>
      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-fg-muted">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-fg" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {isCurrent ? null : pending ? (
          <StatusBadge kind="planRequest" value="PENDING" label={text.pending} />
        ) : paymentsEnabled && upgrading ? (
          <Button className="w-full" loading={checkoutLoading} onClick={() => onCheckout(plan)}>{text.upgradeOnline}</Button>
        ) : (
          <Button className="w-full" variant={upgrading ? 'primary' : 'secondary'} disabled={requestDisabled} onClick={() => onRequest(plan)}>
            {upgrading ? text.requestUpgrade : text.requestDowngrade}
          </Button>
        )}
      </div>
    </Card>
  )
}
