import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import { safeJsonLdStringify } from '@/lib/safeJsonLd'
import './globals.css'

// Self-hosted at build time (no runtime request to fonts.googleapis.com,
// and no render-blocking CSS @import) -- exposed as a CSS variable that
// tailwind.config.ts's fontFamily.sans reads, same family Tailwind's
// font-sans utility already expected.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // ✨ Swapped "Construction Materials" for "Steel & Building Materials" --
  // matches the page's own most-frequent content keywords (steel, building)
  // per RankMath's SEO analyzer, still 57 chars (under the ~60-char cutoff).
  title: {
    default: 'Primegen Trading Corporation | Steel & Building Materials',
    template: '%s | Primegen Trading Corporation',
  },
  icons: {
    icon: '/branding/primegen_trading_logo.png',
  },
  // ✨ Trimmed from 208 to 155 chars -- RankMath flags anything over 160 as
  // likely truncated in SERPs; still names the core product categories.
  description:
    'Primegen Trading Corporation supplies steel bars, pipes, roofing, fencing, and PPE to contractors across Cavite and the Philippines. Request a quote today.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: siteUrl,
    siteName: 'Primegen Trading Corporation',
    title: 'Primegen Trading Corporation | Steel & Building Materials',
    description:
      'Primegen Trading Corporation supplies steel bars, pipes, roofing, fencing, and PPE to contractors across Cavite and the Philippines. Request a quote today.',
    images: [
      {
        // ✨ was '/branding/primegen-logo.png' (hyphen) -- standardized to
        // the underscore filename, which is the one confirmed to actually
        // exist (it's the file rendering in your live site header)
        url: '/branding/primegen_trading_logo.png',
        width: 1200,
        height: 630,
        alt: 'Primegen Trading Corporation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Primegen Trading Corporation | Steel & Building Materials',
    description:
      'Primegen Trading Corporation supplies steel bars, pipes, roofing, fencing, and PPE to contractors across Cavite and the Philippines. Request a quote today.',
    images: ['/branding/primegen_trading_logo.png'],
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HardwareStore',
  name: 'Primegen Trading Corporation',
  image: `${siteUrl}/branding/primegen_trading_logo.png`,
  url: siteUrl,
  telephone: '+63-917-185-9127',
  email: 'sales@primegentradingcorp.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Southern City Homes, YG Building, Cebu St, 4 Tanzang Luma',
    addressLocality: 'Imus',
    addressRegion: 'Cavite',
    postalCode: '4103',
    addressCountry: 'PH',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 14.4297,
    longitude: 120.9367,
  },
  areaServed: {
    '@type': 'Country',
    name: 'Philippines',
  },
  priceRange: '$$',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(localBusinessJsonLd) }}
        />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  )
}