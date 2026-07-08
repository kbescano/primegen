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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
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
      <div className="cine-overlay" />

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

      <div className="cine-content container">
        {slides.map((slide, index) => (
          <div key={`c-${slide.id}`} className={`cine-panel${current === index ? ' cine-panel-active' : ''}`}>
            <p className="micro-label micro-label-on-dark" style={{ marginBottom: 16 }}>
              {slide.label}
            </p>
            <h1 className="cine-title">{slide.title}</h1>
            <Link href={slide.href} className="btn btn-primary">
              {slide.cta}
            </Link>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="cine-pagination">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              aria-label={`Show slide ${index + 1}`}
              className={`cine-dot${current === index ? ' active' : ''}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
