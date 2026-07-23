import { Suspense } from 'react'
import { getPayloadClient } from '@/lib/getPayloadClient'
import QuoteForm from '@/components/QuoteForm'

export const revalidate = 300

export default async function QuotePage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { inStock: { equals: true } },
    limit: 300,
    sort: 'name',
    select: { name: true, category: true, unit: true },
  })
  const products = docs.map((m: any) => ({ id: m.id, name: m.name, unit: m.unit }))

  return (
    <section className="py-28 flex justify-center px-6 lg:px-20">
      <div className="max-w-[520px] w-full">
        <h1 className="mb-3 text-center">Request a Quote</h1>
        <p className="mb-8 text-center">Select the products and quantities you need. Our team will follow up with pricing directly.</p>
        <Suspense fallback={<p className="text-center">Loading form...</p>}>
          <QuoteForm products={products} />
        </Suspense>
      </div>
    </section>
  )
}
