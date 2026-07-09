import { Suspense } from 'react'
import { getPayloadClient } from '@/lib/getPayloadClient'
import QuoteForm from '@/components/QuoteForm'
import { Container, Section } from '@/components/ui/styled'

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
    <Section><Container style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <h1 style={{ marginBottom: 12, textAlign: 'center' }}>Request a Quote</h1>
        <p style={{ marginBottom: 32, textAlign: 'center' }}>
          Select the materials and quantities you need. Our team will follow up with pricing directly.
        </p>
        <Suspense fallback={<p style={{ textAlign: 'center' }}>Loading form...</p>}>
          <QuoteForm materials={materials} />
        </Suspense>
      </div>
    </Container></Section>
  )
}