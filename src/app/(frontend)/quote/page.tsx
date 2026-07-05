import { Suspense } from 'react'
import { getPayloadClient } from '@/lib/getPayloadClient'
import QuoteForm from '@/components/QuoteForm'

export const revalidate = 300

export default async function QuotePage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'materials',
    where: { inStock: { equals: true } },
    limit: 300,
    sort: 'name',
    select: { name: true, category: true, unit: true },
  })

  const materials = docs.map((m: any) => ({ id: m.id, name: m.name, unit: m.unit }))

  return (
    <div className="container" style={{ padding: '56px 24px 80px', maxWidth: 640 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Request a Quote</h1>
      <p style={{ marginBottom: 32 }}>
        Select the materials and quantities you need. Our team will follow up with pricing
        directly -- this form doesn't send an automatic quote.
      </p>
      <Suspense fallback={<p>Loading form...</p>}>
        <QuoteForm materials={materials} />
      </Suspense>
    </div>
  )
}
