'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { backTarget, DEAL_ORIGIN_KEY } from '@/lib/adminNav'

// Back arrow for the deal workflow page. Returns to the list the deal was
// opened from -- with that list's filters and search intact -- and falls back
// to the deals list when it was opened some other way (bookmark, typed URL).
export default function PipelineBackLink() {
  const [origin, setOrigin] = useState<string | null>(null)

  useEffect(() => {
    try {
      setOrigin(sessionStorage.getItem(DEAL_ORIGIN_KEY))
    } catch {
      // storage unavailable -- keep the fallback
    }
  }, [])

  const target = backTarget(origin)

  return (
    <Link
      href={target.href}
      onClick={() => {
        try {
          sessionStorage.removeItem(DEAL_ORIGIN_KEY)
        } catch {
          // ignore
        }
      }}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shrink-0"
      title={`Back to ${target.label}`}
      aria-label={`Back to ${target.label}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  )
}
