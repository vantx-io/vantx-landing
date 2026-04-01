export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">404</h2>
        <p className="text-sm text-gray-500 mb-4">Page not found</p>
        <a
          href="/"
          className="px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent/90 transition inline-block"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
