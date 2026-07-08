import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/getPayloadClient'
import CinematicVideoHero, { type HeroSlide } from '@/components/CinematicVideoHero'

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

  const [featured, heroSlides] = await Promise.all([
    payload.find({ collection: 'materials', where: { featured: { equals: true } }, limit: 8 }),
    payload.find({ collection: 'hero-slides', where: { enabled: { equals: true } }, sort: 'order', limit: 10 }),
  ])

  const slides: HeroSlide[] =
    heroSlides.docs.length > 0
      ? heroSlides.docs.map((s: any) => ({
          id: s.id,
          label: s.label,
          title: s.title,
          cta: s.cta,
          href: s.href,
          video: s.video,
        }))
      : FALLBACK_SLIDES

  return (
    <>
      <CinematicVideoHero slides={slides} />

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {VALUE_PROPS.map((v) => (
              <div key={v.num} className="value-card">
                <span className="value-num">{v.num}</span>
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 6 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, margin: 0 }}>{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-sage">
        <div className="container">
          <p className="micro-label" style={{ marginBottom: 12 }}>Featured</p>
          <h2 style={{ marginBottom: 48 }}>Popular Materials</h2>
          <div className="product-grid">
            {featured.docs.map((m: any) => (
              <div key={m.id} className="product-card">
                <div className="product-card-image">
                  {m.photo?.url && (
                    <Image src={m.photo.url} alt={m.photo.alt || m.name} fill style={{ objectFit: 'cover' }} />
                  )}
                  <Link href={`/materials/${m.id}`} className="product-card-arrow" aria-label={`View ${m.name} details`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M7 17L17 7M17 7H8M17 7V16" />
                    </svg>
                  </Link>
                </div>
                <div className="product-card-body">
                  <p className="micro-label" style={{ marginBottom: 8 }}>
                    {m.category?.replace('-', ' ')}
                  </p>
                  <h3 style={{ marginBottom: 12 }}>{m.name}</h3>
                  <Link href={`/quote?material=${m.id}`} className="link-cta">
                    Request a Quote
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
