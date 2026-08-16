import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import AddClientForm from '@/components/AddClientForm'
import DirectorySearchBar from '@/components/DirectorySearchBar'

const PAGE_SIZE = 15

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)

  const payload = await getPayloadClient()
  const { docs, totalDocs, totalPages, hasNextPage, hasPrevPage } = await payload.find({
    collection: 'clients',
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
    return qs ? `/admin-dashboard/clients?${qs}` : '/admin-dashboard/clients'
  }

  const thClass = "bg-[#01172f] text-white text-[9px] font-bold uppercase tracking-widest px-3.5 py-3 text-left border-r border-[#1a2d42] last:border-0"
  const tdClass = "px-3.5 py-3.5 border-b border-gray-200 align-middle text-[11px] text-gray-800 break-words"

  return (
    <div className="w-full max-w-[1200px] mx-auto py-6 px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-8">
        <div className="w-10 h-[3px] bg-[#149911] mb-4" />
        <h1 className="text-[26px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] leading-none mb-2">
          Clients
        </h1>
        <p className="text-[13px] text-gray-500 font-medium">
          Your client directory -- {totalDocs} total.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <DirectorySearchBar initialQuery={q || ''} placeholder="Search clients..." />
        <AddClientForm />
      </div>

      {docs.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-16 text-center rounded-xl bg-white">
          <p className="text-[12px] text-gray-400 font-medium">
            {q ? `No clients matching "${q}".` : 'No clients added yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr>
                  <th className={`${thClass} w-[20%]`}>Client Name</th>
                  <th className={`${thClass} w-[18%]`}>Company</th>
                  <th className={`${thClass} w-[15%]`}>Contact Number</th>
                  <th className={`${thClass} w-[17%]`}>Email</th>
                  <th className={`${thClass} w-[20%]`}>Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {docs.map((c: any, i: number) => {
                  const zebra = i % 2 === 1 ? "bg-gray-50/60" : "bg-white";
                  return (
                    <tr key={c.id} className={`${zebra} hover:bg-[#149911]/[0.03] transition-colors`}>
                      <td className={tdClass}>
                        <span className="font-bold text-[#01172f] uppercase block leading-tight">
                          {c.name || 'Unnamed Client'}
                        </span>
                      </td>
                      <td className={`${tdClass} text-gray-600 font-medium`}>
                        {c.company || '—'}
                      </td>
                      <td className={`${tdClass} font-mono text-gray-600`}>
                        {c.phone || c.contactNumber || '—'}
                      </td>
                      <td className={`${tdClass} text-gray-600 truncate max-w-[200px]`}>
                        {c.email || '—'}
                      </td>
                      <td className={`${tdClass} text-gray-600 truncate max-w-[250px]`}>
                        {c.address || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4 border-t border-gray-200 bg-gray-50">
              {hasPrevPage ? (
                <Link
                  href={buildHref(currentPage - 1)}
                  className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-white border-gray-200 text-gray-600 hover:border-[#01172f] hover:text-[#01172f] transition-all"
                >
                  &larr; Prev
                </Link>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-gray-50 border-gray-100 text-gray-300">
                  &larr; Prev
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3">
                Page {currentPage} of {totalPages}
              </span>
              {hasNextPage ? (
                <Link
                  href={buildHref(currentPage + 1)}
                  className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-white border-gray-200 text-gray-600 hover:border-[#01172f] hover:text-[#01172f] transition-all"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-gray-50 border-gray-100 text-gray-300">
                  Next &rarr;
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}