'use client'

import Link from 'next/link'
import Image from 'next/image'

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
    <div className="relative flex items-center gap-3">
      <div className="flex-1 flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {materials.map((m, index) => (
          <div
            key={m.id}
            className={`flex-none w-[340px] min-h-[420px] rounded p-8 flex flex-col snap-start max-[480px]:w-[82vw] max-[480px]:min-h-[380px] ${
              index === 0 ? 'bg-green text-white' : 'bg-white text-black border border-black/10'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${index === 0 ? 'text-sage' : 'text-green'}`}>
              {m.category?.replace('-', ' ') || 'Featured'}
            </p>
            <h3 className="text-2xl font-bold mb-2">{m.name}</h3>
            {m.description && <p className="text-sm mb-6 opacity-85">{m.description.slice(0, 80)}</p>}
            <div className="relative flex-1 rounded overflow-hidden min-h-[180px] bg-sage-tint">
              {m.photo?.url && <Image src={m.photo.url} alt={m.photo.alt || m.name} fill className="object-cover" />}
            </div>
            <Link
              href={`/quote?material=${m.id}`}
              className={`inline-flex items-center gap-2 font-bold text-sm mt-5 hover:underline ${index === 0 ? 'text-white' : 'text-green'}`}
            >
              Request a Quote
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      <Link
        href="/materials"
        aria-label="View all materials"
        className="flex-shrink-0 w-11 h-11 rounded-full bg-green text-white flex items-center justify-center hover:bg-green-hover transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    </div>
  )
}
