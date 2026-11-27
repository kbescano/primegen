'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import { buildNav, DEAL_ORIGIN_KEY, isDealPath } from '@/lib/adminNav'

type AdminUser = { name?: string; email: string; role?: string }

// Pages that used to be reachable only by typing the URL. Backup and the
// Facebook import are limited to these roles by their own API routes too.
const UTILITY_ROLES = ['admin', 'marketing']

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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLElement>(null)

  const displayName = user?.name?.trim() || user?.email || ''
  const isAdmin = user?.role === 'admin'
  const userRole = user?.role || 'user'
  const canUseUtilities = UTILITY_ROLES.includes(userRole)

  // What this role may see, with the current page's section and tab marked.
  const sections = buildNav(userRole, pathname)
  const activeSection = sections.find((s) => s.active)
  const subTabs = activeSection?.tabs ?? []
  // Marketing's landing page is not the inbox (that redirects them to the
  // public site), so "home" is simply the first section they can see.
  const homeHref = sections[0]?.href ?? '/admin-dashboard'

  async function handleLogout() {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // proceed to redirect regardless
    }
    router.push('/admin-login')
    router.refresh()
  }

  // Close both menus whenever the page changes.
  useEffect(() => {
    setOpen(false)
    setMenuOpen(false)
  }, [pathname])

  // On a narrow screen the section tabs scroll sideways; keep the current one
  // in view (e.g. "Supplier POs" would otherwise sit off the right edge).
  useEffect(() => {
    const bar = tabsRef.current
    const current = bar?.querySelector<HTMLElement>('[aria-current="page"]')
    if (bar && current) {
      bar.scrollLeft = current.offsetLeft - (bar.clientWidth - current.clientWidth) / 2
    }
  }, [pathname])

  // Account menu: close on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  // Remember which list a deal was opened from (filters included) so the
  // workflow page's back arrow can return there. Recorded at click time, in
  // the capture phase, so it sees the URL the person is leaving.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      let target: URL
      try {
        target = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (target.origin !== window.location.origin || !isDealPath(target.pathname)) return
      // Moving between workflow pages is not a new origin.
      if (isDealPath(window.location.pathname)) return
      try {
        sessionStorage.setItem(DEAL_ORIGIN_KEY, window.location.pathname + window.location.search)
      } catch {
        // storage unavailable -- back falls back to the deals list
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top bar ===== */}
      <header className="admin-header sticky top-0 z-40 bg-white border-b border-[#01172f]/10">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 md:px-10 h-14">
          <Link
            href={homeHref}
            className="text-[14px] sm:text-[16px] font-black uppercase tracking-tight text-[#01172f] leading-none truncate flex-shrink-0"
          >
            Dashboard
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden md:flex items-center gap-1 h-full flex-1 md:ml-6">
            {sections.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                aria-current={section.active ? 'page' : undefined}
                className={`flex items-center h-full px-3 xl:px-4 text-[12px] font-bold uppercase tracking-[0.08em] border-b-2 transition-colors duration-200 ${
                  section.active
                    ? 'border-[#149911] text-[#01172f]'
                    : 'border-transparent text-[#01172f]/50 hover:text-[#01172f] hover:border-[#01172f]/15'
                }`}
              >
                {section.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: bell + account menu */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <NotificationBell role={isAdmin ? 'admin' : 'user'} />
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 h-10 pl-1.5 pr-2.5 rounded-full border border-[#01172f]/10 hover:border-[#01172f]/25 transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#01172f] text-white text-[12px] font-bold uppercase">
                    {displayName.charAt(0) || '?'}
                  </span>
                  <span className="hidden lg:block max-w-[130px] truncate text-[13px] font-semibold text-[#01172f]">{displayName}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#01172f" strokeWidth="3" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#01172f]/10 shadow-lg rounded-xl py-2 z-50"
                  >
                    <div className="px-4 pb-3 mb-1 border-b border-[#01172f]/10">
                      <p className="text-[13px] font-bold text-[#01172f] truncate">{displayName}</p>
                      {user.name && user.email && (
                        <p className="text-[12px] text-[#01172f]/50 truncate">{user.email}</p>
                      )}
                      {user.role && (
                        <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-[#149911]/10 text-[#103900]">
                          {user.role}
                        </span>
                      )}
                    </div>
                    <MenuLink href="/admin-dashboard/account" active={pathname === '/admin-dashboard/account'}>
                      Account &amp; security
                    </MenuLink>
                    {canUseUtilities && (
                      <>
                        <MenuLink href="/admin-dashboard/db-backup" active={pathname === '/admin-dashboard/db-backup'}>
                          Data backup
                        </MenuLink>
                        <MenuLink
                          href="/admin-dashboard/facebook-import"
                          active={pathname === '/admin-dashboard/facebook-import'}
                        >
                          Import from Facebook
                        </MenuLink>
                      </>
                    )}
                    <MenuLink href="/">View website</MenuLink>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 mt-1 border-t border-[#01172f]/10 text-[13px] font-semibold text-[#01172f]/70 hover:text-red-600 hover:bg-red-50/60 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile: bell + hamburger */}
          <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
            <NotificationBell role={isAdmin ? 'admin' : 'user'} />
            <button
              className="flex items-center justify-center w-10 h-10 flex-shrink-0"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
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

      {/* ===== Section tabs (only where a section has more than one page) ===== */}
      {subTabs.length > 1 && (
        <div className="admin-header bg-[#f4f6f2] border-b border-[#01172f]/10">
          <nav
            ref={tabsRef}
            aria-label={`${activeSection?.label} pages`}
            className="relative flex items-center gap-1 px-4 sm:px-6 md:px-10 h-11 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {subTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.active ? 'page' : undefined}
                className={`flex-shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                  tab.active
                    ? 'bg-[#01172f] text-white'
                    : 'text-[#01172f]/60 hover:text-[#01172f] hover:bg-[#01172f]/5'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* ===== Mobile full-screen overlay ===== */}
      {open && (
        <div className="admin-header md:hidden fixed inset-0 bg-white z-50 flex flex-col px-6 pt-6 pb-10 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[16px] font-black uppercase tracking-tight text-[#01172f]">Dashboard</p>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#01172f" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav aria-label="Main" className="flex flex-col">
            {sections.map((section) =>
              section.tabs.length > 1 ? (
                <div key={section.key} className="mt-3 first:mt-0 border-b border-[#01172f]/10">
                  {/* The heading is a link too (to the section's first page). */}
                  <Link
                    href={section.href}
                    onClick={() => setOpen(false)}
                    className={`block py-3 text-[20px] font-black uppercase tracking-tight ${
                      section.active ? 'text-[#149911]' : 'text-[#01172f]'
                    }`}
                  >
                    {section.label}
                  </Link>
                  <div className="flex flex-col pb-2 pl-4 border-l-2 border-[#01172f]/10 ml-1">
                    {section.tabs.map((tab) => (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setOpen(false)}
                        aria-current={tab.active ? 'page' : undefined}
                        className={`py-2 text-[16px] font-bold ${
                          tab.active ? 'text-[#149911]' : 'text-[#01172f]/70'
                        }`}
                      >
                        {tab.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={section.key}
                  href={section.href}
                  onClick={() => setOpen(false)}
                  aria-current={section.active ? 'page' : undefined}
                  className={`mt-3 first:mt-0 py-3 text-[20px] font-black uppercase tracking-tight border-b border-[#01172f]/10 ${
                    section.active ? 'text-[#149911]' : 'text-[#01172f]'
                  }`}
                >
                  {section.label}
                </Link>
              ),
            )}
          </nav>

          {user && (
            <div className="mt-8 flex flex-col">
              <p className="flex items-center gap-2 text-[12px] font-bold text-[#01172f]/60 mb-1">
                <span className="truncate">Signed in as {displayName}</span>
                {user.role && (
                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-[#149911]/10 text-[#103900] flex-shrink-0">
                    {user.role}
                  </span>
                )}
              </p>
              <OverlayLink href="/admin-dashboard/account" onNavigate={() => setOpen(false)} active={pathname === '/admin-dashboard/account'}>
                Account &amp; security
              </OverlayLink>
              {canUseUtilities && (
                <>
                  <OverlayLink href="/admin-dashboard/db-backup" onNavigate={() => setOpen(false)} active={pathname === '/admin-dashboard/db-backup'}>
                    Data backup
                  </OverlayLink>
                  <OverlayLink href="/admin-dashboard/facebook-import" onNavigate={() => setOpen(false)} active={pathname === '/admin-dashboard/facebook-import'}>
                    Import from Facebook
                  </OverlayLink>
                </>
              )}
              <OverlayLink href="/" onNavigate={() => setOpen(false)}>
                &larr; Back to site
              </OverlayLink>
              <button
                onClick={handleLogout}
                className="text-left py-3 text-[15px] font-bold text-red-600"
              >
                Log out
              </button>
            </div>
          )}
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

function MenuLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      aria-current={active ? 'page' : undefined}
      className={`block px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#f4f6f2] ${
        active ? 'text-[#149911]' : 'text-[#01172f]/80 hover:text-[#01172f]'
      }`}
    >
      {children}
    </Link>
  )
}

function OverlayLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string
  active?: boolean
  onNavigate: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`py-3 text-[15px] font-bold ${active ? 'text-[#149911]' : 'text-[#01172f]/70'}`}
    >
      {children}
    </Link>
  )
}
