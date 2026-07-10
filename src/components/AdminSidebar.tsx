'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation' // Added to track active link state

const NAV_ITEMS = [
  { href: '/admin-dashboard', label: 'Quotation Inbox' },
  { href: '/admin-dashboard/suppliers', label: 'Suppliers' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Horizontal Navigation Bar */}
      <header
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

        {/* Right Side: Links */}
        <nav
          className="top-nav"
          style={{ 
            display: 'flex', 
            gap: 24, 
            height: '100%',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive ? '#1d1d1f' : '#6e6e73', // Black for active, gray for inactive
                  textDecoration: 'none',
                  fontSize: 14,
                  height: '100%',
                  boxSizing: 'border-box',
                  // Bottom border mimicking the active state in the image
                  borderBottom: isActive ? '2px solid #1d1d1f' : '2px solid transparent',
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 32, minWidth: 0, backgroundColor: '#fbfbfd' }}>
        {children}
      </main>

      <style>{`
        /* Add horizontal scroll for mobile devices so the links don't crowd/break */
        @media (max-width: 600px) {
          .top-nav {
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
          }
          .top-nav::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}