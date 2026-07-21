import { getPayloadClient } from '@/lib/getPayloadClient'
import SectionHeader from '@/components/SectionHeader'
import ScrollReveal from '@/components/ScrollReveal'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const STAGGER_STEP = 60
const STAGGER_CAP = 480

function PhotoGrid({ photos, title }: { photos: any[]; title: string }) {
  const count = photos.length
  if (count === 0) return null

  if (count === 1) {
    return (
      <div className="relative w-full aspect-[4/3] bg-[#f0f0f0]">
        <Image src={photos[0].url} alt={photos[0].alt || title} fill className="object-cover" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-[16/9]">
        {photos.map((p, i) => (
          <div key={i} className="relative bg-[#f0f0f0]">
            <Image src={p.url} alt={p.alt || title} fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[4/3]">
        <div className="relative row-span-2 bg-[#f0f0f0]">
          <Image src={photos[0].url} alt={photos[0].alt || title} fill className="object-cover" />
        </div>
        <div className="relative bg-[#f0f0f0]">
          <Image src={photos[1].url} alt={photos[1].alt || title} fill className="object-cover" />
        </div>
        <div className="relative bg-[#f0f0f0]">
          <Image src={photos[2].url} alt={photos[2].alt || title} fill className="object-cover" />
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
          <Image src={p.url} alt={p.alt || title} fill className="object-cover" />
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

export default async function DeliveriesPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'deliveries',
    where: { visible: { equals: true } },
    sort: '-deliveryDate',
    limit: 100,
    depth: 2,
  })

  return (
    <section className="py-16 md:py-28 bg-[#f0f2f5] min-h-screen">
      <div className="max-w-[720px] mx-auto px-6 lg:px-0">

        <div className="mb-12 bg-[#fdfffc] px-6 md:px-10 py-10">
          <SectionHeader size="page" eyebrow="Proof of Work" title="Deliveries" accent={true} />
        </div>

        {docs.length === 0 ? (
          <div className="border border-dashed border-[#01172f]/15 py-24 text-center bg-white">
            <p className="text-[15px] text-[#01172f]/40 font-medium">
              No deliveries added yet -- add one in the admin panel under Deliveries.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {docs.map((d: any, index: number) => {
              const photos = Array.isArray(d.photos) ? d.photos.filter((p: any) => p?.url) : []
              const delay = Math.min(index * STAGGER_STEP, STAGGER_CAP)
              const date = new Date(d.deliveryDate).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })

              return (
                <ScrollReveal
                  key={d.id}
                  style={{ transitionDelay: `${delay}ms` }}
                  className="bg-white border border-[#01172f]/10 overflow-hidden"
                >
                  {/* Post header -- logo + page name + date, mimicking a Facebook post's top row */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#f4f6f2]">
                      <Image src="/branding/primegen-logo.jpg" alt="Primegen Trading Corporation" fill className="object-contain p-1" />
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

                  {/* Photo grid */}
                  <PhotoGrid photos={photos} title={d.title} />

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
