import { config } from 'dotenv'
config({ path: '.env' })

async function backfillSlugs() {
  const { getPayloadClient } = await import('./../src/lib/getPayloadClient')
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'products', limit: 500, where: { slug: { exists: false } } })

  for (const doc of docs) {
    await payload.update({ collection: 'products', id: doc.id, data: {} })
    console.log(`Slugged: ${doc.name}`)
  }
  console.log(`Done. ${docs.length} products updated.`)
}

backfillSlugs()
