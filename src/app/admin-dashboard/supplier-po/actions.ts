'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { fetchPOsPage } from '@/lib/supplierPOList'

const STATUSES = ['draft', 'issued', 'fulfilled', 'cancelled']

export async function loadMoreSupplierPOs(input: {
  status?: string
  listOrder?: string
  listSupplier?: string
  page: number
}) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) throw new Error('Unauthorized')
  return fetchPOsPage(payload, {
    status: input.status && STATUSES.includes(input.status) ? input.status : undefined,
    listOrder: input.listOrder,
    listSupplier: input.listSupplier,
    page: Math.max(1, Math.floor(Number(input.page)) || 1),
  })
}
