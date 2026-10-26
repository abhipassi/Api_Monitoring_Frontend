import { Badge } from '@/components/ui/Badge.jsx'
import { usePlans } from './usePlans.js'

// Cheaper plans look calmer; the tone follows the plan's position in the list
const TONES = ['neutral', 'info', 'primary', 'success', 'warning']

export function PlanBadge({ planKey, dot = false, className }) {
  const { nameOf, rankOf } = usePlans()
  const rank = Math.max(0, rankOf(planKey))
  return <Badge tone={TONES[rank % TONES.length]} dot={dot} className={className}>{nameOf(planKey)}</Badge>
}
