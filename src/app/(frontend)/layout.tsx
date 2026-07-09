import type { ReactNode } from 'react'
import SiteHeader from '@/components/SiteHeader'
import StyledComponentsRegistry from '@/components/StyledComponentsRegistry'
import './globals.css'

export const metadata = {
  title: 'Primegen Trading Corporation',
  description: 'Construction materials trading -- cement, steel, aggregates, and more.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <SiteHeader />
          <main>{children}</main>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
