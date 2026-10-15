// A tiny publish/subscribe channel. The API layer (plain JS) uses it to tell the React
// auth providers that a session ended, without importing React.
export const AUTH_EVENTS = Object.freeze({
  expired: 'auth:expired',
  passwordChangeRequired: 'auth:password-change-required',
})

const listeners = new Map()

export const events = {
  on(type, handler) {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type).add(handler)
    return () => listeners.get(type)?.delete(handler)
  },
  emit(type, payload) {
    listeners.get(type)?.forEach((handler) => handler(payload))
  },
}
