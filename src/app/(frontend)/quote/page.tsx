import { Suspense } from 'react'
import { getPayloadClient } from '@/lib/getPayloadClient'
import QuoteForm from '@/components/QuoteForm'
import SectionHeader from '@/components/SectionHeader'

export const revalidate = 300

export const metadata = {
  title: 'Request a Quote',
  description: 'Tell us what products you need and our team will get back to you with pricing.',
}

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
         <SectionHeader
                size="page"
                eyebrow="Form"
                title="Request a Quote"
                description="Select the products and quantities you need. Our team will follow up with pricing directly."
          />
        <Suspense fallback={<p className="text-center">Loading form...</p>}>
          <QuoteForm products={products} />
        </Suspense>
      </div>
    </section>
  )
}
