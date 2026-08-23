import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic' // must run per-request, not at build time -- the DB isn't reachable during Vercel's build step

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  const productsRes = await payload.find({ collection: 'products', limit: 1000, depth: 0 })

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/calculator`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/quote`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/deliveries`, changeFrequency: 'weekly', priority: 0.4 },
  ]

  // Use the canonical slug URL (same one generateMetadata/the page's own
  // redirect treat as canonical), not the numeric id -- listing the id URL
  // here was submitting a non-canonical, soon-to-redirect URL to Google.
  const productPages: MetadataRoute.Sitemap = productsRes.docs.map((m: any) => ({
    url: `${siteUrl}/products/${m.slug || m.id}`,
    lastModified: m.updatedAt ? new Date(m.updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Categories were previously listed as `/products#slug` anchor entries,
  // but a URL fragment isn't a separate crawlable resource -- every one of
  // those "pages" is byte-for-byte the same /products response, so they
  // were duplicate entries rather than real additional coverage. Categories
  // don't have their own route to list here until that changes.

  return [...staticPages, ...productPages]
}
