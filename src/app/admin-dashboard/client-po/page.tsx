import POGenerator, { type POInitial } from '@/components/POGenerator'
import { getPayloadClient } from '@/lib/getPayloadClient'

export default async function ClientPOPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  let initial: POInitial | undefined

  if (from) {
    try {
      const payload = await getPayloadClient()
      const q: any = await payload.findByID({ collection: 'quotation-requests', id: from, depth: 2 })
      if (q) {
        initial = {
          partyName: q.customerName || '',
          project: q.projectType ? `${q.projectType.charAt(0).toUpperCase()}${q.projectType.slice(1)} project` : '',
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
      title="Client Purchase Order"
      partyLabel="Client"
      apiPath="/api/client-purchase-orders"
      partyFieldPrefix="client"
      numberPlaceholder="Auto-generated on save (CPO-YYYY-####)"
      initial={initial}
    />
  )
}
