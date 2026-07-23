import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import WeightCalculatorForm, { type CalcProduct } from '@/components/WeightCalculatorForm'
import RelatedMaterialsGrid from '@/components/RelatedMaterialsCarousel'
import ScrollReveal from '@/components/ScrollReveal'

export const revalidate = 60

const APPLICABLE_PRODUCTS: CalcProduct[] = [
  { id: 'deformed-bar', name: 'Deformed Bar', shape: 'round-bar', density: 7850, standardLength: 6 },
  { id: 'angle-bar', name: 'Angle Bar', shape: 'angle-bar', density: 7850, standardLength: 6 },
  { id: 'channel-bar', name: 'Channel Bar', shape: 'c-channel', density: 7850, standardLength: 6 },
  { id: 'square-bar', name: 'Square Bar', shape: 'square-bar', density: 7850, standardLength: 6 },
  { id: 'plain-round-bar', name: 'Plain Round Bar', shape: 'round-bar', density: 7850, standardLength: 6 },
  { id: 'rectangular-bar', name: 'Rectangular Bar', shape: 'flat-bar', density: 7930, standardLength: 6 },
  { id: 'flat-bar', name: 'Flat Bar', shape: 'flat-bar', density: 7850, standardLength: 6 },
  { id: 'tubular', name: 'Tubular Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'square-tube', name: 'Square Tube', shape: 'square-tube', density: 7850, standardLength: 6 },
  { id: 'c-purlins', name: 'C-Purlins', shape: 'c-channel', density: 7850, standardLength: 6 },
  { id: 'i-beam', name: 'I Beam', shape: 'i-beam', density: 7850, standardLength: 6 },
  { id: 'h-beam', name: 'H Beam', shape: 'i-beam', density: 7850, standardLength: 6 },
  { id: 'bi-pipe', name: 'B.I. Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'gi-pipe', name: 'G.I. Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'copper-pipe', name: 'Copper Pipe', shape: 'round-pipe', density: 8960, standardLength: 6 },
  { id: 'stainless-pipe', name: 'Stainless Pipe', shape: 'round-pipe', density: 7930, standardLength: 6 },
  { id: 'base-plate', name: 'Base Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'mild-steel-plate', name: 'Mild Steel Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'chequered-plate', name: 'Chequered Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'gi-sheet', name: 'G.I. Sheet', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'copper-sheet', name: 'Copper Sheet', shape: 'sheet-plate', density: 8960, standardLength: 1 },
  { id: 'stainless-sheet', name: 'Stainless Sheet', shape: 'sheet-plate', density: 7930, standardLength: 1 },
]

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()

  let material: any
  try {
    material = await payload.findByID({ collection: 'products', id, depth: 2 })
  } catch {
    notFound()
  }
  if (!material) notFound()

  // Real category label from the Categories collection, not the stale hardcoded slug map
  const categoryLabel = material.categoryRef?.label || material.category || 'Products'
  const categoryId = typeof material.categoryRef === 'object' ? material.categoryRef?.id : material.categoryRef

  // Related products: match on the new categoryRef relationship when present,
  // falling back to the legacy category string for products not yet migrated
  const related = await payload.find({
    collection: 'products',
    where: {
      and: [
        categoryId
          ? { categoryRef: { equals: categoryId } }
          : { category: { equals: material.category } },
        { id: { not_equals: material.id } },
      ],
    },
    limit: 8,
  })

  const materialNameLower = material.name?.toLowerCase() || ''
  const calcProduct: CalcProduct | null = APPLICABLE_PRODUCTS.find(
    (p) => materialNameLower === p.name.toLowerCase() || materialNameLower.includes(p.name.toLowerCase())
  ) || null

  const images = [material.photo, material.hoverPhoto].filter((p: any) => p?.url)

  return (
    <section className="py-16 md:py-28 bg-[#fdfffc] min-h-screen selection:bg-[#149911] selection:text-white">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-12 xl:px-20">

        {/* Top Header Row - High End Editorial */}
        <ScrollReveal className="border-b-2 border-[#01172f] pb-8 mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6 relative">
          <div className="absolute top-0 right-0 w-32 h-[2px] bg-[#149911] hidden md:block" />

          <div>
            <div className="w-12 h-[4px] bg-[#149911] mb-6" />
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#01172f]/50 mb-3">
              {categoryLabel}
            </p>
            <h1 className="text-[44px] md:text-[64px] font-black tracking-tighter text-[#01172f] leading-[0.95] uppercase">
              {material.name}.
            </h1>
          </div>

          <div className="flex items-center gap-3 md:pb-2">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#01172f] px-4 py-2 bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#149911] animate-pulse"></span>
              Standard Pricing Applies
            </span>
          </div>
        </ScrollReveal>

        {/* Main 2-Column Grid */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-x-16 gap-y-16">

          {/* Left Column: Media Gallery */}
          <ScrollReveal className="flex flex-col h-full">
            <div className="p-8 md:p-16 w-full flex flex-col items-center relative overflow-hidden group shadow-[0_20px_60px_-15px_rgba(1,23,47,0.05)] h-full justify-center">

              {/* Primary Image */}
              <div className="relative w-full aspect-[4/3] mb-8">
                {images[0]?.url ? (
                  <>
                  <Image
                    src={images[0].url}
                    alt={images[0].alt || material.name}
                    fill
                    className="object-cover drop-shadow-sm transition-transform duration-700 hover:scale-105"
                  />
                  {/* Visual Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/75 z-0 pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200/50 rounded-2xl flex items-center justify-center text-gray-400 font-medium">
                    No Image Available
                  </div>
                )}
              </div>
              {/* Industrial Thumbnail Indicators (Lines instead of dots) */}
              {images.length > 1 && (
                <div className="flex gap-2 justify-center items-center mt-4 absolute bottom-8 z-20">
                  {images.map((img: any, i: number) => (
                    <div
                      key={i}
                      className={`relative h-[3px] transition-all duration-500 cursor-pointer ${i === 0 ? 'w-10 bg-[#01172f]' : 'w-4 bg-[#01172f]/20 hover:bg-[#01172f]/50'}`}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Right Column: Content & Specs */}
          <ScrollReveal style={{ transitionDelay: '120ms' }} className="flex flex-col pt-2 lg:pr-4">

            {/* Spec / Feature List */}
            <div className="flex flex-col mb-12">

              <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-6">Material Specifications</h3>

              {/* Description Feature */}
              {material.description && (
                <div className="flex gap-6 py-6 border-t border-[#01172f]/10 group">
                  <div className="w-8 flex-shrink-0 flex justify-center text-[#149911] mt-1 transition-transform duration-500 group-hover:scale-110">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                      <path d="M4 6h16M4 12h16M4 18h7"/>
                    </svg>
                  </div>
                  <p className="text-[16px] font-medium text-[#01172f]/80 leading-relaxed">
                    {material.description}
                  </p>
                </div>
              )}

              {/* Stock & Delivery Status */}
              <div className="flex gap-6 py-6 border-t border-[#01172f]/10 group">
                <div className="w-8 flex-shrink-0 flex justify-center text-[#149911] mt-1 transition-transform duration-500 group-hover:scale-110">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73V8z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[#01172f] mb-2 uppercase tracking-wide">
                    {material.inStock ? 'In Stock / Ready' : 'Currently Unavailable'}
                  </p>
                  <p className="text-[14px] text-[#01172f]/60 font-medium">
                    Delivery scheduled upon quote confirmation.
                  </p>
                </div>
              </div>
              <div className="border-t border-[#01172f]/10" />
            </div>

            {/* Conditionally Rendered Weight Calculator Box */}
            {calcProduct && (
              <div className="mb-10">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-4">
                  Weight Calculator
                </h3>
                <div className="bg-white border border-[#01172f]/10 p-8 shadow-[0_10px_40px_-10px_rgba(1,23,47,0.05)] transition-colors hover:border-[#149911]/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#149911]" />
                  <WeightCalculatorForm products={[calcProduct]} />
                </div>
              </div>
            )}

            {/* Extraordinary Animated CTA Button */}
            <a
              href={`/quote?material=${material.id}`}
              className="relative flex items-center justify-center w-full text-[#3D5F3B] py-5 mt-auto overflow-hidden group cursor-pointer border border-[#01172f]"
            >
              {/* Liquid Hover Fill */}
              <span className="absolute inset-0 bg-[#149911] transform scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />

              <span className="relative z-10 flex items-center gap-4 text-[13px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 text-[#3D5F3B] hover:text-[#fdfffc]">
                Request a Quote

                {/* Animated Arrow */}
                <span className="relative flex items-center justify-center w-5 h-5 overflow-hidden">
                  <span className="absolute flex transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:translate-x-6">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="absolute flex -translate-x-6 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:translate-x-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </span>
              </span>
            </a>

          </ScrollReveal>
        </div>

        {/* Bottom Callout Banner - Monolithic Block */}
        <ScrollReveal className="bg-[#fdfffc] text-[#fdfffc] mt-24 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 w-full relative overflow-hidden group border border-[#3D5F3B] hover:border-[#149911]/50 transition-colors duration-500">

          {/* Decorative Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#149911]/20 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />

          <div className="border border-[#149911]/40 p-5 bg-[#fdfffc]/5 backdrop-blur-sm shrink-0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#149911" strokeWidth="1.5" strokeLinecap="square">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="flex flex-col relative z-10">
            <h4 className="text-[20px] md:text-[24px] font-black uppercase tracking-tight mb-3">
              Scale Your Project Supply Chain
            </h4>
            <p className="text-[15px] md:text-[16px] text-[#01172f] font-medium max-w-2xl leading-relaxed">
              Customize quantities, track precise dimensions, and adjust delivery schedules across your entire industrial pipeline with accuracy and speed.
            </p>
          </div>
        </ScrollReveal>

        {/* Related Products */}
        {related.docs.length > 0 && (
          <ScrollReveal className="mt-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="w-8 h-[3px] bg-[#149911] mb-4" />
                <h2 className="text-[32px] md:text-[40px] font-black tracking-tighter text-[#01172f] uppercase leading-none">
                  Related Products.
                </h2>
              </div>
              <a href="/products" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#01172f] hover:text-[#149911] transition-colors border-b border-transparent hover:border-[#149911] pb-1">
                View Catalog
              </a>
            </div>

            <div className="w-full">
              <RelatedMaterialsGrid products={related.docs as any} />
            </div>
          </ScrollReveal>
        )}

      </div>
    </section>
  )
}
