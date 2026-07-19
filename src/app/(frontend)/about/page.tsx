import { getPayloadClient } from '@/lib/getPayloadClient'
import ScrollReveal from '@/components/ScrollReveal'

export const revalidate = 60

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const info: any = await payload.findGlobal({ slug: 'about-page' })

  const title = info?.title || 'About Primegen'
  const description = info?.description || 'Add a company description in the admin panel under Globals -> About Page.'
  const address = info?.address || 'Add your address in the admin panel.'
  const phone = info?.phone
  const email = info?.email
  const mapEmbedUrl = info?.mapEmbedUrl

  return (
    <section className="max-w-[1360px] mx-auto px-6 lg:px-12 xl:px-20 mt-20 mb-20">

      {/* Hero Header - Editorial & Bold */}
      <ScrollReveal direction="up" className="mb-20 md:mb-32 relative">
        {/* Architectural Accent Line - Vibrant Green */}
        <div className="w-16 h-[5px] bg-[#149911] mb-10" />
        
        <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#103900]/60 mb-5">
          Who We Are
        </p>
        
        <h1 className="text-[48px] md:text-[80px] font-black tracking-tighter text-[#01172f] leading-[0.95] mb-8 uppercase max-w-[1000px]">
          {title}.
        </h1>
        
        <p className="max-w-[780px] text-[18px] md:text-[22px] leading-relaxed text-[#01172f]/80 font-medium whitespace-pre-line">
          {description}
        </p>
      </ScrollReveal>

      {/* Monolithic Block Layout */}
      <ScrollReveal 
        direction="up" 
        style={{ transitionDelay: '100ms' }}
        className="w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] border border-[#01172f]/10 shadow-[0_40px_100px_-20px_rgba(1,23,47,0.15)]">

          {/* Dark High-Contrast Contact Box - Deep Forest Green */}
          <div className="bg-[#103900] text-[#fdfffc] p-10 md:p-16 flex flex-col justify-center relative">
            
            {/* Inner Accent Line - Vibrant Green */}
            <div className="w-8 h-[3px] bg-[#149911] mb-12" />

            <h2 className="text-[32px] md:text-[42px] text-[#fdfffc] mb-14 tracking-tighter uppercase leading-[1.1]">
              Visit / <br /> Contact Us.
            </h2>

            <div className="flex flex-col gap-10">
              <div className="border-b border-[#fdfffc]/15 pb-8 relative group">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/50 mb-3">Location</p>
                <p className="m-0 whitespace-pre-line text-[#fdfffc] text-[16px] md:text-[18px] font-medium leading-relaxed">
                  {address}
                </p>
              </div>

              {phone && (
                <div className="border-b border-[#fdfffc]/15 pb-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/50 mb-3">Direct Line</p>
                  <p className="m-0">
                    <a href={`tel:${phone}`} className="text-[#fdfffc] hover:text-[#149911] font-medium text-[16px] md:text-[18px] transition-colors duration-300">
                      {phone}
                    </a>
                  </p>
                </div>
              )}

              {email && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/50 mb-3">Digital</p>
                  <p className="m-0">
                    <a href={`mailto:${email}`} className="text-[#fdfffc] hover:text-[#149911] font-medium text-[16px] md:text-[18px] transition-colors duration-300 relative inline-flex group">
                      {email}
                      {/* Vibrant Green Underline Hover Effect */}
                      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#149911] transition-all duration-300 group-hover:w-full"></span>
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* High-End Map View */}
          <div className="relative min-h-[450px] lg:min-h-full bg-[#fdfffc] overflow-hidden group">
            {mapEmbedUrl ? (
              <>
                <iframe
                  src={mapEmbedUrl}
                  className="absolute inset-0 w-full h-full border-0 grayscale contrast-125 opacity-85 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:grayscale-0 group-hover:contrast-100"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                />
                {/* Subtle internal shadow to blend the map edges seamlessly */}
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(1,23,47,0.1)] pointer-events-none transition-opacity duration-1000 group-hover:opacity-0" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#01172f]/5">
                <p className="text-center text-[13px] font-bold uppercase tracking-[0.15em] text-[#01172f]/40">
                  Map Configuration Pending
                </p>
                <p className="mt-2 text-center text-[14px] text-[#01172f]/50">
                  Add a Google Maps embed URL in the admin panel.
                </p>
              </div>
            )}
          </div>

        </div>
      </ScrollReveal>

    </section>
  )
}