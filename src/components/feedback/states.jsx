import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { Spinner } from '@/components/ui/Spinner.jsx'
import { content } from '@/content/index.js'
import { errorMessage } from '@/lib/errors.js'
import { cn } from '@/lib/cn.js'

export function PageLoader({ className }) {
  return (
    <div className={cn('flex min-h-64 items-center justify-center text-link', className)}>
      <Spinner size="lg" label={content.common.states.loading} />
    </div>
  )
}

// What to show when a query failed: the reason, and a way to try again
export function QueryError({ error, onRetry, className }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={content.errors.loadFailed}
      description={errorMessage(error)}
      action={onRetry && <Button variant="secondary" onClick={onRetry}>{content.common.actions.retry}</Button>}
      className={className}
    />
  )
}
