'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const SPARKS: Array<[string, string, string]> = [
  // [dx, dy, extra delay]
  ['-70px', '-46px', '0ms'], ['-42px', '-78px', '40ms'], ['-96px', '-12px', '80ms'], ['-24px', '-60px', '20ms'],
  ['70px', '-46px', '10ms'], ['42px', '-78px', '60ms'], ['96px', '-12px', '30ms'], ['24px', '-60px', '90ms'],
]

// A crane lowers a steel plate (the call to action) into view on a cable;
// it lands with a burst of sparks and then sways to rest. Starts when
// scrolled into view. Without JS or with reduced motion the plate simply
// sits in its final position.
export default function CraneCta({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} data-inview={inView ? 'true' : 'false'} className="fx-crane relative mx-auto w-full max-w-[920px] pt-[18vh]">
      <div className="fx-lowering">
        <div className="fx-swaying relative">
          {/* cable running up out of the section, then the hook block */}
          <div aria-hidden="true" className="absolute bottom-full left-1/2 h-[120vh] w-[3px] -translate-x-1/2 bg-gradient-to-b from-[#6b7a74] to-[#b8c4be]" />
          <div aria-hidden="true" className="absolute -top-[46px] left-1/2 -translate-x-1/2">
            <svg width="46" height="52" viewBox="0 0 46 52" fill="none">
              <rect x="13" y="0" width="20" height="14" rx="3" fill="#2b3833" stroke="#7d8d86" strokeWidth="1.5" />
              <circle cx="23" cy="7" r="3" fill="#0b1411" stroke="#9fb0a9" strokeWidth="1.2" />
              <path d="M23 14v10M23 24c-9 0-13 6-13 12a13 13 0 0 0 26 0" stroke="#9fb0a9" strokeWidth="3" strokeLinecap="round" />
              <path d="M10 36l6-3" stroke="#9fb0a9" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          {/* chains from the hook down to the plate's top corners */}
          <svg aria-hidden="true" className="absolute left-1/2 top-0 h-10 w-[78%] -translate-x-1/2" viewBox="0 0 100 40" preserveAspectRatio="none" fill="none" stroke="#8b9b94" strokeWidth="1.6">
            <path d="M50 0L4 40M50 0L96 40" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* the plate */}
          <div className="relative mt-9 rounded-sm border-2 border-[#2a3a34] bg-gradient-to-br from-[#12241d] via-[#0b1813] to-[#0e1f18] px-5 py-12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] md:px-14 md:py-16">
            {/* rivets */}
            {['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map((pos) => (
              <span key={pos} aria-hidden="true" className={`absolute ${pos} h-3 w-3 rounded-full border border-[#3b4f47] bg-gradient-to-br from-[#2c3f37] to-[#0a1410]`} />
            ))}
            {/* hazard edge */}
            <div aria-hidden="true" className="fx-stripes absolute inset-x-0 top-0 h-1.5" />
            <div aria-hidden="true" className="fx-stripes absolute inset-x-0 bottom-0 h-1.5" />
            {/* landing sparks */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0">
              {SPARKS.map(([dx, dy, d], i) => (
                <span
                  key={i}
                  className="fx-spark absolute top-0 h-1.5 w-1.5 rounded-full bg-[#ffcf7a] shadow-[0_0_8px_2px_rgba(255,160,60,0.9)]"
                  style={{ left: i < 4 ? '3%' : '97%', ['--dx' as string]: dx, ['--dy' as string]: dy, ['--sp' as string]: d } as CSSProperties}
                />
              ))}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
