'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SearchBar({
  initialQuery = '',
  onQueryChange,
}: {
  initialQuery?: string
  onQueryChange?: (query: string) => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)

  // Sync the URL for shareable links, but with history.replaceState instead
  // of router.replace -- this never triggers a Next.js navigation or a
  // server re-render, so typing stays instant regardless of debounce timing.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }

      const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
      window.history.replaceState(null, '', newUrl)
    }, 400)

    return () => clearTimeout(timer)
  }, [query, pathname, searchParams])

  // Filtering itself is instant -- no debounce needed here, since it's just
  // an in-memory array filter in the parent, not a network call.
  useEffect(() => {
    onQueryChange?.(query)
  }, [query, onQueryChange])

  return (
    <div className="relative w-full flex items-center gap-3 px-4 py-3 transition-colors duration-300 bg-transparent group">
      {/* Magnifying Glass Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 text-[#fdfffc]/40 transition-colors group-focus-within:text-[#149911]"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>

      <input
        type="text"
        placeholder="Search products"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-transparent border-none text-[14px] text-[#fdfffc] outline-none placeholder:text-[#fdfffc]/40 p-0 focus:ring-0"
      />
    </div>
  )
}