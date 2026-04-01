'use client'

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex-1 min-w-[160px] animate-pulse" aria-busy="true" aria-label="Loading content">
      <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-2.5 bg-gray-100 rounded w-12" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse" aria-busy="true" aria-label="Loading content">
      <div className="h-9 w-full bg-gray-200 rounded-t-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3.5 flex gap-8 border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded w-20" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`} aria-busy="true" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-200 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonChart({ height = 180 }: { height?: number }) {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading content">
      <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
      <div className="bg-gray-100 rounded" style={{ height }} />
    </div>
  )
}
