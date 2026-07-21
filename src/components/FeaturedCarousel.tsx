"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Category = {
  id: string | number;
  label: string;
  slug: string;
  description?: string;
  image?: { url?: string; alt?: string };
};

const STEEL_FABRICATION_VIDEO =
  "https://www.pexels.com/download/video/30456101/";

export default function FeaturedCarousel({
  categories,
}: {
  categories: Category[];
}) {
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // This triggers every time the element enters OR leaves the screen.
        // It resets the animation when scrolling away, and replays it when scrolling back.
        setRevealed(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Triggers when 10% of the grid is visible
        rootMargin: "0px",
      },
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
      className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
    >
      {categories.map((cat, i) => {
        const isSteelFabrication =
          cat.label.trim().toLowerCase() === "steel fabrication";
        const revealClass = `transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`;

        // Special wide video hero card -- only renders for the "Steel Fabrication" category
        if (isSteelFabrication) {
          return (
            <Link
              key={cat.id}
              href={`/materials#${cat.slug}`}
              className={`group md:col-span-2 relative flex flex-col overflow-hidden bg-white outline-none cursor-pointer border border-[#01172f]/10 ${revealClass}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="pt-12 md:pt-16 pb-10 px-8 md:px-12 text-left relative z-10">
                {/* Bold Accent Line */}
                <div className="w-12 h-[4px] bg-[#01172f] mb-6 transform origin-left transition-transform duration-500 ease-out group-hover:scale-x-150"></div>

                <h3 className="text-[32px] md:text-[48px] font-black text-[#01172f] tracking-tighter uppercase leading-none">
                  {cat.label}.
                </h3>

                {cat?.description && (
                  <p className="mt-5 text-[15px] md:text-[17px] text-[#01172f]/70 font-medium max-w-[560px] leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Video Section */}
              <div className="relative w-full aspect-video md:aspect-[21/9] bg-[#01172f] overflow-hidden">
                <video
                  src={STEEL_FABRICATION_VIDEO}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                />

                {/* Subtle Cinematic Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none transition-opacity duration-700 group-hover:opacity-50" />

                {/* Premium Sharp Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <span className="flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.25em] text-white bg-white/10 backdrop-blur-md px-8 py-4 border border-white/20 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:bg-white group-hover:text-[#01172f] group-hover:border-white shadow-2xl scale-95 group-hover:scale-100">
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
            href={`/materials#${cat.slug}`}
            className={`group relative flex items-end aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[#f8f9f7] outline-none ${revealClass}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            {/* Full-bleed hero image */}
            {cat.image?.url ? (
              <Image
                src={cat.image.url}
                alt={cat.image.alt || cat.label}
                fill
                className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                No Image
              </div>
            )}

            {/* Gradient so white text stays legible over any photo */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

            {/* Bold header + Browse link, bottom-left */}
            <div className="relative z-10 p-6 md:p-10 flex flex-col gap-2 md:gap-3 text-white">
              <h3 className="text-[white] text-[28px] md:text-[36px] font-bold uppercase tracking-tight leading-[1.05]">
                {cat.label}
              </h3>
              <span className="mt-2 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em]">
                Browse
                <span className="flex items-center justify-center w-7 h-7 rounded-full border border-white/50 transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                  <svg
                    width="12"
                    height="12"
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
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
