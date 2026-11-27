'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { findDealRequestId } from '@/app/admin-dashboard/deal/actions'

// One consistent "jump to this deal's workflow" link for every list that shows
// an order, quotation or supplier PO. Pass whichever id the row has:
//   requestId              -> a plain link to the workflow
//   quotation / order / po -> the inquiry is looked up first, then the workflow
//                             opens as an ordinary navigation
//
// The lookup happens here, rather than through a server redirect, because only
// an ordinary navigation lets the workflow open as a modal over the current
// list (so closing it needs no reload and keeps the scroll position). The href
// still points at /admin-dashboard/deal, which does the same lookup on the
// server, for "open in new tab" and as a fallback.
export default function OpenDealLink({
  requestId,
  quotation,
  order,
  po,
  variant = 'button',
}: {
  requestId?: string | number | null
  quotation?: string | number | null
  order?: string | number | null
  po?: string | number | null
  variant?: 'button' | 'text'
}) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'opening' | 'missing'>('idle')

  // Let a "no workflow" note fade back to the link.
  useEffect(() => {
    if (state !== 'missing') return
    const t = setTimeout(() => setState('idle'), 4000)
    return () => clearTimeout(t)
  }, [state])

  const className =
    variant === 'button'
      ? 'inline-flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded bg-[#01172f] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#149911] transition-colors'
      : 'whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors'

  if (requestId) {
    return (
      <Link
        href={`/admin-dashboard/pipeline/${requestId}`}
        prefetch={false}
        // The workflow opens as a modal over the current page; don't scroll it.
        scroll={false}
        className={className}
      >
        Open inquiry &rarr;
      </Link>
    )
  }

  const ref: { quotation?: string; order?: string; po?: string } | null = quotation
    ? { quotation: String(quotation) }
    : order
      ? { order: String(order) }
      : po
        ? { po: String(po) }
        : null
  if (!ref) return null

  const fallbackHref = `/admin-dashboard/deal?${new URLSearchParams(ref as Record<string, string>).toString()}`

  if (state === 'missing') {
    return <span className="whitespace-nowrap text-[11px] font-medium text-gray-400">No workflow for this record</span>
  }

  return (
    <Link
      href={fallbackHref}
      prefetch={false}
      scroll={false}
      aria-busy={state === 'opening'}
      className={`${className} ${state === 'opening' ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={async (e) => {
        // New tab / window, or a modified click: let the browser use the href.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        if (state === 'opening') return
        setState('opening')
        try {
          const id = await findDealRequestId(ref)
          if (!id) {
            setState('missing')
            return
          }
          router.push(`/admin-dashboard/pipeline/${encodeURIComponent(id)}`, { scroll: false })
          setState('idle')
        } catch {
          // Lookup failed (offline, signed out): fall back to the server redirect.
          router.push(fallbackHref, { scroll: false })
          setState('idle')
        }
      }}
    >
      {state === 'opening' ? 'Opening…' : <>Open inquiry &rarr;</>}
    </Link>
  )
}
