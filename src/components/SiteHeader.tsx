"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"] });

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/deliveries", label: "Delivered" },
  { href: "/calculator", label: "Calculator" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    // Lock body scroll when mobile menu is open
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    
    return () => { document.body.style.overflow = 'unset'; }
  }, [open]);

  return (
    <>
      

      {/* Main Header */}
      <header 
        className={`sticky top-0 z-[65] bg-white/80 backdrop-blur-2xl border-b border-[#3D5F3B]/5 transition-all duration-1000 ease-out delay-100
          ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
        `}
      >
        <div className="max-w-[1360px] mx-auto px-6 lg:px-16 h-20 md:h-24 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <Link href="/" className="group flex items-center gap-3 z-[60]" onClick={() => setOpen(false)}>
            <Image
              src="/branding/primegen_trading_logo.png"
              alt="Primegen Logo"
              width={90}
              height={90}
              className="w-14 h-14 md:w-20 md:h-20 object-contain transition-transform duration-500 group-hover:scale-105"
            />

            <div className="flex flex-col justify-center">
              <span className={`${playfair.className} text-base md:text-lg font-black tracking-[0.05em] text-[#3D5F3B] uppercase leading-none [text-shadow:0_1px_1px_rgba(0,0,0,0.15)] transition-colors duration-300 group-hover:text-[#149911]`}>
                Primegen
              </span>
              <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.25em] text-[#000] mt-1">
                Trading Corporation
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 py-2 outline-none
                    ${isActive ? "text-[#3D5F3B]" : "text-[#3D5F3B]/90 hover:text-[#3D5F3B]"}
                  `}
                >
                  {link.label}
                  {/* Underline -- shows for the active page and on keyboard focus */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[1px] bg-[#149911] origin-center transition-all duration-300 group-focus-visible:opacity-100 group-focus-visible:scale-x-100
                      ${isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}
                    `}
                  />
                </Link>
              );
            })}
            
            {/* Minimalist Solid CTA */}
            <Link
              href="/quote"
              className="ml-6 px-8 py-3.5 bg-[#149911] text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#3D5F3B] transition-all duration-500 hover:shadow-xl hover:shadow-[#149911]/10"
            >
              Request Quote
            </Link>
          </nav>

          {/* Mobile Menu Toggle (Minimalist Lines) */}
          <button
            className="md:hidden flex flex-col justify-center items-end gap-[5px] w-8 h-8 z-[60]"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span 
              className={`block h-[1px] bg-[#3D5F3B] transition-all duration-500 ease-in-out origin-center
                ${open ? 'w-6 rotate-45 translate-y-[3px]' : 'w-6'}
              `}
            />
            <span 
              className={`block h-[1px] bg-[#3D5F3B] transition-all duration-500 ease-in-out origin-center
                ${open ? 'w-6 -rotate-45 -translate-y-[3px]' : 'w-4'}
              `}
            />
          </button>
        </div>
      </header>
      {/* Premium Top Bar (Contact Info) - Desktop Only */}
      <div 
        className={`hidden md:block bg-[#F8F9F8] border-b border-[#3D5F3B]/5 transition-all duration-1000 ease-out
          ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
        `}
      >
        <div className="max-w-[1360px] mx-auto px-8 lg:px-16 flex items-center justify-between h-9 text-[10px] uppercase tracking-[0.2em] text-[#3D5F3B] font-bold">
          <div className="flex items-center gap-8">
            <a href="tel:09171859127" className="hover:text-[#149911] transition-colors duration-300">0917-185-9127</a>
            <a href="tel:09171339515" className="hover:text-[#149911] transition-colors duration-300">0917-133-9515</a>
          </div>
          <a href="mailto:sales@primegentradingcorp.com" className="hover:text-[#149911] transition-colors duration-300">
            sales@primegentradingcorp.com
          </a>
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      <div 
        className={`fixed inset-0 z-[55] bg-white/95 backdrop-blur-xl flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        <nav className="flex flex-col px-10 gap-8 max-w-sm mx-auto w-full">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-2xl font-light tracking-[0.1em] text-[#3D5F3B] transition-all duration-700
                ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
              `}
              style={{ transitionDelay: `${open ? i * 100 + 200 : 0}ms` }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/quote"
            className={`mt-4 py-4 border-t border-[#3D5F3B]/10 text-sm uppercase tracking-[0.2em] font-medium text-[#149911] flex items-center justify-between group transition-all duration-700
              ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `}
            style={{ transitionDelay: `${open ? NAV_LINKS.length * 100 + 200 : 0}ms` }}
            onClick={() => setOpen(false)}
          >
            Request a Quote
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-500 group-hover:translate-x-2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </nav>
      </div>

      {/* Mobile Floating Contact (Sleek FAB) */}
      <div className="md:hidden fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Glassmorphic Contact Card */}
        <div 
          className={`mb-4 p-6 bg-white/95 backdrop-blur-lg border border-[#3D5F3B]/5 shadow-2xl rounded-xl w-[260px] origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${contactOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
          `}
        >
          <div className="flex flex-col gap-5">
            <div>
              <span className="block text-[8px] uppercase tracking-[0.25em] text-[#3D5F3B]/40 mb-3 font-medium">Direct Lines</span>
              <div className="flex flex-col gap-3">
                <a href="tel:09171859127" className="text-sm tracking-widest text-[#3D5F3B] hover:text-[#149911] transition-colors">0917-185-9127</a>
                <a href="tel:09171339515" className="text-sm tracking-widest text-[#3D5F3B] hover:text-[#149911] transition-colors">0917-133-9515</a>
              </div>
            </div>
            <div className="pt-5 border-t border-[#3D5F3B]/5">
              <span className="block text-[8px] uppercase tracking-[0.25em] text-[#3D5F3B]/40 mb-3 font-medium">Email</span>
              <a href="mailto:sales@primegentradingcorp.com" className="text-[11px] tracking-wide text-[#3D5F3B] hover:text-[#149911] transition-colors break-all">
                sales@primegentradingcorp.com
              </a>
            </div>
          </div>
        </div>

        {/* Minimal Toggle Button */}
        <button
          onClick={() => setContactOpen(!contactOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ease-out
            ${contactOpen ? 'bg-white text-[#3D5F3B] border border-[#3D5F3B]/10' : 'bg-[#3D5F3B] text-white hover:bg-[#149911]'}
          `}
          aria-label="Contact options"
        >
          <div className="relative w-5 h-5">
            {/* Phone Icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={`absolute inset-0 transition-all duration-500
                ${contactOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}
              `}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {/* Close Icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={`absolute inset-0 transition-all duration-500
                ${contactOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}
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