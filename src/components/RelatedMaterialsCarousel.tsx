'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Material = {
  id: string | number
  name: string
  photo?: { url?: string; alt?: string }
}

export default function RelatedMaterialsCarousel({ materials }: { materials: Material[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const showArrows = materials.length > 3

  function updateScrollState() {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    updateScrollState()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [materials.length])

  function scroll(direction: 'left' | 'right') {
    trackRef.current?.scrollBy({ left: direction === 'right' ? 340 : -340, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div ref={trackRef} className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {materials.map((m) => (
          <Link
            key={m.id}
            href={`/materials/${m.id}`}
            className="relative flex flex-col flex-none w-[300px] h-[380px] snap-start bg-white border border-black/10 rounded-2xl overflow-hidden no-underline"
          >
            <h3 className="text-lg font-bold m-5 mb-3">{m.name}</h3>
            <div className="relative flex-1 bg-sage-tint">
              {m.photo?.url && <Image src={m.photo.url} alt={m.photo.alt || m.name} fill className="object-cover" />}
              <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {showArrows && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="hidden sm:flex absolute top-1/2 -left-2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-black/10 shadow items-center justify-center text-black z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      {showArrows && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="hidden sm:flex absolute top-1/2 -right-2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-black/10 shadow items-center justify-center text-black z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}
