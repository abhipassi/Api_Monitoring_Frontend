import { useState } from 'react'
import { Ban, Crown, Mail, RotateCcw, Trash2, User, UserPlus, Users } from 'lucide-react'

import { QueryError } from '@/components/feedback/states.jsx'
import { useToast } from '@/components/feedback/ToastContext.js'
import { ActionMenu } from '@/components/ui/ActionMenu.jsx'
import { Alert } from '@/components/ui/Alert.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { Badge, StatusBadge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx'
import { DataTable } from '@/components/ui/DataTable.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { Meter } from '@/components/ui/Meter.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { content } from '@/content/index.js'
import { useAuth } from '@/features/auth/AuthContext.js'
import { useRemoveMember, useResendCredentials, useTeam, useUpdateMember } from '@/features/team/api.js'
import { AddMemberModal } from '@/features/team/AddMemberModal.jsx'
import { usePageTitle } from '@/hooks/usePageTitle.js'
import { errorMessage } from '@/lib/errors.js'
import { formatRelative } from '@/lib/format.js'

const text = content.team

export default function TeamPage() {
  usePageTitle(text.title)
  const toast = useToast()
  const { isOwner, user } = useAuth()
  const query = useTeam()
  const update = useUpdateMember()
  const remove = useRemoveMember()
  const resend = useResendCredentials()
  const [adding, setAdding] = useState(false)
  const [pending, setPending] = useState(null) // { kind: 'remove' | 'disable', member }

  const data = query.data
  const atLimit = data && data.seats.used >= data.seats.max

  const change = (member, values, message) =>
    update.mutate({ id: member.id, ...values }, { onSuccess: () => toast.success(message), onError: (error) => toast.error(errorMessage(error)) })

  const confirm = () => {
    const { kind, member } = pending
    const done = { onSettled: () => setPending(null), onError: (error) => toast.error(errorMessage(error)) }
    if (kind === 'remove') remove.mutate(member.id, { ...done, onSuccess: () => toast.success(text.toasts.removed) })
    else update.mutate({ id: member.id, status: 'DISABLED' }, { ...done, onSuccess: () => toast.success(text.toasts.updated) })
  }

  const rowActions = (member) => [
    member.role === 'MEMBER'
      ? { key: 'owner', label: text.rowActions.makeOwner, icon: Crown, onSelect: () => change(member, { role: 'OWNER' }, text.toasts.updated) }
      : { key: 'member', label: text.rowActions.makeMember, icon: User, onSelect: () => change(member, { role: 'MEMBER' }, text.toasts.updated) },
    member.status === 'ACTIVE'
      ? { key: 'disable', label: text.rowActions.disable, icon: Ban, onSelect: () => setPending({ kind: 'disable', member }) }
      : { key: 'enable', label: text.rowActions.enable, icon: RotateCcw, onSelect: () => change(member, { status: 'ACTIVE' }, text.toasts.updated) },
    {
      key: 'resend',
      label: text.rowActions.resend,
      icon: Mail,
      hidden: !(member.pendingFirstLogin && member.status === 'ACTIVE'),
      onSelect: () => resend.mutate(member.id, { onSuccess: () => toast.success(text.toasts.resent), onError: (error) => toast.error(errorMessage(error)) }),
    },
    { key: 'remove', label: text.rowActions.remove, icon: Trash2, tone: 'danger', onSelect: () => setPending({ kind: 'remove', member }) },
  ]

  const columns = [
    {
      key: 'person',
      header: text.columns.person,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-fg">
              <span className="truncate">{row.name}</span>
              {row.id === user.id && <Badge>{content.common.states.you}</Badge>}
            </p>
            <p className="truncate text-xs text-fg-subtle">{row.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
              <StatusBadge kind="role" value={row.role} dot={false} />
              <StatusBadge kind="memberStatus" value={row.status} />
            </div>
          </div>
        </div>
      ),
    },
    { key: 'role', header: text.columns.role, hideBelow: 'sm', cell: (row) => <StatusBadge kind="role" value={row.role} dot={false} /> },
    { key: 'status', header: text.columns.status, hideBelow: 'sm', cell: (row) => <StatusBadge kind="memberStatus" value={row.status} /> },
    {
      key: 'lastLogin',
      header: text.columns.lastLogin,
      hideBelow: 'md',
      cell: (row) => (row.lastLoginAt ? formatRelative(row.lastLoginAt) : <span className="text-fg-subtle">{row.pendingFirstLogin ? text.pending : content.common.states.never}</span>),
    },
    isOwner && {
      key: 'actions',
      header: <span className="sr-only">{text.columns.actions}</span>,
      align: 'right',
      cell: (row) => (row.id === user.id ? null : <ActionMenu items={rowActions(row)} />),
    },
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.description}
        actions={isOwner && <Button leftIcon={UserPlus} disabled={atLimit} onClick={() => setAdding(true)}>{text.add}</Button>}
      />

      {!isOwner && <Alert tone="info" className="mb-4">{text.ownerOnlyNote}</Alert>}
      {isOwner && atLimit && <Alert tone="warning" className="mb-4">{text.limitReached(data.seats.max)}</Alert>}

      <Card>
        {data && <div className="border-b border-line px-5 py-4"><Meter label={text.seats(data.seats.used, data.seats.max)} used={data.seats.used} max={data.seats.max} /></div>}
        {query.isError && !data ? (
          <QueryError error={query.error} onRetry={query.refetch} />
        ) : (
          <DataTable columns={columns} rows={data?.members} loading={!data} empty={<EmptyState icon={Users} title={text.empty.title} description={text.empty.description} />} />
        )}
      </Card>

      <AddMemberModal open={adding} onClose={() => setAdding(false)} />

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.kind === 'remove' ? text.remove.title : text.disable.title}
        message={pending && (pending.kind === 'remove' ? text.remove.message(pending.member.name) : text.disable.message(pending.member.name))}
        confirmLabel={pending?.kind === 'remove' ? text.remove.confirm : text.disable.confirm}
        loading={remove.isPending || update.isPending}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
