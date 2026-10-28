import { findAll } from '@/lib/findAll'

// Orders carry base64 receipt images, so pages are kept small.
export const ORDER_PAGE_SIZE = 10
export const ORDER_STATUSES = ['preparing', 'shipped', 'delivered', 'cancelled']

export function normalizeOrderStatus(value?: string) {
  return value && ORDER_STATUSES.includes(value) ? value : undefined
}

// One page of the Orders list (newest first) plus the supplier POs linked to
// just that page's orders. Used by the initial server render and load-more.
export async function fetchOrdersPage(
  payload: any,
  { status, term, page }: { status?: string; term?: string; page: number },
) {
  const conditions: any[] = []
  const activeStatus = normalizeOrderStatus(status)
  const needle = (term || '').trim()
  if (activeStatus) conditions.push({ fulfillmentStatus: { equals: activeStatus } })

  if (needle) {
    // Search also matches an order's supplier PO number / supplier name, which
    // live on a different collection -- resolve those to order ids first.
    const poMatches = await findAll(payload, {
      collection: 'supplier-purchase-orders',
      where: { or: [{ poNumber: { contains: needle } }, { supplierName: { contains: needle } }] },
      depth: 0,
      select: { sourceOrderId: true },
    })
    const poOrderIds = Array.from(new Set(poMatches.docs.map((p: any) => p.sourceOrderId).filter(Boolean)))

    conditions.push({
      or: [
        { orderNumber: { contains: needle } },
        { customerName: { contains: needle } },
        { company: { contains: needle } },
        { salesPerson: { contains: needle } },
        { contactNumber: { contains: needle } },
        { 'items.description': { contains: needle } },
        ...(poOrderIds.length > 0 ? [{ id: { in: poOrderIds } }] : []),
      ],
    })
  }

  const res = await payload.find({
    collection: 'orders',
    sort: '-createdAt',
    limit: ORDER_PAGE_SIZE,
    page,
    where: conditions.length ? { and: conditions } : undefined,
  })

  return {
    docs: res.docs as any[],
    totalDocs: res.totalDocs as number,
    hasNextPage: Boolean(res.hasNextPage),
    posByOrderId: await fetchPOsByOrderId(payload, res.docs as any[]),
  }
}

export async function fetchPOsByOrderId(payload: any, orders: any[]) {
  const posByOrderId: Record<string, any[]> = {}
  const ids = orders.map((o) => String(o.id))
  if (ids.length === 0) return posByOrderId
  const pos = await findAll(payload, {
    collection: 'supplier-purchase-orders',
    where: { sourceOrderId: { in: ids } },
  })
  for (const po of pos.docs) {
    if (!po.sourceOrderId) continue
    if (!posByOrderId[po.sourceOrderId]) posByOrderId[po.sourceOrderId] = []
    posByOrderId[po.sourceOrderId].push(po)
  }
  return posByOrderId
}
