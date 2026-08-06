import Image from "next/image";
import Link from "next/link";
import { getPayloadClient } from "@/lib/getPayloadClient";
import SearchBar from "@/components/SearchBar";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeader from "@/components/SectionHeader";
import MobileCategoryJump from "@/components/MobileCategoryJump";

export const dynamic = "force-dynamic";

export const metadata = {
  title: 'Products',
  description: 'Browse our full catalog of steel, cement, PPE, fencing, pipe fittings, and other construction products.',
}

const STAGGER_STEP = 60; // ms between each card's reveal
const STAGGER_CAP = 480; // ms max delay, so long lists don't take forever to fully reveal

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const payload = await getPayloadClient();

  const resolvedParams = await searchParams;
  const q = typeof resolvedParams?.q === "string" ? resolvedParams.q : "";

  const [categoriesRes, materialsRes, featuredSlideRes] = await Promise.all([
    payload.find({
      collection: "categories",
      sort: "order",
      limit: 100,
      depth: 2,
    }),
    payload.find({
      collection: "products",
      limit: 200,
      depth: 2,
      ...(q ? { where: { name: { contains: q } } } : {}),
    }),
    payload.find({
      collection: "hero-slides",
      where: { showInFeaturedCarousel: { equals: true } },
      limit: 1,
    }),
  ]);

  const featuredVideo = featuredSlideRes.docs[0]?.video as string | undefined;

  const categoryDocs = categoriesRes.docs as any[];

  const grouped: Record<string, any[]> = {};
  for (const m of materialsRes.docs as any[]) {
    const slug = m.categoryRef?.slug || m.category || "other";
    grouped[slug] = grouped[slug] || [];
    grouped[slug].push(m);
  }

  const orderedSlugs = [
    ...categoryDocs.map((c) => c.slug).filter((slug) => grouped[slug]),
    ...Object.keys(grouped).filter(
      (slug) => !categoryDocs.some((c) => c.slug === slug),
    ),
  ];

  const categoryBySlug: Record<string, any> = {};
  for (const c of categoryDocs) categoryBySlug[c.slug] = c;

  return (
    <section className="py-16 md:py-28 bg-[#fdfffc] min-h-screen">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-12 xl:px-20">
        {/* Top Header with Functional Search Bar */}

        <SectionHeader size="page" eyebrow="Full Catalog" title="Products">
          <SearchBar initialQuery={q} />
        </SectionHeader>

        {/* Empty State / No Results */}
        {orderedSlugs.length === 0 && (
          <ScrollReveal className="py-24 flex flex-col items-center justify-center text-center">
            <p className="text-[17px] font-medium text-[#01172f] mb-2">
              No products found
            </p>
            <p className="text-[14px] text-gray-500">
              We couldn&apos;t find anything matching &quot;{q}&quot;.
            </p>
          </ScrollReveal>
        )}

        {/* Categories Grid (Top Section) */}
        {orderedSlugs.length > 0 && !q && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-24 lg:mb-36">
            {orderedSlugs.map((slug, index) => {
              const cat = categoryBySlug[slug];
              const label = cat?.label || slug;
              const cardImage =
                cat?.image?.url || grouped[slug][0]?.photo?.url || null;
              const delay = Math.min(index * STAGGER_STEP, STAGGER_CAP);
              const isSteelFabrication =
                label.trim().toLowerCase() === "steel fabrication";

              // Special wide video hero card
              if (isSteelFabrication) {
                return (
                  <ScrollReveal
                    key={`nav-${slug}`}
                    as="a"
                    href={`#${slug}`}
                    style={{ transitionDelay: `${delay}ms` }}
                    className="group sm:col-span-2 lg:col-span-3 relative flex flex-col overflow-hidden bg-[#fdfffc] outline-none cursor-pointer border border-[#3D5F3B]/10 transition-all duration-500 md:hover:border-[#149911]/30"
                  >
                    {/* Text Section */}
                    <div className="pt-7 md:pt-20 pb-5 md:pb-14 px-6 md:px-14 text-left relative z-10">
                      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#149911] mb-3 md:mb-5">
                        Featured Capability
                      </p>

                      <div className="w-14 h-[2px] bg-[#149911] mb-4 md:mb-7 origin-left scale-x-100 transition-transform duration-500 ease-out md:group-hover:scale-x-150"></div>

                      <h3 className="text-[26px] md:text-[52px] font-black text-[#3D5F3B] tracking-tighter uppercase leading-[0.92]">
                        {label}.
                      </h3>

                      {cat?.description && (
                        <p className="mt-3 md:mt-6 text-[13px] md:text-[17px] text-[#3D5F3B]/60 font-medium max-w-[560px] leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Video Section */}
                    <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-[#3D5F3B] overflow-hidden">
                      <video
                        src={featuredVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105"
                      />

                      {/* Tinted duotone overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#3D5F3B]/50 via-[#3D5F3B]/5 to-transparent pointer-events-none transition-opacity duration-700 md:group-hover:opacity-60" />

                      {/* Glass CTA badge */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <span className="flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.25em] text-[#fdfffc] bg-[#fdfffc]/10 backdrop-blur-md px-8 py-4 border border-[#fdfffc]/20 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:bg-[#fdfffc] md:group-hover:text-[#3D5F3B] md:group-hover:border-[#fdfffc] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] scale-95 md:group-hover:scale-100">
                          Explore
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            className="transition-transform duration-500 md:group-hover:translate-x-1.5"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              }

              return (
                <ScrollReveal
                  key={`nav-${slug}`}
                  as="a"
                  href={`#${slug}`}
                  style={{ transitionDelay: `${delay}ms` }}
                  className="group relative flex items-end aspect-[4/5] overflow-hidden bg-[#f8f9f7] outline-none cursor-pointer border border-[#3D5F3B]/10 transition-colors duration-500 md:hover:border-[#149911]/30"
                >
                  {cardImage ? (
                    <Image
                      src={cardImage}
                      alt={label}
                      fill
                      className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#3D5F3B]/20 text-[10px] font-medium uppercase tracking-widest">
                      No Image
                    </div>
                  )}

                  {/* Tinted duotone scrim */}
                  <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#3D5F3B]/85 via-[#3D5F3B]/25 to-transparent pointer-events-none" />

                  {/* Eyebrow + bold header + glass Browse badge, bottom-left */}
                  <div className="relative z-10 p-5 md:p-7 flex flex-col gap-2.5 md:gap-3 text-[#fdfffc]">
                    <h3 className="text-[20px] md:text-[26px] font-black uppercase tracking-tight leading-[1.0]">
                      {label}
                    </h3>
                    <span className="inline-flex items-center gap-2.5 w-fit text-[10px] font-bold uppercase tracking-[0.18em] bg-[#fdfffc]/10 backdrop-blur-md px-3.5 py-2 border border-[#fdfffc]/20 transition-all duration-300 md:group-hover:bg-[#fdfffc] md:group-hover:text-[#3D5F3B] md:group-hover:border-[#fdfffc]">
                      Browse
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform duration-300 md:group-hover:translate-x-0.5"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </span>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* Sticky jump-nav */}
        {orderedSlugs.length > 1 && !q && (
          <div className="sticky top-20 md:top-28 z-30 bg-[#fdfffc]/95 backdrop-blur-md border-y border-[#3D5F3B]/10 -mx-6 lg:-mx-12 xl:-mx-20 px-6 lg:px-12 xl:px-20 mb-16 py-3">
            <div className="max-w-[1360px] mx-auto">
              {/* Mobile: compact native dropdown */}
              <div className="sm:hidden">
                <MobileCategoryJump
                  categories={orderedSlugs.map((slug) => ({
                    slug,
                    label: categoryBySlug[slug]?.label || slug,
                  }))}
                />
              </div>
              {/* Desktop: wrapping pill buttons */}
              <div className="hidden sm:flex flex-wrap gap-2">
                {orderedSlugs.map((slug) => {
                  const cat = categoryBySlug[slug];
                  const label = cat?.label || slug;
                  return (
                    <a
                      key={slug}
                      href={`#${slug}`}
                      className="text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 border border-[#3D5F3B]/15 text-[#3D5F3B]/70 md:hover:border-[#149911] md:hover:text-[#149911] transition-colors duration-200"
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* All Products Listed by Category */}
        <div className="flex flex-col gap-24 md:gap-36">
          {orderedSlugs.map((slug) => {
            const cat = categoryBySlug[slug];
            const label = cat?.label || slug;

            return (
              <ScrollReveal
                key={slug}
                as="div"
                id={slug}
                className="scroll-mt-[120px]"
              >
                <div className="border-b border-[#01172f]/10 pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[24px] md:text-[28px] font-medium tracking-tight text-[#01172f]">
                      {label}
                    </h2>
                    {cat?.description && (
                      <p className="mt-3 max-w-[560px] text-[13px] md:text-[14px] leading-relaxed text-[#01172f]/60">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-4 md:gap-x-6 md:gap-y-6">
                  {grouped[slug].map((material, index) => {
                    const imgUrl = material.photo?.url || null;
                    const delay = Math.min(index * STAGGER_STEP, STAGGER_CAP);

                    return (
                      <ScrollReveal
                        key={material.id}
                        as={Link}
                        href={`/products/${material.id}`}
                        style={{ transitionDelay: `${delay}ms` }}
                        className="group relative flex items-end aspect-[4/5] overflow-hidden bg-[#f8f9f7] outline-none cursor-pointer"
                      >
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={material.name}
                            fill
                            className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                            No Image
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

                        <div className="relative z-10 p-4 md:p-5 flex flex-col gap-1.5 text-white w-full">
                          <div className="flex items-end justify-between gap-2">
                            <h3 className="text-[#fdfffc] text-[14px] md:text-[16px] font-bold uppercase tracking-tight leading-snug">
                              {material.name}
                            </h3>
                            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-white/50 transition-all duration-300 opacity-100 md:opacity-0 md:translate-x-1 md:group-hover:opacity-100 md:group-hover:translate-x-0 md:group-hover:bg-white md:group-hover:text-black">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-transform duration-300 md:group-hover:translate-x-0.5"
                              >
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </span>
                          </div>
                          <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.15em] text-white/70 flex items-center gap-1.5">
                            {material.inStock !== false ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] inline-block"></span>
                                Available
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] inline-block"></span>
                                Out of Stock
                              </>
                            )}
                          </p>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}