"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
});

const NAV_LINKS = [
  { href: "/products", label: "Products", hasDropdown: false },
  { href: "/deliveries", label: "Delivered", hasDropdown: false },
  { href: "/calculator", label: "Calculator", hasDropdown: false },
  { href: "/about", label: "About", hasDropdown: false },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [desktopContactOpen, setDesktopContactOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(0.95);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  useEffect(() => {
    setDesktopContactOpen(false);
  }, [pathname]);

  // Scroll listener to dynamically calculate background opacity
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const startFade = 50;  // Begin fading after 50px of scroll
      const endFade = 400;   // Fully transparent at 400px of scroll
      
      if (scrollY <= startFade) {
        setBgOpacity(0.95);
      } else if (scrollY >= endFade) {
        setBgOpacity(0);
      } else {
        const progress = (scrollY - startFade) / (endFade - startFade);
        setBgOpacity(0.95 - (progress * 0.95));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Init on mount
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Main Header - Sleek Dark Theme */}
      <header
        style={{ backgroundColor: `rgba(1, 23, 47, ${bgOpacity})` }}
        className={`fixed top-0 w-full z-[65] backdrop-blur-xl border-b border-[#fdfffc]/5 transition-[transform,opacity] duration-1000 ease-out
          ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
        `}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-[68px] md:h-20 flex items-center justify-between">
          
          {/* 1. Logo & Brand Identity */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 z-[60] outline-none"
            onClick={() => setOpen(false)}
          >
            <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-lg p-1 transition-transform duration-500 group-hover:scale-105">
              <Image
                src="/branding/primegen_trading_logo.png"
                alt="Primegen Logo"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span
                className={`${playfair.className} text-[15px] md:text-[19px] font-black tracking-tight text-[#fdfffc] leading-none transition-colors duration-300 group-hover:text-[#149911]`}
              >
                Primegen
              </span>
              <span className="text-[6px] md:text-[7px] font-bold uppercase tracking-[0.22em] text-[#149911]">
                Trading Corporation
              </span>
            </div>
          </Link>

          {/* 2. Center Navigation - Segmented Pill */}
          <nav className="hidden lg:flex items-center rounded-xl border border-[#fdfffc]/15 bg-[#fdfffc]/5">
            {NAV_LINKS.map((link, idx) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-5 py-2 text-[8px] font-medium transition-colors outline-none
                    ${isActive ? "text-[#fdfffc]" : "text-[#fdfffc]/70 hover:text-[#fdfffc]"}
                    ${idx !== NAV_LINKS.length - 1 ? "border-r border-[#fdfffc]/15" : ""}
                  `}
                >
                  {link.label}
                  {link.hasDropdown && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 mt-0.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. Right Utilities & CTA */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* Email/Inbox Contact Toggle */}
            <div className="relative">
              <button 
                onClick={() => setDesktopContactOpen(!desktopContactOpen)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors outline-none
                  ${desktopContactOpen 
                    ? "border-[#fdfffc] text-[#fdfffc] bg-[#fdfffc]/10" 
                    : "border-[#fdfffc]/15 text-[#fdfffc]/70 hover:text-[#fdfffc] hover:bg-[#fdfffc]/10"
                  }
                `}
                aria-label="Open contact details"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                  <path d="M2 10l10 5 10-5"></path>
                </svg>
              </button>

              {/* Desktop Contact Dropdown */}
              <div
                className={`absolute top-full right-0 mt-4 p-6 bg-white/95 backdrop-blur-lg border border-[#3D5F3B]/5 shadow-2xl rounded-xl w-[260px] origin-top-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                  ${desktopContactOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
                `}
              >
                <div className="flex flex-col gap-5">
                  <div>
                    <span className="block text-[8px] uppercase tracking-[0.25em] text-[#3D5F3B]/40 mb-3 font-medium">
                      Direct Lines
                    </span>
                    <div className="flex flex-col gap-3">
                      <a
                        href="tel:09171859127"
                        className="text-sm tracking-widest text-[#3D5F3B] md:hover:text-[#149911] transition-colors"
                      >
                        0917-185-9127
                      </a>
                      <a
                        href="tel:09171339515"
                        className="text-sm tracking-widest text-[#3D5F3B] md:hover:text-[#149911] transition-colors"
                      >
                        0917-133-9515
                      </a>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-[#3D5F3B]/5">
                    <span className="block text-[8px] uppercase tracking-[0.25em] text-[#3D5F3B]/40 mb-3 font-medium">
                      Email
                    </span>
                    <a
                      href="mailto:sales@primegentradingcorp.com"
                      className="text-[11px] tracking-wide text-[#3D5F3B] md:hover:text-[#149911] transition-colors break-all"
                    >
                      sales@primegentradingcorp.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Vibrant CTA Button */}
            <Link
              href="/quote"
              className="ml-1 px-5 py-2 bg-[#149911] text-white text-[10px] font-semibold rounded-lg hover:bg-[#107e0e] transition-colors shadow-[0_4px_14px_rgba(20,153,17,0.25)] outline-none"
            >
              Request a quote
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden flex flex-col justify-center items-end gap-[5px] w-8 h-8 z-[60] outline-none"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span
              className={`block h-[2px] bg-[#fdfffc] transition-all duration-500 ease-in-out origin-center
                ${open ? "w-6 rotate-45 translate-y-[3px]" : "w-6"}
              `}
            />
            <span
              className={`block h-[2px] bg-[#fdfffc] transition-all duration-500 ease-in-out origin-center
                ${open ? "w-6 -rotate-45 -translate-y-[4px]" : "w-4"}
              `}
            />
          </button>
        </div>
      </header>

      {/* Mobile Fullscreen Menu */}
      <div
        className={`fixed inset-0 z-[55] bg-[#01172f]/98 backdrop-blur-xl flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <nav className="flex flex-col px-10 gap-7 max-w-sm mx-auto w-full">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xl font-light tracking-wide text-[#fdfffc] transition-all duration-700
                ${open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
              `}
              style={{ transitionDelay: `${open ? i * 100 + 200 : 0}ms` }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div
            className={`pt-2 flex flex-col gap-3 transition-all duration-700
              ${open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
            `}
            style={{ transitionDelay: `${open ? NAV_LINKS.length * 100 + 150 : 0}ms` }}
          >
            <a href="tel:09171859127" className="text-[13px] tracking-widest text-[#fdfffc]/60">
              0917-185-9127
            </a>
            <a href="mailto:sales@primegentradingcorp.com" className="text-[13px] tracking-wide text-[#fdfffc]/60">
              sales@primegentradingcorp.com
            </a>
          </div>

          <Link
            href="/quote"
            className={`mt-2 py-4 border-t border-[#fdfffc]/10 text-sm uppercase tracking-[0.2em] font-medium text-[#149911] flex items-center justify-between group transition-all duration-700
              ${open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
            `}
            style={{
              transitionDelay: `${open ? NAV_LINKS.length * 100 + 250 : 0}ms`,
            }}
            onClick={() => setOpen(false)}
          >
            Request a Quote
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-500 group-hover:translate-x-2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </nav>
      </div>

      {/* Mobile Floating Contact (Sleek FAB) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none">
        <div
          className={`mb-4 p-6 bg-white/95 backdrop-blur-lg border border-[#3D5F3B]/5 shadow-2xl rounded-xl w-[260px] origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${contactOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
          `}
        >
          <div className="flex flex-col gap-5">
            <div>
              <span className="block text-[8px] uppercase tracking-[0.25em] text-[#3D5F3B]/40 mb-3 font-medium">
                Direct Lines
              </span>
              <div className="flex flex-col gap-3">
                <a
                  href="tel:09171859127"
                  className="text-sm tracking-widest text-[#3D5F3B] md:hover:text-[#149911] transition-colors"
                >
                  0917-185-9127
                </a>
                <a
                  href="tel:09171339515"
                  className="text-sm tracking-widest text-[#3D5F3B] md:hover:text-[#149911] transition-colors"
                >
                  0917-133-9515
                </a>
              </div>
            </div>
            <div className="pt-5 border-t border-[#3D5F3B]/5">
              <span className="block text-[8px] uppercase tracking-[0.25em] text-[#3D5F3B]/40 mb-3 font-medium">
                Email
              </span>
              <a
                href="mailto:sales@primegentradingcorp.com"
                className="text-[11px] tracking-wide text-[#3D5F3B] md:hover:text-[#149911] transition-colors break-all"
              >
                sales@primegentradingcorp.com
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={() => setContactOpen(!contactOpen)}
          className={`pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ease-out active:scale-95
            ${contactOpen ? "bg-white text-[#3D5F3B] border border-[#3D5F3B]/10" : "bg-[#3D5F3B] text-white md:hover:bg-[#149911]"}
          `}
          aria-label="Contact options"
        >
          <div className="relative w-4.5 h-4.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`absolute inset-0 transition-all duration-500
                ${contactOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}
              `}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`absolute inset-0 transition-all duration-500
                ${contactOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}
              `}
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </button>
      </div>
    </>
  );
}