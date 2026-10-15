import { createContext, useContext } from 'react'

export const MetaContext = createContext(null)

// Plans, prices, allowed values and limits from the API (GET /api/meta)
export const useMeta = () => {
  const meta = useContext(MetaContext)
  if (!meta) throw new Error('useMeta must be used inside <MetaProvider>')
  return meta
}
