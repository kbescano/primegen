import { ReactNode } from 'react'
import ScrollReveal from '@/components/ScrollReveal'

type SectionHeaderProps = {
  title: string
  eyebrow?: string
  description?: string
  size?: 'page' | 'section'
  accent?: boolean
  children?: ReactNode // right-aligned slot: search bar, "View Catalog" link, etc.
}

export default function SectionHeader({
  title,
  eyebrow,
  description,
  size = 'section',
  accent = true,
  children,
}: SectionHeaderProps) {
  const isPage = size === 'page'

  return (
    <ScrollReveal
      className={`group flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-[#01172f]/10 ${
        isPage ? 'pb-10 mb-16 md:mb-24' : 'pb-6 mb-12'
      }`}
    >
      <div>
        {accent && (
          <div
            className={`h-[4px] bg-[#149911] mb-5 origin-left transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-x-150 ${
              isPage ? 'w-12' : 'w-8'
            }`}
          />
        )}
        {eyebrow && (
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-[#01172f]/50 mb-3">
            {eyebrow}
          </p>
        )}
        <h2
          className={`font-black tracking-tighter text-[#01172f] uppercase leading-[0.95] ${
            isPage ? 'text-[40px] md:text-[64px]' : 'text-[26px] md:text-[36px]'
          }`}
        >
          {title}.
        </h2>
        {description && (
          <p className="mt-4 max-w-[560px] text-[13px] md:text-[15px] leading-relaxed text-[#01172f]/60 font-medium">
            {description}
          </p>
        )}
      </div>

      {children && <div className="md:pb-1">{children}</div>}
    </ScrollReveal>
  )
}