import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { content } from '@/content/index.js'

// Catches a rendering crash so one broken page shows a message instead of a blank screen
export class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    // oxlint-disable-next-line no-console -- the one place a crash is reported
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <EmptyState
        icon={AlertTriangle}
        title={content.errors.boundary.title}
        description={content.errors.boundary.description}
        action={<Button onClick={() => this.setState({ failed: false })}>{content.common.actions.retry}</Button>}
        className="min-h-dvh justify-center"
      />
    )
  }
}
