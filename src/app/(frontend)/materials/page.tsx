import Image from 'next/image'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import SearchBar from '@/components/SearchBar'
import ScrollReveal from '@/components/ScrollReveal'

export const dynamic = 'force-dynamic'

const STAGGER_STEP = 60 // ms between each card's reveal
const STAGGER_CAP = 480 // ms max delay, so long lists don't take forever to fully reveal

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MaterialsPage({ searchParams }: Props) {
  const payload = await getPayloadClient()

  const resolvedParams = await searchParams
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : ''

  const [categoriesRes, materialsRes] = await Promise.all([
    payload.find({ collection: 'categories', sort: 'order', limit: 100, depth: 2 }),
    payload.find({
      collection: 'materials',
      limit: 200,
      depth: 2,
      ...(q ? { where: { name: { contains: q } } } : {}),
    }),
  ])

  const categoryDocs = categoriesRes.docs as any[]

  const grouped: Record<string, any[]> = {}
  for (const m of materialsRes.docs as any[]) {
    const slug = m.categoryRef?.slug || m.category || 'other'
    grouped[slug] = grouped[slug] || []
    grouped[slug].push(m)
  }

  const orderedSlugs = [
    ...categoryDocs.map((c) => c.slug).filter((slug) => grouped[slug]),
    ...Object.keys(grouped).filter((slug) => !categoryDocs.some((c) => c.slug === slug)),
  ]

  const categoryBySlug: Record<string, any> = {}
  for (const c of categoryDocs) categoryBySlug[c.slug] = c

  return (
    <section className="py-16 md:py-28 bg-[#fdfffc] min-h-screen">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-12 xl:px-20">

        {/* Top Header with Functional Search Bar */}
        <ScrollReveal className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#01172f]/10 pb-10">
          <div>
            <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#103900] mb-4">
              Full Catalog
            </p>
            <h1 className="text-[40px] md:text-[56px] font-medium tracking-tight text-[#01172f] leading-none">
              Materials
            </h1>
          </div>

          <SearchBar initialQuery={q} />
        </ScrollReveal>

        {/* Empty State / No Results */}
        {orderedSlugs.length === 0 && (
          <ScrollReveal className="py-24 flex flex-col items-center justify-center text-center">
            <p className="text-[17px] font-medium text-[#01172f] mb-2">No materials found</p>
            <p className="text-[14px] text-gray-500">We couldn&apos;t find anything matching &quot;{q}&quot;.</p>
          </ScrollReveal>
        )}

        {/* Categories Grid (Top Section) -- each card staggers in individually */}
        {orderedSlugs.length > 0 && !q && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-8 md:gap-y-14 mb-24 lg:mb-36">
            {orderedSlugs.map((slug, index) => {
              const cat = categoryBySlug[slug]
              const label = cat?.label || slug
              const cardImage = cat?.image?.url || grouped[slug][0]?.photo?.url || null
              const delay = Math.min(index * STAGGER_STEP, STAGGER_CAP)

              return (
                <ScrollReveal
                  key={`nav-${slug}`}
                  as="a"
                  href={`#${slug}`}
                  style={{ transitionDelay: `${delay}ms` }}
                  className="group flex flex-col outline-none cursor-pointer"
                >
                  <div className="relative w-full aspect-[4/5] bg-[#f8f9f7] overflow-hidden">
                    {cardImage ? (
                      <Image
                        src={cardImage}
                        alt={label}
                        fill
                        className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                        No Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/[0.03]" />
                  </div>

                  <div className="flex flex-col mt-4 md:mt-5">
                    <h3 className="text-[15px] md:text-[17px] font-medium tracking-tight text-[#01172f] capitalize truncate transition-colors duration-300">
                      {label}
                    </h3>

                    <span className="mt-1.5 md:mt-2 flex items-center gap-2 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em] text-[#01172f]/40 group-hover:text-[#103900] transition-colors duration-300">
                      More
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </span>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        )}

        {/* All Products Listed by Category */}
        <div className="flex flex-col gap-24 md:gap-36">
          {orderedSlugs.map((slug) => {
            const cat = categoryBySlug[slug]
            const label = cat?.label || slug

            return (
              <ScrollReveal key={slug} as="div" id={slug} className="scroll-mt-[120px]">

                <div className="border-b border-[#01172f]/10 pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[24px] md:text-[28px] font-medium tracking-tight text-[#01172f]">
                      {label}
                    </h2>
                    {cat?.description && (
                      <p className="mt-3 max-w-[560px] text-[13px] md:text-[14px] leading-relaxed text-[#01172f]/60">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-14">
                  {grouped[slug].map((material, index) => {
                    const imgUrl = material.photo?.url || null
                    const delay = Math.min(index * STAGGER_STEP, STAGGER_CAP)

                    return (
                      <ScrollReveal
                        key={material.id}
                        as={Link}
                        href={`/materials/${material.id}`}
                        style={{ transitionDelay: `${delay}ms` }}
                        className="group flex flex-col cursor-pointer outline-none"
                      >
                        <div className="relative w-full aspect-[4/3] bg-[#f8f9f7] overflow-hidden">
                          {imgUrl ? (
                            <Image
                              src={imgUrl}
                              alt={material.name}
                              fill
                              className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                              No Image
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/[0.03]" />
                        </div>

                        <div className="flex flex-col mt-4 md:mt-5">
                          <h3 className="text-[14px] md:text-[15px] font-medium tracking-tight text-[#01172f] leading-snug mb-2 transition-colors duration-300 group-hover:text-[#103900]">
                            {material.name}
                          </h3>

                          <div className="flex justify-between items-center pr-2">
                            <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.15em] text-[#01172f]/50 flex items-center gap-1.5">
                              {material.inStock !== false ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#103900]/70 inline-block"></span>
                                  Available
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-800/60 inline-block"></span>
                                  Out of Stock
                                </>
                              )}
                            </p>

                            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#01172f]/40 translate-x-0 opacity-100 md:opacity-0 md:-translate-x-2 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#103900]">
                              View
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </ScrollReveal>
                    )
                  })}
                </div>
              </ScrollReveal>
            )
          })}
        </div>

      </div>
    </section>
  )
}
