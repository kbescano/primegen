import { getPayloadClient } from "@/lib/getPayloadClient";
import CinematicVideoHero, {
  type HeroSlide,
} from "@/components/CinematicVideoHero";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import CustomerStoriesServer from "@/components/CustomerStoriesServer"; 
import PainPointsResponse from "@/components/PaintPointResponse";
import SiteFooter from "@/components/SiteFooter";
import Marquee from "@/components/Marquee";
import ScrollProgressVar from "@/components/ScrollProgressVar";
import KineticText from "@/components/KineticText";
import Link from "next/link";

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
    title: "Direct supplier low price",
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

  const [heroSlides, categories, featuredSlideRes] = await Promise.all([
    payload.find({
      collection: "hero-slides",
      where: {
        and: [
          { enabled: { equals: true } },
          { showInFeaturedCarousel: { not_equals: true } },
        ],
      },
      sort: "order",
      limit: 10,
    }),
    payload.find({ collection: "categories", sort: "order", limit: 100 }),
    payload.find({
      collection: "hero-slides",
      where: { showInFeaturedCarousel: { equals: true } },
      limit: 1,
    }),
  ]);


  const featuredVideo = featuredSlideRes.docs[0]?.video as string | undefined;

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
      <ScrollProgressVar />

      <CinematicVideoHero slides={slides} />

      <Marquee items={(categories.docs as any[]).map((c) => c.label).filter(Boolean)} />

      {/* Insert the new tabbed section here */}
      <CustomerStoriesServer />

      <PainPointsResponse />

      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-[#05100d] border-t border-[#fdfffc]/5">
        {/* Giant outline words that drift sideways as the page scrolls */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-10 select-none whitespace-nowrap text-[clamp(120px,22vw,340px)] font-black uppercase leading-none tracking-tight text-transparent [-webkit-text-stroke:2px_rgba(47,208,43,0.13)]"
          style={{ transform: "translate3d(calc(var(--page-p, 0) * -55vw + 6vw), 0, 0)", willChange: "transform" }}
        >
          Steel &middot; Pipes &middot; Roofing &middot; Fittings &middot; PPE &middot; Fencing &middot;
        </div>

        <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-20">
          <h2 className="mb-2 normal-case text-[#fdfffc] text-[24px] sm:text-[28px] md:text-[36px] font-medium leading-tight">
            <KineticText
              segments={[
                { text: "Featured Products. " },
                { text: "Browse what's currently in stock.", className: "font-normal text-[#fdfffc]/50" },
              ]}
              stagger={22}
            />
          </h2>

          <div className="mt-8 sm:mt-10">
            <FeaturedCarousel categories={categories.docs as any} featuredVideo={featuredVideo} />
          </div>

          <div className="mt-12 md:mt-16 flex justify-center">
            <Link
              href="/products"
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-lg border border-[#fdfffc]/25 text-[#fdfffc] text-[13px] md:text-[14px] font-bold tracking-wide hover:bg-[#fdfffc]/10 hover:border-[#149911]/60 transition-all duration-300"
            >
              Browse the full catalog
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter categories={categories.docs as any} />
    </>
  );
}