import type { ReactNode } from 'react'
import SiteHeader from '@/components/SiteHeader'
import './globals.css'

export const metadata = {
  title: 'Primegen Trading Corporation',
  description: 'Construction materials trading — cement, steel, aggregates, and more.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer
          style={{
            background: 'var(--color-ink)',
            color: 'rgba(255,255,255,0.65)',
            padding: '44px 0 36px',
            marginTop: 0,
            fontSize: 14,
            borderTop: '3px solid var(--color-forest)',
          }}
        >
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className="brand-mark" />
              <p style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, margin: 0 }}>
                Primegen Trading Corporation
              </p>
            </div>
            <p style={{ margin: 0 }}>
              © {new Date().getFullYear()} All rights reserved. Serving contractors and homeowners
              with quality construction materials.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}