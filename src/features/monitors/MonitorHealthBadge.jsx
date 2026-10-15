import { StatusBadge } from '@/components/ui/Badge.jsx'

// A paused monitor shows "Paused" instead of its last known health
export function MonitorHealthBadge({ monitor }) {
  if (monitor.status === 'PAUSED') return <StatusBadge kind="monitorStatus" value="PAUSED" dot={false} />
  return <StatusBadge kind="health" value={monitor.health?.status ?? monitor.health ?? 'UNKNOWN'} />
}
