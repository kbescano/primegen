import POGenerator, { type POInitial } from '@/components/POGenerator'
import { getPayloadClient } from '@/lib/getPayloadClient'

export default async function SupplierPOPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  let initial: POInitial | undefined

  if (from) {
    try {
      const payload = await getPayloadClient()
      const q: any = await payload.findByID({ collection: 'quotation-requests', id: from, depth: 2 })
      if (q) {
        initial = {
          // Supplier PO: the supplier isn't known from the quotation -- leave party blank,
          // but carry over the project context and the exact items to order.
          project: q.projectType ? `${q.projectType.charAt(0).toUpperCase()}${q.projectType.slice(1)} project -- for ${q.customerName}` : `For ${q.customerName}`,
          items: Array.isArray(q.items)
            ? q.items.map((item: any) => ({
                description: typeof item.material === 'object' ? item.material?.name || '' : String(item.material || ''),
                qty: item.quantity || 1,
                uom: typeof item.material === 'object' ? item.material?.unit || 'pcs' : 'pcs',
                unitPrice: 0,
              }))
            : undefined,
        }
      }
    } catch {
      // quotation not found -- fall through to a blank form
    }
  }

  return (
    <POGenerator
      title="Supplier Purchase Order"
      partyLabel="Supplier"
      apiPath="/api/supplier-purchase-orders"
      partyFieldPrefix="supplier"
      numberPlaceholder="Auto-generated on save (SPO-YYYY-####)"
      initial={initial}
    />
  )
}
