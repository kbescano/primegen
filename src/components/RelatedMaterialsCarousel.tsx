import Link from 'next/link'
import Image from 'next/image'

type Material = {
  id: string | number
  name: string
  photo?: { url?: string; alt?: string }
}

export default function RelatedMaterialsGrid({ materials }: { materials: Material[] }) {
  if (materials.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-14">
      {materials.map((m) => (
        <Link
          key={m.id}
          href={`/materials/${m.id}`}
          className="group flex flex-col cursor-pointer outline-none"
        >
          <div className="relative w-full aspect-[4/3] bg-[#f8f9f7] overflow-hidden">
            {m.photo?.url ? (
              <Image
                src={m.photo.url}
                alt={m.photo.alt || m.name}
                fill
                className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                No Image
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/[0.03]" />
          </div>

          <div className="flex items-center justify-between mt-4 md:mt-5 gap-2">
            <h3 className="text-[14px] md:text-[15px] font-medium tracking-tight text-[#01172f] leading-snug transition-colors duration-300 group-hover:text-[#3D5F3B]">
              {m.name}
            </h3>
            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em] text-[#01172f] opacity-100 translate-x-0 md:opacity-0 md:-translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#3D5F3B]">
              View
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}