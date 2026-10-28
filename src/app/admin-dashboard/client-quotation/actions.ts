'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { fetchQuotationsPage } from '@/lib/quotationList'

// Same gate as the list page itself: the full list is admin-only.
export async function loadMoreQuotations(input: { status?: string; q?: string; page: number }) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (user?.role !== 'admin') throw new Error('Unauthorized')
  return fetchQuotationsPage(payload, {
    status: input.status,
    term: input.q,
    page: Math.max(1, Math.floor(Number(input.page)) || 1),
  })
}
