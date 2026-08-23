import { getPayloadClient } from "@/lib/getPayloadClient";
import ProductsCatalog from "@/components/ProductCatalog";

export const dynamic = "force-dynamic";

export const metadata = {
  // See about/page.tsx: the root layout's title template already appends
  // "| Primegen Trading Corporation" -- a manual suffix here doubled it up.
  title: 'Products',
  description: 'Browse our full catalog of steel, cement, PPE, fencing, pipe fittings, and other construction products.',
  // Canonicalize to the bare listing page regardless of ?q= -- there's no
  // reason to let search engines index every possible search query as a
  // separate URL competing with this one.
  alternates: { canonical: '/products' },
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const payload = await getPayloadClient();
  const resolvedParams = await searchParams;

  // Parse search query -- this one still needs a server refetch since it's
  // filtering on the `name` field via Payload's `where`, not something we
  // want to pull the entire (unfiltered) catalog down for.
  const q = typeof resolvedParams?.q === "string" ? resolvedParams.q : "";

  // Category filtering now happens entirely client-side in ProductsCatalog
  // (useMemo over the already-fetched product list), so we only fetch once
  // here on initial page load / search, not on every checkbox toggle.
  const [categoriesRes, materialsRes] = await Promise.all([
    payload.find({
      collection: "categories",
      sort: "order",
      limit: 100,
      depth: 2,
    }),
    payload.find({
      collection: "products",
      limit: 500,
      depth: 2,
      ...(q ? { where: { name: { contains: q } } } : {}),
    }),
  ]);

  return (
    <ProductsCatalog
      initialQuery={q}
      categories={categoriesRes.docs as any[]}
      products={materialsRes.docs as any[]}
    />
  );
}