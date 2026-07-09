'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FloatingCarouselWrap,
  FloatingScrollButton,
  CarouselTrack,
  ProductCard,
  ProductCardTitle,
  ProductCardImage,
  HoverArrow,
  LinkCta,
} from '@/components/ui/styled'

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
    <FloatingCarouselWrap>
      <CarouselTrack ref={trackRef}>
        {materials.map((m) => (
          <ProductCard key={m.id} as={Link} href={`/materials/${m.id}`} style={{ textDecoration: 'none' }}>
            <ProductCardTitle>{m.name}</ProductCardTitle>
            <ProductCardImage>
              {m.photo?.url && <Image src={m.photo.url} alt={m.photo.alt || m.name} fill style={{ objectFit: 'cover' }} />}
              <HoverArrow className="hover-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </HoverArrow>
            </ProductCardImage>
          </ProductCard>
        ))}
      </CarouselTrack>

      {showArrows && canScrollLeft && (
        <FloatingScrollButton $side="left" onClick={() => scroll('left')} aria-label="Scroll left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </FloatingScrollButton>
      )}
      {showArrows && canScrollRight && (
        <FloatingScrollButton $side="right" onClick={() => scroll('right')} aria-label="Scroll right">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </FloatingScrollButton>
      )}
    </FloatingCarouselWrap>
  )
}
