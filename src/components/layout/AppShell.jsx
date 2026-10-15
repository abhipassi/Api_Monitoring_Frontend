import { Suspense, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Outlet } from 'react-router'

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary.jsx'
import { PageLoader } from '@/components/feedback/states.jsx'
import { IconButton } from '@/components/ui/Button.jsx'
import { Drawer } from '@/components/ui/Drawer.jsx'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { Brand } from './Brand.jsx'
import { NavList } from './NavList.jsx'
import { UserMenu } from './UserMenu.jsx'

// The frame around every signed-in page: sidebar on wide screens, a slide-in menu on narrow ones
export function AppShell({ navigation, areaLabel }) {
  const auth = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
        {content.nav.skipToContent}
      </a>

      <aside className="hidden border-r border-line bg-surface lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Brand to={auth.realm.homePath} className="h-14 shrink-0 border-b border-line px-5" />
        <nav aria-label={content.nav.mainNavigation} className="flex-1 overflow-y-auto px-3 py-5">
          <NavList groups={navigation} auth={auth} />
        </nav>
      </aside>

      <Drawer open={menuOpen} onClose={closeMenu} label={content.nav.mainNavigation}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-5 pr-2">
          <Brand />
          <IconButton icon={X} label={content.common.actions.closeMenu} onClick={closeMenu} />
        </div>
        <nav aria-label={content.nav.mainNavigation} className="flex-1 overflow-y-auto px-3 py-5">
          <NavList groups={navigation} auth={auth} onNavigate={closeMenu} />
        </nav>
      </Drawer>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <IconButton icon={Menu} label={content.common.actions.openMenu} className="lg:hidden" onClick={() => setMenuOpen(true)} />
            <span className="hidden text-sm font-medium text-fg-muted lg:block">{areaLabel}</span>
          </div>
          <UserMenu />
        </header>

        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
