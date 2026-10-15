import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { REALM_KEYS, realms } from '@/config/realms.js'
import { api } from '@/lib/api.js'
import { AUTH_EVENTS, events } from '@/lib/events.js'
import { tokenStore } from '@/lib/storage.js'
import { AUTH_STATUS, AuthContext } from './AuthContext.js'

const emptySession = { status: AUTH_STATUS.anonymous, user: null, account: null, expired: false }

// One provider per area. Both areas use the same screens; the realm decides which endpoints and token they use.
export function AuthProvider({ realm: realmKey, children }) {
  const realm = realms[realmKey]
  const queryClient = useQueryClient()
  const [session, setSession] = useState(() =>
    tokenStore.get(realmKey) ? { ...emptySession, status: AUTH_STATUS.loading } : emptySession
  )

  const endSession = useCallback(
    ({ expired = false } = {}) => {
      tokenStore.clear(realmKey)
      queryClient.clear()
      setSession({ ...emptySession, expired })
    },
    [realmKey, queryClient]
  )

  const loadSession = useCallback(async () => {
    try {
      const body = await api.get(realm.auth.me)
      setSession({ status: AUTH_STATUS.authenticated, user: body.user, account: body.client ?? null, expired: false })
      return body.user
    } catch {
      endSession()
      return null
    }
  }, [realm, endSession])

  // On first load, confirm a stored token still works
  useEffect(() => {
    if (session.status === AUTH_STATUS.loading) loadSession()
    // eslint-disable-next-line react/exhaustive-deps -- runs once, for the token found at startup
  }, [])

  // The API layer announces ended sessions and forced password changes
  useEffect(() => {
    const offExpired = events.on(AUTH_EVENTS.expired, (key) => key === realmKey && endSession({ expired: true }))
    const offChange = events.on(AUTH_EVENTS.passwordChangeRequired, (key) => {
      if (key === realmKey) setSession((current) => (current.user ? { ...current, user: { ...current.user, mustChangePassword: true } } : current))
    })
    return () => {
      offExpired()
      offChange()
    }
  }, [realmKey, endSession])

  const login = useCallback(
    async (email, password) => {
      const body = await api.post(realm.auth.login, { email, password })
      tokenStore.set(realmKey, body.token)
      setSession({ status: AUTH_STATUS.authenticated, user: body.user, account: body.client ?? null, expired: false })
      return body.user
    },
    [realm, realmKey]
  )

  // A password change ends every older session, so the API hands back a fresh token
  const acceptNewToken = useCallback(
    async (token) => {
      tokenStore.set(realmKey, token)
      return loadSession()
    },
    [realmKey, loadSession]
  )

  const value = useMemo(
    () => ({
      realm,
      status: session.status,
      user: session.user,
      account: session.account,
      sessionExpired: session.expired,
      isAuthenticated: session.status === AUTH_STATUS.authenticated,
      isOwner: realmKey === REALM_KEYS.client && session.user?.role === 'OWNER',
      // Staff permissions; a super admin has all of them
      can: (permission) =>
        realmKey === REALM_KEYS.admin &&
        (session.user?.role === 'SUPER_ADMIN' || Boolean(session.user?.permissions?.includes(permission))),
      isSuperAdmin: realmKey === REALM_KEYS.admin && session.user?.role === 'SUPER_ADMIN',
      login,
      logout: () => endSession(),
      acceptNewToken,
      refresh: loadSession,
    }),
    [realm, realmKey, session, login, endSession, acceptNewToken, loadSession]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
