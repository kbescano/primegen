"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import SearchBar from "@/components/SearchBar";

type Category = any;
type Product = any;

export default function ProductsCatalog({
  initialQuery,
  categories,
  products,
}: {
  initialQuery: string;
  categories: Category[];
  products: Product[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // React 18 Transition hook for non-blocking UI rendering
  const [isPending, startTransition] = useTransition();

  const rawCat = searchParams.get("cat");
  const [activeCats, setActiveCats] = useState<string[]>(
    rawCat ? rawCat.split(",") : []
  );

  // In-memory search query, fed by SearchBar's onQueryChange -- no network
  // round-trip, just a local filter alongside category filtering.
  const [query, setQuery] = useState(initialQuery);

  // Mobile-only filter drawer state. Desktop sidebar ignores this and is
  // always visible.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync state if user uses the browser Back/Forward buttons
  useEffect(() => {
    const cat = searchParams.get("cat");
    setActiveCats(cat ? cat.split(",") : []);
  }, [searchParams]);

  const toggleCategory = (slug: string) => {
    const newCats = activeCats.includes(slug)
      ? activeCats.filter((c) => c !== slug)
      : [...activeCats, slug];

    // Silently update the URL so links remain shareable without triggering a server re-fetch
    const params = new URLSearchParams(searchParams.toString());
    if (newCats.length > 0) {
      params.set("cat", newCats.join(","));
    } else {
      params.delete("cat");
    }
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);

    // startTransition tells React to prioritize the checkbox click animation immediately 
    // and process the heavy product grid filtering in the background
    startTransition(() => {
      setActiveCats(newCats);
    });
  };

  const availableSlugs = useMemo(() => {
    return new Set(products.map((m) => m.categoryRef?.slug || m.category || "other"));
  }, [products]);

  const activeCategoryDocs = useMemo(() => {
    return categories.filter((c) => availableSlugs.has(c.slug));
  }, [categories, availableSlugs]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catSlug = p.categoryRef?.slug || p.category || "other";
      const matchesCategory = activeCats.length === 0 || activeCats.includes(catSlug);
      const matchesQuery = !query || p.name?.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, activeCats, query]);

  return (
    <section className="min-h-screen bg-[#05100d] pt-24 md:pt-32 pb-16 md:pb-24 font-sans selection:bg-[#149911]/30 relative">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#149911]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Page Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-12">
          <ScrollReveal direction="none">
            <h1 className="text-[32px] sm:text-[40px] md:text-[56px] font-medium text-[#fdfffc] tracking-tight leading-none mb-3 md:mb-4">
              Products
            </h1>
            <p className="text-[14px] md:text-[16px] text-[#fdfffc]/60 max-w-[600px]">
              Discover our full catalog of steel, cement, PPE, fencing, pipe fittings, and other construction products.
            </p>
          </ScrollReveal>

          <div className="w-full md:w-[320px] flex-shrink-0 z-20 relative bg-[#0a1a15]/80 backdrop-blur-xl border border-[#fdfffc]/10 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <SearchBar initialQuery={initialQuery} onQueryChange={setQuery} />
          </div>
        </div>

        {/* Mobile Filter Toggle -- hidden on lg+, where the sidebar is always visible */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="lg:hidden w-full flex items-center justify-between gap-3 mb-4 px-5 py-3.5 bg-[#0a1a15]/80 backdrop-blur-xl border border-[#fdfffc]/10 rounded-xl text-[14px] text-[#fdfffc]"
        >
          <span className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            Filters
            {activeCats.length > 0 && (
              <span className="bg-[#149911] text-[#fdfffc] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeCats.length}
              </span>
            )}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-300 ${filtersOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* Left Sidebar Filter -- collapsible on mobile, always open on lg+ */}
          <aside
            className={`w-full lg:w-[260px] flex-shrink-0 bg-[#0a1a15]/80 backdrop-blur-xl border border-[#fdfffc]/5 rounded-2xl p-6 lg:sticky lg:top-32 overflow-hidden transition-all duration-300
              ${filtersOpen ? "max-h-[600px] opacity-100 mb-2" : "max-h-0 opacity-0 p-0 border-0 lg:max-h-none lg:opacity-100 lg:p-6 lg:border"}
              lg:block lg:mb-0
            `}
          >
            <h3 className="text-[14px] text-[#fdfffc]/80 font-medium mb-6">
              Choose category:
            </h3>
            
            <div className="flex flex-col gap-4">
              {activeCategoryDocs.map((cat) => {
                const isActive = activeCats.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    onClick={() => toggleCategory(cat.slug)}
                    className="flex items-center gap-3 group outline-none w-full text-left"
                  >
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-300 flex-shrink-0
                      ${isActive ? 'bg-[#149911] border-[#149911]' : 'border-[#fdfffc]/20 group-hover:border-[#fdfffc]/40 bg-transparent'}
                    `}>
                      {isActive && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fdfffc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span className={`text-[14px] transition-colors duration-300
                      ${isActive ? 'text-[#fdfffc]' : 'text-[#fdfffc]/60 group-hover:text-[#fdfffc]'}
                    `}>
                      {cat.label || cat.slug}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Grid Content */}
          <div className={`flex-1 w-full flex flex-col gap-6 transition-opacity duration-200 ${isPending ? 'opacity-60' : 'opacity-100'}`}>
            
            <div className="flex justify-end border-b border-[#fdfffc]/5 pb-4">
              <button className="flex items-center gap-2 text-[14px] text-[#fdfffc]/60 hover:text-[#fdfffc] transition-colors">
                Sort by
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="py-16 md:py-24 flex flex-col items-center justify-center text-center bg-[#0a1a15]/50 border border-[#fdfffc]/5 rounded-2xl px-4">
                <p className="text-[15px] md:text-[16px] text-[#fdfffc] mb-2">No products found</p>
                <p className="text-[13px] md:text-[14px] text-[#fdfffc]/40">
                  {query ? `We couldn't find anything matching "${query}".` : "Adjust your filters to see more results."}
                </p>
              </div>
            )}

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {filteredProducts.map((product, i) => {
                const imgUrl = product.photo?.url || null;
                const catData = activeCategoryDocs.find((c) => c.slug === (product.categoryRef?.slug || product.category));
                const categoryLabel = catData?.label || product.category || "GENERAL";
                
                return (
                  <ScrollReveal
                    key={product.id} // Reverted back to stable ID, preventing layout thrashing
                    direction="none"
                    className="group bg-[#0a1a15] hover:bg-[#0c201a] border border-[#fdfffc]/5 hover:border-[#fdfffc]/10 rounded-2xl p-4 md:p-6 flex flex-col transition-all duration-300 h-full"
                  >
                    <div className="w-full h-32 md:h-40 relative flex items-center justify-center mb-4 md:mb-6">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={product.name} fill className="object-contain transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <div className="text-[#fdfffc]/20 text-[10px] uppercase tracking-widest font-bold">No Image</div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                      <span className="bg-[#fdfffc]/5 border border-[#fdfffc]/10 text-[#fdfffc]/60 px-2 py-1 rounded-[4px] text-[9px] font-bold uppercase tracking-widest">
                        {product.inStock !== false ? 'Available' : 'Out of Stock'}
                      </span>
                      <span className="bg-[#149911]/10 border border-[#149911]/20 text-[#2dd4bf] px-2 py-1 rounded-[4px] text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        </svg>
                        {categoryLabel}
                      </span>
                    </div>

                    <h3 className="text-[15px] md:text-[18px] font-medium text-[#fdfffc] leading-snug mb-3 md:mb-4 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <Link href={`/products/${product.id}`} className="mt-auto pt-3 md:pt-4 inline-flex items-center gap-2 text-[12px] md:text-[13px] font-medium text-[#2dd4bf] hover:text-[#5eead4] transition-colors">
                      View product
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}