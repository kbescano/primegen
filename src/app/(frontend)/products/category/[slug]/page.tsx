import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { safeJsonLdStringify } from '@/lib/safeJsonLd'
import { cloudinaryOptimized } from '@/lib/cloudinaryUrl'

export const revalidate = 60

// Products.category is a fixed-option select (a real Postgres enum, not
// free text) -- comparing it against a slug that isn't one of these exact
// values throws a hard DB error rather than just matching nothing, so any
// category created after this list (e.g. "roofings") must never reach
// that comparison. Kept in sync with Products.ts's own `category` field
// options; only used to decide whether the legacy-field fallback below is
// safe to include, never to validate anything else.
const LEGACY_CATEGORY_VALUES = new Set([
  'bolts-fasteners', 'steel-plates', 'sheet-pile', 'steel-bars', 'beams',
  'black-iron', 'galvanized-iron', 'copper', 'stainless', 'pipe-fittings',
  'fence-wire', 'ppe', 'electrical-cabling', 'steel-fabrication',
])

// The legacy `category` text field on Products stores the category's slug
// directly (not its label) -- same assumption ProductCatalog.tsx already
// makes when deriving `catSlug = p.categoryRef?.slug || p.category`.
async function findCategoryBySlug(payload: any, slug: string) {
  const res = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return res.docs[0] || null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const payload = await getPayloadClient()
    const category = await findCategoryBySlug(payload, slug)
    if (!category) return { title: 'Category Not Found', robots: { index: false, follow: false } }

    const title = category.label
    const description =
      category.description ||
      `Browse ${category.label} from Primegen Trading Corporation -- trusted steel and construction materials supplier based in Imus, Cavite, delivering nationwide across the Philippines. Request a quote today.`
    const canonicalPath = `/products/category/${category.slug}`

    return {
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        images: category.image?.url ? [{ url: cloudinaryOptimized(category.image.url)! }] : undefined,
      },
    }
  } catch {
    return { title: 'Category' }
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const category = await findCategoryBySlug(payload, slug)
  if (!category) notFound()

  const categoryFilters: any[] = [{ categoryRef: { equals: category.id } }]
  if (LEGACY_CATEGORY_VALUES.has(category.slug)) {
    categoryFilters.push({ category: { equals: category.slug } })
  }

  const productsRes = await payload.find({
    collection: 'products',
    where: { or: categoryFilters },
    limit: 200,
    sort: 'name',
    depth: 1,
  })
  const products = productsRes.docs as any[]

  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
  const categoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.label,
    description: category.description || `${category.label} available from Primegen Trading Corporation.`,
    url: `${siteUrl}/products/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteUrl}/products/${p.slug || p.id}`,
        name: p.name,
      })),
    },
  }

  return (
    <section className="min-h-screen bg-[#05100d] pt-24 md:pt-32 pb-16 md:pb-24 font-sans selection:bg-[#149911]/30 relative overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(categoryJsonLd) }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#149911]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="mb-8 md:mb-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/50 hover:text-[#149911] transition-colors mb-6"
          >
            &larr; All Products
          </Link>
          <h1 className="text-[32px] sm:text-[40px] md:text-[56px] font-medium text-[#fdfffc] tracking-tight leading-none mb-3 md:mb-4">
            {category.label}
          </h1>
          {category.description && (
            <p className="text-[14px] md:text-[16px] text-[#fdfffc]/60 max-w-[700px] leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="py-16 md:py-24 flex flex-col items-center justify-center text-center bg-[#0a1a15]/50 border border-[#fdfffc]/5 rounded-2xl px-4">
            <p className="text-[15px] md:text-[16px] text-[#fdfffc] mb-2">No products in this category yet</p>
            <Link href="/products" className="text-[13px] md:text-[14px] text-[#2dd4bf] hover:text-[#5eead4] transition-colors">
              Browse the full catalog &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {products.map((product) => {
              const imgUrl = cloudinaryOptimized(product.photo?.url) || null
              return (
                <div
                  key={product.id}
                  className="group bg-[#0a1a15] hover:bg-[#0c201a] border border-[#fdfffc]/5 hover:border-[#fdfffc]/10 rounded-2xl p-4 md:p-6 flex flex-col transition-all duration-300 h-full"
                >
                  <div className="w-full h-32 md:h-40 relative flex items-center justify-center mb-4 md:mb-6">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        className="object-contain transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="text-[#fdfffc]/20 text-[10px] uppercase tracking-widest font-bold">No Image</div>
                    )}
                  </div>

                  <span className="self-start bg-[#fdfffc]/5 border border-[#fdfffc]/10 text-[#fdfffc]/60 px-2 py-1 rounded-[4px] text-[9px] font-bold uppercase tracking-widest mb-3 md:mb-4">
                    {product.inStock !== false ? 'Available' : 'Out of Stock'}
                  </span>

                  <h3 className="text-[15px] md:text-[18px] font-medium text-[#fdfffc] leading-snug mb-3 md:mb-4 line-clamp-2">
                    {product.name}
                  </h3>

                  <Link
                    href={`/products/${product.slug || product.id}`}
                    className="mt-auto pt-3 md:pt-4 inline-flex items-center gap-2 text-[12px] md:text-[13px] font-medium text-[#2dd4bf] hover:text-[#5eead4] transition-colors"
                  >
                    View product
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
