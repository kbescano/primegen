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
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Horizontal Carousel Track */}
      <div className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {materials.map((m) => (
             <Link key={m.id} href={"/materials"} className="flex items-center justify-center w-full h-full">
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            className="relative flex-none w-[310px] h-[430px] rounded-[24px] overflow-hidden snap-start group cursor-pointer shadow-lg bg-neutral-900 max-[480px]:w-[80vw] max-[480px]:h-[400px]"
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

            {/* Premium Gradient Overlay (Darkens bottom heavily for text legibility, softens top) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />

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
            <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-1 text-white">
              <h3 className="text-2xl font-bold tracking-tight leading-tight text-white">
                {m.name}
              </h3>
              
              <p className="text-sm text-gray-300 font-medium tracking-wide opacity-95">
                In Stock
              </p>
            </div>
          </div>
             </Link>
        ))}
      </div>
    </div>
  )
}