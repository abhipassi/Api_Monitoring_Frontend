import { useCallback, useMemo, useRef, useState } from 'react'

import { appConfig } from '@/config/app.js'
import { Alert } from '@/components/ui/Alert.jsx'
import { ToastContext } from './ToastContext.js'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((current) => current.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (tone, message) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, tone, message }])
      setTimeout(() => dismiss(id), appConfig.toastDurationMs)
    },
    [dismiss]
  )

  const api = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('danger', message),
      info: (message) => push('info', message),
    }),
    [push]
  )

  return (
    <ToastContext value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-96">
        {toasts.map((toast) => (
          <Alert key={toast.id} tone={toast.tone} onDismiss={() => dismiss(toast.id)} className="pointer-events-auto shadow-overlay">
            {toast.message}
          </Alert>
        ))}
      </div>
    </ToastContext>
  )
}
