'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function DirectorySearchBar({
  initialQuery,
  placeholder,
}: {
  initialQuery: string
  placeholder: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initialQuery)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams()
      if (value) params.set('q', value)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    }, 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full sm:w-72 px-4 py-2.5 border border-[#01172f]/15 text-sm text-[#01172f] placeholder:text-[#01172f]/35 focus:outline-none focus:border-[#149911] transition-colors duration-200"
    />
  )
}
