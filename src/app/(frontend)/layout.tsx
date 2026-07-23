import type { ReactNode } from 'react'
import SiteHeader from '@/components/SiteHeader'
import './globals.css'

export const metadata = {
  title: 'Primegen Trading Corporation',
  description: 'Construction products trading -- cement, steel, aggregates, and more.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  )
}
