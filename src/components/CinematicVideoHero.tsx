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

export default function CinematicVideoHero({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [slides.length])

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
    <section className="relative h-[90vh] min-h-[520px] overflow-hidden bg-green text-white max-[480px]:h-[95svh] max-[480px]:min-h-0">
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-green/60 via-green/15 to-transparent" />

      {slides.map((slide, index) => (
        <div key={slide.id} className={`absolute inset-0 transition-opacity duration-[1200ms] ${current === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`}>
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

      <div className="absolute inset-0 z-[3] flex items-center justify-center text-center px-6">
        {slides.map((slide, index) => (
          <div
            key={`c-${slide.id}`}
            className={`absolute max-w-[780px] flex flex-col items-center transition-all duration-[600ms] ${
              current === index ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#149911] mb-4">{slide.label}</p>
            <h1 className="font-bold uppercase leading-[0.95] text-white mb-8 text-[clamp(40px,7vw,88px)]">{slide.title}</h1>
            <Link href={slide.href} className="inline-flex items-center gap-4 text-white group">
              <span className="text-xs text-[#fdfffc] font-bold uppercase tracking-[0.2em]">{slide.cta}</span>
              <span className="w-10 h-10 rounded-full border border-[#149911] flex items-center justify-center transition-colors group-hover:bg-white group-hover:text-green group-hover:border-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#149911" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </Link>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 w-full z-[4] flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              aria-label={`Show slide ${index + 1}`}
              className={`w-2 h-2 rounded-full border-none p-0 transition-colors ${current === index ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
