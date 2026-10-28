export const PO_PAGE_SIZE = 15

export async function fetchPOsPage(
  payload: any,
  {
    status,
    listOrder,
    listSupplier,
    page,
  }: { status?: string; listOrder?: string; listSupplier?: string; page: number },
) {
  const where: any = {}
  if (status) where.status = { equals: status }
  if (listOrder) where.sourceOrderId = { equals: listOrder }
  if (listSupplier) where.supplierName = { equals: listSupplier }

  const res = await payload.find({
    collection: 'supplier-purchase-orders',
    sort: '-createdAt',
    limit: PO_PAGE_SIZE,
    page,
    where: Object.keys(where).length > 0 ? where : undefined,
  })
  return {
    docs: res.docs as any[],
    totalDocs: res.totalDocs as number,
    hasNextPage: Boolean(res.hasNextPage),
  }
}
