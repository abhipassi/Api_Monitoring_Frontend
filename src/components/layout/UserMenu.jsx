import { useId } from 'react'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { Link } from 'react-router'

import { Avatar } from '@/components/ui/Avatar.jsx'
import { StatusBadge } from '@/components/ui/Badge.jsx'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'

export function UserMenu() {
  const id = useId()
  const { user, realm, logout } = useAuth()
  const itemClass = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-fg hover:bg-surface-hover'

  return (
    <>
      <button type="button" popoverTarget={id} aria-label={content.nav.userMenu} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-surface-hover">
        <Avatar name={user.name} size="sm" />
        <span className="hidden max-w-40 truncate text-sm font-medium text-fg sm:block">{user.name}</span>
        <ChevronDown aria-hidden="true" className="size-4 text-fg-subtle" />
      </button>
      <div id={id} popover="auto" className="menu-popover w-64 rounded-lg border border-line bg-surface p-1 text-sm shadow-overlay">
        <div className="border-b border-line px-3 py-2.5">
          <p className="text-xs text-fg-subtle">{content.nav.signedInAs}</p>
          <p className="truncate font-medium text-fg">{user.name}</p>
          <p className="truncate text-fg-muted">{user.email}</p>
          <StatusBadge kind="role" value={user.role} dot={false} className="mt-2" />
        </div>
        <Link to={realm.paths.account} className={itemClass}>
          <UserRound aria-hidden="true" className="size-4" />
          {content.nav.client.account}
        </Link>
        <button type="button" onClick={logout} className={itemClass}>
          <LogOut aria-hidden="true" className="size-4" />
          {content.common.actions.signOut}
        </button>
      </div>
    </>
  )
}
