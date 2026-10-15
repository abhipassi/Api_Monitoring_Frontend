// The hover card shared by every chart. `rows` maps a recharts payload entry to { label, value, color }.
export function ChartTooltip({ active, payload, label, title, rows }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-overlay">
      <p className="mb-1 font-medium text-fg">{title(label, payload)}</p>
      <ul className="space-y-0.5">
        {rows(payload).map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-fg-muted">
              <span aria-hidden="true" className={`size-2 rounded-full ${row.dotClass}`} />
              {row.label}
            </span>
            <span className="font-medium text-fg">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
