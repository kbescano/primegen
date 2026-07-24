import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import AddSupplierForm from '@/components/AddSupplierForm'
import SupplierCard from '@/components/SupplierCard'
import DirectorySearchBar from '@/components/DirectorySearchBar'

const PAGE_SIZE = 12

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)

  const payload = await getPayloadClient()
  const { docs, totalDocs, totalPages, hasNextPage, hasPrevPage } = await payload.find({
    collection: 'suppliers',
    sort: 'name',
    limit: PAGE_SIZE,
    page: currentPage,
    where: q
      ? {
          or: [{ name: { contains: q } }, { company: { contains: q } }],
        }
      : undefined,
  })

  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin-dashboard/suppliers?${qs}` : '/admin-dashboard/suppliers'
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-10">
        <div className="w-10 h-[3px] bg-[#149911] mb-5" />
        <h1 className="text-[26px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] leading-none mb-3">
          Suppliers
        </h1>
        <p className="text-[14px] text-[#01172f]/50 font-medium max-w-[560px]">
          Your supplier directory -- {totalDocs} total.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <DirectorySearchBar initialQuery={q || ''} placeholder="Search suppliers..." />
        <AddSupplierForm />
      </div>

      {docs.length === 0 ? (
        <div className="border border-dashed border-[#01172f]/15 py-16 text-center">
          <p className="text-[14px] text-[#01172f]/40 font-medium">
            {q ? `No suppliers matching "${q}".` : 'No suppliers added yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {docs.map((s: any) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {hasPrevPage ? (
                <Link
                  href={buildHref(currentPage - 1)}
                  className="text-[12px] font-bold uppercase tracking-wide px-4 py-2 border border-[#01172f]/15 text-[#01172f] hover:border-[#149911] transition-colors"
                >
                  &larr; Prev
                </Link>
              ) : (
                <span className="text-[12px] font-bold uppercase tracking-wide px-4 py-2 border border-[#01172f]/5 text-[#01172f]/20">
                  &larr; Prev
                </span>
              )}
              <span className="text-[12px] font-bold uppercase tracking-wide text-[#01172f]/50 px-3">
                Page {currentPage} of {totalPages}
              </span>
              {hasNextPage ? (
                <Link
                  href={buildHref(currentPage + 1)}
                  className="text-[12px] font-bold uppercase tracking-wide px-4 py-2 border border-[#01172f]/15 text-[#01172f] hover:border-[#149911] transition-colors"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span className="text-[12px] font-bold uppercase tracking-wide px-4 py-2 border border-[#01172f]/5 text-[#01172f]/20">
                  Next &rarr;
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
