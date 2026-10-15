import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { appConfig } from '@/config/app.js'
import { endpoints } from '@/config/endpoints.js'
import { queryKeys } from '@/config/queryKeys.js'
import { api } from '@/lib/api.js'

export const useOverview = (range) =>
  useQuery({
    queryKey: queryKeys.overview(range),
    queryFn: () => api.get(endpoints.client.overview, { range }).then((body) => body.overview),
    refetchInterval: appConfig.dashboardRefreshMs,
    placeholderData: keepPreviousData,
  })
