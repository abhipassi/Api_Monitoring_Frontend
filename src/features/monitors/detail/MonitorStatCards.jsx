import { Activity, ListChecks, Timer, TimerOff } from 'lucide-react'

import { StatCard } from '@/components/ui/StatCard.jsx'
import { content } from '@/content/index.js'
import { uptimeTone } from '@/features/stats/uptime.js'
import { formatDuration, formatMs, formatNumber, formatPercent } from '@/lib/format.js'

const text = content.monitors.detail.statCards

export function MonitorStatCards({ stats }) {
  const loading = !stats
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={text.uptime}
        value={formatPercent(stats?.uptimePercent)}
        hint={stats && text.uptimeHint(content.common.pluralize.checks(stats.checks.total))}
        icon={Activity}
        tone={uptimeTone(stats?.uptimePercent)}
        loading={loading}
      />
      <StatCard
        label={text.response}
        value={formatMs(stats?.responseTimeMs?.avg)}
        hint={stats?.responseTimeMs && text.responseHint(formatMs(stats.responseTimeMs.p95))}
        icon={Timer}
        tone="info"
        loading={loading}
      />
      <StatCard
        label={text.checks}
        value={formatNumber(stats?.checks.total)}
        hint={stats && text.checksHint(formatNumber(stats.checks.failed))}
        icon={ListChecks}
        loading={loading}
      />
      <StatCard
        label={text.downtime}
        value={formatDuration(stats?.incidents.downtimeSeconds)}
        hint={stats && text.downtimeHint(content.common.pluralize.incidents(stats.incidents.count))}
        icon={TimerOff}
        tone={stats?.incidents.downtimeSeconds > 0 ? 'danger' : 'success'}
        loading={loading}
      />
    </div>
  )
}
