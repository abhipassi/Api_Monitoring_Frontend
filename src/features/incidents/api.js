import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { appConfig } from '@/config/app.js'
import { endpoints } from '@/config/endpoints.js'
import { queryKeys } from '@/config/queryKeys.js'
import { api } from '@/lib/api.js'
import { compactParams } from '@/hooks/useListParams.js'

export const useIncidents = (params) =>
  useQuery({
    queryKey: queryKeys.incidents.list(params),
    queryFn: () => api.get(endpoints.client.incidents.base, compactParams(params)),
    refetchInterval: appConfig.dashboardRefreshMs,
    placeholderData: keepPreviousData,
  })
