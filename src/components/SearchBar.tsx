'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'

export default function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  // Update URL whenever the debounced query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    }, 400) // 400ms debounce delay (waits for user to stop typing)

    return () => clearTimeout(timer)
  }, [query, router, pathname, searchParams])

  return (
    <div className="relative w-full md:w-72 flex items-center gap-2.5 border-b border-[#01172f]/15 pb-2.5 transition-colors duration-300 focus-within:border-[#103900]">
      {/* Magnifying Glass Icon */}
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 text-[#01172f]/30"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>

      <input
        type="text"
        placeholder="Search materials"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-transparent border-none text-[14px] text-[#01172f] outline-none placeholder:text-[#01172f]/30 p-0"
      />

      {/* Loading indicator while Next.js fetches new results */}
      {isPending && (
        <div className="w-3 h-3 flex-shrink-0 rounded-full border-2 border-[#103900]/20 border-t-[#103900] animate-spin" />
      )}
    </div>
  )
}