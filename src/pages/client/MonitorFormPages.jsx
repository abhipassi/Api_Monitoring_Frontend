import { useNavigate, useParams } from 'react-router'

import { PageLoader, QueryError } from '@/components/feedback/states.jsx'
import { useToast } from '@/components/feedback/ToastContext.js'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { paths } from '@/config/routes.js'
import { content } from '@/content/index.js'
import { MonitorForm } from '@/features/monitors/MonitorForm.jsx'
import { useCreateMonitor, useMonitor, useMonitors, useUpdateMonitor } from '@/features/monitors/api.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

const text = content.monitors

// The customer's plan limits arrive with the monitor list (usage), which the form uses to offer valid choices
const usePlanLimits = () => {
  const query = useMonitors({ limit: 1 })
  return { query, planLimits: query.data?.usage }
}

export function NewMonitorPage() {
  usePageTitle(text.form.createTitle)
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateMonitor()
  const { query, planLimits } = usePlanLimits()

  if (query.isPending) return <PageLoader />
  if (query.isError) return <QueryError error={query.error} onRetry={query.refetch} />

  return (
    <>
      <PageHeader title={text.form.createTitle} description={text.form.createDescription} back={{ to: paths.client.monitors, label: text.title }} />
      <MonitorForm
        planLimits={planLimits}
        submitting={create.isPending}
        error={create.error}
        cancelTo={paths.client.monitors}
        submitLabel={text.form.submitCreate}
        onSubmit={(payload) =>
          create.mutate(payload, {
            onSuccess: (body) => {
              toast.success(text.toasts.created)
              navigate(paths.client.monitor(body.monitor.id))
            },
          })
        }
      />
    </>
  )
}

export function EditMonitorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const monitorQuery = useMonitor(id)
  const update = useUpdateMonitor()
  const { query: planQuery, planLimits } = usePlanLimits()
  usePageTitle(text.form.editTitle)

  if (monitorQuery.isPending || planQuery.isPending) return <PageLoader />
  if (monitorQuery.isError) {
    return monitorQuery.error.status === 404 ? (
      <EmptyState title={text.detail.notFound.title} description={text.detail.notFound.description} />
    ) : (
      <QueryError error={monitorQuery.error} onRetry={monitorQuery.refetch} />
    )
  }

  const monitor = monitorQuery.data
  return (
    <>
      <PageHeader title={text.form.editTitle} description={text.form.editDescription} back={{ to: paths.client.monitor(id), label: monitor.name }} />
      <MonitorForm
        monitor={monitor}
        planLimits={planLimits}
        submitting={update.isPending}
        error={update.error}
        cancelTo={paths.client.monitor(id)}
        submitLabel={text.form.submitEdit}
        onSubmit={(payload) =>
          update.mutate(
            { id, ...payload },
            {
              onSuccess: () => {
                toast.success(text.toasts.updated)
                navigate(paths.client.monitor(id))
              },
            }
          )
        }
      />
    </>
  )
}
