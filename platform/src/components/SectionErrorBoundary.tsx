'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallbackTitle?: string
  fallbackBody?: string
  fallbackRetry?: string
}

interface State {
  hasError: boolean
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SectionErrorBoundary] caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Something went wrong in this section',
        fallbackBody = 'This section couldn\'t load. The rest of the page is still available.',
        fallbackRetry = 'Try again',
      } = this.props

      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-2xl mb-2">&#x26A0;</div>
          <h3 className="text-sm font-semibold text-brand-dark mb-1">{fallbackTitle}</h3>
          <p className="text-xs text-brand-muted mb-4">{fallbackBody}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-brand-muted hover:bg-white hover:text-brand-dark transition"
          >
            {fallbackRetry}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
