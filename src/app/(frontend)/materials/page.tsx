import { getPayloadClient } from '@/lib/getPayloadClient'
import MaterialCarousel from '@/components/MaterialCarousel'
import { Container, SectionSage, MicroLabel, CategoryTabsWrap, CategoryTab } from '@/components/ui/styled'

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
  const categories = Object.keys(grouped)

  return (
    <SectionSage>
      <Container>
        <MicroLabel style={{ marginBottom: 8 }}>Full Catalog</MicroLabel>
        <h1 style={{ marginBottom: 32 }}>Materials</h1>

        {categories.length > 1 && (
          <CategoryTabsWrap>
            {categories.map((cat) => (
              <CategoryTab key={cat} href={`#${cat}`}>
                {CATEGORY_LABELS[cat] || cat}
              </CategoryTab>
            ))}
          </CategoryTabsWrap>
        )}

        {categories.map((cat) => (
          <div key={cat} id={cat} style={{ marginBottom: 96, scrollMarginTop: 100 }}>
            <h2 style={{ marginBottom: 32 }}>{CATEGORY_LABELS[cat] || cat}</h2>
            <MaterialCarousel materials={grouped[cat]} />
          </div>
        ))}
      </Container>
    </SectionSage>

  )
}
