import { Badge } from '@/components/ui/Badge.jsx'
import { content } from '@/content/index.js'
import { formatNumber, humanize } from '@/lib/format.js'

const text = content.monitors.detail.errors

// Failures in the chosen period, grouped by cause, most common first
export function ErrorBreakdown({ errors }) {
  if (!errors?.length) return <p className="text-sm text-fg-muted">{text.none}</p>
  return (
    <ul className="divide-y divide-line">
      {errors.map((entry) => (
        <li key={entry.type} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="text-sm text-fg">{content.enums.checkError[entry.type] ?? humanize(entry.type)}</span>
          <Badge tone="danger">{text.count(formatNumber(entry.count))}</Badge>
        </li>
      ))}
    </ul>
  )
}
