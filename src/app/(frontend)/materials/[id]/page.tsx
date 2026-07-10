import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import WeightCalculatorForm, { type CalcProduct } from '@/components/WeightCalculatorForm'
import RelatedMaterialsCarousel from '@/components/RelatedMaterialsCarousel'

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

const FALLBACK_CALC_PRODUCT: CalcProduct = {
  id: 'default',
  name: 'Round Bar',
  shape: 'round-bar',
  density: 7850,
  standardLength: 6,
}

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()

  let material: any
  try {
    material = await payload.findByID({ collection: 'materials', id, depth: 2 })
  } catch {
    notFound()
  }
  if (!material) notFound()

  const related = await payload.find({
    collection: 'materials',
    where: { and: [{ category: { equals: material.category } }, { id: { not_equals: material.id } }] },
    limit: 8,
  })

  const calcProduct: CalcProduct = material.weightCalcProduct
    ? {
        id: material.weightCalcProduct.id,
        name: material.weightCalcProduct.name,
        shape: material.weightCalcProduct.shape,
        density: material.weightCalcProduct.density,
        standardLength: material.weightCalcProduct.standardLength,
      }
    : FALLBACK_CALC_PRODUCT

  const images = [material.photo, material.hoverPhoto].filter((p: any) => p?.url)

  return (
    <section className="py-28">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-20">
        <div className="grid gap-14 [grid-template-columns:minmax(280px,1fr)_minmax(320px,1fr)] max-[800px]:grid-cols-1 mb-16">
          <div>
            <div className="relative w-full aspect-[4/5] bg-sage-tint rounded-2xl overflow-hidden">
              {images[0]?.url && <Image src={images[0].url} alt={images[0].alt || material.name} fill className="object-cover" />}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 mt-4">
                {images.map((img: any, i: number) => (
                  <div key={i} className={`relative w-16 h-16 rounded overflow-hidden cursor-pointer border-2 ${i === 0 ? 'border-green' : 'border-transparent'}`}>
                    <Image src={img.url} alt={img.alt || material.name} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3.5 items-start py-5 border-t border-b border-black/[0.08] my-6">
              <span className="flex-shrink-0 text-green mt-0.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="7" width="15" height="10" rx="1" />
                  <path d="M16 10h4l3 3v4h-7" />
                  <circle cx="5.5" cy="19.5" r="1.5" />
                  <circle cx="18.5" cy="19.5" r="1.5" />
                </svg>
              </span>
              <div>
                <p className="font-bold mb-1">{material.inStock ? 'In Stock' : 'Currently Unavailable'}</p>
                <p className="text-sm text-gray-500">Delivery scheduled once your quote is confirmed.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green mb-2">{CATEGORY_LABELS[material.category] || material.category}</p>
            <h1 className="mb-5 text-[clamp(28px,4vw,40px)]">{material.name}</h1>
            {material.description && <p className="text-base mb-7">{material.description}</p>}

            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-wider text-green mb-3">Calculate Weight</p>
              <WeightCalculatorForm products={[calcProduct]} />
            </div>

            <a href={`/quote?material=${material.id}`} className="inline-block w-full text-center px-8 py-3.5 rounded bg-green text-white font-bold hover:bg-green-hover">
              Request a Quote
            </a>
          </div>
        </div>

        {related.docs.length > 0 && (
          <div>
            <h2 className="mb-10 text-center">Related Materials</h2>
            <RelatedMaterialsCarousel materials={related.docs as any} />
          </div>
        )}
      </div>
    </section>
  )
}
