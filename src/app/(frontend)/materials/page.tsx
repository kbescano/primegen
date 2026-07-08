import Image from 'next/image'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

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
  const { docs } = await payload.find({ collection: 'materials', limit: 200, sort: 'category' })

  const grouped: Record<string, any[]> = {}
  for (const m of docs) {
    const cat = m.category || 'other'
    grouped[cat] = grouped[cat] || []
    grouped[cat].push(m)
  }

  return (
    <div className="container section">
      <p className="micro-label" style={{ marginBottom: 12 }}>Full Catalog</p>
      <h1 style={{ marginBottom: 48 }}>Materials</h1>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 80 }}>
          <h2 style={{ marginBottom: 32 }}>{CATEGORY_LABELS[cat] || cat}</h2>
          <div className="product-grid">
            {items.map((m: any) => (
              <div key={m.id} className="product-card" style={{ opacity: m.inStock ? 1 : 0.5 }}>
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
                  <h3 style={{ marginBottom: 12 }}>{m.name}</h3>
                  {m.inStock ? (
                    <Link href={`/quote?material=${m.id}`} className="link-cta">
                      Request a Quote
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  ) : (
                    <p style={{ fontSize: 13, color: '#4a4a4a', margin: 0 }}>Out of stock</p>
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
