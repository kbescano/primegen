import { getPayload } from 'payload'
import config from './src/payload.config'

const CATEGORIES = [
  { label: 'Bolts & Fasteners', slug: 'bolts-fasteners', order: 1, description: 'High-quality bolts, nuts, screws, washers, anchors, and fastening solutions for construction, industrial, and DIY applications.' },
  { label: 'Steel Plates', slug: 'steel-plates', order: 2, description: 'Durable steel plates available in various grades, thicknesses, and sizes for fabrication, structural, and industrial projects.' },
  { label: 'Sheet Pile', slug: 'sheet-pile', order: 3, description: 'Heavy-duty sheet piles designed for retaining walls, excavation support, flood protection, and foundation construction.' },
  { label: 'Steel Bars & Tubing', slug: 'steel-bars', order: 4, description: 'Round bars, square bars, flat bars, pipes, tubes, and structural tubing for manufacturing, fabrication, and construction.' },
  { label: 'Beams', slug: 'beams', order: 5, description: 'Structural steel beams including I-beams, H-beams, and wide flange beams for residential, commercial, and industrial buildings.' },
  { label: 'Black Iron', slug: 'black-iron', order: 6, description: 'Black iron pipes, fittings, and steel products ideal for gas lines, structural frameworks, and industrial applications.' },
  { label: 'Galvanized Iron', slug: 'galvanized-iron', order: 7, description: 'Corrosion-resistant galvanized iron sheets, pipes, and structural materials built for long-lasting outdoor and industrial use.' },
  { label: 'Copper', slug: 'copper', order: 8, description: 'Premium copper pipes, fittings, wires, and accessories for plumbing, electrical, and industrial installations.' },
  { label: 'Stainless', slug: 'stainless', order: 9, description: 'High-grade stainless steel sheets, pipes, bars, fittings, and hardware offering exceptional corrosion resistance and durability.' },
  { label: 'Pipe Fittings', slug: 'pipe-fittings', order: 10, description: 'Comprehensive range of elbows, tees, couplings, flanges, valves, and connectors for plumbing and industrial piping systems.' },
  { label: 'Fence & Wire', slug: 'fence-wire', order: 11, description: 'Wire mesh, chain link, barbed wire, welded wire, and fencing materials for residential, commercial, and agricultural use.' },
  { label: 'PPE', slug: 'ppe', order: 12, description: 'Personal protective equipment including helmets, gloves, safety shoes, eyewear, and protective clothing for workplace safety.' },
  { label: 'Electrical & Cabling', slug: 'electrical-cabling', order: 13, description: 'Electrical wires, power cables, conduits, connectors, switches, and installation accessories for residential and industrial projects.' },
]

async function seed() {
  const payload = await getPayload({ config })
  for (const c of CATEGORIES) {
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: c.slug } }, limit: 1 })
    if (existing.docs.length > 0) {
      console.log(`skip (exists): ${c.label}`)
      continue
    }
    await payload.create({ collection: 'categories', data: c })
    console.log(`created: ${c.label}`)
  }
  console.log('Done.')
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
