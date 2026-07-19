'use client'

import { useEffect, useRef, useState, ElementType, ReactNode, CSSProperties } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  as?: ElementType
  id?: string
  style?: CSSProperties
  direction?: 'up' | 'left'
  [key: string]: any
}

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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true)
          observer.unobserve(currentElement)
        }
      },
      { threshold: 0.1, rootMargin: '0px' }
    )

    observer.observe(currentElement)

    const rect = currentElement.getBoundingClientRect()
    if (rect.top >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)) {
      setHasRevealed(true)
      observer.unobserve(currentElement)
    }

    return () => {
      if (currentElement) observer.unobserve(currentElement)
    }
  }, [])

  const hiddenTransform = direction === 'left' ? '-translate-x-10' : 'translate-y-10'
  const revealedTransform = direction === 'left' ? 'translate-x-0' : 'translate-y-0'

  return (
    <Component
      id={id}
      ref={elementRef}
      style={style}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none
        ${hasRevealed ? `opacity-100 ${revealedTransform}` : `opacity-0 ${hiddenTransform}`}
        ${className}
      `}
      {...rest}
    >
      {children}
    </Component>
  )
}
