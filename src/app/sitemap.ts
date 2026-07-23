import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/getPayloadClient'

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  const [productsRes, categoriesRes] = await Promise.all([
    payload.find({ collection: 'products', limit: 1000, depth: 0 }),
    payload.find({ collection: 'categories', limit: 100, depth: 0 }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/calculator`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/quote`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/deliveries`, changeFrequency: 'weekly', priority: 0.4 },
  ]

  const materialPages: MetadataRoute.Sitemap = productsRes.docs.map((m: any) => ({
    url: `${siteUrl}/products/${m.id}`,
    lastModified: m.updatedAt ? new Date(m.updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const categoryPages: MetadataRoute.Sitemap = categoriesRes.docs.map((c: any) => ({
    url: `${siteUrl}/products#${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...staticPages, ...materialPages, ...categoryPages]
}
