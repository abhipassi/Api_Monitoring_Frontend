import { appConfig } from '@/config/app.js'
import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'
import { formatNumber } from '@/lib/format.js'

// Native <progress> keeps this accessible and lets the bar width follow the value without any inline style.
const fills = {
  primary: '[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary',
  warning: '[&::-webkit-progress-value]:bg-warning [&::-moz-progress-bar]:bg-warning',
  danger: '[&::-webkit-progress-value]:bg-danger [&::-moz-progress-bar]:bg-danger',
}

const toneFor = (ratio) => (ratio >= 1 ? 'danger' : ratio >= appConfig.meterWarnRatio ? 'warning' : 'primary')

export function Meter({ label, used, max, className }) {
  const ratio = max > 0 ? used / max : 0
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-fg">{label}</span>
        <span className="text-fg-muted">{content.common.usage(formatNumber(used), formatNumber(max))}</span>
      </div>
      <progress
        value={Math.min(used, max)}
        max={max}
        aria-label={label}
        className={cn(
          'h-2 w-full appearance-none overflow-hidden rounded-full bg-surface-muted [&::-webkit-progress-bar]:bg-surface-muted',
          fills[toneFor(ratio)]
        )}
      />
    </div>
  )
}
