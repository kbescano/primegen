'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CarouselTrack,
  CarouselControls,
  ScrollButton,
  ProductCard,
  ProductCardTitle,
  ProductCardImage,
  ArrowOverlayButton,
  LinkCta,
  MicroLabel,
  ButtonLink,
  QvBackdrop,
  QvModal,
  QvClose,
  QvTabs,
  QvTab,
  QvBody,
  QvImage,
  QvFeatureRow,
  QvFeatureIcon,
  QvFeatureText,
} from '@/components/ui/styled'

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
      <CarouselTrack ref={trackRef}>
        {materials.map((m) => (
          <ProductCard key={m.id} style={{ opacity: m.inStock === false ? 0.5 : 1 }}>
            <ProductCardTitle>{m.name}</ProductCardTitle>
            <ProductCardImage>
              {m.photo?.url && <Image src={m.photo.url} alt={m.photo.alt || m.name} fill style={{ objectFit: 'cover' }} />}
              <ArrowOverlayButton onClick={() => setSelected(m)} aria-label={`Quick view ${m.name}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </ArrowOverlayButton>
            </ProductCardImage>
            <div style={{ marginTop: 16 }}>
              {m.inStock === false ? (
                <p style={{ fontSize: 13, color: '#4a4a4a', margin: 0 }}>Out of stock</p>
              ) : (
                <LinkCta href={`/quote?material=${m.id}`}>Request a Quote</LinkCta>
              )}
            </div>
          </ProductCard>
        ))}
      </CarouselTrack>

      <CarouselControls>
        <ScrollButton onClick={() => scroll('left')} aria-label="Scroll left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </ScrollButton>
        <ScrollButton onClick={() => scroll('right')} aria-label="Scroll right">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </ScrollButton>
      </CarouselControls>

      {selected && (
        <QvBackdrop onClick={() => setSelected(null)}>
          <QvModal onClick={(e) => e.stopPropagation()}>
            <QvClose onClick={() => setSelected(null)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </QvClose>

            {materials.length > 1 && (
              <QvTabs>
                {materials.map((m) => (
                  <QvTab key={m.id} $active={selected.id === m.id} onClick={() => setSelected(m)}>
                    {m.name}
                  </QvTab>
                ))}
              </QvTabs>
            )}

            <QvBody>
              <QvImage>
                {selected.photo?.url && (
                  <Image src={selected.photo.url} alt={selected.photo.alt || selected.name} fill style={{ objectFit: 'cover' }} />
                )}
              </QvImage>

              <div>
                <MicroLabel style={{ marginBottom: 8 }}>
                  {CATEGORY_LABELS[selected.category || ''] || selected.category}
                </MicroLabel>
                <h2 style={{ marginBottom: 20, fontSize: 28 }}>{selected.name}</h2>

                {selected.inStock === false ? (
                  <p style={{ color: '#8a2e2e', fontWeight: 700, marginBottom: 20 }}>Out of stock</p>
                ) : (
                  <ButtonLink href={`/quote?material=${selected.id}`} style={{ marginBottom: 24 }}>
                    Request a Quote
                  </ButtonLink>
                )}

                {selected.description && (
                  <QvFeatureRow>
                    <QvFeatureIcon>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </QvFeatureIcon>
                    <QvFeatureText>{selected.description}</QvFeatureText>
                  </QvFeatureRow>
                )}

                {selected.unit && (
                  <QvFeatureRow>
                    <QvFeatureIcon>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                    </QvFeatureIcon>
                    <QvFeatureText>Sold {selected.unit}</QvFeatureText>
                  </QvFeatureRow>
                )}

                <QvFeatureRow>
                  <QvFeatureIcon>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </QvFeatureIcon>
                  <QvFeatureText>{selected.inStock === false ? 'Currently out of stock' : 'In stock and available'}</QvFeatureText>
                </QvFeatureRow>

                <LinkCta href={`/materials/${selected.id}`} style={{ marginTop: 20 }}>
                  View Full Details
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </LinkCta>
              </div>
            </QvBody>
          </QvModal>
        </QvBackdrop>
      )}
    </div>
  )
}
