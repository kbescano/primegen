'use client'

import { useEffect, useRef, useState, ElementType, ReactNode, CSSProperties } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  as?: ElementType
  id?: string
  style?: CSSProperties
  direction?: 'up' | 'left' | 'none'
  [key: string]: any
}

// Max time we'll wait for the IntersectionObserver before forcing the
// element visible anyway. This is the safety net: no matter what goes
// wrong with layout timing, viewport quirks, or the observer never
// firing, the element WILL become visible and clickable eventually.
const REVEAL_FALLBACK_MS = 1200

export default function ScrollReveal({
  children,
  className = '',
  as: Component = 'div',
  id,
  style,
  direction = 'up',
  ...rest
}: ScrollRevealProps) {
  const [hasRevealed, setHasRevealed] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const currentElement = elementRef.current
    if (!currentElement) return

    let settled = false
    const reveal = () => {
      if (settled) return
      settled = true
      setHasRevealed(true)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          observer.unobserve(currentElement)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px 200px 0px' } // trigger a bit early instead of exactly at the fold
    )

    observer.observe(currentElement)

    // Immediate check in case it's already in view on mount
    const rect = currentElement.getBoundingClientRect()
    if (rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)) {
      reveal()
      observer.unobserve(currentElement)
    }

    // Safety net: whatever the cause (layout shift before paint, observer
    // never firing, viewport chrome resize on mobile, etc.), never leave
    // an element permanently hidden/unclickable.
    const fallbackTimer = window.setTimeout(reveal, REVEAL_FALLBACK_MS)

    return () => {
      settled = true
      window.clearTimeout(fallbackTimer)
      observer.unobserve(currentElement)
    }
  }, [])

  const hiddenTransform =
    direction === 'none' ? '' : direction === 'left' ? '-translate-x-10' : 'translate-y-10'
  const revealedTransform =
    direction === 'none' ? '' : direction === 'left' ? 'translate-x-0' : 'translate-y-0'

  return (
    <Component
      id={id}
      ref={elementRef}
      style={{ touchAction: 'manipulation', ...style }}
      className={`transition-[opacity,transform] duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none pointer-events-auto
        ${hasRevealed ? `opacity-100 ${revealedTransform}` : `opacity-0 ${hiddenTransform}`}
        ${className}
      `}
      {...rest}
    >
      {children}
    </Component>
  )
}