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

      {/* Contact Sub-header (Below Navbar - Minimalist & Current Palette) */}
      <div className="bg-white text-[#01172f] py-2 border-b border-green/15 text-xs font-semibold">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-20 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="opacity-40 font-normal">Phone</span>
            <a
              href="tel:09171859127"
              className="hover:text-[#149911] transition-colors"
            >
              0917-185-9127
            </a>
            <span className="opacity-20 hidden sm:inline">/</span>
            <a
              href="tel:09171339515"
              className="hover:text-[#149911] transition-colors hidden sm:inline"
            >
              0917-133-9515
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-40 font-normal">Email</span>
            <a
              href="mailto:sales@primegentradingcorp.com"
              className="hover:text-[#149911] transition-colors"
            >
              sales@primegentradingcorp.com
            </a>
          </div>
        </div>
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