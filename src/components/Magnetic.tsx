'use client'

import { useEffect, useRef, type ReactNode } from 'react'

// Wraps a button/link so it leans toward the pointer. The hit area extends
// ~16px past the child on every side; listeners live on that wrapper only
// (nothing global), and do nothing on touch devices or with reduced motion.
export default function Magnetic({
  children,
  strength = 0.32,
  className = '',
  fill = false,
}: {
  children: ReactNode
  strength?: number
  className?: string
  // Stretch the child to the wrapper's width (for full-width / flex-1 buttons).
  fill?: boolean
}) {
  const outer = useRef<HTMLSpanElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    let raf = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // The outer wrapper never moves, so its centre is the rest position.
        const r = o.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) * strength
        const dy = (e.clientY - (r.top + r.height / 2)) * strength
        i.style.transition = 'transform 120ms ease-out'
        i.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
      })
    }
    const leave = () => {
      cancelAnimationFrame(raf)
      i.style.transition = 'transform 600ms cubic-bezier(0.2, 1.4, 0.4, 1)'
      i.style.transform = 'translate3d(0, 0, 0)'
    }
    o.addEventListener('pointermove', move)
    o.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      o.removeEventListener('pointermove', move)
      o.removeEventListener('pointerleave', leave)
    }
  }, [strength])

  return (
    <span ref={outer} className={`${fill ? 'block' : 'inline-block'} p-4 -m-4 ${className}`}>
      <span ref={inner} className={`${fill ? 'block' : 'inline-block'} will-change-transform`}>
        {children}
      </span>
    </span>
  )
}
