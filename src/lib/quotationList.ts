export const QUOTATION_PAGE_SIZE = 15
export const QUOTATION_STATUSES = ['draft', 'pending_approval', 'quotation_approved', 'order_confirmed', 'cancelled']

export function normalizeQuotationStatus(value?: string) {
  return value && QUOTATION_STATUSES.includes(value) ? value : undefined
}

// One page of the Client Quotations list (newest first), plus the
// quotation -> order id lookup for just that page's "View Converted Order"
// links. Used by both the initial server render and the load-more action.
export async function fetchQuotationsPage(
  payload: any,
  { status, term, page }: { status?: string; term?: string; page: number },
) {
  const conditions: any[] = []
  const activeStatus = normalizeQuotationStatus(status)
  const needle = (term || '').trim()
  if (activeStatus) conditions.push({ status: { equals: activeStatus } })
  if (needle) {
    conditions.push({
      or: [
        { quotationNumber: { contains: needle } },
        { customerName: { contains: needle } },
        { company: { contains: needle } },
        { salesPerson: { contains: needle } },
        { 'items.description': { contains: needle } },
      ],
    })
  }

  const res = await payload.find({
    collection: 'client-quotations',
    sort: '-createdAt',
    limit: QUOTATION_PAGE_SIZE,
    page,
    where: conditions.length ? { and: conditions } : undefined,
  })

  const ids = res.docs.map((d: any) => String(d.id))
  const orderIdByQuotationId: Record<string, string> = {}
  if (ids.length > 0) {
    const ordersRes = await payload.find({
      collection: 'orders',
      where: { sourceQuotationId: { in: ids } },
      limit: ids.length * 2,
      // Only used to build the id lookup -- never shows receipt images.
      select: { clientPaymentReceipts: false, supplierPaymentReceipts: false },
    })
    for (const o of ordersRes.docs as any[]) {
      if (o.sourceQuotationId) orderIdByQuotationId[o.sourceQuotationId] = o.id
    }
  }

  return {
    docs: res.docs as any[],
    totalDocs: res.totalDocs as number,
    hasNextPage: Boolean(res.hasNextPage),
    orderIdByQuotationId,
  }
}
