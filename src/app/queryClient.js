import { QueryClient } from '@tanstack/react-query'

// Lists refresh when a window regains focus; a failed call is retried once, but never a 4xx
// (those are answers, not glitches)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 1 && !(error?.status >= 400 && error?.status < 500),
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
    mutations: { retry: false },
  },
})
