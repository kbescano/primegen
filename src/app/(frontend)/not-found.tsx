import Link from 'next/link'

export const metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <section className="min-h-screen bg-[#05100d] pt-24 md:pt-32 pb-16 md:pb-24 font-sans selection:bg-[#149911]/30 relative overflow-x-hidden flex items-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#149911]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-4">
          404 Error
        </p>
        <h1 className="text-[40px] sm:text-[52px] md:text-[64px] font-medium text-[#fdfffc] tracking-tight leading-none mb-6">
          Page Not Found
        </h1>
        <p className="text-[14px] md:text-[16px] text-[#fdfffc]/60 max-w-[480px] mx-auto leading-relaxed mb-12">
          The page you're looking for doesn't exist or may have moved. Try browsing our product
          catalog, or head back to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-[#149911] text-white font-bold uppercase tracking-wide text-[13px] rounded-xl hover:bg-[#103900] transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-transparent border border-[#fdfffc]/20 text-[#fdfffc] font-bold uppercase tracking-wide text-[13px] rounded-xl hover:border-[#fdfffc]/40 transition-colors"
          >
            Browse Products
          </Link>
        </div>

        <div className="mt-16 pt-10 border-t border-[#fdfffc]/10 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 text-[13px]">
          <a href="tel:+639171859127" className="text-[#2dd4bf] hover:text-[#5eead4] font-medium transition-colors">
            0917-185-9127
          </a>
          <a href="mailto:sales@primegentradingcorp.com" className="text-[#2dd4bf] hover:text-[#5eead4] font-medium transition-colors">
            sales@primegentradingcorp.com
          </a>
        </div>
      </div>
    </section>
  )
}
