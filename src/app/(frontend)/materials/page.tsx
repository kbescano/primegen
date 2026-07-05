import Image from 'next/image'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 300

const CATEGORY_LABELS: Record<string, string> = {
  'cement-concrete': 'Cement & Concrete',
  'steel-rebar': 'Steel & Rebar',
  'sand-aggregates': 'Sand & Aggregates',
  'lumber-wood': 'Lumber & Wood',
  roofing: 'Roofing',
  plumbing: 'Plumbing Supplies',
  electrical: 'Electrical Supplies',
  'tools-hardware': 'Tools & Hardware',
  other: 'Other',
}

export default async function MaterialsPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'materials',
    limit: 200,
    sort: 'category',
  })

  const grouped: Record<string, any[]> = {}
  for (const m of docs) {
    const cat = m.category || 'other'
    grouped[cat] = grouped[cat] || []
    grouped[cat].push(m)
  }
  const categories = Object.keys(grouped)

  return (
    <div className="container" style={{ padding: '56px 24px 88px' }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Full Catalog</p>
      <h1 style={{ marginBottom: 10 }}>Materials</h1>
      <p style={{ marginBottom: 28 }}>
        Browse our full range. Request a quote for current pricing on any item.
      </p>

      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 44 }}>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`#${cat}`}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 16px',
                borderRadius: 20,
                textDecoration: 'none',
                background: 'white',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-border)',
              }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </Link>
          ))}
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat} id={cat} style={{ marginBottom: 56, scrollMarginTop: 90 }}>
          <h2
            style={{
              marginBottom: 20,
              paddingBottom: 10,
              borderBottom: '2px solid var(--color-forest)',
              display: 'inline-block',
            }}
          >
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
            {grouped[cat].map((m: any) => (
              <div key={m.id} className="facet-card" style={{ opacity: m.inStock ? 1 : 0.5 }}>
                {m.photo?.url && (
                  <div style={{ position: 'relative', width: '100%', height: 152 }}>
                    <Image src={m.photo.url} alt={m.photo.alt || m.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '14px 16px 16px' }}>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 8, color: 'var(--color-ink)' }}>
                    {m.name}
                  </h3>
                  {m.inStock ? (
                    <Link
                      href={`/quote?material=${m.id}`}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--color-forest)',
                        textDecoration: 'none',
                      }}
                    >
                      Request pricing
                    </Link>
                  ) : (
                    <p style={{ fontSize: 12, color: '#b3382b', margin: 0 }}>Out of stock</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
