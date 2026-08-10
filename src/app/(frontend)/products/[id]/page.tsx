import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import WeightCalculatorForm, { type CalcProduct } from '@/components/WeightCalculatorForm'
import RelatedMaterialsGrid from '@/components/RelatedMaterialsCarousel'
import ScrollReveal from '@/components/ScrollReveal'
import TypewriterEffect from '@/components/TypewriterReveal'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const payload = await getPayloadClient()
    const material: any = await payload.findByID({ collection: 'products', id, depth: 1 })
    if (!material) return { title: 'Product Not Found' }

    const categoryName = material.categoryRef?.label || material.category || ''
    const title = categoryName ? `${material.name} -- ${categoryName}` : material.name
    const description = `${material.name} available from Primegen Trading Corporation -- trusted steel and construction materials supplier based in Imus, Cavite, delivering nationwide across the Philippines. Request a quote today.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: material.photo?.url ? [{ url: material.photo.url }] : undefined,
      },
    }
  } catch {
    return { title: 'Product' }
  }
}

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

  const categoryLabel = material.categoryRef?.label || material.category || 'Products'
  const categoryId = typeof material.categoryRef === 'object' ? material.categoryRef?.id : material.categoryRef

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
    <section className="py-24 md:py-32 bg-[#05100d] min-h-screen selection:bg-[#149911]/30 selection:text-white relative overflow-hidden">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[#149911]/[0.08] blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-6 lg:px-12 xl:px-20 relative z-10">

        {/* Top Header Row - High End Editorial */}
        <ScrollReveal className="group/header border-b border-[#fdfffc]/10 pb-8 mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6 relative">
          <div className="absolute top-0 right-0 w-32 h-[2px] bg-[#149911] hidden md:block transition-all duration-700 ease-out group-hover/header:w-64" />

          <div>
            <div className="w-12 h-[4px] bg-[#149911] mb-6 transition-all duration-500 ease-out group-hover/header:w-24" />
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#fdfffc]/50 mb-3 min-h-[1.5em]">
              <TypewriterEffect text={categoryLabel} speed={30} delay={100} />
            </p>
            <h1 className="text-[40px] md:text-[56px] lg:text-[64px] font-medium tracking-tight text-[#fdfffc] leading-[0.95] uppercase min-h-[1.2em]">
              <TypewriterEffect text={`${material.name}.`} speed={40} delay={300} />
            </h1>
          </div>

          <div className="flex items-center gap-3 md:pb-2">
            <span className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#fdfffc] px-4 py-2 bg-[#fdfffc]/5 border border-[#fdfffc]/10 rounded-md backdrop-blur-md hover:bg-[#fdfffc]/10 transition-colors duration-500 cursor-default">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#149911] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#149911]" />
              </span>
              <TypewriterEffect text="Standard Pricing Applies" speed={25} delay={600} />
            </span>
          </div>
        </ScrollReveal>

        {/* Main 2-Column Grid */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-x-16 gap-y-16">

          {/* Left Column: Media Gallery */}
          <ScrollReveal className="flex flex-col h-full">
            <div className="p-8 md:p-16 w-full flex flex-col items-center relative overflow-hidden group h-full justify-center bg-[#0a1a15]/80 backdrop-blur-xl border border-[#fdfffc]/5 rounded-2xl hover:border-[#149911]/30 hover:shadow-[0_20px_60px_-15px_rgba(20,153,17,0.15)] transition-all duration-700 ease-out">

              <div className="relative w-full aspect-[4/3] mb-8 overflow-hidden rounded-xl">
                {images[0]?.url ? (
                  <>
                  <Image
                    src={images[0].url}
                    alt={images[0].alt || material.name}
                    fill
                    className="object-contain drop-shadow-sm transition-transform duration-[1200ms] ease-out group-hover:scale-110 z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a15]/10 via-transparent to-[#0a1a15]/40 z-20 pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#fdfffc]/20 text-[10px] uppercase tracking-widest font-bold">
                    <TypewriterEffect text="No Image Available" delay={800} />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 justify-center items-center mt-4 absolute bottom-8 z-30">
                  {images.map((img: any, i: number) => (
                    <div
                      key={i}
                      className={`relative h-[3px] transition-all duration-500 ease-out cursor-pointer rounded-full origin-center animate-in fade-in zoom-in-75 ${i === 0 ? 'w-10 bg-[#fdfffc]' : 'w-4 bg-[#fdfffc]/20 hover:bg-[#fdfffc]/50'}`}
                      style={{ animationDelay: `${900 + i * 80}ms`, animationFillMode: 'backwards' }}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Right Column: Content & Specs */}
          <ScrollReveal style={{ transitionDelay: '150ms' }} className="flex flex-col pt-2 lg:pr-4">

            <div className="flex flex-col mb-12">

              <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/40 mb-6 min-h-[1.5em]">
                <TypewriterEffect text="Material Specifications" speed={30} delay={600} />
              </h3>

              {material.description && (
                <div className="flex gap-6 py-6 border-t border-[#fdfffc]/10 group cursor-default">
                  <div className="w-8 flex-shrink-0 flex justify-center text-[#149911] mt-1 transition-transform duration-700 ease-out group-hover:scale-125 group-hover:-rotate-6">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                      <path d="M4 6h16M4 12h16M4 18h7"/>
                    </svg>
                  </div>
                  <p className="text-[15px] md:text-[16px] font-medium text-[#fdfffc]/80 leading-relaxed min-h-[3em]">
                    <TypewriterEffect text={material.description} speed={15} delay={800} />
                  </p>
                </div>
              )}

              <div className="flex gap-6 py-6 border-t border-[#fdfffc]/10 group cursor-default">
                <div className="w-8 flex-shrink-0 flex justify-center text-[#149911] mt-1 transition-transform duration-700 ease-out group-hover:scale-125 group-hover:rotate-6">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73V8z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] md:text-[16px] font-bold text-[#fdfffc] mb-2 uppercase tracking-wide transition-colors duration-500 group-hover:text-[#149911] min-h-[1.5em]">
                    <TypewriterEffect text={material.inStock ? 'In Stock / Ready' : 'Currently Unavailable'} speed={25} delay={1100} />
                  </p>
                  <p className="text-[13px] md:text-[14px] text-[#fdfffc]/60 font-medium min-h-[1.5em]">
                    <TypewriterEffect text="Delivery scheduled upon quote confirmation." speed={20} delay={1300} />
                  </p>
                </div>
              </div>
              <div className="border-t border-[#fdfffc]/10" />
            </div>

            {calcProduct && (
              <div className="mb-10 group">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/40 mb-4 transition-colors duration-500 group-hover:text-[#149911] min-h-[1.5em]">
                  <TypewriterEffect text="Weight Calculator" delay={1500} />
                </h3>
                <div className="bg-[#0a1a15]/80 backdrop-blur-xl border border-[#fdfffc]/5 rounded-xl p-8 transition-colors duration-700 group-hover:border-[#149911]/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#149911] transition-transform duration-700 origin-bottom scale-y-50 group-hover:scale-y-100" />
                  <WeightCalculatorForm products={[calcProduct]} />
                </div>
              </div>
            )}

            <a
              href={`/quote?product=${material.id}`}
              className="relative flex items-center justify-center w-full text-[#149911] py-5 mt-auto overflow-hidden group cursor-pointer border border-[#149911] rounded-lg"
            >
              <span className="absolute inset-0 bg-[#149911] transform scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />

              <span className="relative z-10 flex items-center gap-4 text-[13px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 text-[#149911] group-hover:text-[#fdfffc]">
                Request a Quote

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
        <ScrollReveal style={{ transitionDelay: '250ms' }} className="bg-[#0a1a15] text-[#fdfffc] mt-24 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 w-full relative overflow-hidden group border border-[#fdfffc]/10 rounded-2xl transition-all duration-700 ease-out hover:-translate-y-1.5 hover:border-[#149911]/50 hover:shadow-[0_20px_60px_-15px_rgba(20,153,17,0.2)]">

          <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#149911]/[0.15] rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 opacity-40 group-hover:opacity-100" />

          <div className="border border-[#149911]/40 p-5 bg-[#fdfffc]/5 backdrop-blur-sm shrink-0 rounded-lg transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#149911" strokeWidth="1.5" strokeLinecap="square">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="flex flex-col relative z-10">
            <h4 className="text-[20px] md:text-[24px] font-medium tracking-tight mb-3 text-[#fdfffc] min-h-[1.5em]">
              <TypewriterEffect text="Scale Your Project Supply Chain" speed={25} delay={300} />
            </h4>
            <p className="text-[14px] md:text-[15px] text-[#fdfffc]/60 font-medium max-w-2xl leading-relaxed min-h-[3em]">
              <TypewriterEffect text="Customize quantities, track precise dimensions, and adjust delivery schedules across your entire industrial pipeline with accuracy and speed." speed={15} delay={800} />
            </p>
          </div>
        </ScrollReveal>

        {/* Related Products */}
        {related.docs.length > 0 && (
          <ScrollReveal style={{ transitionDelay: '350ms' }} className="mt-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 group/related">
              <div>
                <div className="w-8 h-[3px] bg-[#149911] mb-4 transition-all duration-700 ease-out group-hover/related:w-16" />
                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight text-[#fdfffc] leading-none min-h-[1.2em]">
                  <TypewriterEffect text="Related Products." speed={40} delay={400} />
                </h2>
              </div>
              <a href="/products" className="group/link inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/80 hover:text-[#149911] transition-colors border-b border-transparent hover:border-[#149911] pb-1 min-h-[1.5em]">
                <TypewriterEffect text="View Catalog" speed={30} delay={800} />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" className="transition-transform duration-300 group-hover/link:translate-x-1">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
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