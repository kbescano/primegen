'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const NAV_ITEMS = [
  { href: '/admin-dashboard', label: 'Quotation Inbox' },
  { href: '/admin-dashboard/client-quotation', label: 'Client Quotation' },
  { href: '/admin-dashboard/supplier-po', label: 'Supplier PO' },
  { href: '/admin-dashboard/reports', label: 'Reports' },
]

type AdminUser = { name?: string; email: string; role?: string }

export default function AdminLayout({
  children,
  user,
}: {
  children: React.ReactNode
  user?: AdminUser
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const displayName = user?.name?.trim() || user?.email

  async function handleLogout() {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // proceed to redirect regardless -- worst case the cookie just expires naturally
    }
    router.push('/admin-login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top bar ===== */}
      <header className="admin-header sticky top-0 z-40 bg-white border-b border-[#01172f]/10">
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 h-16">
          <div className="flex items-center gap-3">
            <p className="text-[14px] sm:text-[16px] font-black uppercase tracking-tight text-[#01172f] leading-none truncate">
              Dashboard
            </p>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center h-full px-4 text-[12px] font-bold uppercase tracking-[0.08em] border-b-2 transition-colors duration-200 ${
                    isActive
                      ? 'border-[#149911] text-[#01172f]'
                      : 'border-transparent text-[#01172f]/40 hover:text-[#01172f] hover:border-[#01172f]/15'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/"
              className="ml-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#01172f]/35 hover:text-[#149911] transition-colors"
            >
              &larr; Site
            </Link>
            <div className="ml-2 pl-2 border-l border-[#01172f]/10">
              <NotificationBell />
            </div>
          </nav>

          {/* Mobile: bell + hamburger */}
          <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
          <NotificationBell />
          <button
            className="flex items-center justify-center w-10 h-10 flex-shrink-0"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="flex flex-col gap-1.5 w-6 h-[15px] justify-center">
              <span className={`block h-[2px] w-full bg-[#01172f] transition-transform ${open ? 'translate-y-[6.5px] rotate-45' : ''}`} />
              <span className={`block h-[2px] w-full bg-[#01172f] transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-[2px] w-full bg-[#01172f] transition-transform ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
            </span>
          </button>
          </div>
        </div>
      </header>

      {/* ===== User bar -- sits below the nav, not inside it ===== */}
      {user && (
        <div className="admin-header bg-[#f4f6f2] border-b border-[#01172f]/10">
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 h-11">
            <span className="flex items-center gap-2 text-[12px] font-bold text-[#01172f]/60 truncate">
              Signed in as {displayName}
              {user.role && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-[#149911]/10 text-[#103900] flex-shrink-0">
                  {user.role}
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#01172f]/40 hover:text-red-600 transition-colors flex-shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* ===== Mobile full-screen overlay -- sibling of header, not nested ===== */}
      {open && (
        <div className="admin-header md:hidden fixed inset-0 bg-white z-50 flex flex-col px-6 pt-8 pb-10 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <p className="text-[16px] font-black uppercase tracking-tight text-[#01172f]">Dashboard</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#01172f" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`py-3.5 text-[20px] font-black uppercase tracking-tight border-b border-[#01172f]/10 ${
                    isActive ? 'text-[#149911]' : 'text-[#01172f]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="py-3.5 text-[14px] font-bold uppercase tracking-wide text-[#01172f]/40"
            >
              &larr; Back to Site
            </Link>
          </nav>
        </div>
      )}

      {/* ===== Main content ===== */}
      <main className="flex-1 min-w-0 bg-[#fbfbfd] p-6 md:p-10">
        {children}
      </main>

      <style>{`
        @media print {
          .admin-header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
