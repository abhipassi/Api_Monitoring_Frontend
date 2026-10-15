import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ServerCrash } from 'lucide-react'

import { PageLoader } from '@/components/feedback/states.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { appConfig } from '@/config/app.js'
import { endpoints } from '@/config/endpoints.js'
import { queryKeys } from '@/config/queryKeys.js'
import { content } from '@/content/index.js'
import { api } from '@/lib/api.js'
import { MetaContext } from './MetaContext.js'

// The whole site depends on this config, so nothing renders until it has loaded
export function MetaProvider({ children }) {
  const query = useQuery({
    queryKey: queryKeys.meta,
    queryFn: () => api.get(endpoints.meta).then((body) => body.meta),
    staleTime: appConfig.metaStaleMs,
    retry: 1,
  })

  useEffect(() => {
    if (query.data?.appName) document.title = query.data.appName
  }, [query.data?.appName])

  if (query.isPending) return <PageLoader className="min-h-dvh" />

  if (query.isError) {
    return (
      <EmptyState
        icon={ServerCrash}
        title={content.errors.metaFailed.title}
        description={content.errors.metaFailed.description}
        action={<Button onClick={() => query.refetch()}>{content.common.actions.retry}</Button>}
        className="min-h-dvh justify-center"
      />
    )
  }

  return <MetaContext value={query.data}>{children}</MetaContext>
}
