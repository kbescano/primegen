"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

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

  // Triggers exactly once on first load
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <header className="bg-white backdrop-blur-md py-3.5 sticky top-0 z-50 border-b border-green/15 overflow-hidden">
        <div
          className={`max-w-[1360px] mx-auto px-6 lg:px-20 flex items-center justify-between relative transition-all duration-700 ease-out
            ${isMounted ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}
          `}
        >
          <Link
            href="/"
            className="flex flex-row items-center gap-2 font-bold bg-gradient-to-tr from-[#051d00] via-[#3D5F3B] to-[#52b788] bg-clip-text text-transparent"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/branding/primegen_trading_logo.png"
              alt="Primegen Logo"
              width={60}
              height={60}
            />
            Primegen Trading Corporation
          </Link>

          <button
            className="flex md:hidden flex-col gap-1.5 w-6 h-[17px] bg-transparent border-none cursor-pointer"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={`block h-0.5 w-full bg-black rounded transition-transform ${open ? "translate-y-[7.5px] rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-full bg-black rounded transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-full bg-black rounded transition-transform ${open ? "-translate-y-[7.5px] -rotate-45" : ""}`}
            />
          </button>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <span key={link.href} className="flex items-center gap-7">
                <Link
                  href={link.href}
                  className={`relative text-xs font-medium text-[#01172f] pb-1 border-b-2 ${pathname === link.href ? "border-sage" : "border-transparent hover:border-[#149911]"} transition-colors`}
                >
                  {link.label}
                </Link>
              </span>
            ))}
            <Link
              href="/quote"
              className="inline-flex items-center justify-center px-7 py-3.5 border-2 border-[#149911] bg-[#fdfffc] text-[#149911] font-bold text-xs hover:bg-[#149911] hover:text-[#fdfffc] transition-colors"
            >
              Request a Quote
            </Link>
          </nav>
        </div>
      </header>

      {/* Desktop Contact Sub-header (Hidden on mobile to save vertical viewport space) */}
      <div className="hidden md:block bg-[#fdfffc] text-[#01172f] py-2.5 border-b border-green/15 text-xs">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-normal">Phone:</span>
            <a
              href="tel:09171859127"
              className="font-medium hover:text-[#149911] transition-colors duration-200"
            >
              0917-185-9127
            </a>
            <span className="text-slate-300">|</span>
            <a
              href="tel:09171339515"
              className="font-medium hover:text-[#149911] transition-colors duration-200"
            >
              0917-133-9515
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-normal">Email:</span>
            <a
              href="mailto:sales@primegentradingcorp.com"
              className="font-medium hover:text-[#149911] transition-colors duration-200"
            >
              sales@primegentradingcorp.com
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Floating Contact Button & Popover Card */}
      <div className="md:hidden fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Popover Card */}
        {contactOpen && (
          <div className="mb-3 p-4 bg-white rounded-lg shadow-xl border border-green/20 w-72 text-xs text-[#01172f] transition-all duration-200">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100">
              <span className="font-bold text-sm text-[#01172f]">Direct Contact</span>
              <button
                onClick={() => setContactOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
                aria-label="Close contact details"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-3 font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Phone Numbers</span>
                <div className="flex flex-col gap-1.5 font-semibold">
                  <a
                    href="tel:09171859127"
                    className="hover:text-[#149911] transition-colors flex items-center gap-2 py-0.5"
                  >
                    📞 0917-185-9127
                  </a>
                  <a
                    href="tel:09171339515"
                    className="hover:text-[#149911] transition-colors flex items-center gap-2 py-0.5"
                  >
                    📞 0917-133-9515
                  </a>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Email Address</span>
                <a
                  href="mailto:sales@primegentradingcorp.com"
                  className="hover:text-[#149911] transition-colors flex items-center gap-2 py-0.5 font-semibold break-all"
                >
                  ✉️ sales@primegentradingcorp.com
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setContactOpen((prev) => !prev)}
          className="flex items-center justify-center w-13 h-13 p-3.5 bg-[#149911] text-white rounded-full shadow-lg hover:bg-[#11800e] active:scale-95 transition-all duration-200"
          aria-label="Open contact options"
        >
          {contactOpen ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 bg-white z-[999] p-7 overflow-y-auto flex flex-col">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="self-end p-2 mb-6"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3.5 text-xl font-bold text-black"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/quote"
            className="block py-3.5 text-xl font-bold text-green"
            onClick={() => setOpen(false)}
          >
            Request a Quote
          </Link>
        </div>
      )}
    </>
  );
}