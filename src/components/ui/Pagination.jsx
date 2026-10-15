import { ChevronLeft, ChevronRight } from 'lucide-react'

import { content } from '@/content/index.js'
import { formatNumber } from '@/lib/format.js'
import { IconButton } from './Button.jsx'

// page is 1-based, as the API expects
export function Pagination({ page, pages, total, pageSize, onPageChange }) {
  if (!total) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const text = content.common.pagination

  return (
    <nav aria-label={text.label} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-sm text-fg-muted">{text.summary(formatNumber(from), formatNumber(to), formatNumber(total))}</p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <span className="mr-2 text-sm text-fg-muted">{text.page(page, pages)}</span>
          <IconButton icon={ChevronLeft} label={content.common.actions.previous} size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
          <IconButton icon={ChevronRight} label={content.common.actions.next} size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPageChange(page + 1)} />
        </div>
      )}
    </nav>
  )
}
