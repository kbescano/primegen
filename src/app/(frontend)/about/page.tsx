import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import ScrollReveal from '@/components/ScrollReveal'
import TypewriterText from '@/components/TypewriterReveal'

export const revalidate = 60

export const metadata = {
  title: 'About Us | Primegen',
  description: 'Learn about Primegen Trading Corporation -- your trusted supplier for commercial and industrial equipment, metal supply, and metal fabrication services in Cavite, Philippines.',
}

const SERVICES = [
  'Commercial & Industrial Equipment Supply',
  'Metal Supply',
  'Metal Fabrication Services',
]

const WHY_CHOOSE = [
  { title: 'Complete Solutions', body: "From equipment supply to customized metal fabrication, we've got your needs covered." },
  { title: 'Trusted Expertise', body: 'Our team brings years of experience in providing industrial solutions that last.' },
  { title: 'Customer-First Approach', body: 'Every project is handled with professionalism, accuracy, and care.' },
]

const FAQS = [
  { q: 'What industries does Primegen Trading Corp. serve?', a: 'We provide everything from tools to heavy equipment, ensuring convenience and affordability across the industries we support.' },
  { q: 'Can Primegen supply bulk orders for large projects?', a: 'Absolutely. We are equipped to handle both small-scale and large-scale industrial supply needs.' },
  { q: 'Do you provide custom metal fabrication?', a: 'Yes -- our expert fabricators deliver tailored solutions to meet specific project requirements.' },
  { q: 'What industrial tools and machines do you carry?', a: 'We supply power tools, welding equipment, compressors, pumps, and metal fabrication machinery.' },
  { q: 'Can I purchase spare parts and consumables?', a: 'Absolutely. We provide bearings, filters, hoses, lubricants, valves, and other industrial components.' },
  { q: 'Why should I choose Primegen over other suppliers?', a: 'We combine quality, reliability, and expert service, ensuring you receive not just products but long-term industrial solutions.' },
]

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
    <section className="min-h-screen bg-[#05100d] pt-24 md:pt-32 pb-16 md:pb-24 font-sans selection:bg-[#149911]/30 relative">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#149911]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <h1 className="sr-only">{title}</h1>

        {/* ===== Hero ===== */}
        <TypewriterText
          containerClassName="mb-4"
          lines={[
            { text: 'Who We Are', as: 'p', className: 'text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-3', charsPerTick: 1 },
            { text: title, as: 'h2', className: 'text-[32px] sm:text-[40px] md:text-[48px] font-medium text-[#fdfffc] tracking-tight leading-none mb-4', charsPerTick: 2 },
            { text: description, as: 'p', className: 'text-[14px] md:text-[16px] text-[#fdfffc]/60 max-w-[640px] leading-relaxed', charsPerTick: 3 },
          ]}
        />

        {/* ===== Why Choose Primegen ===== */}
        <div className="mt-24 md:mt-32">
          <TypewriterText
            containerClassName="mb-8"
            lines={[
              { text: 'Our Commitment', as: 'p', className: 'text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-3', charsPerTick: 1 },
              { text: 'Why Choose Primegen', as: 'h2', className: 'text-[28px] md:text-[36px] font-medium text-[#fdfffc] tracking-tight leading-none mb-4', charsPerTick: 2 },
              { text: 'At Primegen, we are committed to delivering top-quality materials, reliable equipment, and precision fabrication to support industries that build, innovate, and move the Philippines forward.', as: 'p', className: 'text-[14px] md:text-[16px] text-[#fdfffc]/60 max-w-[640px] leading-relaxed', charsPerTick: 3 },
            ]}
          />

          <div className="flex flex-wrap gap-2 mb-10">
            {SERVICES.map((s) => (
              <span key={s} className="text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-full border border-[#149911]/30 text-[#2dd4bf] bg-[#149911]/[0.08]">
                {s}
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:gap-6 sm:grid-cols-3">
            {WHY_CHOOSE.map((item, i) => (
              <ScrollReveal
                key={item.title}
                direction="none"
                style={{ transitionDelay: `${i * 100}ms` }}
                className="group relative bg-[#0a1a15] hover:bg-[#0c201a] border border-[#fdfffc]/5 hover:border-[#fdfffc]/10 rounded-2xl p-8 overflow-hidden transition-all duration-300"
              >
                <span className="absolute -top-6 -right-2 text-[100px] font-black leading-none text-[#fdfffc]/[0.04] select-none pointer-events-none transition-all duration-700 group-hover:text-[#149911]/10">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="absolute top-0 left-0 h-[3px] w-full bg-[#149911] origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />
                <div className="relative z-10">
                  <h3 className="text-[16px] font-bold uppercase tracking-tight text-[#fdfffc] mb-2">{item.title}</h3>
                  <p className="text-[14px] text-[#fdfffc]/60 font-medium leading-relaxed">{item.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* ===== Closing CTA ===== */}
        <ScrollReveal direction="none" className="mt-16 md:mt-20 bg-[#149911] text-white rounded-2xl p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <p className="text-[18px] md:text-[22px] text-[#fdfffc] font-bold leading-snug max-w-[520px]">
            Message us today and let Primegen Trading Corp. be your trusted supplier for all your industrial and construction needs.
          </p>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#05100d] text-[#fdfffc] font-bold uppercase tracking-wide text-[13px] rounded-xl hover:bg-[#0a1a15] transition-colors flex-shrink-0 w-fit"
          >
            Get a Quote
          </Link>
        </ScrollReveal>

        {/* ===== FAQ ===== */}
        <div className="mt-24 md:mt-32">
          <TypewriterText
            containerClassName="mb-8"
            lines={[
              { text: 'Common Questions', as: 'p', className: 'text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-3', charsPerTick: 1 },
              { text: 'Frequently Asked Questions', as: 'h2', className: 'text-[28px] md:text-[36px] font-medium text-[#fdfffc] tracking-tight leading-none', charsPerTick: 2 },
            ]}
          />

          <div className="flex flex-col border-t border-[#fdfffc]/10">
            {FAQS.map((faq, i) => (
              <ScrollReveal
                key={i}
                as="details"
                direction="none"
                style={{ transitionDelay: `${Math.min(i * 60, 300)}ms` }}
                className="group border-b border-[#fdfffc]/10 py-5"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="text-[15px] md:text-[16px] font-bold text-[#fdfffc] pr-4">{faq.q}</span>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full border border-[#fdfffc]/20 flex items-center justify-center text-[#fdfffc]/50 transition-transform duration-300 group-open:rotate-45">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-[14px] text-[#fdfffc]/60 font-medium leading-relaxed pr-10">{faq.a}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:gap-8 lg:grid-cols-[380px_1fr] mt-20">

          <ScrollReveal direction="none" className="bg-[#0a1a15] border border-[#fdfffc]/5 rounded-2xl p-8 md:p-10 flex flex-col justify-center">
            <h2 className="text-[20px] md:text-[24px] font-bold uppercase tracking-tight text-[#fdfffc] mb-8">
              Visit / Contact Us
            </h2>
            <div className="flex flex-col gap-6">
              <div className="border-b border-[#fdfffc]/10 pb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/40 mb-2">Address</p>
                <p className="m-0 whitespace-pre-line text-[15px] font-medium text-[#fdfffc]">{address}</p>
              </div>
              {phone && (
                <div className="border-b border-[#fdfffc]/10 pb-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/40 mb-2">Phone</p>
                  <p className="m-0"><a href={`tel:${phone}`} className="text-[#2dd4bf] hover:text-[#5eead4] font-bold text-[15px] transition-colors">{phone}</a></p>
                </div>
              )}
              {email && (
                <div className="border-b border-[#fdfffc]/10 pb-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/40 mb-2">Email</p>
                  <p className="m-0"><a href={`mailto:${email}`} className="text-[#2dd4bf] hover:text-[#5eead4] font-bold text-[15px] transition-colors">{email}</a></p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/40 mb-2">Facebook</p>
                <p className="m-0">
                  <a href="https://www.facebook.com/primegentradingcorp/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#2dd4bf] hover:text-[#5eead4] font-bold text-[15px] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.022 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.918 8.437-9.94z" />
                    </svg>
                    Primegen Trading Corp.
                  </a>
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal
            direction="none"
            style={{ transitionDelay: '120ms' }}
            className="bg-[#0a1a15] border border-[#fdfffc]/5 rounded-2xl overflow-hidden min-h-[400px] lg:min-h-[500px] flex items-center justify-center relative"
          >
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                className="absolute inset-0 w-full h-full border-0 opacity-90 grayscale-[20%] transition-opacity hover:opacity-100 hover:grayscale-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              />
            ) : (
              <p className="p-8 text-center text-[15px] font-medium text-[#fdfffc]/50 max-w-sm">
                Add a Google Maps embed URL in the admin panel under Globals &rarr; About Page to show the map here.
              </p>
            )}
          </ScrollReveal>

        </div>

      </div>
    </section>
  )
}