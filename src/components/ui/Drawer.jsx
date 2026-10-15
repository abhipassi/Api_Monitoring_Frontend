import { useEffect, useRef } from 'react'

import { cn } from '@/lib/cn.js'

// A panel that slides in from the left edge (the mobile menu). Native <dialog>, like Modal.
export function Drawer({ open, onClose, label, children, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // Clicking the dimmed area closes the panel; Escape covers the keyboard.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-label={label}
      onClose={() => open && onClose?.()}
      onClick={(event) => event.target === ref.current && onClose?.()}
      className={cn('m-0 mr-auto h-dvh max-h-dvh w-72 max-w-full flex-col border-r border-line bg-surface p-0 text-fg shadow-overlay open:flex backdrop:bg-overlay', className)}
    >
      {open && children}
    </dialog>
  )
}
