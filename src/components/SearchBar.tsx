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
    <div className="relative w-full md:w-80">
      <input
        type="text"
        placeholder="Search materials..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-[#f8f9f7] border-none text-[14px] text-[#01172f] px-5 py-3.5 outline-none placeholder:text-[#01172f]/30 transition-all duration-300 focus:bg-[#f4f6f2] focus:ring-1 focus:ring-inset focus:ring-[#103900]/20"
      />
      
      {/* Magnifying Glass Icon (Decorative only, no button) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#01172f]/30">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {/* Optional Loading Indicator while Next.js fetches new results */}
      {isPending && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#103900]/20 border-t-[#103900] animate-spin" />
      )}
    </div>
  )
}