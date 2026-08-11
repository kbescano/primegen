"use client";

import { useState, useEffect, useRef } from "react";

const VALUE_PROPS = [
  {
    num: "01",
    title: "Direct supplier low price",
    body: "No markup layers, prices reflect current supplier cost.",
  },
  {
    num: "02",
    title: "Scheduled delivery",
    body: "Book delivery windows that fit your project timeline.",
  },
  {
    num: "03",
    title: "Dedicated coordination",
    body: "A real person confirms your order, not an auto-reply.",
  },
];

export default function PainPointsResponse() {
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const [headerProgress, setHeaderProgress] = useState(0);
  const [cardsProgress, setCardsProgress] = useState(0);
  const [textProgress, setTextProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const wh = window.innerHeight;

      // Track Header (Pain Points)
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        let p = (wh - rect.top) / (wh * 0.5);
        setHeaderProgress(Math.max(0, Math.min(1, p)));
      }

      // Track Cards Grid
      if (cardsRef.current) {
        const rect = cardsRef.current.getBoundingClientRect();
        // CHANGED: Animation now begins exactly when the top of the cards crosses the 50% center mark of the screen
        // It reaches full size after scrolling another 30% of the viewport height.
        let p = ((wh * 0.5) - rect.top) / (wh * 0.3); 
        setCardsProgress(Math.max(0, Math.min(1, p)));
      }

      // Track Text/Typewriter (Our Response)
      if (textRef.current) {
        const rect = textRef.current.getBoundingClientRect();
        let p = (wh * 0.85 - rect.top) / (wh * 0.7);
        setTextProgress(Math.max(0, Math.min(1, p)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); 
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Header Scroll-Linked Typewriter Math ---
  const H_EYEBROW = "Pain Points";
  const H1 = "You're expected to build fast, with ";
  const H2 = "accurate timelines";
  const H3 = ", but traditional suppliers can't keep up with ";
  const H4 = "project demands";

  const hTotalChars = H_EYEBROW.length + H1.length + H2.length + H3.length + H4.length;
  const hCurrentChars = Math.floor(headerProgress * hTotalChars);

  let hRem = hCurrentChars;
  
  const hTypedEyebrow = H_EYEBROW.substring(0, Math.max(0, hRem));
  hRem -= H_EYEBROW.length;
  
  const h_r1 = hRem > 0 ? H1.substring(0, hRem) : "";
  hRem -= H1.length;
  
  const h_r2 = hRem > 0 ? H2.substring(0, hRem) : "";
  hRem -= H2.length;
  
  const h_r3 = hRem > 0 ? H3.substring(0, hRem) : "";
  hRem -= H3.length;
  
  const h_r4 = hRem > 0 ? H4.substring(0, hRem) : "";

  // --- Card Tiny-to-Big Scroll Reveal Logic (Synchronized) ---
  const getCardStyle = () => {
    const p = cardsProgress;

    // Apply a smooth ease-out curve so it snaps beautifully at the end
    const easeOut = 1 - Math.pow(1 - p, 4);

    // Start at exactly 15% scale (tiny miniature), grow to 100% simultaneously
    const scale = 0.15 + (0.85 * easeOut);
    
    // Pull the cards DOWN slightly initially, pushing them up into center as they expand
    const translateY = (1 - easeOut) * 100;
    
    // The wrapper stays slightly transparent when tiny, becomes fully opaque
    const opacity = 0.4 + (0.6 * easeOut);

    return {
      opacity,
      transform: `translateY(${translateY}px) scale(${scale})`,
      willChange: p < 1 ? "transform, opacity" : "auto",
    };
  };

  // Only fade the internal text/icons in during the second half of the expansion
  const contentOpacity = cardsProgress < 0.3 ? 0 : (cardsProgress - 0.3) / 0.7;

  // --- Our Response Scroll-Linked Typewriter Math ---
  const EYEBROW = "Our Response";
  const P1 = "Primegen gives you all the power of a ";
  const P2 = "direct supplier";
  const P3 = ", so you can build ";
  const P4 = "quicker than ever";
  const DESC = "Developed in parallel with the largest commercial infrastructure projects, Primegen was shaped by real construction challenges to provide proven logistics, scale, and pricing transparency.";

  const totalChars = EYEBROW.length + P1.length + P2.length + P3.length + P4.length + DESC.length;
  const currentChars = Math.floor(textProgress * totalChars);

  let remaining = currentChars;
  
  const typedEyebrow = EYEBROW.substring(0, Math.max(0, remaining));
  remaining -= EYEBROW.length;
  
  const r1 = remaining > 0 ? P1.substring(0, remaining) : "";
  remaining -= P1.length;
  
  const r2 = remaining > 0 ? P2.substring(0, remaining) : "";
  remaining -= P2.length;
  
  const r3 = remaining > 0 ? P3.substring(0, remaining) : "";
  remaining -= P3.length;
  
  const r4 = remaining > 0 ? P4.substring(0, remaining) : "";
  remaining -= P4.length;
  
  const typedDesc = remaining > 0 ? DESC.substring(0, remaining) : "";

  return (
    <section className="py-20 md:py-32 bg-[#fdfffc] overflow-hidden min-h-screen flex flex-col justify-center">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-20 w-full">
        
        {/* 1. Pain Points Header (Scroll-driven Typewriter) */}
        <div 
          ref={headerRef}
          className="flex flex-col items-center text-center mb-12 md:mb-16 will-change-transform min-h-[180px]"
          style={{ 
            opacity: headerProgress, 
            transform: `translateY(${(1 - headerProgress) * 20}px)` 
          }}
        >
          <div className="flex items-center gap-2 text-[#01172f]/40 mb-6 h-[24px]">
            {hTypedEyebrow.length > 0 && (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                  {hTypedEyebrow}
                </span>
              </>
            )}
          </div>
          <h2 className="text-[28px] md:text-[40px] lg:text-[48px] font-medium tracking-tight text-[#01172f] leading-[1.2]">
            {h_r1}
            <span className="text-[#149911]">{h_r2}</span>
            {h_r3}
            <span className="text-[#149911]">{h_r4}</span>
          </h2>
        </div>

        {/* 2. Pain Points Grid */}
        <div ref={cardsRef} className="grid gap-6 md:gap-8 sm:grid-cols-3 mb-32 md:mb-48 relative z-10">
          {VALUE_PROPS.map((v) => (
            // STATIC WRAPPER: Centers the animated card within the grid cell coordinate space
            <div key={v.num} className="flex items-center justify-center w-full h-full">
              
              {/* ANIMATED TARGET: Transforms purely from its own center synchronously */}
              <div style={getCardStyle()} className="w-full h-full origin-center">
                
                {/* Inner Card - Handles hover states independently of scroll progress */}
                <div className="group relative h-full bg-[#f8f9f7] rounded-2xl p-8 flex flex-col gap-6 border border-[#01172f]/5 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.05] hover:shadow-[0_30px_60px_-15px_rgba(20,153,17,0.15)] hover:-translate-y-2 hover:border-[#149911]/20">
                  
                  {/* Subtle Glow Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#149911]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

                  <div style={{ opacity: contentOpacity, willChange: "opacity" }} className="flex flex-col gap-6 h-full transition-opacity duration-100 ease-linear">
                    {/* Animated Icon Container */}
                    <div className="w-12 h-12 rounded-xl bg-[#149911]/10 text-[#149911] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm relative z-10">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-[16px] md:text-[18px] font-bold text-[#01172f] leading-tight mb-3 transition-colors duration-300 group-hover:text-[#149911]">
                        {v.title}
                      </h3>
                      <p className="text-[14px] text-[#01172f]/60 font-medium leading-relaxed m-0">
                        {v.body}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Accent Line on Hover */}
                  <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r from-[#149911]/0 via-[#149911]/40 to-[#149911]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. "Our Response" Typewriter Effect */}
        <div 
          ref={textRef}
          className="flex flex-col items-center text-center max-w-[900px] mx-auto pb-10 min-h-[340px]"
        >
          <div className="flex items-center gap-2 text-[#01172f]/40 mb-6 h-[24px]">
            {typedEyebrow.length > 0 && (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                  {typedEyebrow}
                </span>
              </>
            )}
          </div>

          <h2 className="text-[32px] md:text-[48px] lg:text-[56px] font-medium tracking-tight text-[#01172f] leading-[1.1] mb-8 min-h-[140px] md:min-h-[125px]">
            {r1}
            <span className="text-[#149911]">{r2}</span>
            {r3}
            <span className="text-[#149911]">{r4}</span>
          </h2>

          <p className="text-[15px] md:text-[18px] text-[#01172f]/60 font-medium leading-relaxed max-w-[640px] min-h-[80px]">
            {typedDesc}
          </p>
        </div>
      </div>
    </section>
  );
}