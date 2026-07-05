'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

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
  const [mounted, setMounted] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const radius = 9
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    setMounted(true)
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
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
    <section className="cine-hero">
      <div className="cine-hero-overlay-radial" />
      <div className="cine-hero-overlay-linear" />

      {slides.map((slide, index) => (
        <div key={slide.id} className={`cine-slide${current === index ? ' cine-slide-active' : ''}`}>
          <video
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            autoPlay
            loop
            muted
            playsInline
            className="cine-slide-video"
          >
            <source src={slide.video} type="video/mp4" />
          </video>
        </div>
      ))}

      <div className="cine-content">
        {slides.map((slide, index) => (
          <div key={`c-${slide.id}`} className={`cine-panel${current === index ? ' cine-panel-active' : ''}`}>
            <p className="cine-eyebrow">{slide.label}</p>
            <h1 className="cine-title">{slide.title}</h1>
            <Link href={slide.href} className="cine-cta">
              <span>{slide.cta}</span>
              <span className="cine-cta-circle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </Link>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="cine-pagination">
          {slides.map((_, index) => {
            const isActive = current === index
            return (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                aria-label={`Show slide ${index + 1}`}
                className="cine-dot-btn"
              >
                <span className={`cine-dot${isActive ? ' cine-dot-hidden' : ''}`} />
                <svg className={`cine-ring${isActive ? ' cine-ring-active' : ''}`} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r={radius} className="cine-ring-track" />
                  <circle
                    cx="12"
                    cy="12"
                    r={radius}
                    className="cine-ring-progress"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: isActive && mounted ? 0 : circumference,
                      transition: isActive ? `stroke-dashoffset ${SLIDE_DURATION}ms linear` : 'none',
                    }}
                  />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
