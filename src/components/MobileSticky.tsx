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
      href="/materials"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`min-[641px]:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 backdrop-blur-md text-[#143109] text-sm font-bold shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-black/5 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      Materials
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}