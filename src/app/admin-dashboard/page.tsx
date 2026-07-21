import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import StatusSelect from '@/components/StatusSelect'

const STATUSES = ['pending', 'processing', 'quote-sent', 'completed'] as const
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  'quote-sent': 'Quote Sent',
  completed: 'Completed',
}

const PERIODS = ['today', 'week', 'month', 'year'] as const
const PERIOD_LABELS: Record<string, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
}

function getPeriodStart(period?: string): Date | undefined {
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'week') {
    const day = now.getDay() // 0 = Sun ... 6 = Sat
    const diffToMonday = day === 0 ? -6 : 1 - day
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (period === 'year') {
    return new Date(now.getFullYear(), 0, 1)
  }
  return undefined
}

export default async function QuotationInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string }>
}) {
  const { status, period } = await searchParams
  const activeStatus = STATUSES.includes(status as any) ? status : undefined
  const activePeriod = PERIODS.includes(period as any) ? period : undefined

  function buildHref(overrides: { status?: string; period?: string }) {
    const params = new URLSearchParams()
    const s = 'status' in overrides ? overrides.status : activeStatus
    const p = 'period' in overrides ? overrides.period : activePeriod
    if (s) params.set('status', s)
    if (p) params.set('period', p)
    const qs = params.toString()
    return qs ? `/admin-dashboard?${qs}` : '/admin-dashboard'
  }

  const payload = await getPayloadClient()

  const periodStart = getPeriodStart(activePeriod)
  const conditions: any[] = []
  if (activeStatus) conditions.push({ status: { equals: activeStatus } })
  if (periodStart) conditions.push({ createdAt: { greater_than_equal: periodStart.toISOString() } })

  const { docs } = await payload.find({
    collection: 'quotation-requests',
    sort: '-createdAt',
    limit: 100,
    where: conditions.length > 0 ? { and: conditions } : undefined,
    depth: 2,
  })

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="w-10 h-[3px] bg-[#149911] mb-5" />
        <h1 className="text-[26px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] leading-none mb-3">
          Quotation Requests
        </h1>
        <p className="text-[14px] text-[#01172f]/50 font-medium max-w-[560px]">
          Requests submitted from the website. Follow up by phone or email, then update status --
          quotes are always sent by your team directly, never automatically.
        </p>
      </div>

      {/* Status filter */}
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-3">
        Status
      </p>
      <div className="flex gap-2 flex-wrap mb-6">
        <FilterLink label="All" active={!activeStatus} href={buildHref({ status: undefined })} />
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={STATUS_LABELS[s]}
            active={activeStatus === s}
            href={buildHref({ status: s })}
          />
        ))}
      </div>

      {/* Date range filter */}
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-3">
        Date Range
      </p>
      <div className="flex gap-2 flex-wrap mb-10">
        <FilterLink label="All Time" active={!activePeriod} href={buildHref({ period: undefined })} />
        {PERIODS.map((p) => (
          <FilterLink
            key={p}
            label={PERIOD_LABELS[p]}
            active={activePeriod === p}
            href={buildHref({ period: p })}
          />
        ))}
      </div>

      {/* Quotation cards */}
      <div className="flex flex-col gap-4">
        {docs.map((q: any) => (
          <div
            key={q.id}
            className="relative bg-white border border-[#01172f]/10 p-5 md:p-6 transition-all duration-300 hover:border-[#149911]/40 hover:shadow-[0_16px_40px_-16px_rgba(1,23,47,0.15)]"
          >
            <span className="absolute top-0 left-0 h-full w-[3px] bg-[#149911]/0 transition-colors duration-300" />

            <div className="flex justify-between items-start gap-3 flex-wrap mb-1">
              <div>
                <h3 className="text-[16px] font-bold text-[#01172f]">{q.customerName}</h3>
                <p className="text-[13px] text-[#01172f]/50 font-medium">
                  {q.phone} {q.email ? `· ${q.email}` : ''}
                </p>
              </div>
              <StatusSelect id={q.id} status={q.status} />
            </div>

            {Array.isArray(q.items) && q.items.length > 0 && (
              <div className="mt-4 border-t border-[#01172f]/10 pt-3 overflow-x-auto">
                <table className="w-full text-[13px] border-collapse min-w-[280px]">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-1.5 pr-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#01172f]/40">
                        Material
                      </th>
                      <th className="pb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#01172f]/40">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.items.map((item: any, i: number) => {
                      const material = item.material
                      return (
                        <tr key={i}>
                          <td className="py-1 pr-2 font-medium text-[#01172f]">
                            {typeof material === 'object' ? material?.name : material}
                          </td>
                          <td className="py-1 px-2 font-mono text-[#01172f]/70">
                            {item.quantity} {typeof material === 'object' ? material?.unit : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {q.message && (
              <p className="mt-3 text-[14px] text-[#01172f]/70 leading-relaxed">{q.message}</p>
            )}

            <div className="flex gap-3 flex-wrap mt-4">
              <Link
                href={`/admin-dashboard/client-quotation?from=${q.id}`}
                className="text-[12px] font-bold uppercase tracking-[0.1em] px-4 py-2 bg-[#103900] text-white hover:bg-[#01172f] transition-colors duration-300"
              >
                Create Client Quotation
              </Link>
              <Link
                href={`/admin-dashboard/supplier-po?from=${q.id}`}
                className="text-[12px] font-bold uppercase tracking-[0.1em] px-4 py-2 border-2 border-[#103900] text-[#103900] hover:bg-[#103900] hover:text-white transition-colors duration-300"
              >
                Create Supplier PO
              </Link>
            </div>

            <p className="mt-4 text-[11px] text-[#01172f]/30 font-medium">
              Submitted {new Date(q.createdAt).toLocaleString()} via {q.source}
            </p>
          </div>
        ))}

        {docs.length === 0 && (
          <div className="border border-dashed border-[#01172f]/15 py-16 text-center">
            <p className="text-[14px] text-[#01172f]/40 font-medium">
              No quotation requests
              {activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''}
              {activePeriod ? ` ${PERIOD_LABELS[activePeriod].toLowerCase()}` : ''}.
            </p>
          </div>
        )}
      </div>

      <p className="mt-8 text-[13px] text-[#01172f]/40 font-medium">
        For internal notes or bulk edits, use the{' '}
        <Link
          href="/admin/collections/quotation-requests"
          className="text-[#103900] font-bold hover:text-[#149911] transition-colors underline underline-offset-2"
        >
          full CMS admin view
        </Link>
        .
      </p>
    </div>
  )
}

function FilterLink({ label, active, href }: { label: string; active?: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 border transition-all duration-200 ${
        active
          ? 'bg-[#01172f] border-[#01172f] text-white'
          : 'bg-white border-[#01172f]/15 text-[#01172f]/60 hover:border-[#01172f]/40 hover:text-[#01172f]'
      }`}
    >
      {label}
    </Link>
  )
}
