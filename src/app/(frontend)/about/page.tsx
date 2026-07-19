import { getPayloadClient } from '@/lib/getPayloadClient'
import ScrollReveal from '@/components/ScrollReveal'

export const revalidate = 60

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const info: any = await payload.findGlobal({ slug: 'about-page' })

  const title = info?.title || 'About Primegen Trading Corporation'
  const description = info?.description || 'Add a company description in the admin panel under Globals -> About Page.'
  const address = info?.address || 'Add your address in the admin panel.'
  const phone = info?.phone
  const email = info?.email
  const mapEmbedUrl = info?.mapEmbedUrl

  return (
    <section className="py-16 md:py-28 px-6 lg:px-8 max-w-[1200px] mx-auto bg-white min-h-screen">

      {/* Hero Header */}
      <ScrollReveal direction="left" className="flex flex-col items-center text-center mb-16 md:mb-24">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Who We Are
        </p>
        <h1 className="text-[40px] md:text-[56px] font-semibold tracking-tight text-[#01172f] leading-tight mb-6">
          {title}
        </h1>
        <p className="max-w-[720px] text-[17px] md:text-[19px] leading-relaxed text-gray-500 whitespace-pre-line font-medium">
          {description}
        </p>
      </ScrollReveal>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-[380px_1fr]">

        {/* Contact Information Card */}
        <ScrollReveal direction="left" className="bg-[#f5f5f7] rounded-[24px] p-8 md:p-10 flex flex-col justify-center">
          <h2 className="text-[24px] font-semibold text-gray-900 mb-8 tracking-tight">
            Visit / Contact Us
          </h2>

          <div className="flex flex-col gap-6">
            <div className="border-b border-gray-300/60 pb-6">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Address</p>
              <p className="m-0 whitespace-pre-line text-[15px] font-medium text-gray-900">{address}</p>
            </div>

            {phone && (
              <div className="border-b border-gray-300/60 pb-6">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Phone</p>
                <p className="m-0">
                  <a href={`tel:${phone}`} className="text-[#149911] hover:text-[#0077ED] font-medium text-[15px] transition-colors">
                    {phone}
                  </a>
                </p>
              </div>
            )}

            {email && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Email</p>
                <p className="m-0">
                  <a href={`mailto:${email}`} className="text-[#0071e3] hover:text-[#0077ED] font-medium text-[15px] transition-colors">
                    {email}
                  </a>
                </p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Map Card */}
        <ScrollReveal
          direction="left"
          style={{ transitionDelay: '120ms' }}
          className="bg-[#f5f5f7] rounded-[24px] overflow-hidden min-h-[400px] lg:min-h-[500px] flex items-center justify-center relative shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
        >
          {mapEmbedUrl ? (
            <iframe
              src={mapEmbedUrl}
              className="absolute inset-0 w-full h-full border-0 grayscale-[10%] opacity-90 transition-opacity hover:opacity-100 hover:grayscale-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Location Map"
            />
          ) : (
            <p className="p-8 text-center text-[15px] font-medium text-gray-500 max-w-sm">
              Add a Google Maps embed URL in the admin panel under Globals &rarr; About Page to show the map here.
            </p>
          )}
        </ScrollReveal>

      </div>
    </section>
  )
}
