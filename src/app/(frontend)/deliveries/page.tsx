import { getPayloadClient } from '@/lib/getPayloadClient'
import ScrollReveal from '@/components/ScrollReveal'
import Image from 'next/image'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}): Promise<Metadata> {
  const { location } = await searchParams

  if (location) {
    return {
      title: `Deliveries in ${location} | Primegen`,
      description: `Real steel and construction material deliveries completed by Primegen Trading Corporation in ${location}. See photos and proof of every delivery.`,
    }
  }

  return {
    title: 'Deliveries | Primegen',
    description: 'Recent deliveries completed by Primegen Trading Corporation across the Philippines.',
  }
}

const STAGGER_STEP = 60
const STAGGER_CAP = 480

function PhotoGrid({ photos, altBase }: { photos: any[]; altBase: string }) {
  const count = photos.length
  if (count === 0) return null

  const altFor = (i: number) => photos[i]?.alt || altBase

  if (count === 1) {
    return (
      <div className="relative w-full aspect-[4/3] bg-[#05100d] rounded-xl overflow-hidden">
        <Image src={photos[0].url} alt={altFor(0)} fill className="object-cover" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 aspect-[16/9] rounded-xl overflow-hidden">
        {photos.map((p, i) => (
          <div key={i} className="relative bg-[#05100d]">
            <Image src={p.url} alt={altFor(i)} fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-[4/3] rounded-xl overflow-hidden">
        <div className="relative row-span-2 bg-[#05100d]">
          <Image src={photos[0].url} alt={altFor(0)} fill className="object-cover" />
        </div>
        <div className="relative bg-[#05100d]">
          <Image src={photos[1].url} alt={altFor(1)} fill className="object-cover" />
        </div>
        <div className="relative bg-[#05100d]">
          <Image src={photos[2].url} alt={altFor(2)} fill className="object-cover" />
        </div>
      </div>
    )
  }

  // 4 or more -- 2x2 grid, "+N" overlay on the last visible tile
  const visible = photos.slice(0, 4)
  const remaining = count - 4

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square rounded-xl overflow-hidden">
      {visible.map((p, i) => (
        <div key={i} className="relative bg-[#05100d]">
          <Image src={p.url} alt={altFor(i)} fill className="object-cover" />
          {i === 3 && remaining > 0 && (
            <div className="absolute inset-0 bg-[#05100d]/70 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[#fdfffc] text-xl md:text-2xl font-bold">+{remaining}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  const { location } = await searchParams
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'deliveries',
    where: { visible: { equals: true } },
    sort: '-deliveryDate',
    limit: 100,
    depth: 2,
  })

  // Unique locations actually present in your data, for the filter pills
  const locations = Array.from(
    new Set(docs.map((d: any) => d.location).filter(Boolean))
  ).sort() as string[]

  const filteredDocs = location ? docs.filter((d: any) => d.location === location) : docs

  // ImageObject structured data for what's currently shown -- ties each real delivery
  // photo to its real location, reinforcing genuine nationwide delivery evidence for Google Images.
  const imageObjectsJsonLd = filteredDocs.flatMap((d: any) => {
    const photos = Array.isArray(d.photos) ? d.photos.filter((p: any) => p?.url) : []
    return photos.map((p: any) => ({
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      contentUrl: p.url,
      name: d.title,
      description: d.location ? `${d.title} -- delivered in ${d.location}` : d.title,
      ...(d.location ? { contentLocation: { '@type': 'Place', name: d.location } } : {}),
      datePublished: d.deliveryDate,
    }))
  })

  function buildHref(loc?: string) {
    return loc ? `/deliveries?location=${encodeURIComponent(loc)}` : '/deliveries'
  }

  return (
   <section className="min-h-screen bg-[#05100d] pt-24 md:pt-32 pb-16 md:pb-24 font-sans selection:bg-[#149911]/30 relative overflow-x-hidden">
      {/* Subtle Background Glow -- matches ProductsCatalog */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#149911]/10 blur-[120px] rounded-full pointer-events-none" />

      {imageObjectsJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObjectsJsonLd) }}
        />
      )}

      <div className="max-w-[720px] mx-auto px-4 sm:px-6 relative z-10">

        <ScrollReveal direction="none" className="mb-10 md:mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-3">
            Proof of Work
          </p>
          <h1 className="text-[32px] sm:text-[40px] md:text-[48px] font-medium text-[#fdfffc] tracking-tight leading-none mb-3">
            Deliveries
          </h1>
          <p className="text-[14px] md:text-[16px] text-[#fdfffc]/60 max-w-[560px]">
            Real deliveries, real sites, nationwide -- a running record of materials we've gotten out the door.
          </p>
        </ScrollReveal>

        {locations.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <a
              href={buildHref(undefined)}
              className={`text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full border transition-all duration-200 ${
                !location
                  ? 'bg-[#149911] border-[#149911] text-[#fdfffc]'
                  : 'bg-[#0a1a15]/80 border-[#fdfffc]/10 text-[#fdfffc]/60 hover:border-[#fdfffc]/30 hover:text-[#fdfffc]'
              }`}
            >
              All Locations
            </a>
            {locations.map((loc) => (
              <a
                key={loc}
                href={buildHref(loc)}
                className={`text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full border transition-all duration-200 ${
                  location === loc
                    ? 'bg-[#149911] border-[#149911] text-[#fdfffc]'
                    : 'bg-[#0a1a15]/80 border-[#fdfffc]/10 text-[#fdfffc]/60 hover:border-[#fdfffc]/30 hover:text-[#fdfffc]'
                }`}
              >
                {loc}
              </a>
            ))}
          </div>
        )}

        {filteredDocs.length === 0 ? (
          <div className="border border-dashed border-[#fdfffc]/10 rounded-2xl py-24 text-center bg-[#0a1a15]/50">
            <p className="text-[14px] text-[#fdfffc]/40 font-medium">
              {location
                ? `No deliveries found for "${location}".`
                : 'No deliveries added yet -- add one in the admin panel under Deliveries.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:gap-5">
            {filteredDocs.map((d: any, index: number) => {
              const photos = Array.isArray(d.photos) ? d.photos.filter((p: any) => p?.url) : []
              const delay = Math.min(index * STAGGER_STEP, STAGGER_CAP)
              const date = new Date(d.deliveryDate).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
              const altBase = d.location ? `${d.title} -- delivered in ${d.location}` : d.title

              return (
                <ScrollReveal
                  key={d.id}
                  direction="none"
                  style={{ transitionDelay: `${delay}ms` }}
                  className="group bg-[#0a1a15] hover:bg-[#0c201a] border border-[#fdfffc]/5 hover:border-[#fdfffc]/10 rounded-2xl overflow-hidden transition-all duration-300 p-4 md:p-5"
                >
                  {/* Meta tags -- date + location, styled like product card badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-[#fdfffc]/5 border border-[#fdfffc]/10 text-[#fdfffc]/60 px-2 py-1 rounded-[4px] text-[9px] font-bold uppercase tracking-widest">
                      {date}
                    </span>
                    {d.location && (
                      <span className="bg-[#149911]/10 border border-[#149911]/20 text-[#2dd4bf] px-2 py-1 rounded-[4px] text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {d.location}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[16px] md:text-[18px] font-medium text-[#fdfffc] leading-snug mb-4">
                    {d.title}
                  </h3>

                  <PhotoGrid photos={photos} altBase={altBase} />

                  {/* Footer CTA -- genuine link only, no fabricated engagement numbers */}
                  {d.permalinkUrl && (
                    <div className="pt-4 mt-1">
                      <a
                        href={d.permalinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-medium text-[#2dd4bf] hover:text-[#5eead4] transition-colors"
                      >
                        View original post
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                          <path d="M7 17L17 7M17 7H8M17 7V16" />
                        </svg>
                      </a>
                    </div>
                  )}
                </ScrollReveal>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}