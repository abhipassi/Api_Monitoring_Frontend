import { content } from '@/content/index.js'
import { Button } from './Button.jsx'
import { Modal } from './Modal.jsx'

// "Are you sure?" for anything destructive. `children` can add a field (e.g. a note) under the message.
export function ConfirmDialog({ open, title, message, confirmLabel, tone = 'danger', loading = false, onConfirm, onCancel, children }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{content.common.actions.cancel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      {message && <p className="text-sm text-fg-muted">{message}</p>}
      {children}
    </Modal>
  )
}
