"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

interface Story {
  id: string;
  logo: string;
  category: string;
  title: string;
  description: string;
  image: string;
}

export default function CustomerStories({ stories }: { stories: Story[] }) {
  // ✨ stories now comes from props (fetched server-side from Payload)
  // instead of a hardcoded array. Guard against an empty list just in
  // case this ever renders with no data reaching it.
  if (!stories || stories.length === 0) return null;

  const [activeTab, setActiveTab] = useState<Story>(stories[0]);

  // Typewriter and Reveal State
  const [displayedTitle, setDisplayedTitle] = useState(stories[0].title);
  const [displayedDesc, setDisplayedDesc] = useState(stories[0].description);
  const [isTypingDone, setIsTypingDone] = useState(true);

  const handleTabClick = (story: Story) => {
    if (activeTab.id === story.id) return;
    setActiveTab(story);
  };

  // Fast Typewriting Effect Hook
  useEffect(() => {
    let titleIndex = 0;
    let descIndex = 0;
    const titleFull = activeTab.title;
    const descFull = activeTab.description;

    // Reset state for new tab
    setDisplayedTitle("");
    setDisplayedDesc("");
    setIsTypingDone(false);

    const timer = setInterval(() => {
      // Type title first
      if (titleIndex < titleFull.length) {
        titleIndex += 2; // type 2 chars at a time for speed
        setDisplayedTitle(titleFull.substring(0, titleIndex));
      }
      // Then type description
      else if (descIndex < descFull.length) {
        descIndex += 3; // type 3 chars at a time for speed
        setDisplayedDesc(descFull.substring(0, descIndex));
      }
      // Finish and reveal image
      else {
        setIsTypingDone(true);
        clearInterval(timer);
      }
    }, 10); // Ultra-fast interval

    return () => clearInterval(timer);
  }, [activeTab]);

  return (
    <section className="py-24 md:py-32 bg-[#05100d] overflow-hidden relative">

      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#149911]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 relative z-10">
        <ScrollReveal>

          {/* Section Header */}
          <div className="flex flex-col items-center justify-center text-center mb-10 md:mb-12">
            <div className="flex items-center gap-2 mb-3 text-[#fdfffc]/50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M2 15h10" />
                <path d="M9 18l3-3-3-3" />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
                Case Studies
              </span>
            </div>
            <h2 className="text-[28px] md:text-[36px] font-medium tracking-tight text-[#fdfffc] leading-none">
              Our customer <span className="text-[#149911]">stories</span>
            </h2>
          </div>

          {/* Segmented Tab Navigation */}
          <div className="flex flex-wrap md:flex-nowrap w-full overflow-hidden rounded-t-2xl bg-[#0a1a15] border border-[#fdfffc]/10 border-b-0 relative z-10">
            {stories.map((story, i) => {
              const isActive = activeTab.id === story.id;
              const isLast = i === stories.length - 1;

              return (
                <button
                  key={story.id}
                  onClick={() => handleTabClick(story)}
                  className={`flex-auto w-[50%] md:w-auto md:flex-1 py-4 md:py-5 px-2 md:px-4 flex items-center justify-center text-[10px] md:text-[11px] font-bold tracking-widest uppercase transition-all duration-300 outline-none border-[#fdfffc]/10 border-r
                    ${isActive
                      ? "bg-[#fdfffc] text-[#01172f]"
                      : "bg-transparent text-[#fdfffc]/60 hover:bg-[#fdfffc]/10 hover:text-[#fdfffc] border-b"
                    }
                    ${isLast ? "border-r-0" : ""}
                    ${i % 2 === 1 && !isLast ? "border-r-0 md:border-r" : ""}
                  `}
                >
                  {story.logo}
                </button>
              );
            })}
          </div>

          {/* Tab Content Container */}
          <div className="relative z-0">
            <div className="bg-[#fdfffc] w-full p-8 md:p-12 lg:p-16 shadow-2xl rounded-b-2xl border-x border-b border-[#fdfffc]/10 min-h-[400px]">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center h-full">

                {/* Left: Typewriting Text Content */}
                <div className="flex flex-col items-start order-2 lg:order-1 h-full justify-center">

                  {/* Category Badge */}
                  <span className="inline-flex items-center gap-1.5 bg-[#149911]/10 text-[#149911] px-2.5 py-1 rounded-[4px] text-[8px] font-bold uppercase tracking-[0.2em] mb-4 md:mb-5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    {activeTab.category}
                  </span>

                  {/* Typing Title */}
                  <h3 className="text-[20px] md:text-[28px] font-medium text-[#01172f] tracking-tight leading-[1.2] mb-4 min-h-[50px] md:min-h-[70px]">
                    {displayedTitle}
                    {!isTypingDone && <span className="animate-pulse ml-0.5 inline-block w-[2px] h-[20px] md:h-[24px] bg-[#149911] translate-y-1"></span>}
                  </h3>

                  {/* Typing Description */}
                  <p className="text-[#01172f]/60 font-medium text-[13px] md:text-[14px] leading-relaxed max-w-[420px]">
                    {displayedDesc}
                  </p>

                </div>

                {/* Right: Delayed Image Reveal */}
                <div
                  className={`relative w-full aspect-video md:aspect-[4/3] order-1 lg:order-2 mix-blend-darken transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isTypingDone ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"}
                  `}
                >
                  <Image
                    src={activeTab.image}
                    alt={activeTab.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-contain drop-shadow-lg"
                    unoptimized
                  />
                </div>

              </div>
            </div>
          </div>

        </ScrollReveal>
      </div>
    </section>
  );
}