'use client'

import { useEffect } from 'react'

// Publishes the page's scroll progress (0-1) as --page-p on <html>, for CSS
// that reacts to scroll (the drifting watermark text). Renders nothing.
export default function ScrollProgressVar() {
  useEffect(() => {
    const root = document.documentElement
    let raf = 0
    const update = () => {
      raf = 0
      const max = root.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      root.style.setProperty('--page-p', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      root.style.removeProperty('--page-p')
    }
  }, [])
  return null
}
