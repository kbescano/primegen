// src/app/loading.tsx
import React from 'react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fdfffc] px-6">
      <div className="flex flex-col items-center justify-center">
        
        {/* Bold Typography Hierarchy */}
        <h1 className="text-3xl md:text-5xl font-black tracking-[0.2em] md:tracking-[0.25em] uppercase text-[#103900]">
          Primegen
        </h1>
        <p className="mt-2 md:mt-3 text-[9px] md:text-[10px] font-bold tracking-[0.4em] md:tracking-[0.5em] uppercase text-[#01172f] opacity-80">
          Trading Corporation
        </p>

        {/* Minimalist Animation (Zero-config standard Tailwind utilities) */}
        <div className="mt-10 md:mt-12 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#149911] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-[#149911] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-[#149911] rounded-full animate-bounce" />
        </div>
        
      </div>
    </div>
  )
}