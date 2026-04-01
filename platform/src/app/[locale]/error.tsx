'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent/90 transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
