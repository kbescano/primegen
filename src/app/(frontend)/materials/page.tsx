import Image from "next/image";
import Link from "next/link";
import { getPayloadClient } from "@/lib/getPayloadClient";
import SearchBar from "@/components/SearchBar";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeader from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

const STAGGER_STEP = 60; // ms between each card's reveal
const STAGGER_CAP = 480; // ms max delay, so long lists don't take forever to fully reveal
const STEEL_FABRICATION_VIDEO =
  "https://www.pexels.com/download/video/30456101/";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MaterialsPage({ searchParams }: Props) {
  const payload = await getPayloadClient();

  const resolvedParams = await searchParams;
  const q = typeof resolvedParams?.q === "string" ? resolvedParams.q : "";

  const [categoriesRes, materialsRes] = await Promise.all([
    payload.find({
      collection: "categories",
      sort: "order",
      limit: 100,
      depth: 2,
    }),
    payload.find({
      collection: "materials",
      limit: 200,
      depth: 2,
      ...(q ? { where: { name: { contains: q } } } : {}),
    }),
  ]);

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

        <SectionHeader size="page" eyebrow="Full Catalog" title="Materials">
          <SearchBar initialQuery={q} />
        </SectionHeader>

        {/* Empty State / No Results */}
        {orderedSlugs.length === 0 && (
          <ScrollReveal className="py-24 flex flex-col items-center justify-center text-center">
            <p className="text-[17px] font-medium text-[#01172f] mb-2">
              No materials found
            </p>
            <p className="text-[14px] text-gray-500">
              We couldn&apos;t find anything matching &quot;{q}&quot;.
            </p>
          </ScrollReveal>
        )}

        {/* Categories Grid (Top Section) -- full-bleed hero panels, each stagger in individually */}
        {orderedSlugs.length > 0 && !q && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-24 lg:mb-36">
            {orderedSlugs.map((slug, index) => {
              const cat = categoryBySlug[slug];
              const label = cat?.label || slug;
              const cardImage =
                cat?.image?.url || grouped[slug][0]?.photo?.url || null;
              const delay = Math.min(index * STAGGER_STEP, STAGGER_CAP);
              const isSteelFabrication =
                label.trim().toLowerCase() === "steel fabrication";

              // Special wide video hero card -- only renders for the "Steel Fabrication" category
              if (isSteelFabrication) {
                return (
                  <ScrollReveal
                    key={`nav-${slug}`}
                    as="a"
                    href={`#${slug}`}
                    style={{ transitionDelay: `${delay}ms` }}
                    className="group md:col-span-2 relative flex flex-col overflow-hidden bg-white outline-none cursor-pointer border border-[#01172f]/10 transition-all duration-700 hover:shadow-[0_20px_60px_-15px_rgba(1,23,47,0.12)]"
                  >
                    {/* Text Section */}
                    <div className="pt-12 md:pt-16 pb-10 px-8 md:px-12 text-left relative z-10">
                      {/* Bold Accent Line */}
                      <div className="w-12 h-[4px] bg-[#01172f] mb-6 transform origin-left transition-transform duration-500 ease-out group-hover:scale-x-150"></div>

                      <h3 className="text-[32px] md:text-[48px] font-black text-[#01172f] tracking-tighter uppercase leading-none">
                        {label}.
                      </h3>

                      {cat?.description && (
                        <p className="mt-5 text-[15px] md:text-[17px] text-[#01172f]/70 font-medium max-w-[560px] leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Video Section */}
                    <div className="relative w-full aspect-video md:aspect-[21/9] bg-[#01172f] overflow-hidden">
                      <video
                        src={STEEL_FABRICATION_VIDEO}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                      />

                      {/* Subtle Cinematic Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none transition-opacity duration-700 group-hover:opacity-50" />

                      {/* Premium Sharp Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <span className="flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.25em] text-white bg-white/10 backdrop-blur-md px-8 py-4 border border-white/20 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:bg-white group-hover:text-[#01172f] group-hover:border-white shadow-2xl scale-95 group-hover:scale-100">
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
                            className="transition-transform duration-500 group-hover:translate-x-1.5"
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
                  className="group relative flex items-end aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[#f8f9f7] outline-none cursor-pointer"
                >
                  {cardImage ? (
                    <Image
                      src={cardImage}
                      alt={label}
                      fill
                      className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                      No Image
                    </div>
                  )}

                  {/* Gradient so white text stays legible over any photo */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Eyebrow + bold header + Discover link, bottom-left */}
                  <div className="relative z-10 p-6 md:p-10 flex flex-col gap-2 md:gap-3 text-white">
                    <h3 className="text-[#fdfffc] text-[28px] md:text-[36px] font-bold uppercase tracking-tight leading-[1.05]">
                      {label}
                    </h3>
                    <span className="mt-2 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em]">
                      Explore
                      <span className="flex items-center justify-center w-7 h-7 rounded-full border border-white/50 transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-transform duration-300 group-hover:translate-x-0.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </span>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* All Products Listed by Category -- same visual language as the category panels above, denser grid */}
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
                        href={`/materials/${material.id}`}
                        style={{ transitionDelay: `${delay}ms` }}
                        className="group relative flex items-end aspect-[4/5] overflow-hidden bg-[#f8f9f7] outline-none cursor-pointer"
                      >
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={material.name}
                            fill
                            className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#01172f]/20 text-[10px] font-medium uppercase tracking-widest">
                            No Image
                          </div>
                        )}

                        {/* Gradient so white text stays legible over any photo */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

                        {/* Bold overlaid title + status + arrow, matching the category panels above */}
                        <div className="relative z-10 p-4 md:p-5 flex flex-col gap-1.5 text-white w-full">
                          <div className="flex items-end justify-between gap-2">
                            <h3 className="text-[#fdfffc] text-[14px] md:text-[16px] font-bold uppercase tracking-tight leading-snug">
                              {material.name}
                            </h3>
                            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-white/50 transition-all duration-300 opacity-100 md:opacity-0 md:translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:bg-white group-hover:text-black">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-transform duration-300 group-hover:translate-x-0.5"
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
