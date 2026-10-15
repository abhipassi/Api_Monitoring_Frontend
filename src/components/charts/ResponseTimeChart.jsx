import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { chartColors } from '@/constants/chartColors.js'
import { content } from '@/content/index.js'
import { formatDayAndTime, formatMs, formatShortDate, formatTime } from '@/lib/format.js'
import { ChartTooltip } from './ChartTooltip.jsx'

const text = content.monitors.detail.charts

// Up to a day of 15-minute buckets reads best as times; longer spans as dates
const SHORT_RANGE_SECONDS = 900
// With few samples (a monitor that checks rarely) show each one as a dot, so a chart is never just empty
const SPARSE_POINTS = 40

export function ResponseTimeChart({ points, bucketSeconds }) {
  const data = points.map((p) => ({ ...p, time: new Date(p.t).getTime() }))
  const formatTick = bucketSeconds <= SHORT_RANGE_SECONDS ? formatTime : formatShortDate
  const sparse = data.filter((p) => p.avgResponseTimeMs != null).length < SPARSE_POINTS

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={formatTick} minTickGap={32} tickLine={false} />
          <YAxis tickFormatter={formatMs} width={64} tickLine={false} axisLine={false} />
          <Tooltip
            content={
              <ChartTooltip
                title={(label) => formatDayAndTime(label)}
                rows={(payload) =>
                  payload.map((entry) => ({
                    label: entry.dataKey === 'avgResponseTimeMs' ? text.average : text.slowest,
                    value: formatMs(entry.value),
                    dotClass: entry.dataKey === 'avgResponseTimeMs' ? 'bg-chart-1' : 'bg-chart-2',
                  }))
                }
              />
            }
          />
          <Line type="monotone" dataKey="maxResponseTimeMs" name={text.slowest} stroke={chartColors.warning} strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="avgResponseTimeMs" name={text.average} stroke={chartColors.primary} strokeWidth={2} dot={sparse} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
