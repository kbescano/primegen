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
    <header className="bg-white/95 backdrop-blur-md py-3.5 sticky top-0 z-50 border-b border-green/15">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-20 flex items-center justify-between relative">
        <Link href="/" className="font-bold text-sm text-green" onClick={() => setOpen(false)}>
          Primegen Trading Corporation
        </Link>

        <button
          className="flex md:hidden flex-col gap-1.5 w-6 h-[17px] bg-transparent border-none cursor-pointer"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`block h-0.5 w-full bg-black rounded transition-transform ${open ? 'translate-y-[7.5px] rotate-45' : ''}`} />
          <span className={`block h-0.5 w-full bg-black rounded transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-full bg-black rounded transition-transform ${open ? '-translate-y-[7.5px] -rotate-45' : ''}`} />
        </button>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center gap-7">
              <Link
                href={link.href}
                className={`relative text-xs font-medium text-green/85 pb-1 border-b-2 ${pathname === link.href ? 'border-sage' : 'border-transparent hover:border-sage'} transition-colors`}
              >
                {link.label}
              </Link>
            </span>
          ))}
          <Link href="/quote" className="inline-flex items-center justify-center px-7 py-3.5 rounded bg-sage text-white font-bold text-xs hover:bg-green-hover transition-colors">
            Request a Quote
          </Link>
        </nav>

        {open && (
          <div className="md:hidden fixed inset-0 bg-white z-[999] p-7 overflow-y-auto flex flex-col">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="self-end p-2 mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block py-3.5 text-xl font-bold text-black" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/quote" className="block py-3.5 text-xl font-bold text-green" onClick={() => setOpen(false)}>
              Request a Quote
            </Link>
          </div>
        )}

      </div>
    </header>
  )
}
