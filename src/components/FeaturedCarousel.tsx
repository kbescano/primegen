'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  CarouselWrap,
  CarouselTrack,
  FeaturedCard,
  FeaturedCardLabel,
  FeaturedCardTitle,
  FeaturedCardSub,
  FeaturedCardImage,
  ViewAllButton,
  LinkCta,
} from '@/components/ui/styled'

type Material = {
  id: string | number
  name: string
  category?: string
  description?: string
  photo?: { url?: string; alt?: string }
}

export default function FeaturedCarousel({ materials }: { materials: Material[] }) {
  if (materials.length === 0) return null

  return (
    <CarouselWrap>
      <CarouselTrack style={{ flex: 1 }}>
        {materials.map((m, index) => (
          <FeaturedCard key={m.id} $dark={index === 0}>
            <FeaturedCardLabel $dark={index === 0}>{m.category?.replace('-', ' ') || 'Featured'}</FeaturedCardLabel>
            <FeaturedCardTitle>{m.name}</FeaturedCardTitle>
            {m.description && <FeaturedCardSub>{m.description.slice(0, 80)}</FeaturedCardSub>}
            <FeaturedCardImage>
              {m.photo?.url && <Image src={m.photo.url} alt={m.photo.alt || m.name} fill style={{ objectFit: 'cover' }} />}
            </FeaturedCardImage>
            <LinkCta href={`/quote?material=${m.id}`} style={{ marginTop: 20, color: index === 0 ? 'white' : undefined }}>
              Request a Quote
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </LinkCta>
          </FeaturedCard>
        ))}
      </CarouselTrack>

      <ViewAllButton href="/materials" aria-label="View all materials">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </ViewAllButton>
    </CarouselWrap>
  )
}
