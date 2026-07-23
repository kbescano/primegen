'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MobileStickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300)
    }
    onScroll() // set correct state on mount
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Link
      href="/products"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`min-[641px]:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-white border-2 border-[#3D5F3B] text-[#3D5F3B] text-[12px] font-bold uppercase tracking-[0.1em] shadow-[0_4px_16px_-4px_rgba(1,23,47,0.15)] transition-all duration-300 active:scale-95 active:bg-[#3D5F3B] active:text-white ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      Products
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}
