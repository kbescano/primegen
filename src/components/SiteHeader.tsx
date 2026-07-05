'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/about', label: 'About' },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`site-header${scrolled ? ' scrolled' : ''}`}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(20, 49, 9, 0.15)',
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
      >
        <Link
          href="/"
          className="brand-wordmark"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 20,
            color: '#143109',
            textDecoration: 'none',
          }}
          onClick={() => setOpen(false)}
        >
          <span className="brand-mark" />
          Primegen Trading Corporation
        </Link>

        <button
          className={`hamburger mobile-nav-toggle${open ? ' open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className="desktop-nav-links">
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
              <Link
                href={link.href}
                className={`nav-link-item${pathname === link.href ? ' active' : ''}`}
                style={{ color: 'rgba(20, 49, 9, 0.85)', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}
              >
                {link.label}
              </Link>
              {i < NAV_LINKS.length - 1 && <span className="nav-divider" />}
            </span>
          ))}
          <Link href="/quote" className="btn btn-primary">
            Request a Quote
          </Link>
        </nav>

        <div className={`mobile-nav-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

        <div className={`mobile-nav-panel${open ? ' open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="mnp-row" onClick={() => setOpen(false)}>
              <span>{link.label}</span>
              <span className="mnp-chevron">&gt;</span>
            </Link>
          ))}
          <div className="mnp-cta-wrap">
            <Link
              href="/quote"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setOpen(false)}
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
