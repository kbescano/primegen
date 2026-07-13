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
        <div className="flex-1 flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {materials.map((m) => (
            <Link key={m.id} href={"/materials"} className="flex h-full group outline-none">
              <div
                onClick={() => setSelected(m)}
                className="relative flex-none w-[310px] h-[430px] rounded-xl overflow-hidden snap-start cursor-pointer bg-[#01172f] ring-1 ring-inset ring-white/10 max-[480px]:w-[80vw] max-[480px]:h-[500px]"
              >
                {/* Full-Bleed Background Image with subtle scale hover effect */}
                {m.photo?.url && (
                  <Image
                    src={m.photo.url}
                    alt={m.photo.alt || m.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                )}

                {/* Bottom scrim -- legibility only, photo stays clean */}
                <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#01172f]/85 via-[#01172f]/35 to-transparent" />

                {/* Arrow -- reveals on hover, matching catalog cards */}
                <span className="absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-full bg-[#fdfffc] text-[#103900] opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H8M17 7V16" />
                  </svg>
                </span>

                {/* Left-Aligned Bottom Information Layer */}
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-2.5 text-white">
                  <h3 className="text-[21px] font-bold tracking-tight leading-snug text-[#fdfffc]">
                    {m.name}
                  </h3>

                  <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white/75">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#149911]"></span>
                    In Stock
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View-all arrow, beside the carousel */}
        <Link
          href="/materials"
          aria-label="View all materials"
          className="flex-shrink-0 w-12 h-12 rounded-full bg-transparent ring-1 ring-[#01172f]/15 text-[#103900] flex items-center justify-center transition-colors hover:bg-[#103900] hover:text-[#fdfffc] hover:ring-[#103900] max-[640px]:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}