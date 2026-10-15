import { NavLink } from 'react-router'

import { cn } from '@/lib/cn.js'
import { canSee } from './navigation.js'

// The grouped links in the sidebar and the mobile menu
export function NavList({ groups, auth, onNavigate }) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const items = group.items.filter((item) => canSee(item, auth))
        if (items.length === 0) return null
        return (
          <div key={group.group}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{group.group}</p>
            <ul className="flex flex-col gap-0.5">
              {items.map(({ key, to, label, icon: Icon, end }) => (
                <li key={key}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                      )
                    }
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
