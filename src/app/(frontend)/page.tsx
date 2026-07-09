import { getPayloadClient } from '@/lib/getPayloadClient'
import CinematicVideoHero, { type HeroSlide } from '@/components/CinematicVideoHero'
import FeaturedCarousel from '@/components/FeaturedCarousel'
import { Container, Section, SectionSage, ValueCard, ValueNum } from '@/components/ui/styled'

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
      ? heroSlides.docs.map((s: any) => ({ id: s.id, label: s.label, title: s.title, cta: s.cta, href: s.href, video: s.video }))
      : FALLBACK_SLIDES

  return (
    <>
      <CinematicVideoHero slides={slides} />

      <Section>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {VALUE_PROPS.map((v) => (
              <ValueCard key={v.num}>
                <ValueNum>{v.num}</ValueNum>
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 6 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, margin: 0 }}>{v.body}</p>
                </div>
              </ValueCard>
            ))}
          </div>
        </Container>
      </Section>

      <SectionSage>
        <Container>
          <h2 style={{ marginBottom: 8 }}>
            Featured Materials.{' '}
            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
              Browse what's currently in stock.
            </span>
          </h2>
          <div style={{ marginTop: 40 }}>
            <FeaturedCarousel materials={featured.docs as any} />
          </div>
        </Container>
      </SectionSage>
    </>
  )
}
