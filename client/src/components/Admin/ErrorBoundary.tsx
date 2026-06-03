 

import React from "react"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
          <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-8 max-w-md w-full text-center">
            <AlertTriangle size={48} className="text-[#ef4444] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#e5e7eb] mb-2">Something went wrong</h1>
            <p className="text-[#9ca3af] mb-6">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
