import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/getPayloadClient'
import CinematicVideoHero, { type HeroSlide } from '@/components/CinematicVideoHero'
import FeaturedCarousel from '@/components/FeaturedCarousel'
import MobileStickyCta from '@/components/MobileSticky'

export const revalidate = 60

const FALLBACK_SLIDES: HeroSlide[] = [
  { id: 'f1', label: 'Fabrication & Steel', title: 'Precision in Every Cut', cta: 'Browse Materials', href: '/materials', video: '/videos/hero-1.mp4' },
  { id: 'f2', label: 'Full Catalog', title: 'Built on Trust', cta: 'See Current Prices', href: '/materials', video: '/videos/hero-2.mp4' },
  { id: 'f3', label: 'Project Ready', title: 'From Site to Structure', cta: 'Request a Quote', href: '/quote', video: '/videos/hero-3.mp4' },
]

const VALUE_PROPS = [
  { num: '01', title: 'Direct-from-supplier pricing', body: 'No markup layers, prices reflect current supplier cost.' },
  { num: '02', title: 'Scheduled delivery', body: 'Book delivery windows that fit your project timeline.' },
  { num: '03', title: 'Dedicated coordination', body: 'A real person confirms your order, not an auto-reply.' },
]

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [heroSlides, categories] = await Promise.all([
    payload.find({ collection: 'hero-slides', where: { enabled: { equals: true } }, sort: 'order', limit: 10 }),
    payload.find({ collection: 'categories', sort: 'order', limit: 100 }),
  ])

  const slides: HeroSlide[] =
    heroSlides.docs.length > 0
      ? heroSlides.docs.map((s: any) => ({ id: s.id, label: s.label, title: s.title, cta: s.cta, href: s.href, video: s.video }))
      : FALLBACK_SLIDES

  return (
    <>
      <CinematicVideoHero slides={slides} />

      <section className="py-28">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_PROPS.map((v) => (
              <div key={v.num} className="flex gap-4 items-start bg-white border-l-4 border-[#149911] p-6">
                <span className="text-sm font-bold text-[#103900]">{v.num}</span>
                <div>
                  <h3 className="text-base font-bold mb-1.5">{v.title}</h3>
                  <p className="text-sm m-0">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 bg-sage-tint">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-20">
          <h2 className="mb-2 normal-case text-[#01172f]">
            Featured Materials.{' '}
            <span className="font-normal text-gray-500">Browse what&apos;s currently in stock.</span>
          </h2>

          <div className="mt-10">
            <FeaturedCarousel categories={categories.docs as any} />
          </div>
        </div>
      </section>

      {/* Mobile-only sticky CTA */}
      <MobileStickyCta />

      <footer className="py-2 bg-sage-tint border-t border-[#01172f]/5">
        <div className="max-w-[1360px] mx-auto px-6">
          <p className="text-center text-xs tracking-wide text-[#01172f]">
            &copy; {new Date().getFullYear()} Primegen Trading Corporation
          </p>
        </div>
      </footer>
    </>
  )
}
