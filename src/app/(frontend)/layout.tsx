import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Primegen Trading Corporation | Steel & Construction Materials Supplier',
    template: '%s | Primegen Trading Corporation',
  },
  description:
    'Construction products trading -- cement, steel, aggregates, and more. Serving contractors and builders across Cavite and the Philippines.',
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: siteUrl,
    siteName: 'Primegen Trading Corporation',
    title: 'Primegen Trading Corporation | Steel & Construction Materials Supplier',
    description:
      'Construction products trading -- cement, steel, aggregates, and more. Serving contractors and builders across Cavite and the Philippines.',
    images: [
      {
        url: '/branding/primegen_trading_logo.png',
        width: 1200,
        height: 630,
        alt: 'Primegen Trading Corporation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Primegen Trading Corporation | Steel & Construction Materials Supplier',
    description:
      'Construction products trading -- cement, steel, aggregates, and more. Serving contractors and builders across Cavite and the Philippines.',
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
  priceRange: '$$',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  )
}
