'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin-dashboard', label: 'Quotation Inbox' },
  { href: '/admin-dashboard/supplier-po', label: 'Supplier PO' },
  { href: '/admin-dashboard/client-quotation', label: 'Client Quotation' }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Horizontal Navigation Bar */}
      <header
        className="admin-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '52px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #d2d2d7',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Left Side: Brand / Title */}
        <span style={{ fontWeight: 600, fontSize: 21, color: '#1d1d1f' }}>
          Dashboard
        </span>

        {/* Desktop Links (hidden on mobile via CSS below) */}
        <nav className="top-nav" style={{ display: 'flex', gap: 24, height: '100%' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive ? '#1d1d1f' : '#6e6e73',
                  textDecoration: 'none',
                  fontSize: 14,
                  height: '100%',
                  boxSizing: 'border-box',
                  borderBottom: isActive ? '2px solid #1d1d1f' : '2px solid transparent',
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Hamburger (mobile only, hidden on desktop via CSS below) */}
        <button
          className="nav-hamburger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: 5,
            width: 24,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <span style={{ display: 'block', height: 2, width: '100%', background: '#1d1d1f', borderRadius: 2 }} />
          <span style={{ display: 'block', height: 2, width: '100%', background: '#1d1d1f', borderRadius: 2 }} />
          <span style={{ display: 'block', height: 2, width: '100%', background: '#1d1d1f', borderRadius: 2 }} />
        </button>
      </header>

      {/* Mobile full-screen overlay -- sibling of header, same pattern as the homepage nav */}
      {open && (
        <div
          className="admin-header"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#ffffff',
            zIndex: 999,
            padding: 28,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginBottom: 24 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '14px 0',
                  fontSize: 22,
                  fontWeight: 700,
                  color: isActive ? '#103900' : '#1d1d1f',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 32, minWidth: 0, backgroundColor: '#fbfbfd' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 600px) {
          .top-nav {
            display: none !important;
          }
          .nav-hamburger {
            display: flex !important;
          }
        }

        @media print {
          .admin-header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}