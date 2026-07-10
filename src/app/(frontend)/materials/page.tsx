import { getPayloadClient } from '@/lib/getPayloadClient'
import MaterialCarousel from '@/components/MaterialCarousel'

export const revalidate = 60

const CATEGORY_LABELS: Record<string, string> = {
  'cement-concrete': 'Cement & Concrete',
  'steel-rebar': 'Steel & Rebar',
  'sand-aggregates': 'Sand & Aggregates',
  'lumber-wood': 'Lumber & Wood',
  roofing: 'Roofing',
  plumbing: 'Plumbing Supplies',
  electrical: 'Electrical Supplies',
  'tools-hardware': 'Tools & Hardware',
  other: 'Other',
}

export default async function MaterialsPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'materials', limit: 200, sort: 'category' })

  const grouped: Record<string, any[]> = {}
  for (const m of docs) {
    const cat = m.category || 'other'
    grouped[cat] = grouped[cat] || []
    grouped[cat].push(m)
  }
  const categories = Object.keys(grouped)

  return (
    <section className="py-28 bg-sage-tint">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-20">
        <p className="text-xs font-bold uppercase tracking-wider text-green mb-2">Full Catalog</p>
        <h1 className="mb-8">Materials</h1>

        {categories.length > 1 && (
          <div className="flex gap-7 overflow-x-auto border-b border-black/10 pb-4 mb-14 [scrollbar-width:none]">
            {categories.map((cat) => (
              <a key={cat} href={`#${cat}`} className="text-sm text-gray-500 no-underline whitespace-nowrap pb-1.5 border-b-2 border-transparent hover:text-black">
                {CATEGORY_LABELS[cat] || cat}
              </a>
            ))}
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat} id={cat} className="mb-24 scroll-mt-[100px]">
            <h2 className="mb-8">{CATEGORY_LABELS[cat] || cat}</h2>
            <MaterialCarousel materials={grouped[cat]} />
          </div>
        ))}
      </div>
    </section>
  )
}
