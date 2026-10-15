import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { chartColors } from '@/constants/chartColors.js'
import { content } from '@/content/index.js'
import { formatDayAndTime, formatNumber, formatPercent, formatShortDate, formatTime } from '@/lib/format.js'
import { ChartTooltip } from './ChartTooltip.jsx'

const text = content.monitors.detail.charts
const SHORT_RANGE_SECONDS = 900

// Passed and failed checks per period, stacked, so an outage shows up as a red bar
export function ChecksChart({ points, bucketSeconds }) {
  const data = points.map((p) => ({
    ...p,
    time: new Date(p.t).getTime(),
    passed: p.checks - p.failures,
  }))
  const formatTick = bucketSeconds <= SHORT_RANGE_SECONDS ? formatTime : formatShortDate

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={1}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" type="category" tickFormatter={formatTick} minTickGap={32} tickLine={false} />
          <YAxis allowDecimals={false} width={40} tickLine={false} axisLine={false} />
          <Tooltip
            content={
              <ChartTooltip
                title={(label) => formatDayAndTime(label)}
                rows={(payload) => {
                  const point = payload[0].payload
                  return [
                    { label: text.passed, value: formatNumber(point.passed), dotClass: 'bg-chart-3' },
                    { label: text.failed, value: formatNumber(point.failures), dotClass: 'bg-chart-4' },
                    { label: text.uptimeLabel, value: formatPercent(point.uptimePercent), dotClass: 'bg-fg-subtle' },
                  ]
                }}
              />
            }
          />
          <Bar dataKey="passed" name={text.passed} stackId="checks" fill={chartColors.success} isAnimationActive={false} />
          <Bar dataKey="failures" name={text.failed} stackId="checks" fill={chartColors.danger} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
