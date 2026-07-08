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

      <p className="micro-label" style={{ marginBottom: 12 }}>{CATEGORY_LABELS[material.category] || material.category}</p>
      <h1 style={{ marginBottom: 12, fontSize: 'clamp(28px, 4vw, 40px)' }}>{material.name}</h1>
      {material.description && <p style={{ fontSize: 16, marginBottom: 40, maxWidth: 640 }}>{material.description}</p>}
      {!material.inStock && <p style={{ color: '#8a2e2e', fontWeight: 700, marginBottom: 24 }}>Currently out of stock</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1fr)', gap: 48, alignItems: 'start' }}>
        <div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'var(--color-sage-tint)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 20 }}>
            {material.photo?.url && (
              <Image src={material.photo.url} alt={material.photo.alt || material.name} fill style={{ objectFit: 'cover' }} />
            )}
          </div>
          <Link href={`/quote?material=${material.id}`} className="link-cta">
            Request a Quote
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div>
          <p className="micro-label" style={{ marginBottom: 16 }}>Calculate Weight</p>
          {calcProduct ? (
            <WeightCalculatorForm products={[calcProduct]} />
          ) : (
            <p className="calc-empty-note">
              A weight calculator isn't set up for this material yet. Add one in the admin panel
              under this material's "Weight Calc Product" field.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
