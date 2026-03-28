'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Something went wrong</h2>
            <button onClick={reset} style={{ padding: '0.5rem 1rem', background: '#2E75B6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
