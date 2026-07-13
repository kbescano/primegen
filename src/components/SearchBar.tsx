'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useState } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  // Initialize state with current URL search param if it exists
  const [term, setTerm] = useState(searchParams.get('q') || '')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTerm(value)
    
    // useTransition keeps the UI responsive while Next.js fetches new server data
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      // Update the URL without scrolling to the top
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="relative w-full md:w-[320px] shrink-0">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className={`w-5 h-5 transition-colors duration-300 ${isPending ? 'text-[#01172f]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <input 
        type="text" 
        value={term}
        onChange={handleSearch}
        placeholder="Search materials..." 
        className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-full ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-[#01172f] focus:bg-white transition-all duration-300 text-[15px] text-gray-900 placeholder:text-gray-400"
      />
    </div>
  )
}