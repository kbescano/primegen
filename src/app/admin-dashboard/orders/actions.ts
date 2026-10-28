'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { fetchOrdersPage } from '@/lib/orderList'

// Same gate as the orders list page itself: the full list is admin-only.
export async function loadMoreOrders(input: { status?: string; q?: string; page: number }) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (user?.role !== 'admin') throw new Error('Unauthorized')
  return fetchOrdersPage(payload, {
    status: input.status,
    term: input.q,
    page: Math.max(1, Math.floor(Number(input.page)) || 1),
  })
}
