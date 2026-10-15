import {
  Building2,
  ClipboardList,
  CreditCard,
  FileClock,
  Gauge,
  LayoutDashboard,
  Siren,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'

import { content } from '@/content/index.js'
import { paths } from '@/config/routes.js'

/*
 * The sidebar for each area. `requires` hides an item from people who can't open it:
 *   { owner: true }                 customer owners only
 *   { permission: 'clients.read' }  staff with that permission (super admins always)
 *   { superAdmin: true }            super admins only
 */
const text = content.nav

export const clientNavigation = [
  {
    group: text.groups.main,
    items: [
      { key: 'dashboard', to: paths.client.dashboard, label: text.client.dashboard, icon: LayoutDashboard, end: true },
      { key: 'monitors', to: paths.client.monitors, label: text.client.monitors, icon: Gauge },
      { key: 'incidents', to: paths.client.incidents, label: text.client.incidents, icon: Siren },
    ],
  },
  {
    group: text.groups.account,
    items: [
      { key: 'team', to: paths.client.team, label: text.client.team, icon: Users },
      { key: 'billing', to: paths.client.billing, label: text.client.billing, icon: CreditCard, requires: { owner: true } },
      { key: 'account', to: paths.client.account, label: text.client.account, icon: UserRound },
    ],
  },
]

export const adminNavigation = [
  {
    group: text.groups.platform,
    items: [
      { key: 'dashboard', to: paths.admin.dashboard, label: text.admin.dashboard, icon: LayoutDashboard, end: true, requires: { permission: 'clients.read' } },
      { key: 'customers', to: paths.admin.customers, label: text.admin.customers, icon: Building2, requires: { permission: 'clients.read' } },
      { key: 'planRequests', to: paths.admin.planRequests, label: text.admin.planRequests, icon: ClipboardList, requires: { permission: 'plan-requests.manage' } },
      { key: 'employees', to: paths.admin.employees, label: text.admin.employees, icon: UserCog, requires: { superAdmin: true } },
      { key: 'auditLog', to: paths.admin.auditLog, label: text.admin.auditLog, icon: FileClock, requires: { permission: 'audit.read' } },
    ],
  },
  {
    group: text.groups.account,
    items: [{ key: 'account', to: paths.admin.account, label: text.admin.account, icon: UserRound }],
  },
]

export const canSee = (item, auth) => {
  const { requires } = item
  if (!requires) return true
  if (requires.owner) return auth.isOwner
  if (requires.superAdmin) return auth.isSuperAdmin
  if (requires.permission) return auth.can(requires.permission)
  return true
}
