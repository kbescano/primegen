import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import WeightCalculatorForm, { type CalcProduct } from '@/components/WeightCalculatorForm'
import RelatedMaterialsCarousel from '@/components/RelatedMaterialsCarousel'
import { Container, Section, MicroLabel, ButtonLink, TwoColGrid, PdpInfoRow, PdpInfoIcon, PdpThumbStrip, PdpThumb } from '@/components/ui/styled'

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

const FALLBACK_CALC_PRODUCT: CalcProduct = {
  id: 'default',
  name: 'Round Bar',
  shape: 'round-bar',
  density: 7850,
  standardLength: 6,
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
    where: { and: [{ category: { equals: material.category } }, { id: { not_equals: material.id } }] },
    limit: 8,
  })

  const calcProduct: CalcProduct = material.weightCalcProduct
    ? {
        id: material.weightCalcProduct.id,
        name: material.weightCalcProduct.name,
        shape: material.weightCalcProduct.shape,
        density: material.weightCalcProduct.density,
        standardLength: material.weightCalcProduct.standardLength,
      }
    : FALLBACK_CALC_PRODUCT

  const images = [material.photo, material.hoverPhoto].filter((p: any) => p?.url)

  return (
    <Container as={Section}>
      <TwoColGrid style={{ marginBottom: 64 }}>
        <div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'var(--color-sage-tint)', borderRadius: 'var(--product-radius)', overflow: 'hidden' }}>
            {images[0]?.url && <Image src={images[0].url} alt={images[0].alt || material.name} fill style={{ objectFit: 'cover' }} />}
          </div>

          {images.length > 1 && (
            <PdpThumbStrip>
              {images.map((img: any, i: number) => (
                <PdpThumb key={i} $active={i === 0}>
                  <Image src={img.url} alt={img.alt || material.name} fill style={{ objectFit: 'cover' }} />
                </PdpThumb>
              ))}
            </PdpThumbStrip>
          )}

         
        </div>

        <div>
          <MicroLabel style={{ marginBottom: 8 }}>{CATEGORY_LABELS[material.category] || material.category}</MicroLabel>
          <h1 style={{ marginBottom: 20, fontSize: 'clamp(28px, 4vw, 40px)' }}>{material.name}</h1>
          {material.description && <p style={{ fontSize: 16, marginBottom: 28 }}>{material.description}</p>}

          <div style={{ marginBottom: 28 }}>
            <MicroLabel style={{ marginBottom: 12 }}>Calculate Weight</MicroLabel>
            <WeightCalculatorForm products={[calcProduct]} />
          </div>
          <PdpInfoRow>
            <PdpInfoIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="7" width="15" height="10" rx="1" />
                <path d="M16 10h4l3 3v4h-7" />
                <circle cx="5.5" cy="19.5" r="1.5" />
                <circle cx="18.5" cy="19.5" r="1.5" />
              </svg>
            </PdpInfoIcon>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>{material.inStock ? 'In Stock' : 'Currently Unavailable'}</p>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Delivery scheduled once your quote is confirmed.</p>
            </div>
          </PdpInfoRow>
          <ButtonLink href={`/quote?material=${material.id}`} style={{ width: '100%' }}>
            Get a Quote
          </ButtonLink>
        </div>
      </TwoColGrid>

      {related.docs.length > 0 && (
        <div>
          <h2 style={{ marginBottom: 40, textAlign: 'center' }}>Related Materials</h2>
          <RelatedMaterialsCarousel materials={related.docs as any} />
        </div>
      )}
    </Container>
  )
}
