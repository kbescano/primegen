import QuotationGenerator, { type QuotationInitial } from '@/components/QuotationGenerator'
import { getPayloadClient } from '@/lib/getPayloadClient'

export default async function ClientQuotationPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  let initial: QuotationInitial | undefined

  if (from) {
    try {
      const payload = await getPayloadClient()
      const q: any = await payload.findByID({ collection: 'quotation-requests', id: from, depth: 2 })
      if (q) {
        initial = {
          customerName: q.customerName || '',
          contactNumber: q.phone || '',
          items: Array.isArray(q.items)
            ? q.items.map((item: any) => ({
                qty: item.quantity || 1,
                unit: typeof item.material === 'object' ? item.material?.unit || 'pcs' : 'pcs',
                description: typeof item.material === 'object' ? item.material?.name || '' : String(item.material || ''),
                unitPrice: 0,
              }))
            : undefined,
        }
      }
    } catch {
      // fall through to a blank form
    }
  }

  return <QuotationGenerator initial={initial} />
}
