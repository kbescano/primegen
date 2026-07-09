import { getPayloadClient } from '@/lib/getPayloadClient'
import WeightCalculatorForm, { type CalcProduct } from '@/components/WeightCalculatorForm'
import { Container, MicroLabel, SectionSage } from '@/components/ui/styled'

export const revalidate = 60

const FALLBACK_PRODUCTS: CalcProduct[] = [
  { id: 'f1', name: 'Deformed Steel Bar (Rebar)', shape: 'round-bar', density: 7850, standardLength: 6 },
  { id: 'f2', name: 'Square Bar', shape: 'square-bar', density: 7850, standardLength: 6 },
  { id: 'f3', name: 'Flat Bar', shape: 'flat-bar', density: 7850, standardLength: 6 },
  { id: 'f4', name: 'G.I. Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'f5', name: 'Angle Bar', shape: 'angle-bar', density: 7850, standardLength: 6 },
  { id: 'f6', name: 'G.I. Sheet / Plate', shape: 'sheet-plate', density: 7850, standardLength: 6 },
]

export default async function CalculatorPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'weight-calc-products', where: { enabled: { equals: true } }, sort: 'order', limit: 50 })

  const products: CalcProduct[] =
    docs.length > 0
      ? docs.map((p: any) => ({ id: p.id, name: p.name, shape: p.shape, density: p.density, standardLength: p.standardLength }))
      : FALLBACK_PRODUCTS

  return (
    <SectionSage><Container>
      <MicroLabel style={{ marginBottom: 8 }}>Tools</MicroLabel>
      <h1 style={{ marginBottom: 10 }}>Weight Calculator</h1>
      <p style={{ marginBottom: 32, maxWidth: 560 }}>
        Estimate the weight of steel products by shape and dimension -- useful for planning orders and checking delivery loads before you request a quote.
      </p>
      <WeightCalculatorForm products={products} />
    </Container></SectionSage>
  )
}