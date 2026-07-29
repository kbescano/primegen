"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * ===== DESIGN SYSTEM TOKENS (Architectural Couture, Primegen palette) =====
 * Color:
 *   --ink:      #3D5F3B  -- deep forest green. Primary dark surface / heading color.
 *   --accent:   #149911  -- bright green. Used SPARINGLY: hover states, thin accent lines, CTA highlights only.
 *   --paper:    #fdfffc  -- warm off-white. Light backgrounds, high-contrast text on dark.
 *
 * Typography:
 *   Eyebrow / micro-label: text-[11px] font-bold uppercase tracking-[0.25em]
 *   Display headline:      font-black uppercase tracking-tighter leading-none
 *   Body copy:             font-medium leading-relaxed
 *
 * Elevation:
 *   Hairline border, not shadow: border border-[#3D5F3B]/10 (or /15 on dark)
 *   Glass CTA badge: bg-[#fdfffc]/10 backdrop-blur-md border border-[#fdfffc]/20
 *
 * Grid: 1 col mobile -> 2 col tablet (sm:) -> 3 col desktop (lg:)
 * =========================================================================
 */

type Category = {
  id: string | number;
  label: string;
  slug: string;
  description?: string;
  image?: { url?: string; alt?: string };
};

export default function FeaturedCarousel({
  categories,
  featuredVideo,
}: {
  categories: Category[];
  featuredVideo?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setRevealed(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "0px" },
    );

    observer.observe(container);
    return () => {
      if (container) observer.unobserve(container);
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
    >
      {categories.map((cat, i) => {
        const isSteelFabrication =
          cat.label.trim().toLowerCase() === "steel fabrication";
        const revealClass = `transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`;

        // Special wide video hero card -- spans the full grid width regardless of column count
        if (isSteelFabrication) {
          return (
            <Link
              key={cat.id}
              href={`/products#${cat.slug}`}
              className={`group sm:col-span-2 lg:col-span-3 relative flex flex-col overflow-hidden bg-[#fdfffc] outline-none cursor-pointer border border-[#3D5F3B]/10 transition-all duration-500 hover:border-[#149911]/30 ${revealClass}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="pt-14 md:pt-20 pb-11 md:pb-14 px-8 md:px-14 text-left relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-5">
                  Featured Capability
                </p>

                <div className="w-14 h-[2px] bg-[#149911] mb-7 origin-left scale-x-100 transition-transform duration-500 ease-out group-hover:scale-x-150" />

                <h3 className="text-[34px] md:text-[52px] font-black text-[#3D5F3B] tracking-tighter uppercase leading-[0.92]">
                  {cat.label}.
                </h3>

                {cat?.description && (
                  <p className="mt-6 text-[15px] md:text-[17px] text-[#3D5F3B]/60 font-medium max-w-[560px] leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="relative w-full aspect-video md:aspect-[21/9] bg-[#3D5F3B] overflow-hidden">
                <video
                  src={featuredVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#3D5F3B]/50 via-[#3D5F3B]/5 to-transparent pointer-events-none transition-opacity duration-700 group-hover:opacity-60" />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <span className="flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.25em] text-[#fdfffc] bg-[#fdfffc]/10 backdrop-blur-md px-8 py-4 border border-[#fdfffc]/20 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:bg-[#fdfffc] group-hover:text-[#3D5F3B] group-hover:border-[#fdfffc] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] scale-95 group-hover:scale-100">
                    Explore
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      className="transition-transform duration-500 group-hover:translate-x-1.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={cat.id}
            href={`/products#${cat.slug}`}
            className={`group relative flex items-end aspect-[4/5] overflow-hidden bg-[#f8f9f7] outline-none border border-[#3D5F3B]/10 transition-colors duration-500 hover:border-[#149911]/30 ${revealClass}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            {cat.image?.url ? (
              <Image
                src={cat.image.url}
                alt={cat.image.alt || cat.label}
                fill
                className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#3D5F3B]/20 text-[10px] font-medium uppercase tracking-widest">
                No Image
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#3D5F3B]/85 via-[#3D5F3B]/25 to-transparent pointer-events-none" />

            <div className="relative z-10 p-5 md:p-7 flex flex-col gap-2.5 md:gap-3 text-[#fdfffc]">
              <h3 className="text-[20px] md:text-[26px] font-black uppercase tracking-tight leading-[1.0]">
                {cat.label}
              </h3>
              <span className="inline-flex items-center gap-2.5 w-fit text-[10px] font-bold uppercase tracking-[0.18em] bg-[#fdfffc]/10 backdrop-blur-md px-3.5 py-2 border border-[#fdfffc]/20 transition-all duration-300 group-hover:bg-[#fdfffc] group-hover:text-[#3D5F3B] group-hover:border-[#fdfffc]">
                Browse
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
