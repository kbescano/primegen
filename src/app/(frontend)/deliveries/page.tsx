import { getPayloadClient } from '@/lib/getPayloadClient'
import SectionHeader from '@/components/SectionHeader'
import ScrollReveal from '@/components/ScrollReveal'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Deliveries',
  description: 'Recent deliveries completed by Primegen Trading Corporation across the Philippines.',
}

const STAGGER_STEP = 60
const STAGGER_CAP = 480

function PhotoGrid({ photos, altBase }: { photos: any[]; altBase: string }) {
  const count = photos.length
  if (count === 0) return null

  const altFor = (i: number) => photos[i]?.alt || altBase

  if (count === 1) {
    return (
      <div className="relative w-full aspect-[4/3] bg-[#f0f0f0]">
        <Image src={photos[0].url} alt={altFor(0)} fill className="object-cover" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-[16/9]">
        {photos.map((p, i) => (
          <div key={i} className="relative bg-[#f0f0f0]">
            <Image src={p.url} alt={altFor(i)} fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[4/3]">
        <div className="relative row-span-2 bg-[#f0f0f0]">
          <Image src={photos[0].url} alt={altFor(0)} fill className="object-cover" />
        </div>
        <div className="relative bg-[#f0f0f0]">
          <Image src={photos[1].url} alt={altFor(1)} fill className="object-cover" />
        </div>
        <div className="relative bg-[#f0f0f0]">
          <Image src={photos[2].url} alt={altFor(2)} fill className="object-cover" />
        </div>
      </div>
    )
  }

  // 4 or more -- 2x2 grid, "+N" overlay on the last visible tile
  const visible = photos.slice(0, 4)
  const remaining = count - 4

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-square">
      {visible.map((p, i) => (
        <div key={i} className="relative bg-[#f0f0f0]">
          <Image src={p.url} alt={altFor(i)} fill className="object-cover" />
          {i === 3 && remaining > 0 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-white text-xl md:text-2xl font-bold">+{remaining}</span>
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
    <section className="py-16 md:py-28 bg-[#f0f2f5] min-h-screen">
      {imageObjectsJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObjectsJsonLd) }}
        />
      )}

      <div className="max-w-[720px] mx-auto px-6 lg:px-0">

        <div className="mb-8 bg-[#fdfffc] px-6 md:px-10 py-10">
          <SectionHeader size="page" eyebrow="Proof of Work" title="Deliveries" accent={true} />
        </div>

        {locations.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 px-6 lg:px-0">
            <a
              href={buildHref(undefined)}
              className={`text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 border transition-all duration-200 ${
                !location
                  ? 'bg-[#01172f] border-[#01172f] text-white'
                  : 'bg-white border-[#01172f]/15 text-[#01172f]/60 hover:border-[#01172f]/40'
              }`}
            >
              All Locations
            </a>
            {locations.map((loc) => (
              <a
                key={loc}
                href={buildHref(loc)}
                className={`text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 border transition-all duration-200 ${
                  location === loc
                    ? 'bg-[#01172f] border-[#01172f] text-white'
                    : 'bg-white border-[#01172f]/15 text-[#01172f]/60 hover:border-[#01172f]/40'
                }`}
              >
                {loc}
              </a>
            ))}
          </div>
        )}

        {filteredDocs.length === 0 ? (
          <div className="border border-dashed border-[#01172f]/15 py-24 text-center bg-white">
            <p className="text-[15px] text-[#01172f]/40 font-medium">
              {location
                ? `No deliveries found for "${location}".`
                : 'No deliveries added yet -- add one in the admin panel under Deliveries.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
                  style={{ transitionDelay: `${delay}ms` }}
                  className="bg-white border border-[#01172f]/10 overflow-hidden"
                >
                  {/* Post header -- logo + page name + date, mimicking a Facebook post's top row */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#f4f6f2]">
                      <Image src="/branding/primegen_trading_logo.png" alt="Primegen Trading Corporation" fill className="object-contain p-1" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#01172f] leading-tight">
                        Primegen Trading Corporation
                      </p>
                      <p className="text-[12px] text-[#01172f]/45 font-medium">{date}</p>
                    </div>
                  </div>

                  {/* Caption -- title + location */}
                  <div className="px-4 pb-3">
                    <p className="text-[15px] font-bold text-[#01172f] leading-snug">{d.title}</p>
                    {d.location && (
                      <p className="text-[14px] text-[#01172f]/60 font-medium mt-0.5">{d.location}</p>
                    )}
                  </div>

                  <PhotoGrid photos={photos} altBase={altBase} />

                  {/* Footer -- genuine link only, no fabricated engagement numbers */}
                  {d.permalinkUrl && (
                    <div className="px-4 py-3 border-t border-[#01172f]/10">
                      <a
                        href={d.permalinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#3D5F3B] hover:text-[#149911] transition-colors"
                      >
                        View Original Post
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
