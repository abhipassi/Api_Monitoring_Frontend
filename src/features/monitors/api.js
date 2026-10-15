import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { appConfig } from '@/config/app.js'
import { endpoints } from '@/config/endpoints.js'
import { queryKeys } from '@/config/queryKeys.js'
import { api } from '@/lib/api.js'
import { compactParams } from '@/hooks/useListParams.js'

const urls = endpoints.client.monitors

export const useMonitors = (params) =>
  useQuery({
    queryKey: queryKeys.monitors.list(params),
    queryFn: () => api.get(urls.base, compactParams(params)),
    placeholderData: keepPreviousData,
  })

export const useMonitor = (id) =>
  useQuery({
    queryKey: queryKeys.monitors.detail(id),
    queryFn: () => api.get(urls.byId(id)).then((body) => body.monitor),
    refetchInterval: appConfig.monitorRefreshMs,
  })

export const useMonitorStats = (id, range) =>
  useQuery({
    queryKey: queryKeys.monitors.stats(id, range),
    queryFn: () => api.get(urls.stats(id), { range }).then((body) => body.stats),
    refetchInterval: appConfig.monitorRefreshMs,
    placeholderData: keepPreviousData,
  })

export const useMonitorChart = (id, range) =>
  useQuery({
    queryKey: queryKeys.monitors.chart(id, range),
    queryFn: () => api.get(urls.chart(id), { range }).then((body) => body.chart),
    refetchInterval: appConfig.monitorRefreshMs,
    placeholderData: keepPreviousData,
  })

// Newest first; "load more" asks for results older than the last one received
export const useMonitorResults = (id) =>
  useInfiniteQuery({
    queryKey: queryKeys.monitors.results(id),
    queryFn: ({ pageParam }) => api.get(urls.results(id), { limit: appConfig.recentChecksPageSize, before: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (last) => (last.results.length === appConfig.recentChecksPageSize ? last.results.at(-1).checkedAt : undefined),
    refetchInterval: appConfig.monitorRefreshMs,
  })

// Anything that changes a monitor can change counts, usage and the dashboard
const useRefreshMonitorData = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.monitors.all }),
      queryClient.invalidateQueries({ queryKey: ['overview'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.billing }),
    ])
}

export const useCreateMonitor = () => {
  const refresh = useRefreshMonitorData()
  return useMutation({ mutationFn: (values) => api.post(urls.base, values), onSuccess: refresh })
}

export const useUpdateMonitor = () => {
  const refresh = useRefreshMonitorData()
  return useMutation({ mutationFn: ({ id, ...values }) => api.patch(urls.byId(id), values), onSuccess: refresh })
}

export const useDeleteMonitor = () => {
  const refresh = useRefreshMonitorData()
  return useMutation({ mutationFn: (id) => api.delete(urls.byId(id)), onSuccess: refresh })
}
