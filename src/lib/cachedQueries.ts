import { unstable_cache } from 'next/cache'
import { getPayloadClient } from '@/lib/getPayloadClient'

// The public catalog, deliveries gallery and sitemap are read by every
// visitor and crawler. These pages have to stay dynamic (search params / DB
// not reachable at build time), so without this each request re-ran the full
// Payload queries. Caching the query results keeps the freshness the other
// public pages already have (60s) without paying for the queries every hit.

export function getCatalogData(q: string) {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const [categoriesRes, materialsRes] = await Promise.all([
        payload.find({ collection: 'categories', sort: 'order', limit: 100, depth: 2 }),
        payload.find({
          collection: 'products',
          limit: 500,
          depth: 2,
          ...(q ? { where: { name: { contains: q } } } : {}),
        }),
      ])
      return { categories: categoriesRes.docs as any[], products: materialsRes.docs as any[] }
    },
    ['public-catalog', q],
    { revalidate: 60 },
  )()
}

export function getPublicDeliveries() {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection: 'deliveries',
        where: { visible: { equals: true } },
        sort: '-deliveryDate',
        limit: 100,
        depth: 2,
      })
      return docs as any[]
    },
    ['public-deliveries'],
    { revalidate: 60 },
  )()
}

export function getSitemapData() {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const [productsRes, categoriesRes] = await Promise.all([
        payload.find({ collection: 'products', limit: 1000, depth: 0 }),
        payload.find({ collection: 'categories', limit: 100, depth: 0 }),
      ])
      return { products: productsRes.docs as any[], categories: categoriesRes.docs as any[] }
    },
    ['sitemap-data'],
    { revalidate: 3600 },
  )()
}
