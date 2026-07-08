'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin-dashboard', label: 'Quotation Inbox' },
  { href: '/admin-dashboard/suppliers', label: 'Suppliers' },
]

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        className="dashboard-topbar"
        style={{
          display: 'none',
          background: '#143109',
          color: 'white',
          padding: '14px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16 }}>Dashboard</span>
        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer' }}
        >
          {open ? 'X' : '='}
        </button>
      </div>

      <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>
        <aside
          className={`dashboard-sidebar${open ? ' open' : ''}`}
          style={{
            width: 220,
            background: '#143109',
            color: 'white',
            padding: '28px 18px',
            flexShrink: 0,
            borderRight: '3px solid #b5bfa1',
          }}
        >
          <h2 style={{ color: 'white', fontSize: 17, marginBottom: 36, fontWeight: 800 }}>Dashboard</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  color: '#e4e8dc',
                  textDecoration: 'none',
                  padding: '11px 14px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="dashboard-main" style={{ flex: 1, padding: 32, minWidth: 0, background: '#ffffff' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-topbar { display: flex !important; }
          .dashboard-sidebar {
            position: fixed;
            top: 53px;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            z-index: 39;
            overflow-y: auto;
          }
          .dashboard-sidebar.open {
            transform: translateX(0);
          }
          .dashboard-main {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
