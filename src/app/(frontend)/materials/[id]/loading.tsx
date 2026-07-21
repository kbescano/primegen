// src/app/loading.tsx
import React from 'react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#01172f] px-6 overflow-hidden">
      {/* Ambient glow -- gives the dark field depth instead of flat black */}
      <div className="absolute w-[600px] h-[600px] bg-[#149911]/[0.08] rounded-full blur-3xl animate-[pulseGlow_4s_ease-in-out_infinite]" />

      <div className="relative flex flex-col items-center justify-center animate-[riseIn_0.9s_cubic-bezier(0.25,1,0.5,1)_both]">

        {/* Bold Typography Hierarchy */}
        <h1 className="text-3xl md:text-5xl font-black tracking-[0.2em] md:tracking-[0.25em] uppercase text-[#fdfffc]">
          Primegen
        </h1>
        <p className="mt-3 text-[9px] md:text-[10px] font-bold tracking-[0.4em] md:tracking-[0.5em] uppercase text-[#fdfffc]">
          Trading Corporation
        </p>

        {/* Sweeping progress line -- reads as precision-instrument, not spinner */}
        <div className="mt-12 w-48 md:w-64 h-[2px] bg-white/10 overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/3 bg-[#149911] animate-[sweep_1.4s_cubic-bezier(0.87,0,0.13,1)_infinite]" />
        </div>

      </div>

      <style>{`
        @keyframes sweep {
          0% { left: -35%; }
          100% { left: 100%; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}