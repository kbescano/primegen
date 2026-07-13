import Image from 'next/image'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import SearchBar from '@/components/SearchBar' // Adjust path if needed

export const revalidate = 60

const CATEGORIES: Record<string, { label: string; description: string }> = {
  'bolts-fasteners': {
    label: 'Bolts & Fasteners',
    description: 'High-quality bolts, nuts, screws, washers, anchors, and fastening solutions for construction, industrial, and DIY applications.',
  },
  'steel-plates': {
    label: 'Steel Plates',
    description: 'Durable steel plates available in various grades, thicknesses, and sizes for fabrication, structural, and industrial projects.',
  },
  'sheet-pile': {
    label: 'Sheet Pile',
    description: 'Heavy-duty sheet piles designed for retaining walls, excavation support, flood protection, and foundation construction.',
  },
  'steel-bars': {
    label: 'Steel Bars & Tubing',
    description: 'Round bars, square bars, flat bars, pipes, tubes, and structural tubing for manufacturing, fabrication, and construction.',
  },
  beams: {
    label: 'Beams',
    description: 'Structural steel beams including I-beams, H-beams, and wide flange beams for residential, commercial, and industrial buildings.',
  },
  'black-iron': {
    label: 'Black Iron',
    description: 'Black iron pipes, fittings, and steel products ideal for gas lines, structural frameworks, and industrial applications.',
  },
  'galvanized-iron': {
    label: 'Galvanized Iron',
    description: 'Corrosion-resistant galvanized iron sheets, pipes, and structural materials built for long-lasting outdoor and industrial use.',
  },
  copper: {
    label: 'Copper',
    description: 'Premium copper pipes, fittings, wires, and accessories for plumbing, electrical, and industrial installations.',
  },
  stainless: {
    label: 'Stainless',
    description: 'High-grade stainless steel sheets, pipes, bars, fittings, and hardware offering exceptional corrosion resistance and durability.',
  },
  'pipe-fittings': {
    label: 'Pipe Fittings',
    description: 'Comprehensive range of elbows, tees, couplings, flanges, valves, and connectors for plumbing and industrial piping systems.',
  },
  'fence-wire': {
    label: 'Fence & Wire',
    description: 'Wire mesh, chain link, barbed wire, welded wire, and fencing materials for residential, commercial, and agricultural use.',
  },
  ppe: {
    label: 'PPE',
    description: 'Personal protective equipment including helmets, gloves, safety shoes, eyewear, and protective clothing for workplace safety.',
  },
  'electrical-cabling': {
    label: 'Electrical & Cabling',
    description: 'Electrical wires, power cables, conduits, connectors, switches, and installation accessories for residential and industrial projects.',
  },
}

// searchParams is a Promise in Next.js 15
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MaterialsPage({ searchParams }: Props) {
  const payload = await getPayloadClient()

  const resolvedParams = await searchParams
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : ''

  const query: any = {
    collection: 'materials',
    limit: 200,
    sort: 'category',
  }

  if (q) {
    query.where = {
      name: {
        contains: q,
      },
    }
  }

  const { docs } = await payload.find(query)

  // Group products by category
  const grouped: Record<string, any[]> = {}
  for (const m of docs) {
    const cat = m.category || 'other'
    grouped[cat] = grouped[cat] || []
    grouped[cat].push(m)
  }
  const categories = Object.keys(grouped)

  return (
    <section className="py-16 md:py-24 bg-[#fdfffc] min-h-screen">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-20">

        {/* Top Header with Functional Search Bar */}
        <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#01172f]/10 pb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#103900] mb-3">
              Full Catalog
            </p>
            <h1 className="text-[40px] md:text-[52px] font-bold tracking-[-0.02em] text-[#01172f] leading-none">
              Materials
            </h1>
          </div>

          <SearchBar />
        </div>

        {/* Empty State / No Results */}
        {categories.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <p className="text-[17px] font-semibold text-[#01172f] mb-2">No materials found</p>
            <p className="text-[14px] text-gray-500">We couldn&apos;t find anything matching &quot;{q}&quot;.</p>
          </div>
        )}

        {/* Categories Grid (Top Section) - only shows when NOT searching */}
        {categories.length > 0 && !q && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 mb-24 lg:mb-32">
            {categories.map((cat) => {
              const firstProductImage = grouped[cat][0]?.photo?.url || null

              return (
                <a
                  key={`nav-${cat}`}
                  href={`#${cat}`}
                  className="group flex flex-col outline-none"
                >
                  <div className="relative w-full aspect-[4/5] bg-[#f4f6f2] rounded-lg overflow-hidden mb-4 ring-1 ring-inset ring-[#01172f]/5 transition-shadow duration-300 group-hover:ring-[#01172f]/15">
                    {firstProductImage ? (
                      <Image
                        src={firstProductImage}
                        alt={CATEGORIES[cat]?.label || cat}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[12px] font-medium uppercase tracking-wider">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-[15px] md:text-[17px] font-semibold tracking-tight text-[#01172f] capitalize truncate">
                      {CATEGORIES[cat]?.label || cat}
                    </h3>

                    <div className="flex justify-between items-center border-t border-[#01172f]/10 pt-2.5">
                      <span className="text-[12px] md:text-[13px] text-gray-500">
                        View Details
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#103900]">
                        More
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* All Products Listed by Category (Bottom Section) */}
        <div className="flex flex-col gap-24 md:gap-32">
          {categories.map((cat) => (
            <div key={cat} id={cat} className="scroll-mt-[120px]">

              <div className="border-b border-[#01172f]/10 pb-5 mb-10">
                <h2 className="text-[22px] md:text-[26px] font-bold tracking-tight text-[#01172f]">
                  {CATEGORIES[cat]?.label || cat}
                </h2>
                {CATEGORIES[cat]?.description && (
                  <p className="mt-2 max-w-[560px] text-[13px] md:text-[14px] leading-relaxed text-gray-500">
                    {CATEGORIES[cat]?.description}
                  </p>
                )}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
                {grouped[cat].map((material) => {
                  const imgUrl = material.photo?.url || null

                  return (
                    <Link
                      key={material.id}
                      href={`/materials/${material.id}`}
                      className="group flex flex-col cursor-pointer outline-none"
                    >
                      <div className="relative w-full aspect-[4/3] bg-[#f4f6f2] rounded-lg overflow-hidden mb-4 ring-1 ring-inset ring-[#01172f]/5 transition-shadow duration-300 group-hover:ring-[#01172f]/15">
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={material.name}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[12px] font-medium uppercase tracking-wider">
                            No Image Available
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-start gap-3">
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-[14px] md:text-[15px] font-semibold tracking-tight text-[#01172f] leading-snug mb-1.5 transition-colors duration-200 group-hover:text-[#103900]">
                            {material.name}
                          </h3>
                          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500 flex items-center gap-1.5">
                            {material.inStock !== false ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#149911] inline-block"></span>
                                Available
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                                Out of Stock
                              </>
                            )}
                          </p>
                        </div>

                        <span className="hidden md:flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#103900] opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                          View Details
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}