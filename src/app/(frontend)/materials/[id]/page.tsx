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
    <section className="py-12 md:py-20 bg-white min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        
        {/* Top Header Row (Apple "Buy" page style) */}
        <div className="border-b border-gray-300/70 pb-6 mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-[40px] md:text-[48px] font-semibold tracking-tight text-gray-900 leading-none">
              Buy {material.name}
            </h1>
            <p className="text-[15px] text-gray-500 mt-3 font-medium">
              {CATEGORY_LABELS[material.category] || material.category}
            </p>
          </div>
          <div className="text-[15px] font-medium text-gray-900 pb-1">
            Standard pricing applies
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-x-16 gap-y-12">
          
          {/* Left Column: Media Gallery */}
          <div className="flex flex-col">
            <div className="bg-[#f5f5f7] rounded-[24px] p-8 md:p-14 w-full flex flex-col items-center relative overflow-hidden">
              
              {/* Primary Image */}
              <div className="relative w-full max-w-[440px] aspect-[4/3] mb-8">
                {images[0]?.url ? (
                  <Image 
                    src={images[0].url} 
                    alt={images[0].alt || material.name} 
                    fill 
                    className="object-contain drop-shadow-sm transition-transform duration-700 hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200/50 rounded-2xl flex items-center justify-center text-gray-400 font-medium">
                    No Image Available
                  </div>
                )}
              </div>

              {/* Apple-style thumbnail pill/dots */}
              {images.length > 1 && (
                <div className="flex gap-3 justify-center items-center mt-4">
                  {images.map((img: any, i: number) => (
                    <div 
                      key={i} 
                      className={`relative w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${i === 0 ? 'bg-gray-800 scale-110' : 'bg-gray-300 hover:bg-gray-400'}`}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Content & Specs */}
          <div className="flex flex-col pt-2 lg:pr-4">
            
            {/* Spec / Feature List */}
            <div className="flex flex-col border-t border-gray-300/70 mb-10">
              
              {/* Description Feature */}
              {material.description && (
                <div className="flex gap-5 py-6 border-b border-gray-300/70">
                  <div className="w-7 flex-shrink-0 flex justify-center text-gray-800 mt-0.5">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[15px] font-medium text-gray-900 leading-snug">
                    {material.description}
                  </p>
                </div>
              )}

              {/* Stock & Delivery Status */}
              <div className="flex gap-5 py-6 border-b border-gray-300/70">
                <div className="w-7 flex-shrink-0 flex justify-center text-gray-800 mt-0.5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 mb-1">
                    {material.inStock ? 'In Stock and Ready' : 'Currently Unavailable'}
                  </p>
                  <p className="text-[14px] text-gray-500 font-medium">
                    Delivery scheduled once your quote is confirmed.
                  </p>
                </div>
              </div>
            </div>

            {/* Weight Calculator Box */}
            <div className="mb-10">
              <h3 className="text-[17px] font-semibold text-gray-900 mb-3">
                Calculate Requirements. 
              </h3>
              <div className="bg-white border border-gray-300/80 rounded-[18px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all hover:border-gray-400/60">
                <WeightCalculatorForm products={[calcProduct]} />
              </div>
            </div>

            {/* Apple Primary CTA Button */}
            <a 
              href={`/quote?material=${material.id}`} 
              className="bg-[#01172f] hover:bg-[#143109] text-white text-center w-full py-4 rounded-[14px] text-[17px] font-semibold transition-colors shadow-sm"
            >
              Request a Quote
            </a>
            
          </div>
        </div>

        {/* Bottom Callout Banner */}
        <div className="bg-[#f5f5f7] rounded-[24px] px-8 py-8 mt-16 flex flex-col md:flex-row items-start md:items-center gap-5 w-full">
          <div className="text-[#0071e3] bg-white p-3 rounded-full shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#143109" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="flex flex-col">
            <h4 className="text-[15px] font-semibold text-gray-900">Create the order you always wanted</h4>
            <p className="text-[14px] text-gray-500 mt-1 font-medium">Customize quantities, track dimensions, and adjust delivery schedules across your entire project supply chain.</p>
          </div>
        </div>

        {/* Related Materials */}
        {related.docs.length > 0 && (
          <div className="mt-24 border-t border-gray-200/60 pt-16">
            <h2 className="text-[28px] font-semibold tracking-tight text-gray-900 mb-8 text-center">
              Related Materials
            </h2>
            <div className="w-full">
              <RelatedMaterialsCarousel materials={related.docs as any} />
            </div>
          </div>
        )}
        
      </div>
    </section>
  )
}