import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'
import KineticText from '@/components/KineticText'
import Magnetic from '@/components/Magnetic'
import CraneCta from '@/components/CraneCta'

type FooterCategory = { id: string | number; label: string; slug: string }

const NAV = [
  { href: '/products', label: 'Products' },
  { href: '/deliveries', label: 'Delivered projects' },
  { href: '/calculator', label: 'Weight calculator' },
  { href: '/about', label: 'About & contact' },
  { href: '/quote', label: 'Request a quote' },
]

// Link with an underline that draws in from the left and a nudge on hover.
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative inline-block text-[13px] text-[#fdfffc]/65 transition-all duration-300 hover:translate-x-1 hover:text-[#fdfffc]"
    >
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[#2fd02b] transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  )
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#149911]">
      <span className="h-px w-5 bg-[#149911]" />
      {children}
    </p>
  )
}

export default function SiteFooter({ categories }: { categories: FooterCategory[] }) {
  const topCategories = categories.slice(0, 6)

  return (
    <footer className="bg-[#05100d] text-[#fdfffc]">
      {/* Moving hazard-stripe band */}
      <div aria-hidden="true" className="fx-stripes h-3 w-full" />

      {/* Closing call to action: a crane lowers the plate */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(253,255,252,1) 1px, transparent 1px), linear-gradient(90deg, rgba(253,255,252,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative px-4 pb-20 sm:px-6 md:pb-28 lg:px-12">
          <CraneCta>
            <div className="text-center">
              <p className="mb-5 inline-flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#fdfffc]/55">
                <span className="fx-blink inline-block h-2 w-2 bg-[#2fd02b]" />
                Quote desk &middot; open to site requests
              </p>

              <h2 className="text-balance text-[30px] font-extrabold leading-[1.08] tracking-tight text-[#fdfffc] sm:text-[40px] md:text-[58px]">
                <KineticText
                  segments={[
                    { text: 'Need a price on your ' },
                    { text: 'materials list?', className: 'text-[#2fd02b]' },
                  ]}
                  stagger={30}
                  delay={1500}
                />
              </h2>

              <p className="mx-auto mt-5 max-w-[540px] text-[14px] leading-relaxed text-[#fdfffc]/60 md:text-[16px]">
                Send us the list. A real person confirms stock and pricing with you, not an auto-reply.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <Magnetic fill className="w-full sm:w-auto">
                  <Link
                    href="/quote"
                    className="fx-weld block rounded-sm bg-[#149911] px-9 py-4 text-[13px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_30px_-8px_rgba(20,153,17,0.6)] transition-colors duration-300 hover:bg-[#10750e] md:text-[14px]"
                  >
                    Request a quote &rarr;
                  </Link>
                </Magnetic>
                <Magnetic fill className="w-full sm:w-auto">
                  <a
                    href="tel:09171859127"
                    className="fx-weld block rounded-sm border border-[#fdfffc]/30 px-9 py-4 text-[13px] font-bold uppercase tracking-[0.12em] text-[#fdfffc] transition-colors duration-300 hover:border-[#2fd02b]/60 hover:bg-[#fdfffc]/10 md:text-[14px]"
                  >
                    Call 0917-185-9127
                  </a>
                </Magnetic>
              </div>
            </div>
          </CraneCta>
        </div>
      </div>

      {/* Footer columns */}
      <div className="relative">
        <ScrollReveal variant="line">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2fd02b]/70 to-transparent" />
        </ScrollReveal>

        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-12">
          <ScrollReveal delay={0}>
            <p className="text-[16px] font-bold tracking-tight text-[#fdfffc]">Primegen Trading Corporation</p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#fdfffc]/55">
              Steel and construction materials supplier based in Imus, Cavite, delivering across the Philippines.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={130} direction="left">
            <ColumnTitle>Explore</ColumnTitle>
            <ul className="space-y-3">
              {NAV.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={260} direction="left">
            <ColumnTitle>Popular categories</ColumnTitle>
            <ul className="space-y-3">
              {topCategories.map((c) => (
                <li key={c.id}>
                  <FooterLink href={`/products/category/${c.slug}`}>{c.label}</FooterLink>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={390} direction="left">
            <ColumnTitle>Contact</ColumnTitle>
            <ul className="space-y-3 text-[13px] text-[#fdfffc]/65">
              <li>
                <a href="tel:09171859127" className="transition-colors hover:text-[#2fd02b]">0917-185-9127</a>
              </li>
              <li>
                <a href="tel:09171339515" className="transition-colors hover:text-[#2fd02b]">0917-133-9515</a>
              </li>
              <li>
                <a href="mailto:sales@primegentradingcorp.com" className="break-all transition-colors hover:text-[#2fd02b]">
                  sales@primegentradingcorp.com
                </a>
              </li>
              <li className="leading-relaxed text-[#fdfffc]/50">
                Southern City Homes, YG Building, Cebu St, 4 Tanzang Luma, Imus, Cavite 4103
              </li>
            </ul>
          </ScrollReveal>
        </div>

        <div className="border-t border-[#fdfffc]/10">
          <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-5 sm:px-6 lg:px-12">
            <p className="text-[11px] tracking-wide text-[#fdfffc]/40">
              &copy; {new Date().getFullYear()} Primegen Trading Corporation
            </p>
            <a
              href="#"
              aria-label="Back to top"
              className="group flex h-10 w-10 items-center justify-center border border-[#fdfffc]/20 text-[#fdfffc]/70 transition-colors duration-300 hover:border-[#2fd02b] hover:bg-[#2fd02b]/15 hover:text-[#2fd02b]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-y-1">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
