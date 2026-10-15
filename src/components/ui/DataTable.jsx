import { cn } from '@/lib/cn.js'
import { Skeleton } from './Spinner.jsx'

const hideBelow = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

const aligns = { left: 'text-left', right: 'text-right', center: 'text-center' }

/*
 * columns: [{ key, header, cell: (row) => node, align?, hideBelow?: 'sm'|'md'|'lg', className? }]
 * One table for every list in the app, so spacing, hover and loading look the same everywhere.
 */
export function DataTable({
  columns,
  rows = [],
  rowKey = (row) => row.id,
  loading = false,
  loadingRows = 5,
  empty,
  caption,
  className,
}) {
  const visible = (column) => cn(column.hideBelow && hideBelow[column.hideBelow])

  if (!loading && rows.length === 0 && empty) return <div className={className}>{empty}</div>

  return (
    <div className={cn('relative overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line bg-surface-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn('px-4 py-3', aligns[column.align ?? 'left'], visible(column), column.headerClassName)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading
            ? Array.from({ length: loadingRows }, (_, i) => (
                <tr key={i}>
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-4 py-3.5', visible(column))}>
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-surface-muted/50">
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-4 py-3.5 align-middle text-fg', aligns[column.align ?? 'left'], visible(column), column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
