import { useEffect } from 'react'

import { useMeta } from '@/features/meta/MetaContext.js'

// Sets the browser tab title to "Page · App name"
export function usePageTitle(title) {
  const { appName } = useMeta()
  useEffect(() => {
    document.title = title ? `${title} · ${appName}` : appName
  }, [title, appName])
}
