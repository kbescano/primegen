'use client'

import { useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { isDealPath } from '@/lib/adminNav'

/**
 * `useSearchParams` for a list page (Deals, Orders, Quotations, Inquiry
 * overview) that can have the deal workflow open on top of it.
 *
 * The workflow opens as a modal at /admin-dashboard/pipeline/<id>, which changes
 * the URL -- and its (empty) query string -- while the list stays mounted
 * underneath. A list that mirrors its filters from the URL would see that as
 * "all filters cleared", redraw itself unfiltered (for the Deals list that is
 * over a thousand cards), then redraw again when the modal closes. This hands
 * the list the query string it had before the modal opened and keeps it until
 * the modal is gone, so nothing underneath changes.
 */
export function useListSearchParams() {
  const live = useSearchParams()
  const pathname = usePathname()
  const held = useRef(live)
  if (!isDealPath(pathname ?? '')) held.current = live
  return held.current
}
