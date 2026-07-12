'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Material = {
  id: string | number
  name: string
  category?: string
  description?: string
  unit?: string
  photo?: { url?: string; alt?: string }
}

export default function FeaturedDarkCarousel({ materials }: { materials: Material[] }) {
  const [selected, setSelected] = useState<Material | null>(null)

  if (materials.length === 0) return null

  return (
    <div className="w-full max-w-7xl py-6">
      <div className="flex items-center gap-4">
        {/* Horizontal Carousel Track */}
        <div className="flex-1 flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {materials.map((m) => (
            <Link key={m.id} href={"/materials"} className="flex h-full">
              <div
                onClick={() => setSelected(m)}
                className="relative flex-none w-[310px] h-[430px] rounded-[24px] overflow-hidden snap-start group cursor-pointer bg-neutral-900 max-[480px]:w-[80vw] max-[480px]:h-[500px]"
              >
                {/* Full-Bleed Background Image with subtle scale hover effect */}
                {m.photo?.url && (
                  <Image
                    src={m.photo.url}
                    alt={m.photo.alt || m.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}

                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#103900]/65 via-[#fdfffc]/25 to-[#01172f]/60 z-0" />

                {/* Translucent Floating Action Arrow (Top Right) */}
                <button
                  aria-label={`View details for ${m.name}`}
                  className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:bg-white/25 group-hover:scale-105 border border-white/10"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M7 17L17 7M17 7H8M17 7V16" />
                  </svg>
                </button>

                {/* Left-Aligned Bottom Information Layer */}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-2 text-white">
                  <h3 className="text-2xl font-bold tracking-tight leading-tight text-white">
                    {m.name}
                  </h3>
                  
                  {/* Notification Badge UI */}
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-md border border-white/10 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#149911] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#149911]"></span>
                    </span>
                    <p className="text-xs text-white font-medium tracking-wider uppercase">
                      In Stock
                    </p>
                  </div>
                  
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View-all arrow, beside the carousel */}
        <Link
          href="/materials"
          aria-label="View all materials"
          className="flex-shrink-0 w-14 h-14 rounded-full bg-[#e8e8ed] text-[#424245] flex items-center justify-center hover:bg-[#d2d2d7] transition-colors max-[640px]:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#149911" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}