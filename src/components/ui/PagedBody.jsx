import { QueryError } from '@/components/feedback/states.jsx'
import { Pagination } from './Pagination.jsx'

// The body of a list card: the error (if loading failed), or the table with its page buttons.
// Pass the table as children.
export function PagedBody({ query, pageSize, onPageChange, children }) {
  const data = query.data
  if (query.isError && !data) return <QueryError error={query.error} onRetry={query.refetch} />

  return (
    <>
      {children}
      {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} pageSize={pageSize} onPageChange={onPageChange} />}
    </>
  )
}
