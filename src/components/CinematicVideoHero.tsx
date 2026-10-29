'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import KineticText from '@/components/KineticText'
import Magnetic from '@/components/Magnetic'

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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1 sm:mb-3 text-[#fdfffc]">
        <path d="M4 4h16M4 20h16M9 4v16M15 4v16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Cement & Concrete",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1 sm:mb-3 text-[#fdfffc]">
        <path d="M5 8h14c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2zM8 8V6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Heavy Equipment",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1 sm:mb-3 text-[#fdfffc]">
        <path d="M3 15h18M5 15l-2-6h6l2 6M17 15l2-6h-6l-2 6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7" cy="19" r="2" />
        <circle cx="17" cy="19" r="2" />
      </svg>
    ),
  },
  {
    label: "Pipes & Valves",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1 sm:mb-3 text-[#fdfffc]">
        <path d="M4 14v4h16v-4M4 10V6h16v4M2 10h20M2 14h20" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Electrical",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1 sm:mb-3 text-[#fdfffc]">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "PPE & Safety",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1 sm:mb-3 text-[#fdfffc]">
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
  const sectionRef = useRef<HTMLElement>(null)

  // Scroll + pointer parallax: written as CSS custom properties on the
  // section (rAF-batched), read by the transforms below. No React state, so
  // none of this re-renders the hero.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let scrollRaf = 0
    let lastHs = -1
    const onScroll = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        const hs = Math.min(1, Math.max(0, window.scrollY / el.offsetHeight))
        if (hs === lastHs) return
        lastHs = hs
        el.style.setProperty('--hs', hs.toFixed(3))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let moveRaf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(moveRaf)
      moveRaf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width
        const y = (e.clientY - r.top) / r.height
        el.style.setProperty('--px', ((x - 0.5) * 2).toFixed(3))
        el.style.setProperty('--py', ((y - 0.5) * 2).toFixed(3))
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(moveRaf)
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
    }
    if (fine) {
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
    }
    return () => {
      cancelAnimationFrame(scrollRaf)
      cancelAnimationFrame(moveRaf)
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

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
    // Previously every video called .play() on every slide change,
    // including the ones sitting hidden behind opacity-0. Several
    // concurrent .play() calls on muted <video> elements is exactly the
    // kind of thing browsers intermittently race/reject -- when that
    // happened, the failure was swallowed by .catch(() => {}) and nothing
    // retried until the next slide change 6s later, so the visible slide
    // could sit frozen on its first frame for part of its window before it
    // "caught" -- the stop-then-play. Only ever playing the active video
    // (and explicitly pausing the rest, instead of leaving them running
    // invisibly) removes that contention, and restarting from frame 0
    // gives every slide a clean beginning instead of resuming wherever it
    // happened to drift to while hidden.
    videoRefs.current.forEach((v, index) => {
      if (!v) return
      if (index !== current) {
        v.pause()
        return
      }
      v.muted = true
      v.currentTime = 0
      v.play().catch(() => {})
    })
  }, [current])

  if (slides.length === 0) return null

  return (
    <section ref={sectionRef} className="relative w-full h-[95vh] min-h-[660px] sm:min-h-[750px] md:min-h-[800px] overflow-hidden bg-[#01172f]">
      
      {/* Inject Continuous Floating Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-1 { animation: float-slow 5s ease-in-out infinite; }
        .animate-float-2 { animation: float-slow 6.5s ease-in-out infinite 1s; }
        .animate-float-3 { animation: float-slow 7s ease-in-out infinite 2s; }
        .animate-float-4 { animation: float-slow 5.5s ease-in-out infinite 3s; }
      `}} />

      {/* 1. Background Video Slider */}
      {slides.map((slide, index) => (
        <div key={`video-${slide.id}`} className={`absolute inset-0 transition-opacity duration-[1200ms] ${current === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`}>
          <div
            className="absolute inset-0"
            style={{
              transform: 'translate3d(calc(var(--px, 0) * -14px), calc(var(--hs, 0) * 150px + var(--py, 0) * -9px), 0) scale(1.1)',
              transition: 'transform 0.35s ease-out',
              willChange: 'transform',
            }}
          >
          <video
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            // No `autoPlay`: playback is already fully controlled by the
            // useEffect above (it calls .play() on whichever slide is
            // current). With autoPlay present, every slide's video -- not
            // just the visible one -- told the browser to start eagerly
            // fetching immediately on mount, before that effect ever got a
            // chance to pause the hidden ones. Each of these is a raw ~13MB
            // stock download, so that was 4x the bandwidth actually needed
            // for ANY single page load. preload="none" on the hidden slides
            // keeps them from being fetched at all until they're selected.
            preload={index === current ? 'auto' : 'none'}
            loop
            muted
            playsInline
            className={`w-full h-full object-cover ${current === index ? 'fx-kenburns' : ''}`}
          >
            <source src={slide.video} type="video/mp4" />
          </video>
          </div>
        </div>
      ))}

      {/* 2. Gradient Overlay */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#01172f] via-[#01172f]/80 to-[#149911]/20 mix-blend-multiply" />
      <div className="absolute inset-0 z-[2] bg-black/40" />

      {/* 3. Main Content Container */}
      <div
        className="absolute inset-0 z-[3] max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-full flex flex-col justify-center pt-20 sm:pt-24 pb-[240px] sm:pb-[200px] pointer-events-none"
        style={{
          transform: 'translate3d(0, calc(var(--hs, 0) * -80px), 0)',
          opacity: 'calc(1 - var(--hs, 0) * 1.25)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-8 items-center flex-1">
          
          {/* Left Column: Dynamic Typography & CTAs */}
          <div className="fx-shake relative w-full max-w-xl h-[320px] sm:h-[340px] flex items-center">
            {slides.map((slide, index) => {
              // All slides render simultaneously (for the crossfade), but
              // only the active one should be a real <h1> -- otherwise
              // every slide in the carousel adds another <h1> to the DOM,
              // which search engines and screen readers see regardless of
              // the opacity-0 hiding it visually.
              const isActive = current === index
              const HeadingTag = isActive ? 'h1' : 'p'
              return (
              <div
                key={`content-${slide.id}`}
                aria-hidden={!isActive}
                className={`absolute inset-0 flex flex-col justify-center transition-all ease-out
                  ${isActive ? 'opacity-100 translate-y-0 pointer-events-auto z-10 duration-[700ms] delay-[280ms]' : 'opacity-0 translate-y-4 pointer-events-none z-0 duration-[280ms]'}
                `}
              >
                <p className="text-[10px] sm:text-[12px] md:text-[14px] font-bold uppercase tracking-[0.2em] text-[#149911] mb-2 sm:mb-3 md:mb-5">
                  {slide.label}
                </p>

                <HeadingTag className="text-[32px] sm:text-[44px] md:text-[56px] lg:text-[64px] font-black text-[#fdfffc] leading-[1.05] tracking-tight mb-3 sm:mb-6">
                  {isActive ? (
                    <KineticText key={`title-${slide.id}-${current}`} text={slide.title} trigger="mount" delay={320} stagger={34} />
                  ) : (
                    slide.title
                  )}
                </HeadingTag>

                <p className="text-[13px] sm:text-[15px] md:text-[17px] text-[#fdfffc]/80 font-medium leading-relaxed mb-6 sm:mb-8 md:mb-10 max-w-[480px]">
                  Generate project-specific quotes and guarantee site delivery with unprecedented speed and reliability for large-scale developments.
                </p>

                <div className="flex flex-row w-full sm:w-auto items-center gap-2 sm:gap-4">
                  <Magnetic fill className="flex-1 sm:flex-none">
                    <Link
                      href="/about"
                      className="fx-weld block text-center px-2 sm:px-8 py-3.5 bg-[#149911] text-white text-[11px] sm:text-[12px] md:text-[14px] font-bold tracking-wide rounded-lg hover:bg-[#10750e] transition-colors duration-300 shadow-[0_0_28px_rgba(20,153,17,0.45)] whitespace-nowrap"
                    >
                      Contact us
                    </Link>
                  </Magnetic>
                  <Link
                    href={slide.href || '#'}
                    className="flex-1 sm:flex-none text-center px-2 sm:px-8 py-3.5 bg-transparent border border-[#fdfffc]/30 text-[#fdfffc] text-[11px] sm:text-[12px] md:text-[14px] font-bold tracking-wide rounded-lg hover:bg-[#fdfffc]/10 transition-colors duration-300 whitespace-nowrap"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
              )
            })}
          </div>

          {/* Right Column: Abstract Skewed Process Graphic */}
          {/* CHANGED: Container is pointer-events-none so it never blocks background clicks */}
          <div className="hidden lg:flex justify-end items-start relative w-full h-[400px] pr-8 pointer-events-none">
            <div className="fx-parallax flex gap-4 absolute right-0 top-10" style={{ ['--depth' as string]: -22 }}>
              
              {/* Left Branch */}
              <div className="fx-clamp flex flex-col mt-16" style={{ ['--fd' as string]: '700ms' }}>
              <div className="animate-float-1">
                {/* CHANGED: Added pointer-events-auto just to the box so it can be hovered */}
                <div className="group w-[200px] bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/20 px-6 py-4 -skew-x-[15deg] shadow-xl relative z-10 pointer-events-auto cursor-default transition-all duration-500 hover:-translate-y-2 hover:bg-[#fdfffc]/10 hover:shadow-[0_15px_40px_-10px_rgba(255,255,255,0.15)] hover:border-[#fdfffc]/40">
                  <div className="skew-x-[15deg] transition-transform duration-500 group-hover:scale-105">
                    <span className="block text-[#fdfffc] text-[13px] font-medium leading-snug text-center">
                      Site evaluation,<br/>Estimating
                    </span>
                  </div>
                </div>
              </div>
              </div>

              {/* Right Branch */}
              <div className="flex flex-col gap-3">
                
                {/* Highlighted Step */}
                <div className="fx-clamp" style={{ ['--fd' as string]: '850ms' }}>
                <div className="animate-float-2 relative">
                  <div className="group w-[220px] bg-[#149911]/10 backdrop-blur-md border border-[#149911] px-6 py-4 -skew-x-[15deg] shadow-[0_0_30px_rgba(20,153,17,0.2)] relative z-20 -ml-8 pointer-events-auto cursor-default transition-all duration-500 hover:-translate-y-2 hover:bg-[#149911]/20 hover:shadow-[0_0_40px_rgba(20,153,17,0.4)]">
                    <div className="skew-x-[15deg] transition-transform duration-500 group-hover:scale-105">
                      <span className="block text-[#fdfffc] text-[13px] font-bold leading-snug text-center">
                        Material sourcing
                      </span>
                    </div>
                  </div>
                </div>
                </div>
                
                {/* Regular Step 2 */}
                <div className="fx-clamp" style={{ ['--fd' as string]: '1000ms' }}>
                <div className="animate-float-3">
                  <div className="group w-[220px] bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/20 px-6 py-4 -skew-x-[15deg] shadow-xl relative z-10 pointer-events-auto cursor-default transition-all duration-500 hover:-translate-y-2 hover:bg-[#fdfffc]/10 hover:shadow-[0_15px_40px_-10px_rgba(255,255,255,0.15)] hover:border-[#fdfffc]/40">
                    <div className="skew-x-[15deg] transition-transform duration-500 group-hover:scale-105">
                      <span className="block text-[#fdfffc]/80 text-[13px] font-medium leading-snug text-center group-hover:text-[#fdfffc] transition-colors duration-300">
                        Logistics<br/>specification
                      </span>
                    </div>
                  </div>
                </div>
                </div>

                {/* Regular Step 3 */}
                <div className="fx-clamp" style={{ ['--fd' as string]: '1150ms' }}>
                <div className="animate-float-4">
                  <div className="group w-[220px] bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/20 px-6 py-4 -skew-x-[15deg] shadow-xl relative z-10 pointer-events-auto cursor-default transition-all duration-500 hover:-translate-y-2 hover:bg-[#fdfffc]/10 hover:shadow-[0_15px_40px_-10px_rgba(255,255,255,0.15)] hover:border-[#fdfffc]/40">
                    <div className="skew-x-[15deg] transition-transform duration-500 group-hover:scale-105">
                      <span className="block text-[#fdfffc]/80 text-[13px] font-medium leading-snug text-center group-hover:text-[#fdfffc] transition-colors duration-300">
                        Delivery<br/>scheduling
                      </span>
                    </div>
                  </div>
                </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Category Cards (Static persistent overlay) */}
      <div className="absolute bottom-8 sm:bottom-12 md:bottom-10 left-0 right-0 w-full px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto z-[4] pointer-events-none">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 pointer-events-auto">
          {CATEGORIES.map((cat, idx) => (
            <Link 
              key={idx}
              href={`/products#${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="group flex flex-col items-center sm:items-start justify-center sm:justify-end h-20 sm:h-28 md:h-32 p-2 sm:p-4 md:p-5 bg-[#fdfffc]/5 backdrop-blur-md border border-[#fdfffc]/10 rounded-xl sm:rounded-2xl hover:bg-[#fdfffc]/10 hover:border-[#fdfffc]/30 transition-all duration-300"
            >
              <div className="transition-transform duration-300 group-hover:-translate-y-1">
                {cat.icon}
              </div>
              <span className="text-[9px] sm:text-[11px] md:text-[13px] font-bold text-[#fdfffc] tracking-wide text-center sm:text-left leading-tight w-full break-words">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 left-0 w-full z-[5] flex justify-center gap-2 pointer-events-auto">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              aria-label={`Show slide ${index + 1}`}
              className={`relative h-2 rounded-full border-none p-0 overflow-hidden transition-all duration-500 ${current === index ? 'w-10 bg-white/30' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            >
              {current === index && (
                <span
                  key={`progress-${current}`}
                  className="fx-progress absolute inset-0 bg-white"
                  style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}