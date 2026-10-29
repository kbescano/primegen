// Branded full-screen loader shown while a public page loads. Used via small
// loading.tsx files on pages that can never be a 404 -- NOT on routes that call
// notFound() (unknown URLs, missing products/categories), because a loading
// boundary sends the response before notFound() runs and turns the 404 into a
// 200 (a "soft 404").
import Image from "next/image";

export default function SiteLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05100d] px-6">
      <div className="flex flex-col items-center justify-center animate-[riseIn_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">

        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
          <Image
            src="/branding/primegen_trading_logo.png"
            alt="Primegen Trading Corporation"
            fill
            sizes="112px"
            className="object-contain"
            priority
          />
        </div>

        <div className="mt-10 w-40 h-[1px] bg-[#fdfffc]/15 relative overflow-hidden">
          <div className="absolute inset-y-0 w-1/3 bg-[#fdfffc]/70 animate-[sweep_1.4s_cubic-bezier(0.65,0,0.35,1)_infinite]" />
        </div>

      </div>

      <style>{`
        @keyframes sweep {
          0% { left: -35%; }
          100% { left: 110%; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
