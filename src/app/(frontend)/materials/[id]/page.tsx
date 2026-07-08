import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import WeightCalculatorForm, { type CalcProduct } from '@/components/WeightCalculatorForm'

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

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()

  let material: any
  try {
    material = await payload.findByID({ collection: 'materials', id, depth: 2 })
  } catch {
    notFound()
  }
  if (!material) notFound()

  const related = await payload.find({
    collection: 'materials',
    where: {
      and: [{ category: { equals: material.category } }, { id: { not_equals: material.id } }],
    },
    limit: 3,
  })

  const calcProduct: CalcProduct | null = material.weightCalcProduct
    ? {
        id: material.weightCalcProduct.id,
        name: material.weightCalcProduct.name,
        shape: material.weightCalcProduct.shape,
        density: material.weightCalcProduct.density,
        standardLength: material.weightCalcProduct.standardLength,
      }
    : null

  return (
    <div className="container section">
      <Link href="/materials" className="micro-label" style={{ textDecoration: 'underline', color: '#000', marginBottom: 32, display: 'inline-block' }}>
        Back to Materials
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1fr)', gap: 56, alignItems: 'start', marginBottom: 64 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'var(--color-sage-tint)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {material.photo?.url && (
            <Image src={material.photo.url} alt={material.photo.alt || material.name} fill style={{ objectFit: 'cover' }} />
          )}
        </div>

        <div className="detail-sticky">
          <p className="micro-label" style={{ marginBottom: 12 }}>{CATEGORY_LABELS[material.category] || material.category}</p>
          <h1 style={{ marginBottom: 16, fontSize: 'clamp(28px, 4vw, 38px)' }}>{material.name}</h1>
          {material.description && <p style={{ fontSize: 16, marginBottom: 28 }}>{material.description}</p>}
          {!material.inStock && <p style={{ color: '#8a2e2e', fontWeight: 700, marginBottom: 20 }}>Currently out of stock</p>}

          <Link href={`/quote?material=${material.id}`} className="btn btn-primary" style={{ width: '100%', marginBottom: 32 }}>
            Request a Quote
          </Link>

          {calcProduct ? (
            <div>
              <p className="micro-label" style={{ marginBottom: 12 }}>Calculate Weight</p>
              <WeightCalculatorForm products={[calcProduct]} />
            </div>
          ) : (
            <p className="calc-empty-note">
              A weight calculator isn't set up for this material yet.
            </p>
          )}

          <details className="detail-accordion">
            <summary>Delivery & Ordering</summary>
            <div className="detail-accordion-body">
              Submit a quote request with the quantity you need. Our team confirms pricing and
              delivery timing directly by phone or email -- prices aren't listed online since they
              track current supplier cost.
            </div>
          </details>

          <details className="detail-accordion">
            <summary>Specifications</summary>
            <div className="detail-accordion-body">
              Category: {CATEGORY_LABELS[material.category] || material.category}<br />
              Sold: {material.unit?.replace('per ', 'Per ')}<br />
              Availability: {material.inStock ? 'In stock' : 'Out of stock'}
            </div>
          </details>
        </div>
      </div>

      {related.docs.length > 0 && (
        <div>
          <p className="micro-label" style={{ marginBottom: 12 }}>You May Also Need</p>
          <h2 style={{ marginBottom: 32 }}>Related Materials</h2>
          <div className="product-grid">
            {related.docs.map((m: any) => (
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
      )}
    </div>
  )
}
