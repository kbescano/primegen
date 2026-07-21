"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/materials", label: "Materials" },
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
            className="flex flex-row items-center gap-2 font-bold bg-gradient-to-tr from-[#051d00] via-[#103900] to-[#52b788] bg-clip-text text-transparent"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/branding/primegen-logo.jpg"
              alt="Primegen Logo"
              width={50}
              height={50}
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
