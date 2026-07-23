import Link from "next/link";
import Image from "next/image";
import { getPayloadClient } from "@/lib/getPayloadClient";
import CinematicVideoHero, {
  type HeroSlide,
} from "@/components/CinematicVideoHero";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MobileStickyCta from "@/components/MobileSticky";
import ScrollReveal from "@/components/ScrollReveal";

export const revalidate = 60;

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: "f1",
    label: "Fabrication & Steel",
    title: "Precision in Every Cut",
    cta: "Browse Products",
    href: "/products",
    video: "/videos/hero-1.mp4",
  },
  {
    id: "f2",
    label: "Full Catalog",
    title: "Built on Trust",
    cta: "See Current Prices",
    href: "/products",
    video: "/videos/hero-2.mp4",
  },
  {
    id: "f3",
    label: "Project Ready",
    title: "From Site to Structure",
    cta: "Request a Quote",
    href: "/quote",
    video: "/videos/hero-3.mp4",
  },
];

const VALUE_PROPS = [
  {
    num: "01",
    title: "Direct-from-supplier pricing",
    body: "No markup layers, prices reflect current supplier cost.",
  },
  {
    num: "02",
    title: "Scheduled delivery",
    body: "Book delivery windows that fit your project timeline.",
  },
  {
    num: "03",
    title: "Dedicated coordination",
    body: "A real person confirms your order, not an auto-reply.",
  },
];

export default async function HomePage() {
  const payload = await getPayloadClient();

  const [heroSlides, categories] = await Promise.all([
    payload.find({
      collection: "hero-slides",
      where: { enabled: { equals: true } },
      sort: "order",
      limit: 10,
    }),
    payload.find({ collection: "categories", sort: "order", limit: 100 }),
  ]);

  const slides: HeroSlide[] =
    heroSlides.docs.length > 0
      ? heroSlides.docs.map((s: any) => ({
          id: s.id,
          label: s.label,
          title: s.title,
          cta: s.cta,
          href: s.href,
          video: s.video,
        }))
      : FALLBACK_SLIDES;

  return (
    <>
      <CinematicVideoHero slides={slides} />

      <section className="py-20 md:py-28 bg-[#fdfffc] overflow-hidden">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-20">
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_PROPS.map((v, i) => (
              <ScrollReveal
                key={v.num}
                style={{ transitionDelay: `${i * 120}ms` }}
                className="group relative bg-white shadow-md border border-[#01172f]/10 p-8 md:p-10 overflow-hidden cursor-default transition-all duration-500 hover:border-[#149911]/40 hover:shadow-[0_20px_50px_-20px_rgba(16,57,0,0.25)] hover:-translate-y-1"
              >
                {/* Giant ghost numeral */}
                <span className="absolute -top-6 -right-2 text-[120px] md:text-[140px] font-black leading-none text-[#01172f]/[0.04] select-none pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:text-[#149911]/10 group-hover:scale-110">
                  {v.num}
                </span>

                {/* Top accent bar -- sweeps in from the left on hover */}
                <span className="absolute top-0 left-0 h-[4px] w-full bg-[#149911] origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />

                <div className="relative z-10">
                  <span className="inline-block text-[12px] font-black tracking-[0.2em] text-[#149911] mb-5">
                    {v.num}
                  </span>
                  <h3 className="text-[18px] md:text-[20px] font-black uppercase tracking-tight text-[#01172f] leading-tight mb-3">
                    {v.title}
                  </h3>
                  <p className="text-[14px] text-[#01172f]/60 font-medium leading-relaxed m-0">
                    {v.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 bg-sage-tint">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-20">
          <h2 className="mb-2 normal-case text-[#01172f]">
            Featured Products.{" "}
            <span className="font-normal text-gray-500">
              Browse what&apos;s currently in stock.
            </span>
          </h2>

          <div className="mt-10">
            <FeaturedCarousel categories={categories.docs as any} />
          </div>
        </div>
      </section>

      {/* Mobile-only sticky CTA */}
      <MobileStickyCta />

      <footer className="py-2 bg-sage-tint border-t border-[#01172f]/5">
        <div className="max-w-[1360px] mx-auto px-6">
          <p className="text-center text-xs tracking-wide text-[#01172f]">
            &copy; {new Date().getFullYear()} Primegen Trading Corporation
          </p>
        </div>
      </footer>
    </>
  );
}
