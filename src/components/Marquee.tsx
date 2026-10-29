// A single, quiet ticker: category names in small muted caps drifting slowly
// across hairline rules. Pure CSS (no JS); pauses on hover. Hidden from
// assistive tech -- the same categories are listed in the real content below.
export default function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null

  const content = (
    <div className="flex shrink-0 items-center">
      {items.map((label, i) => (
        <div key={`${label}-${i}`} className="flex shrink-0 items-center">
          <span className="whitespace-nowrap px-7 text-[11px] font-medium uppercase tracking-[0.32em] text-[#fdfffc]/45 transition-colors duration-300 hover:text-[#fdfffc] md:px-10 md:text-[12px]">
            {label}
          </span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#149911]" />
        </div>
      ))}
    </div>
  )

  return (
    <section
      aria-hidden="true"
      className="fx-tape relative overflow-hidden border-y border-[#fdfffc]/10 bg-[#05100d] py-5 md:py-6"
    >
      <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="fx-tape-track flex shrink-0" style={{ ['--dur' as string]: '110s' }}>
          {content}
        </div>
        <div aria-hidden="true" className="fx-tape-track flex shrink-0" style={{ ['--dur' as string]: '110s' }}>
          {content}
        </div>
      </div>
    </section>
  )
}
