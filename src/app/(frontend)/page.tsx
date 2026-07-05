import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/getPayloadClient'
import CinematicVideoHero, { type HeroSlide } from '@/components/CinematicVideoHero'

export const revalidate = 60

const VALUE_PROPS = [
  { num: '01', title: 'Direct-from-supplier pricing', body: 'No markup layers, prices reflect current supplier cost.' },
  { num: '02', title: 'Scheduled delivery', body: 'Book delivery windows that fit your project timeline.' },
  { num: '03', title: 'Dedicated coordination', body: 'A real person confirms your order, not an auto-reply.' },
]

const FALLBACK_SLIDES: HeroSlide[] = [
  { id: 'f1', label: 'Fabrication & Steel', title: 'Precision in Every Cut', cta: 'Browse Materials', href: '/materials', video: '/videos/hero-1.mp4' },
  { id: 'f2', label: 'Full Catalog', title: 'Built on Trust', cta: 'See Current Prices', href: '/materials', video: '/videos/hero-2.mp4' },
  { id: 'f3', label: 'Project Ready', title: 'From Site to Structure', cta: 'Request a Quote', href: '/quote', video: '/videos/hero-3.mp4' },
]

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [featured, allForTicker, heroSlides] = await Promise.all([
    payload.find({ collection: 'materials', where: { featured: { equals: true } }, limit: 8 }),
    payload.find({ collection: 'materials', where: { inStock: { equals: true } }, limit: 14, sort: '-updatedAt' }),
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
      <div style={{ background: 'var(--color-forest)', color: 'white', padding: '9px 0' }}>
        <div
          className="container price-ticker-track"
          style={{ display: 'flex', alignItems: 'center', gap: 28, whiteSpace: 'nowrap' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 12.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            In Stock Now
          </span>
          {allForTicker.docs.map((m: any) => (
            <span
              key={m.id}
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                fontSize: 12.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 28,
              }}
            >
              <span style={{ opacity: 0.5 }}>|</span>
              {m.name}
            </span>
          ))}
        </div>
      </div>

      <CinematicVideoHero slides={slides} />

      <section className="container" style={{ padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {VALUE_PROPS.map((v) => (
            <div key={v.num} className="value-chip">
              <span className="num">{v.num}</span>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--color-ink)' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: 13.5, margin: 0 }}>{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: '24px 24px 88px' }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>In Stock Now</p>
        <h2 style={{ marginBottom: 28 }}>Featured Materials</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 24,
          }}
        >
          {featured.docs.map((m: any) => (
            <div key={m.id} className="facet-card">
              {m.photo?.url && (
                <div style={{ position: 'relative', width: '100%', height: 168 }}>
                  <Image src={m.photo.url} alt={m.photo.alt || m.name} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '16px 18px 18px' }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 10, color: 'var(--color-ink)' }}>
                  {m.name}
                </h3>
                <Link
                  href={`/quote?material=${m.id}`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-forest)',
                    textDecoration: 'none',
                  }}
                >
                  Request pricing
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
