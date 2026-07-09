'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Material = {
  id: string | number
  name: string
  category?: string
  description?: string
  photo?: { url?: string; alt?: string }
}

export default function FeaturedCarousel({ materials }: { materials: Material[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  function scroll(direction: 'left' | 'right') {
    trackRef.current?.scrollBy({ left: direction === 'right' ? 360 : -360, behavior: 'smooth' })
  }

  if (materials.length === 0) return null

  return (
    <div className="latest-carousel-wrap">
      <div className="latest-carousel" ref={trackRef}>
        {materials.map((m, index) => (
          <div key={m.id} className={`latest-card${index === 0 ? ' latest-card-dark' : ' latest-card-white'}`}>
            <p className="latest-card-label">{m.category?.replace('-', ' ') || 'Featured'}</p>
            <h3 className="latest-card-title">{m.name}</h3>
            {m.description && <p className="latest-card-sub">{m.description.slice(0, 80)}</p>}
            <div className="latest-card-image">
              {m.photo?.url && (
                <Image src={m.photo.url} alt={m.photo.alt || m.name} fill style={{ objectFit: 'cover' }} />
              )}
            </div>
            <Link
              href={`/quote?material=${m.id}`}
              className={index === 0 ? 'link-cta' : 'link-cta'}
              style={{ marginTop: 20, color: index === 0 ? 'white' : undefined }}
            >
              Request a Quote
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
      <Link href="/materials" className="latest-view-all">
      <button className="latest-scroll-btn right" onClick={() => scroll('right')} aria-label="Scroll right">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      </Link>
    </div>
  )
}
