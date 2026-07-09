'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import {  MicroLabel, Container, ViewAllButton } from '@/components/ui/styled'
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

const Hero = styled.section`
  position: relative;
  height: 80vh;
  min-height: 520px;
  overflow: hidden;
  background: var(--color-green);
  color: white;

  @media (max-width: 480px) {
    height: 68vh;
    min-height: 460px;
  }
`

const Slide = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${(p) => (p.$active ? 1 : 0)};
  z-index: ${(p) => (p.$active ? 1 : 0)};
  transition: opacity 1.2s ease;
`

const SlideVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(to top, rgba(20, 49, 9, 0.6) 0%, rgba(20, 49, 9, 0.15) 55%, transparent 100%);
`

const Content = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  padding-bottom: 72px;

  @media (max-width: 480px) {
    padding-bottom: 48px;
  }
`

const Panel = styled.div<{ $active: boolean }>`
  position: absolute;
  max-width: 620px;
  opacity: ${(p) => (p.$active ? 1 : 0)};
  transform: translateY(${(p) => (p.$active ? '0' : '16px')});
  transition: opacity 0.6s ease, transform 0.6s ease;
  pointer-events: ${(p) => (p.$active ? 'auto' : 'none')};
`

const Title = styled.h1`
  font-weight: 700;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.1;
  color: white;
  margin: 0 0 28px;
  max-width: 16ch;
`

const Pagination = styled.div`
  position: absolute;
  bottom: 24px;
  left: 0;
  width: 100%;
  z-index: 4;
  display: flex;
  justify-content: center;
  gap: 8px;
`

const Dot = styled.button<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: ${(p) => (p.$active ? 'white' : 'rgba(255,255,255,0.4)')};
  cursor: pointer;
  transition: background 200ms ease;
  padding: 0;
`

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
    <Hero>
      <Overlay />
      {slides.map((slide, index) => (
        <Slide key={slide.id} $active={current === index}>
          <SlideVideo
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={slide.video} type="video/mp4" />
          </SlideVideo>
        </Slide>
      ))}

      <Content as={Container}>
        {slides.map((slide, index) => (
          <Panel key={`c-${slide.id}`} $active={current === index}>
            <MicroLabel $onDark style={{ marginBottom: 16 }}>
              {slide.label}
            </MicroLabel>
            <Title>{slide.title}</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
            <p style={{ color: 'white', fontSize: '24px' }}>{slide.cta}</p>
            <ViewAllButton href={slide.href} aria-label="View all materials">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
            </ViewAllButton>
            </div>
          </Panel>
        ))}
      </Content>

      {slides.length > 1 && (
        <Pagination>
          {slides.map((_, index) => (
            <Dot key={index} $active={current === index} onClick={() => setCurrent(index)} aria-label={`Show slide ${index + 1}`} />
          ))}
        </Pagination>
      )}
    </Hero>
  )
}
