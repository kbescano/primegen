'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Material = {
  id: string | number
  name: string
  category?: string
  description?: string
  unit?: string
  inStock?: boolean
  photo?: { url?: string; alt?: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  'cement-concrete': 'Cement & Concrete',
  'steel-rebar': 'Steel & Rebar',
  'sand-aggregates': 'Sand & Aggregates',
  'lumber-wood': 'Lumber & Wood',
  roofing: 'Roofing',
  plumbing: 'Plumbing Supplies',
  electrical: 'Electrical Supplies',
  'tools-hardware': 'Tools & Hardware',
  other: 'Other',
}

export default function MaterialCarousel({ materials }: { materials: Material[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Material | null>(null)

  function scroll(direction: 'left' | 'right') {
    trackRef.current?.scrollBy({ left: direction === 'right' ? 320 : -320, behavior: 'smooth' })
  }

  return (
    <div>
      <div ref={trackRef} className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {materials.map((m) => (
          <div
          key={m.id}
          className="relative flex flex-col flex-none w-[420px] h-[500px] snap-start bg-white border border-black/10 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden max-[480px]:w-[70vw] max-[480px]:h-[440px]"
          style={{ opacity: m.inStock === false ? 0.5 : 1 }}
        >
          <button
            onClick={() => setSelected(m)}
            aria-label={`Quick view ${m.name}`}
            className="absolute top-5 right-6 z-10 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-green hover:bg-green hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H8M17 7V16" />
            </svg>
          </button>

          <div className="pt-12 pl-6">
            <h3 className="text-xl font-bold leading-snug mb-2">{m.name}</h3>
            {m.description && <p className="text-sm text-gray-500 line-clamp-2">{m.description}</p>}
          </div>

          {/* FIX: Replaced 'self-end' with 'mt-auto w-full' to push it to the bottom */}
          <div className="relative m-auto w-[90%] min-h-[342px]">
            {m.photo?.url && (
              <Image 
                src={m.photo.url} 
                alt={m.photo.alt || m.name} 
                fill 
                className="object-cover" 
              />
            )}
          </div>
        </div>
      ))}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => scroll('left')} aria-label="Scroll left" className="w-11 h-11 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center text-black hover:bg-gray-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button onClick={() => scroll('right')} aria-label="Scroll right" className="w-11 h-11 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center text-black hover:bg-gray-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/55 z-[100] flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl flex flex-col items-center">
            {materials.length > 1 && (
              <div className="flex items-center gap-1 bg-gray-200 rounded-full p-1.5 mb-4 overflow-x-auto max-w-fit [scrollbar-width:none]">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap ${selected.id === m.id ? 'bg-black text-white' : 'bg-transparent text-black'}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/5 flex items-center justify-center z-10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="grid md:grid-cols-2 gap-10 p-6">
                <div className="relative w-full aspect-[4/5] bg-sage-tint rounded">
                  {selected.photo?.url && (
                    <Image src={selected.photo.url} alt={selected.photo.alt || selected.name} fill className="object-cover" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green mb-2">
                    {CATEGORY_LABELS[selected.category || ''] || selected.category}
                  </p>
                  <h2 className="text-2xl font-bold mb-5">{selected.name}</h2>

                  {selected.inStock === false ? (
                    <p className="text-red-700 font-bold mb-5">Out of stock</p>
                  ) : (
                    <Link href={`/quote?material=${selected.id}`} className="inline-flex items-center justify-center px-8 py-3.5 rounded bg-green text-white font-bold mb-6 hover:bg-green-hover">
                      Request a Quote
                    </Link>
                  )}

                  {selected.description && (
                    <div className="flex gap-3 py-4 border-t border-black/10">
                      <p className="text-sm font-bold text-black">{selected.description}</p>
                    </div>
                  )}

                  {selected.unit && (
                    <div className="flex gap-3 py-4 border-t border-black/10">
                      <p className="text-sm font-bold text-black">Sold {selected.unit}</p>
                    </div>
                  )}

                  <Link href={`/materials/${selected.id}`} className="inline-flex items-center gap-2 text-green font-bold text-sm mt-5 hover:underline">
                    View Full Details
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
