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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-8 md:gap-y-14"
    >
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          href={`/materials#${cat.slug}`}
          className={`group flex flex-col outline-none cursor-pointer transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none
            ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}
          // The staggered delay remains intact
          style={{ transitionDelay: `${i * 75}ms` }}
        >
          {/* High-end Image Container */}
          <div className="relative w-full aspect-[4/5] bg-[#f8f9f7] overflow-hidden">
            {cat.image?.url ? (
              <Image
                src={cat.image.url}
                alt={cat.image.alt || cat.label}
                fill
                className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                No Image
              </div>
            )}
            
            {/* Subtle darkening overlay on hover */}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/[0.03]" />
          </div>

          {/* Clean, Stacked Typography */}
          <div className="flex flex-col mt-4 md:mt-5">
            <h3 className="text-[15px] md:text-[17px] font-medium tracking-tight text-[#01172f] leading-snug transition-colors duration-300">
              {cat.label}
            </h3>
            
            <span className="mt-1.5 md:mt-2 flex items-center gap-2 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em] text-[#01172f]/40 group-hover:text-[#103900] transition-colors duration-300">
              Browse
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}