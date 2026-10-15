import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AUTH_STATUS, AuthContext } from './AuthContext.js'
import { GuestOnly, RequireAuth, RequirePermission, RequireSuperAdmin } from './guards.jsx'

const realm = { paths: { login: '/login', changePassword: '/change-password' }, homePath: '/home' }

const session = (overrides) => ({ realm, status: AUTH_STATUS.authenticated, user: { name: 'Pat', mustChangePassword: false }, can: () => false, isSuperAdmin: false, ...overrides })

const renderAt = (path, auth, routes) =>
  render(
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/change-password" element={<p>change page</p>} />
          <Route path="/home" element={<p>home page</p>} />
          {routes}
        </Routes>
      </MemoryRouter>
    </AuthContext>
  )

const protectedRoutes = (
  <Route element={<RequireAuth />}>
    <Route path="/secret" element={<p>secret page</p>} />
  </Route>
)

describe('RequireAuth', () => {
  it('lets a signed-in person through', () => {
    renderAt('/secret', session(), protectedRoutes)
    expect(screen.getByText('secret page')).toBeInTheDocument()
  })

  it('sends a visitor to sign in', () => {
    renderAt('/secret', session({ status: AUTH_STATUS.anonymous, user: null }), protectedRoutes)
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('shows a loader, not the page, while the session is being checked', () => {
    renderAt('/secret', session({ status: AUTH_STATUS.loading, user: null }), protectedRoutes)
    expect(screen.queryByText('secret page')).not.toBeInTheDocument()
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
  })

  it('keeps someone on the temporary password away from everything but the change page', () => {
    renderAt('/secret', session({ user: { name: 'Pat', mustChangePassword: true } }), protectedRoutes)
    expect(screen.getByText('change page')).toBeInTheDocument()
  })

  it('lets the change-password page itself through for that person', () => {
    renderAt(
      '/pending',
      session({ user: { name: 'Pat', mustChangePassword: true } }),
      <Route element={<RequireAuth allowPendingPasswordChange />}><Route path="/pending" element={<p>the form</p>} /></Route>
    )
    expect(screen.getByText('the form')).toBeInTheDocument()
  })
})

describe('GuestOnly', () => {
  const guestRoutes = (
    <Route element={<GuestOnly />}>
      <Route path="/welcome" element={<p>welcome page</p>} />
    </Route>
  )

  it('shows sign-in pages to visitors', () => {
    renderAt('/welcome', session({ status: AUTH_STATUS.anonymous, user: null }), guestRoutes)
    expect(screen.getByText('welcome page')).toBeInTheDocument()
  })

  it('sends someone already signed in to their home', () => {
    renderAt('/welcome', session(), guestRoutes)
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('sends someone on a temporary password to change it', () => {
    renderAt('/welcome', session({ user: { name: 'Pat', mustChangePassword: true } }), guestRoutes)
    expect(screen.getByText('change page')).toBeInTheDocument()
  })
})

describe('permission guards', () => {
  const routes = (
    <>
      <Route element={<RequirePermission permission="clients.read" />}><Route path="/customers" element={<p>customers page</p>} /></Route>
      <Route element={<RequireSuperAdmin />}><Route path="/staff" element={<p>staff page</p>} /></Route>
    </>
  )

  it('allows a permission holder and blocks everyone else', () => {
    const { unmount } = renderAt('/customers', session({ can: (p) => p === 'clients.read' }), routes)
    expect(screen.getByText('customers page')).toBeInTheDocument()
    unmount()
    renderAt('/customers', session(), routes)
    expect(screen.queryByText('customers page')).not.toBeInTheDocument()
    expect(screen.getByText('No access')).toBeInTheDocument()
  })

  it('keeps staff management for super admins', () => {
    const { unmount } = renderAt('/staff', session({ isSuperAdmin: true }), routes)
    expect(screen.getByText('staff page')).toBeInTheDocument()
    unmount()
    renderAt('/staff', session({ can: () => true }), routes)
    expect(screen.queryByText('staff page')).not.toBeInTheDocument()
  })
})
