'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/about', label: 'About' },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header
      style={{
        background: '#ffffff',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: 19,
            color: '#000000',
            textDecoration: 'none',
          }}
          onClick={() => setOpen(false)}
        >
          Primegen Trading Corporation
        </Link>

        <button
          className={`hamburger mobile-nav-toggle${open ? ' open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 4, width: 24, height: 17 }}
        >
          <span style={{ display: 'block', height: 2, width: '100%', borderRadius: 2 }} />
          <span style={{ display: 'block', height: 2, width: '100%', borderRadius: 2 }} />
          <span style={{ display: 'block', height: 2, width: '100%', borderRadius: 2 }} />
        </button>

        <nav className="nav-links" style={{ display: open ? 'flex' : undefined }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-item${pathname === link.href ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/quote" className="btn btn-primary">
            Request a Quote
          </Link>
        </nav>
      </div>
    </header>
  )
}
