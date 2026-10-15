import { Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary.jsx'
import { PageLoader } from '@/components/feedback/states.jsx'
import { ToastProvider } from '@/components/feedback/ToastProvider.jsx'
import { MetaProvider } from '@/features/meta/MetaProvider.jsx'
import { AppRoutes } from './AppRoutes.jsx'
import { queryClient } from './queryClient.js'

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MetaProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader className="min-h-dvh" />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </MetaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
