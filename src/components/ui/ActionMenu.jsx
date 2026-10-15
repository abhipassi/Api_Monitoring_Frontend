import { useId } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'
import { buttonStyles } from './buttonStyles.js'

const itemTones = {
  default: 'text-fg hover:bg-surface-hover',
  danger: 'text-danger-fg hover:bg-danger-soft',
}

/*
 * A "..." menu for a table row. Uses the browser's popover (top layer, closes on outside click and Escape,
 * returns focus), so it is never clipped by a scrolling table and needs no positioning code.
 * items: [{ key, label, icon?, onSelect, tone?: 'danger', hidden?, disabled? }]
 */
export function ActionMenu({ items, label = content.common.actions.rowActions }) {
  const id = useId()
  const shown = items.filter((item) => !item.hidden)
  if (shown.length === 0) return null

  return (
    <>
      <button type="button" popoverTarget={id} aria-label={label} title={label} className={buttonStyles({ variant: 'ghost', size: 'sm', iconOnly: true })}>
        <MoreHorizontal aria-hidden="true" className="size-5" />
      </button>
      <div id={id} popover="auto" role="menu" className="menu-popover min-w-48 rounded-lg border border-line bg-surface p-1 text-sm shadow-overlay">
        {shown.map(({ key, label: itemLabel, icon: Icon, onSelect, tone = 'default', disabled }) => (
          <button
            key={key}
            type="button"
            role="menuitem"
            disabled={disabled}
            className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50', itemTones[tone])}
            onClick={(event) => {
              event.currentTarget.closest('[popover]')?.hidePopover?.()
              onSelect()
            }}
          >
            {Icon && <Icon aria-hidden="true" className="size-4" />}
            {itemLabel}
          </button>
        ))}
      </div>
    </>
  )
}
