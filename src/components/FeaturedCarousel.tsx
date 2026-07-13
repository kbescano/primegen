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

export default function FeaturedMaterialsGrid({ materials }: { materials: Material[] }) {
  const [selected, setSelected] = useState<Material | null>(null)

  if (materials.length === 0) return null

  return (
    <div className="w-full max-w-[1360px] mx-auto py-16 px-4 md:px-6 lg:px-8">
      {/* Editorial Section Header */}

      {/* Grid Layout (Airbnb/Petra Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {materials.map((m) => (
          <Link 
            key={m.id} 
            href="/materials" 
            className="group flex flex-col bg-white rounded-[32px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] ring-1 ring-gray-100 hover:ring-gray-200 transition-all duration-500 ease-out hover:-translate-y-1 outline-none"
            onClick={() => setSelected(m)}
          >
            {/* Image Container with Top Tags and Bottom Dots */}
            <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden mb-5 bg-[#f5f5f7]">
              {m.photo?.url ? (
                <>
                  <Image
                    src={m.photo.url}
                    alt={m.photo.alt || m.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Subtle vignette for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                  Image Unavailable
                </div>
              )}

              {/* Top Left Glassy Tags */}
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                {m.category && (
                  <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[#01172f] text-[12px] font-medium tracking-wide ring-1 ring-white/30 shadow-sm capitalize transition-colors duration-300 group-hover:bg-white/30">
                    {m.category.replace('-', ' ')}
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[#01172f] text-[12px] font-medium tracking-wide ring-1 ring-white/30 shadow-sm transition-colors duration-300 group-hover:bg-white/30">
                  Premium
                </span>
              </div>
            </div>

            {/* Content & Typography Layer */}
            <div className="px-2 pb-2 flex flex-col flex-1">
              {/* Header Row */}
              <div className="flex justify-between items-start mb-1.5 gap-4">
                <h3 className="text-[22px] font-semibold tracking-tight text-gray-900 leading-snug truncate">
                  {m.name}
                </h3>
              </div>

              {/* Subtitle */}
              <p className="text-[14px] text-gray-500 font-medium mb-2.5">
                Ready to Ship • {m.unit || 'Bulk Available'}
              </p>

              {/* Description */}
              <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-2 font-light mb-6">
                {m.description || 'High-grade building material optimized for structural integrity and long-lasting durability in demanding conditions.'}
              </p>

              {/* Footer Row (Price & Action) */}
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-[16px] font-semibold text-gray-900 tracking-tight">
                    In Stock <span className="font-normal text-gray-500 text-[14px]">/ Verified</span>
                  </span>
                </div>

                {/* Animated Pill Button */}
                <div className="flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full bg-[#01172f] text-white transition-colors duration-300 group-hover:bg-[#103900]">
                  <span className="text-[13px] font-semibold tracking-wide">View Details</span>
                  <div className="w-7 h-7 rounded-full bg-white text-[#01172f] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}