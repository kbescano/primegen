import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayloadClient'

export async function POST() {
  const payload = await getPayloadClient()
  const results: string[] = []

  // Build a slug -> categoryId lookup
  const cats = await payload.find({ collection: 'categories', limit: 100 })
  const catBySlug: Record<string, number> = {}
  for (const c of cats.docs) {
    if (typeof c.id === 'number') {
      catBySlug[c.slug as string] = c.id
    }
  }

  // Walk every material and link categoryRef based on its existing category string
  const products = await payload.find({ collection: 'products', limit: 500 })
  for (const m of products.docs) {
    const slug = m.category as string
    const catId = catBySlug[slug]

    if (!catId) {
      results.push(`SKIP (no matching category "${slug}"): ${m.name}`)
      continue
    }
    if (m.categoryRef) {
      results.push(`skip (already linked): ${m.name}`)
      continue
    }

    await payload.update({
      collection: 'products',
      id: m.id,
      data: { categoryRef: catId || null },
    })
    results.push(`linked: ${m.name} -> ${slug}`)
  }

  return NextResponse.json({ results, total: products.docs.length })
}
