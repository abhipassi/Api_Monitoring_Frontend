import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

import { content } from '@/content/index.js'
import { cn } from '@/lib/cn.js'
import { IconButton } from './Button.jsx'

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

// Built on the native <dialog>, which gives focus trapping, Escape-to-close and a blocked background for free.
// Children are only mounted while open, so a form inside starts fresh every time.
export function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // Clicking the dimmed backdrop closes the dialog. A mouse-only extra: Escape and the close button cover the keyboard.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => open && onClose?.()}
      onCancel={(event) => !dismissible && event.preventDefault()}
      onClick={(event) => dismissible && event.target === ref.current && onClose?.()}
      className={cn(
        'm-auto max-h-dvh w-full flex-col rounded-xl border border-line bg-surface p-0 text-fg shadow-overlay open:flex backdrop:bg-overlay',
        widths[size]
      )}
    >
      {open && (
        <>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-fg">{title}</h2>
              {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
            </div>
            {dismissible && <IconButton icon={X} label={content.common.actions.close} size="sm" onClick={onClose} />}
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-3">{footer}</div>}
        </>
      )}
    </dialog>
  )
}
