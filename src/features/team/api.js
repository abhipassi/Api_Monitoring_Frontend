import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { endpoints } from '@/config/endpoints.js'
import { queryKeys } from '@/config/queryKeys.js'
import { api } from '@/lib/api.js'

const urls = endpoints.client.team

export const useTeam = () => useQuery({ queryKey: queryKeys.team, queryFn: () => api.get(urls.base) })

const useRefreshTeam = () => {
  const queryClient = useQueryClient()
  // Seat usage also shows on the billing page
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.team }), queryClient.invalidateQueries({ queryKey: queryKeys.billing })])
}

export const useAddMember = () => {
  const refresh = useRefreshTeam()
  return useMutation({ mutationFn: (values) => api.post(urls.base, values), onSuccess: refresh })
}

export const useUpdateMember = () => {
  const refresh = useRefreshTeam()
  return useMutation({ mutationFn: ({ id, ...values }) => api.patch(urls.byId(id), values), onSuccess: refresh })
}

export const useRemoveMember = () => {
  const refresh = useRefreshTeam()
  return useMutation({ mutationFn: (id) => api.delete(urls.byId(id)), onSuccess: refresh })
}

export const useResendCredentials = () => useMutation({ mutationFn: (id) => api.post(urls.resend(id)) })
