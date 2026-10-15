import { createContext, useContext } from 'react'

export const AUTH_STATUS = Object.freeze({ loading: 'loading', anonymous: 'anonymous', authenticated: 'authenticated' })

export const AuthContext = createContext(null)

// The signed-in person for the current area (customer or admin), plus sign-in/out helpers
export const useAuth = () => {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
