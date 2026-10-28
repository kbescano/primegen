'use client'

import { useEffect, useRef } from 'react'

// Sits under a list: loads the next batch when scrolled near, and also shows
// a button so the list never depends on the observer firing.
export default function InfiniteScrollSentinel({
  hasMore,
  loading,
  error,
  onLoadMore,
  loadedCount,
  totalCount,
  noun,
}: {
  hasMore: boolean
  loading: boolean
  error?: string
  onLoadMore: () => void
  loadedCount: number
  totalCount: number
  noun: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const loadRef = useRef(onLoadMore)
  loadRef.current = onLoadMore

  useEffect(() => {
    const el = ref.current
    if (!el || !hasMore || loading || error) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadRef.current()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, error, loadedCount])

  return (
    <div ref={ref} className="flex flex-col items-center gap-3 py-8">
      <p className="text-[11px] text-gray-400 font-medium">
        {hasMore
          ? `Showing ${loadedCount} of ${totalCount} ${noun}`
          : totalCount > 0
            ? `All ${totalCount} ${noun} loaded`
            : ''}
      </p>
      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded border bg-white border-gray-200 text-gray-600 hover:border-[#01172f] hover:text-[#01172f] transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : error ? 'Retry' : 'Load older'}
        </button>
      )}
    </div>
  )
}
