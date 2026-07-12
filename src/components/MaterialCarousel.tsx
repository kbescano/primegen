'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Material = {
  id: string | number
  name: string
  category?: string
  description?: string
  material?: string
  usage?: string
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
    trackRef.current?.scrollBy({ left: direction === 'right' ? 360 : -360, behavior: 'smooth' })
  }

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selected])

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      {/* Carousel Track Container */}
      <div 
        ref={trackRef} 
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {materials.map((m) => (
          <div
            key={m.id}
            className="group relative flex flex-col justify-between flex-none w-[360px] h-[520px] snap-start bg-gray-900 rounded-[28px] transition-all duration-300 overflow-hidden p-8 max-[480px]:w-[80vw] max-[480px]:h-[500px]"
            style={{ opacity: m.inStock === false ? 0.5 : 1 }}
          >
            {/* Full Card Cover Image Layer */}
            {m.photo?.url && (
              <>
                <div className="absolute inset-0 z-0 transition-transform duration-700 ease-out group-hover:scale-105">
                  <Image 
                    src={m.photo.url} 
                    alt={m.photo.alt || m.name} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                {/* Visual Scrim: Protects contrast for text on top of varying images */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/75 z-0" />
              </>
            )}

            {/* Top Right Action Button */}
            <button
              onClick={() => setSelected(m)}
              aria-label={`Quick view ${m.name}`}
              className="absolute top-8 right-8 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H8M17 7V16" />
              </svg>
            </button>

            {/* Top Text Content Area */}
            <div className="flex flex-col items-start pr-14 relative z-10">
              <h3 className="text-3xl font-extrabold tracking-tight text-white leading-[1.1] mb-3 drop-shadow-sm">
                {m.name}
              </h3>
              <p className="text-[15px] text-white/80 font-medium leading-relaxed line-clamp-4 drop-shadow-sm">
                {m.description ? m.description : 'In Stock.'}
              </p>
            </div>

            {/* Bottom Content Info Layer */}
            <div className="mt-auto relative z-10 flex flex-col items-start">
              <span className="text-[11px] text-white/50 font-bold tracking-widest uppercase mb-1">
                Availability
              </span>
              <span className="text-sm font-bold text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                {m.inStock === false ? 'Out of Stock' : (m.unit ? `Per ${m.unit}` : 'In Stock')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-end gap-3 mt-6 px-2">
        <button 
          onClick={() => scroll('left')} 
          aria-label="Scroll left" 
          className="w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button 
          onClick={() => scroll('right')} 
          aria-label="Scroll right" 
          className="w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Quick View Modal Overlay */}
      {selected && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex justify-center overflow-y-auto p-4 transition-opacity duration-300" 
          onClick={() => setSelected(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-3xl my-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
          >
            {materials.length > 1 && (
              <div className="flex items-center gap-1 bg-white/80 backdrop-blur border border-gray-100 rounded-full p-1.5 mb-4 overflow-x-auto max-w-full md:max-w-fit shadow-md [scrollbar-width:none]">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-tight whitespace-nowrap transition-all ${
                      selected.id === m.id ? 'bg-[#01172f] text-white' : 'bg-transparent text-gray-600 hover:text-black'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white rounded-[28px] w-full max-h-[85vh] overflow-y-auto relative shadow-2xl border border-gray-100">
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center z-10 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Main Content Grid */}
            <div className="grid md:grid-cols-[1fr_1.1fr] gap-x-12 p-5 md:p-10 lg:p-12">
              
              {/* Left Column: Media Gallery */}
              <div className="flex flex-col items-center pt-2">

                {/* Primary Image */}
                <div className="relative w-full max-w-[340px] h-[280px] md:h-[500px] aspect-square flex items-center justify-center mb-5 md:mb-8">
                  {selected.photo?.url ? (
                    <>
                <div className="absolute inset-0 z-0 transition-transform duration-700 ease-out group-hover:scale-105">
                  <Image 
                    src={selected.photo.url} 
                    alt={selected.photo.alt || selected.name} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                {/* Visual Scrim: Protects contrast for text on top of varying images */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/75 z-0" />
              </>
                  ) : (
                    <div className="w-full h-full bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>

                
              </div>

              {/* Right Column: Specs & Actions */}
              <div className="flex flex-col pt-2 md:pt-12 lg:pr-4">

                {/* Title */}
                <h2 className="text-[32px] font-semibold tracking-tight text-gray-900 leading-tight mb-2">
                  {selected.name}
                </h2>
                
                {/* Pricing / Action Row */}
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[15px] text-gray-800 font-medium">
                    {selected.unit ? `From per ${selected.unit}` : 'Request pricing details'}
                  </span>
                  <Link 
                    href={`/quote?material=${selected.id}`} 
                    className="bg-[#01172f] hover:bg-[#143109] hover:text-white text-white px-5 py-1.5 rounded-full text-sm font-medium transition-colors"
                  >
                    Get
                  </Link>
                </div>

                {/* Features / Spec List */}
                <div className="flex flex-col border-t border-gray-300/70">
                  
                  {/* Feature 1: Description */}
                  <div className="flex gap-5 py-5 border-b border-gray-300/70">
                    <div className="w-7 flex-shrink-0 flex justify-center text-gray-700 mt-0.5">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-[14px] text-gray-900 leading-snug">
                      {selected.description || 'Premium quality material tailored for specific architectural, construction, and design requirements.'}
                    </p>
                  </div>

                  {/* Feature 2: Stock Status */}
                  <div className="flex gap-5 py-5 border-b border-gray-300/70">
                    <div className="w-7 flex-shrink-0 flex justify-center text-gray-700 mt-0.5">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                    </div>
                    <p className="text-[14px] text-gray-900 leading-snug">
                      {selected.material  ?  selected.material : 'In stock and available for immediate local delivery or warehouse pickup.'}
                    </p>
                  </div>

                  {/* Feature 3: Category */}
                  <div className="flex gap-5 py-5 border-b border-gray-300/70">
                    <div className="w-7 flex-shrink-0 flex justify-center text-gray-700 mt-0.5">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 12 12 17 22 12"></polyline>
                        <polyline points="2 17 12 22 22 17"></polyline>
                      </svg>
                    </div>
                    <p className="text-[14px] text-gray-900 leading-snug">
                  {selected.usage ? (
  selected.usage
) : (
  <>
    General material for various construction applications. Classified under <span className="font-semibold">{selected.category ? CATEGORY_LABELS[selected.category] || selected.category : 'General Materials'}</span> for structural integrity and building compliance.
  </>
)}
                    </p>
                  </div>
                </div>

                {/* Explore Link */}
                <Link 
                  href={`/materials/${selected.id}`} 
                  className="text-[#143109] hover:underline text-[14px] font-medium mt-5 inline-flex items-center gap-1 group w-fit"
                >
                  Explore {selected.name} further 
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>

              </div>
            </div>

            {/* Bottom Footer Callout Banner */}
            <div className="bg-[#f5f5f7] w-full px-10 py-6 flex items-start gap-4 mt-auto">
              <div className="mt-0.5 text-[#143109]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#143109" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[13px] font-semibold text-gray-900">Create the order you always wanted</h4>
                <p className="text-[13px] text-gray-500 mt-0.5">Customize quantities, track dimensions, and adjust delivery schedules just about anywhere on your account.</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}