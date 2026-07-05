import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const info: any = await payload.findGlobal({ slug: 'about-page' })

  const title = info?.title || 'About Primegen Trading Corporation'
  const description =
    info?.description ||
    'Add a company description in the admin panel under Globals -> About Page.'
  const address = info?.address || 'Add your address in the admin panel.'
  const phone = info?.phone
  const email = info?.email
  const mapEmbedUrl = info?.mapEmbedUrl

  return (
    <div className="container" style={{ padding: '56px 24px 88px' }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Who We Are</p>
      <h1 style={{ marginBottom: 20 }}>{title}</h1>
      <p style={{ maxWidth: 680, marginBottom: 48, whiteSpace: 'pre-line' }}>{description}</p>

      <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 380px) minmax(280px, 1fr)', gap: 32 }}>
        <div className="facet-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>Visit / Contact Us</h2>

          <div style={{ marginBottom: 20 }}>
            <p style={contactLabel}>Address</p>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{address}</p>
          </div>

          {phone && (
            <div style={{ marginBottom: 20 }}>
              <p style={contactLabel}>Phone</p>
              <p style={{ margin: 0 }}>
                <a href={`tel:${phone}`} style={{ color: 'var(--color-forest)', textDecoration: 'none' }}>
                  {phone}
                </a>
              </p>
            </div>
          )}

          {email && (
            <div>
              <p style={contactLabel}>Email</p>
              <p style={{ margin: 0 }}>
                <a href={`mailto:${email}`} style={{ color: 'var(--color-forest)', textDecoration: 'none' }}>
                  {email}
                </a>
              </p>
            </div>
          )}
        </div>

        <div
          className="facet-card"
          style={{ overflow: 'hidden', minHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {mapEmbedUrl ? (
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 340 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--color-text)' }}>
              Add a Google Maps embed URL in the admin panel under Globals -&gt; About Page to show
              the map here.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const contactLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--color-forest)',
  marginBottom: 4,
}
