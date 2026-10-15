import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { searchParams as names } from '@/config/routes.js'

// Filters, search and page live in the address bar, so a filtered list can be shared and survives a refresh.
// `defaults` must be a stable object (declare it outside the component).
export function useListParams(defaults = {}) {
  const [search, setSearch] = useSearchParams()

  const params = useMemo(() => {
    const merged = { ...defaults, ...Object.fromEntries(search) }
    merged[names.page] = Math.max(1, parseInt(merged[names.page], 10) || 1)
    return merged
  }, [search, defaults])

  const update = useCallback(
    (patch) => {
      setSearch(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(patch)) {
            if (value === '' || value == null || value === defaults[key]) next.delete(key)
            else next.set(key, String(value))
          }
          // Changing a filter returns to the first page, unless the change is the page itself
          if (!(names.page in patch)) next.delete(names.page)
          return next
        },
        { replace: true }
      )
    },
    [setSearch, defaults]
  )

  return [params, update]
}

// What gets sent to the API: drop empty values
export const compactParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
