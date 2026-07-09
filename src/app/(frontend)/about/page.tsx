import { getPayloadClient } from '@/lib/getPayloadClient'
import { Container, SectionSage, MicroLabel, TwoColGrid, ProductCard } from '@/components/ui/styled'

export const revalidate = 60

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const info: any = await payload.findGlobal({ slug: 'about-page' })

  const title = info?.title || 'About Primegen Trading Corporation'
  const description = info?.description || 'Add a company description in the admin panel under Globals -> About Page.'
  const address = info?.address || 'Add your address in the admin panel.'
  const phone = info?.phone
  const email = info?.email
  const mapEmbedUrl = info?.mapEmbedUrl

  return (
    <SectionSage><Container>
      <MicroLabel style={{ marginBottom: 8 }}>Who We Are</MicroLabel>
      <h1 style={{ marginBottom: 20 }}>{title}</h1>
      <p style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-text-muted)' }}>{description}</p>

      <TwoColGrid style={{ gridTemplateColumns: 'minmax(260px, 380px) minmax(280px, 1fr)' }}>
        <ProductCard style={{ height: 'auto', padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>Visit / Contact Us</h2>
          <div style={{ marginBottom: 20 }}>
            <MicroLabel style={{ marginBottom: 4 }}>Address</MicroLabel>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{address}</p>
          </div>
          {phone && (
            <div style={{ marginBottom: 20 }}>
              <MicroLabel style={{ marginBottom: 4 }}>Phone</MicroLabel>
              <p style={{ margin: 0 }}>
                <a href={`tel:${phone}`} style={{ color: 'var(--color-green)', textDecoration: 'none' }}>{phone}</a>
              </p>
            </div>
          )}
          {email && (
            <div>
              <MicroLabel style={{ marginBottom: 4 }}>Email</MicroLabel>
              <p style={{ margin: 0 }}>
                <a href={`mailto:${email}`} style={{ color: 'var(--color-green)', textDecoration: 'none' }}>{email}</a>
              </p>
            </div>
          )}
        </ProductCard>

        <ProductCard style={{ height: 'auto', minHeight: 340, overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {mapEmbedUrl ? (
            <iframe src={mapEmbedUrl} width="100%" height="100%" style={{ border: 0, minHeight: 340 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <p style={{ padding: 24, textAlign: 'center' }}>
              Add a Google Maps embed URL in the admin panel under Globals -&gt; About Page to show the map here.
            </p>
          )}
        </ProductCard>
      </TwoColGrid>
    </Container></SectionSage>
  )
}