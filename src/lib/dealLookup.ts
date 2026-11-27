// Works out which customer inquiry (the key of the deal workflow page) an
// order, quotation or supplier PO belongs to, by following the ids that link
// them: PO -> order -> quotation -> inquiry.
//
// Read-only. Every lookup runs as the signed-in person (overrideAccess: false),
// so someone can only resolve a record they are allowed to read.

export type DealRef = { request?: string; quotation?: string; order?: string; po?: string }

async function findField(payload: any, user: any, collection: string, id: string, field: string) {
  try {
    const doc: any = await payload.findByID({
      collection,
      id,
      depth: 0,
      select: { [field]: true },
      user,
      overrideAccess: false,
    })
    const value = doc?.[field]
    return value ? String(typeof value === 'object' ? value.id : value) : null
  } catch {
    return null
  }
}

export async function resolveDealRequestId(payload: any, user: any, ref: DealRef): Promise<string | null> {
  if (!user) return null

  let requestId: string | null = ref.request ? String(ref.request) : null
  let quotationId: string | null = ref.quotation ? String(ref.quotation) : null
  let orderId: string | null = ref.order ? String(ref.order) : null

  if (!requestId && !quotationId && !orderId && ref.po) {
    orderId = await findField(payload, user, 'supplier-purchase-orders', String(ref.po), 'sourceOrderId')
  }
  if (!requestId && !quotationId && orderId) {
    quotationId = await findField(payload, user, 'orders', orderId, 'sourceQuotationId')
  }
  if (!requestId && quotationId) {
    requestId = await findField(payload, user, 'client-quotations', quotationId, 'sourceRequestId')
  }
  return requestId
}
