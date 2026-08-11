import { getPayloadClient } from '@/lib/getPayloadClient'
import WeightCalculatorForm, { type CalcProduct } from '@/components/WeightCalculatorForm'

export const revalidate = 60

export const metadata = {
  title: 'Weight Calculator | Primegen',
  description: 'Estimate the weight of steel products by shape and dimension before you request a quote.',
}

const FALLBACK_PRODUCTS: CalcProduct[] = [
  { id: 'deformed-bar', name: 'Deformed Bar', shape: 'round-bar', density: 7850, standardLength: 6 },
  { id: 'angle-bar', name: 'Angle Bar', shape: 'angle-bar', density: 7850, standardLength: 6 },
  { id: 'channel-bar', name: 'Channel Bar', shape: 'c-channel', density: 7850, standardLength: 6 },
  { id: 'square-bar', name: 'Square Bar', shape: 'square-bar', density: 7850, standardLength: 6 },
  { id: 'plain-round-bar', name: 'Plain Round Bar', shape: 'round-bar', density: 7850, standardLength: 6 },
  { id: 'rectangular-bar', name: 'Rectangular Bar', shape: 'flat-bar', density: 7930, standardLength: 6 }, // Using stainless default
  { id: 'flat-bar', name: 'Flat Bar', shape: 'flat-bar', density: 7850, standardLength: 6 },
  { id: 'tubular', name: 'Tubular Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'square-tube', name: 'Square Tube', shape: 'square-tube', density: 7850, standardLength: 6 },
  { id: 'c-purlins', name: 'C-Purlins', shape: 'c-channel', density: 7850, standardLength: 6 },
  { id: 'i-beam', name: 'I Beam', shape: 'i-beam', density: 7850, standardLength: 6 },
  { id: 'h-beam', name: 'H Beam', shape: 'i-beam', density: 7850, standardLength: 6 },
  { id: 'bi-pipe', name: 'B.I. Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'gi-pipe', name: 'G.I. Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'copper-pipe', name: 'Copper Pipe', shape: 'round-pipe', density: 8960, standardLength: 6 },
  { id: 'stainless-pipe', name: 'Stainless Pipe', shape: 'round-pipe', density: 7930, standardLength: 6 },
  { id: 'base-plate', name: 'Base Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'mild-steel-plate', name: 'Mild Steel Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'chequered-plate', name: 'Chequered Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'gi-sheet', name: 'G.I. Sheet', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'copper-sheet', name: 'Copper Sheet', shape: 'sheet-plate', density: 8960, standardLength: 1 },
  { id: 'stainless-sheet', name: 'Stainless Sheet', shape: 'sheet-plate', density: 7930, standardLength: 1 },
]

export default async function CalculatorPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'weight-calc-products',
    where: { enabled: { equals: true } },
    sort: 'order',
    limit: 50
  })

  const products: CalcProduct[] =
    docs.length > 0
      ? docs.map((p: any) => ({
          id: p.id,
          name: p.name,
          shape: p.shape,
          density: p.density,
          standardLength: p.standardLength
        }))
      : FALLBACK_PRODUCTS

  return (
    <section className="min-h-screen bg-[#05100d] pt-24 md:pt-32 pb-16 md:pb-24 font-sans selection:bg-[#149911]/30 relative overflow-x-hidden">

      {/* Subtle Background Glow -- matches ProductsCatalog / Deliveries */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#149911]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">

        <div className="mb-8 md:mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-3">
            Tools
          </p>
          <h1 className="text-[32px] sm:text-[40px] md:text-[56px] font-medium text-[#fdfffc] tracking-tight leading-none mb-3 md:mb-4">
            Weight Calculator
          </h1>
          <p className="text-[14px] md:text-[16px] text-[#fdfffc]/60 max-w-[600px]">
            Estimate the weight of steel products by shape and dimension -- useful for planning orders and checking delivery loads before you request a quote.
          </p>
        </div>

        <div className="bg-[#0a1a15]/80 backdrop-blur-xl border border-[#fdfffc]/5 rounded-2xl p-5 md:p-8">
          <WeightCalculatorForm products={products} />
        </div>

      </div>
    </section>
  )
}