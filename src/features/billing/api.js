import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { endpoints } from '@/config/endpoints.js'
import { queryKeys } from '@/config/queryKeys.js'
import { api } from '@/lib/api.js'

const urls = endpoints.client.billing

export const useBilling = (enabled = true) =>
  useQuery({ queryKey: queryKeys.billing, queryFn: () => api.get(urls.base).then((body) => body.billing), enabled })

const useRefreshBilling = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.billing })
}

export const useCreatePlanRequest = () => {
  const refresh = useRefreshBilling()
  return useMutation({ mutationFn: (values) => api.post(urls.planRequests, values), onSuccess: refresh })
}

export const useCancelPlanRequest = () => {
  const refresh = useRefreshBilling()
  return useMutation({ mutationFn: (id) => api.delete(urls.planRequest(id)), onSuccess: refresh })
}

// Once a payment provider is connected, this returns the address to send the customer to
export const useCheckout = () => useMutation({ mutationFn: (plan) => api.post(urls.checkout, { plan }) })
