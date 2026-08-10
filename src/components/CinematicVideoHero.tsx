'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export type HeroSlide = {
  id: string | number
  label: string
  title: string
  cta: string
  href: string
  video: string
}

const SLIDE_DURATION = 6000

const CATEGORIES = [
  {
    label: "Steel & Rebar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 md:w-10 md:h-10 mb-3 text-[#fdfffc]">
        <path d="M4 4h16M4 20h16M9 4v16M15 4v16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Cement & Concrete",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 md:w-10 md:h-10 mb-3 text-[#fdfffc]">
        <path d="M5 8h14c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2zM8 8V6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Heavy Equipment",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 md:w-10 md:h-10 mb-3 text-[#fdfffc]">
        <path d="M3 15h18M5 15l-2-6h6l2 6M17 15l2-6h-6l-2 6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7" cy="19" r="2" />
        <circle cx="17" cy="19" r="2" />
      </svg>
    ),
  },
  {
    label: "Pipes & Valves",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 md:w-10 md:h-10 mb-3 text-[#fdfffc]">
        <path d="M4 14v4h16v-4M4 10V6h16v4M2 10h20M2 14h20" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Electrical",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 md:w-10 md:h-10 mb-3 text-[#fdfffc]">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "PPE & Safety",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 md:w-10 md:h-10 mb-3 text-[#fdfffc]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function CinematicVideoHero({ slides: rawSlides }: { slides: HeroSlide[] }) {

  const slides = rawSlides.filter(
    (slide, index, arr) => arr.findIndex((s) => String(s.id) === String(slide.id)) === index
  )
  
  const [current, setCurrent] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    if (current > slides.length - 1) {
      setCurrent(0)
    }
  }, [slides.length, current])

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) {
        v.muted = true
        v.play().catch(() => {})
      }
    })
  }, [current])

  if (slides.length === 0) return null

  return (
    <section className="relative w-full h-[95vh] min-h-[800px] overflow-hidden bg-[#01172f]">
      
      {/* 1. Background Video Slider */}
      {slides.map((slide, index) => (
        <div key={`video-${slide.id}`} className={`absolute inset-0 transition-opacity duration-[1200ms] ${current === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`}>
          <video
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={slide.video} type="video/mp4" />
          </video>
        </div>
      ))}

      {/* 2. Gradient Overlay (Dark to Greenish Tint to match reference image) */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#01172f] via-[#01172f]/80 to-[#149911]/20 mix-blend-multiply" />
      <div className="absolute inset-0 z-[2] bg-black/40" />

      {/* 3. Main Content Container */}
      <div className="absolute inset-0 z-[3] max-w-[1400px] mx-auto px-6 lg:px-12 h-full flex flex-col justify-center pt-24 pb-32 pointer-events-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center flex-1">
          
          {/* Left Column: Dynamic Typography & CTAs */}
          {/* Left Column: Dynamic Typography & CTAs */}
          <div className="relative w-full max-w-xl h-[340px] flex items-center">
            {slides.map((slide, index) => (
              <div 
                key={`content-${slide.id}`} 
                className={`absolute inset-0 flex flex-col justify-center transition-all duration-[800ms] ease-out
                  ${current === index ? 'opacity-100 translate-y-0 pointer-events-auto z-10' : 'opacity-0 translate-y-4 pointer-events-none z-0'}
                `}
              >
                <p className="text-[12px] md:text-[14px] font-bold uppercase tracking-[0.2em] text-[#149911] mb-3 md:mb-5">
                  {slide.label}
                </p>
                
                <h1 className="text-[44px] md:text-[56px] lg:text-[64px] font-black text-[#fdfffc] leading-[1.05] tracking-tight mb-6">
                  {slide.title}
                </h1>
                
                <p className="text-[15px] md:text-[17px] text-[#fdfffc]/80 font-medium leading-relaxed mb-8 md:mb-10 max-w-[480px]">
                  Generate project-specific quotes and guarantee site delivery with unprecedented speed and reliability for large-scale developments.
                </p>
                
                <div className="flex flex-wrap items-center gap-4">
                  <Link 
                    href="/contact"
                    className="px-8 py-3.5 bg-[#149911] text-white text-[13px] md:text-[14px] font-bold tracking-wide rounded-lg hover:bg-[#10750e] transition-colors duration-300 shadow-[0_0_20px_rgba(20,153,17,0.3)]"
                  >
                    Contact us
                  </Link>
                  <Link 
                    href={slide.href || '#'}
                    className="px-8 py-3.5 bg-transparent border border-[#fdfffc]/30 text-[#fdfffc] text-[13px] md:text-[14px] font-bold tracking-wide rounded-lg hover:bg-[#fdfffc]/10 transition-colors duration-300"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Abstract Skewed Process Graphic (Static persistent overlay) */}
          <div className="hidden lg:flex justify-end items-start relative w-full h-[400px] pr-8 pointer-events-auto">
            <div className="flex gap-4 absolute right-0 top-10">
              
              {/* Left Branch */}
              <div className="flex flex-col mt-16">
                <div className="w-[200px] bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/20 px-6 py-4 -skew-x-[15deg] shadow-xl relative z-10">
                  <div className="skew-x-[15deg]">
                    <span className="block text-[#fdfffc] text-[13px] font-medium leading-snug text-center">
                      Site evaluation,<br/>Estimating
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Branch */}
              <div className="flex flex-col gap-3">
                {/* Highlighted Step */}
                <div className="w-[220px] bg-[#149911]/10 backdrop-blur-md border border-[#149911] px-6 py-4 -skew-x-[15deg] shadow-[0_0_30px_rgba(20,153,17,0.2)] relative z-20 -ml-8">
                  <div className="skew-x-[15deg]">
                    <span className="block text-[#fdfffc] text-[13px] font-bold leading-snug text-center">
                      Material sourcing
                    </span>
                  </div>
                </div>
                
                {/* Regular Step 2 */}
                <div className="w-[220px] bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/20 px-6 py-4 -skew-x-[15deg] shadow-xl relative z-10">
                  <div className="skew-x-[15deg]">
                    <span className="block text-[#fdfffc]/80 text-[13px] font-medium leading-snug text-center">
                      Logistics<br/>specification
                    </span>
                  </div>
                </div>

                {/* Regular Step 3 */}
                <div className="w-[220px] bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/20 px-6 py-4 -skew-x-[15deg] shadow-xl relative z-10">
                  <div className="skew-x-[15deg]">
                    <span className="block text-[#fdfffc]/80 text-[13px] font-medium leading-snug text-center">
                      Delivery<br/>scheduling
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Category Cards (Static persistent overlay) */}
      <div className="absolute bottom-12 md:bottom-8 left-0 right-0 w-full px-6 lg:px-12 max-w-[1400px] mx-auto z-[4] pointer-events-none">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 pointer-events-auto">
          {CATEGORIES.map((cat, idx) => (
            <Link 
              key={idx}
              href={`/products#${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="group flex flex-col items-start justify-end h-28 md:h-32 p-4 md:p-5 bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/10 rounded-2xl hover:bg-[#fdfffc]/10 hover:border-[#fdfffc]/30 transition-all duration-300"
            >
              <div className="transition-transform duration-300 group-hover:-translate-y-1">
                {cat.icon}
              </div>
              <span className="text-[10px] md:text-[13px] font-bold text-[#fdfffc] tracking-wide">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 w-full z-[5] flex justify-center gap-2 pointer-events-auto">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              aria-label={`Show slide ${index + 1}`}
              className={`w-2 h-2 rounded-full border-none p-0 transition-colors ${current === index ? 'bg-white' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}