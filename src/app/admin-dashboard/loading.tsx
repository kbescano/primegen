// src/app/loading.tsx
import Image from 'next/image'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#3D5F3B] px-6 overflow-hidden">
      {/* Ambient glow -- Vibrant green against the dark olive creates rich depth */}
      <div className="absolute w-[600px] h-[600px] bg-[#149911]/20 rounded-full blur-[80px] md:blur-[100px] animate-[pulseGlow_4s_ease-in-out_infinite]" />

      <div className="relative flex flex-col items-center justify-center animate-[riseIn_0.9s_cubic-bezier(0.25,1,0.5,1)_both]">

        {/* Logo replacing the text wordmark */}
        <div className="relative w-40 h-40 md:w-52 md:h-52 drop-shadow-xl">
          <Image
            src="/branding/primegen_trading_logo.png"
            alt="Primegen Trading Corporation"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Sweeping progress line -- Bright off-white for maximum contrast */}
        <div className="mt-8 w-48 md:w-64 h-[2px] bg-[#fdfffc]/10 overflow-hidden relative rounded-full">
          <div className="absolute inset-y-0 w-1/3 bg-[#fdfffc] shadow-[0_0_8px_rgba(253,255,252,0.8)] animate-[sweep_1.4s_cubic-bezier(0.87,0,0.13,1)_infinite] rounded-full" />
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
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}