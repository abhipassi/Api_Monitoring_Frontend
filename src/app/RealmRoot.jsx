import { Outlet } from 'react-router'

import { AuthProvider } from '@/features/auth/AuthProvider.jsx'

// Wraps one area of the site (customer or admin) in its own sign-in session
export function RealmRoot({ realm }) {
  return (
    <AuthProvider realm={realm}>
      <Outlet />
    </AuthProvider>
  )
}
