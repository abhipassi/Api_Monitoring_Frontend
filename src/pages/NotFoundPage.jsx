import { FileQuestion } from 'lucide-react'

import { ButtonLink } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { content } from '@/content/index.js'
import { usePageTitle } from '@/hooks/usePageTitle.js'

export default function NotFoundPage({ homePath }) {
  usePageTitle(content.errors.notFound.title)
  return (
    <EmptyState
      icon={FileQuestion}
      title={content.errors.notFound.title}
      description={content.errors.notFound.description}
      action={<ButtonLink to={homePath}>{content.errors.notFound.action}</ButtonLink>}
      className="min-h-dvh justify-center"
    />
  )
}
