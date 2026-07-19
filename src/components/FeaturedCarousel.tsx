'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Category = {
  id: string | number
  label: string
  slug: string
  image?: { url?: string; alt?: string }
}

export default function FeaturedCarousel({ categories }: { categories: Category[] }) {
  const [revealed, setRevealed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // This triggers every time the element enters OR leaves the screen.
        // It resets the animation when scrolling away, and replays it when scrolling back.
        setRevealed(entry.isIntersecting)
      },
      {
        threshold: 0.1, // Triggers when 10% of the grid is visible
        rootMargin: '0px'
      }
    )

    observer.observe(container)

    return () => {
      if (container) observer.unobserve(container)
    }
  }, [])

  if (categories.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
    >
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          href={`/materials#${cat.slug}`}
          className={`group relative flex items-end aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[#f8f9f7] outline-none transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none
            ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}
          // The staggered delay remains intact
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          {/* Full-bleed hero image */}
          {cat.image?.url ? (
            <Image
              src={cat.image.url}
              alt={cat.image.alt || cat.label}
              fill
              className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
              No Image
            </div>
          )}

          {/* Gradient so white text stays legible over any photo */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Eyebrow + bold header + Discover link, bottom-left */}
          <div className="relative z-10 p-6 md:p-10 flex flex-col gap-2 md:gap-3 text-white">
            <h3 className="text-[white] text-[28px] md:text-[36px] font-bold uppercase tracking-tight leading-[1.05]">
              {cat.label}
            </h3>
            <span className="mt-2 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em]">
              Browse
              <span className="flex items-center justify-center w-7 h-7 rounded-full border border-white/50 transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}