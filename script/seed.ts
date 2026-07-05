/**
 * Seeds a few sample materials so the site isn't empty on first run.
 * Run with: npx tsx scripts/seed.ts
 * (or: npm install -D tsx first, if not already present)
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function seed() {
  const payload = await getPayload({ config })

  console.log('Checking for existing admin user...')
  const existingUsers = await payload.find({ collection: 'users', limit: 1 })

  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@sturdybuild.example',
        password: 'ChangeMe123!',
        name: 'Admin',
        role: 'super-admin',
      },
    })
    console.log('Created admin user: admin@sturdybuild.example / ChangeMe123!')
    console.log('CHANGE THIS PASSWORD after first login.')
  }

  console.log('Seeding sample materials...')
  const materials = [
    { name: 'Portland Cement (40kg)', category: 'cement-concrete', price: 285, unit: 'bag' },
    { name: 'Deformed Steel Bar 10mm x 6m', category: 'steel-rebar', price: 245, unit: 'length' },
    { name: 'Deformed Steel Bar 12mm x 6m', category: 'steel-rebar', price: 350, unit: 'length' },
    { name: 'Washed Sand', category: 'sand-aggregates', price: 850, unit: 'cbm' },
    { name: 'Gravel (3/4)', category: 'sand-aggregates', price: 900, unit: 'cbm' },
    { name: 'Marine Plywood 3/4" 4x8', category: 'lumber-wood', price: 1450, unit: 'piece' },
    { name: 'Corrugated GI Sheet 0.4mm x 8ft', category: 'roofing', price: 420, unit: 'piece' },
    { name: 'PVC Pipe 4" x 3m', category: 'plumbing', price: 380, unit: 'length' },
  ]

  for (const m of materials) {
    const existing = await payload.find({
      collection: 'materials',
      where: { name: { equals: m.name } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'materials',
        data: {
          ...m,
          inStock: true,
          featured: false,
        } as any,
      })
      console.log(`Created: ${m.name}`)
    }
  }

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})