import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { appConfig } from '@/config/app.js'
import { endpoints } from '@/config/endpoints.js'
import { queryKeys } from '@/config/queryKeys.js'
import { compactParams } from '@/hooks/useListParams.js'
import { api } from '@/lib/api.js'

const urls = endpoints.admin

export const useAdminStats = () =>
  useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => api.get(urls.stats).then((body) => body.stats),
    refetchInterval: appConfig.dashboardRefreshMs,
  })

export const useAdminClients = (params) =>
  useQuery({
    queryKey: queryKeys.admin.clients.list(params),
    queryFn: () => api.get(urls.clients, compactParams(params)),
    placeholderData: keepPreviousData,
  })

export const useAdminClient = (id) =>
  useQuery({ queryKey: queryKeys.admin.clients.detail(id), queryFn: () => api.get(urls.client(id)) })

export const usePlanRequests = (params) =>
  useQuery({
    queryKey: queryKeys.admin.planRequests.list(params),
    queryFn: () => api.get(urls.planRequests, compactParams(params)),
    placeholderData: keepPreviousData,
  })

export const useEmployees = (params) =>
  useQuery({
    queryKey: queryKeys.admin.employees.list(params),
    queryFn: () => api.get(urls.employees, compactParams(params)),
    placeholderData: keepPreviousData,
  })

export const useAuditLogs = (params, enabled = true) =>
  useQuery({
    queryKey: queryKeys.admin.auditLogs(params),
    queryFn: () => api.get(urls.auditLogs, compactParams(params)),
    placeholderData: keepPreviousData,
    enabled,
  })

const useRefreshAdmin = () => {
  const queryClient = useQueryClient()
  // A customer, request or staff change can affect every admin list, the overview and the audit log
  return () => queryClient.invalidateQueries({ queryKey: ['admin'] })
}

export const useUpdateClient = () => {
  const refresh = useRefreshAdmin()
  return useMutation({ mutationFn: ({ id, ...values }) => api.patch(urls.client(id), values), onSuccess: refresh })
}

export const useDecidePlanRequest = () => {
  const refresh = useRefreshAdmin()
  return useMutation({
    mutationFn: ({ id, approve, note }) =>
      api.post(approve ? urls.approvePlanRequest(id) : urls.rejectPlanRequest(id), { note: note || undefined }),
    onSuccess: refresh,
  })
}

export const useCreateEmployee = () => {
  const refresh = useRefreshAdmin()
  return useMutation({ mutationFn: (values) => api.post(urls.employees, values), onSuccess: refresh })
}

export const useUpdateEmployee = () => {
  const refresh = useRefreshAdmin()
  return useMutation({ mutationFn: ({ id, ...values }) => api.patch(urls.employee(id), values), onSuccess: refresh })
}
