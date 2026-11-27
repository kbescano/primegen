'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { resolveDealRequestId, type DealRef } from '@/lib/dealLookup'

// Used by the "Open deal" links on order / quotation / PO rows: find the
// inquiry the record belongs to, so the page can open the workflow as a normal
// navigation (which is what lets it appear as a modal over the current list).
// Returns null when the record has no inquiry behind it.
export async function findDealRequestId(ref: Pick<DealRef, 'quotation' | 'order' | 'po'>): Promise<string | null> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return resolveDealRequestId(payload, user, {
    quotation: ref.quotation ? String(ref.quotation) : undefined,
    order: ref.order ? String(ref.order) : undefined,
    po: ref.po ? String(ref.po) : undefined,
  })
}
