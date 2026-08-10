import { getPayloadClient } from "@/lib/getPayloadClient";
import CinematicVideoHero, {
  type HeroSlide,
} from "@/components/CinematicVideoHero";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ScrollReveal from "@/components/ScrollReveal";
import CustomerStories from "@/components/CustomerStories"; 
import PainPointsResponse from "@/components/PaintPointResponse";

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
      <CinematicVideoHero slides={slides} />

      {/* Insert the new tabbed section here */}
      <CustomerStories />

      <PainPointsResponse />

      <section className="py-28 bg-[#05100d] border-t border-[#fdfffc]/5">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-20">
          <ScrollReveal>
          <h2 className="mb-2 normal-case text-[#fdfffc] text-[28px] md:text-[36px] font-medium">
            Featured Products.{" "}
            <span className="font-normal text-[#fdfffc]/50">
              Browse what&apos;s currently in stock.
            </span>
          </h2>
          </ScrollReveal>

          <div className="mt-10">
            <FeaturedCarousel categories={categories.docs as any} featuredVideo={featuredVideo} />
          </div>
        </div>
      </section>

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