"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cloudinaryOptimized } from "@/lib/cloudinaryUrl";

type Category = {
  id: string | number;
  label: string;
  slug: string;
  description?: string;
  image?: { url?: string; alt?: string };
};

// Internal component: High-end 3D tilt + dramatic scroll reveal on EVERY scroll
function CategoryCard({
  cat,
  isFeatured,
  featuredVideo,
  index,
  wide,
}: {
  cat: Category;
  isFeatured: boolean;
  featuredVideo?: string;
  index: number;
  wide?: boolean;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  // 1. Triggered Entrance Animation (Runs every time it enters/leaves the viewport)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle visibility based on whether it is currently intersecting
        setIsVisible(entry.isIntersecting);
      },
      { 
        threshold: 0.1, 
        rootMargin: "0px 0px -50px 0px" 
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 2. 3D Mouse Tracking Physics (Desktop Only). Written straight to the
  // element's style (batched to one write per frame) instead of through React
  // state, so moving the mouse over a card no longer re-renders it on every
  // mousemove event.
  const REST = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  const applyTransform = (t: string, ms: number) => {
    const el = innerRef.current;
    if (!el) return;
    el.style.transitionDuration = `${ms}ms`;
    el.style.transform = t;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    if (!cardRef.current) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Dampen the rotation for a luxurious, subtle tilt
      const rotateX = (((clientY - rect.top) - centerY) / centerY) * -8;
      const rotateY = (((clientX - rect.left) - centerX) / centerX) * 8;
      applyTransform(`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`, 100);
    });
  };

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    // Initial scale-up pop before the mouse moves
    applyTransform("perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1.05, 1.05, 1.05)", 100);
  };

  const handleMouseLeave = () => {
    cancelAnimationFrame(rafRef.current);
    // Reset smoothly to flat rest state
    applyTransform(REST, 700);
  };

  // Stagger entrance, but remove delay on exit so it resets instantly off-screen
  const delay = isVisible ? Math.min(index * 120, 600) : 0;

  return (
    <Link
      ref={cardRef}
      href={`/products/category/${cat.slug}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ transitionDelay: `${delay}ms` }}
      // Outer wrapper handles the scroll fade-in with a premium 'dealing card' rotation/scale
      className={`group relative outline-none z-10 lg:hover:z-30 flex flex-col justify-end
        transition-all duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom
        ${isVisible 
          ? "opacity-100 translate-y-0 scale-100 rotate-0 blur-none" 
          : "opacity-0 translate-y-[100px] scale-[0.85] rotate-[4deg] blur-sm"}
        ${isFeatured ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : wide ? "col-span-1 aspect-[4/5] lg:col-span-2 lg:aspect-[8/5]" : "col-span-1 aspect-[4/5]"}
      `}
    >
      {/* Inner 3D Wrapper: Handles the physics and aesthetic borders */}
      <div 
        ref={innerRef}
        style={{ transform: REST, transitionDuration: "700ms" }}
        className={`absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-b from-[#0a1a15] to-[#05100d] border border-[#fdfffc]/10 flex flex-col justify-end
          shadow-[0_4px_20px_rgba(0,0,0,0.4)] lg:group-hover:shadow-[0_20px_50px_rgba(20,153,17,0.4)] lg:group-hover:border-[#149911]/40
          transition-transform ease-out

        `}
      >
        {/* Image / Video Background */}
        {isFeatured && featuredVideo ? (
          <video
            src={featuredVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.25,1,0.5,1)] scale-100 lg:group-hover:scale-110"
          />
        ) : cat.image?.url ? (
          <Image
            src={cloudinaryOptimized(cat.image.url, 1000) || cat.image.url}
            alt={cat.image.alt || cat.label}
            fill
            className="object-cover transition-all duration-[2s] ease-[cubic-bezier(0.25,1,0.5,1)] scale-105 lg:group-hover:scale-110 opacity-70 lg:group-hover:opacity-100 filter lg:group-hover:brightness-110 pointer-events-none"
            sizes={isFeatured ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 50vw, 25vw"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#030806] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a1a15] to-[#030806] pointer-events-none">
            <span className="text-[#fdfffc]/10 text-[11px] font-black uppercase tracking-[0.3em]">
              No Image
            </span>
          </div>
        )}

        {/* Ambient Top Glow for Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none opacity-0 lg:group-hover:opacity-100 transition-opacity duration-700" />

        {/* Dark Duotone Overlay Gradient for deep text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#010605] via-[#05100d]/70 to-transparent pointer-events-none transition-colors duration-700 lg:group-hover:via-[#05100d]/40" />

        {/* Text Content */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end h-full w-full pointer-events-none">
          {isFeatured && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 bg-[#149911]/10 border border-[#149911]/30 backdrop-blur-md text-[#2dd4bf] px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] shadow-[0_0_15px_rgba(20,153,17,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#149911] animate-pulse" />
                Featured Capability
              </span>
            </div>
          )}

          <h3 className={`font-semibold text-[#fdfffc] leading-[1.1] mb-1 tracking-tight drop-shadow-lg transition-colors duration-500 lg:group-hover:text-[#2dd4bf] ${isFeatured ? 'text-[28px] md:text-[36px]' : 'text-[18px] md:text-[22px]'}`}>
            {cat.label}
          </h3>

          {/* Browse CTA: Visible by default on mobile, expands/slides on hover for desktop */}
          <div className="overflow-hidden h-10 lg:h-0 lg:group-hover:h-10 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] mt-2">
            <span className="inline-flex items-center gap-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc] translate-y-0 lg:translate-y-6 lg:group-hover:translate-y-0 transition-transform duration-500 delay-100">
              Browse Category
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#149911] text-white lg:-translate-x-3 lg:group-hover:translate-x-1 transition-transform duration-500 shadow-[0_0_10px_rgba(20,153,17,0.4)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedCarousel({
  categories,
  featuredVideo,
}: {
  categories: Category[];
  featuredVideo?: string;
}) {
  if (categories.length === 0) return null;

  // On the 4-column layout the featured tile covers 2x2, so the grid fills 4
  // cells per row except where the category count leaves a short last row;
  // widen those last tiles so the grid ends flush instead of with a gap.
  const hasFeatured = categories.some((c) => c.label.trim().toLowerCase() === "steel fabrication");
  const cells = categories.length + (hasFeatured ? 3 : 0);
  const remainder = cells % 4;
  const wideFrom = remainder === 2 ? categories.length - 2 : remainder === 3 ? categories.length - 3 : -1;
  const wideTo = remainder === 2 ? categories.length : remainder === 3 ? categories.length - 2 : -1;

  return (
    <div className="w-full flex flex-col gap-10 md:gap-16 pt-4 bg-[#05100d]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
        {categories.map((cat, index) => {
          const isSteelFabrication = cat.label.trim().toLowerCase() === "steel fabrication";
          return (
            <CategoryCard
              key={cat.id}
              cat={cat}
              isFeatured={isSteelFabrication}
              featuredVideo={featuredVideo}
              index={index}
              wide={index >= wideFrom && index < wideTo}
            />
          );
        })}
      </div>
    </div>
  );
}