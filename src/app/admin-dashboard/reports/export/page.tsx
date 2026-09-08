import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import DateGranularityFilter from '@/components/DateGranularityFilter'
import ExportCenterClient from './ExportCenterClient'

export const dynamic = 'force-dynamic'

function currentMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getGranularityRange(granularity?: string, periodValue?: string): { start?: Date; end?: Date } {
  if (!granularity || !periodValue) return {}
  if (granularity === 'month') {
    const [y, m] = periodValue.split('-').map(Number)
    if (!y || !m) return {}
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) }
  }
  if (granularity === 'week') {
    const start = new Date(`${periodValue}T00:00:00`)
    if (isNaN(start.getTime())) return {}
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start, end }
  }
  if (granularity === 'year') {
    const y = Number(periodValue)
    if (!y) return {}
    return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) }
  }
  return {}
}

export default async function ExportCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ granularity?: string; periodValue?: string }>
}) {
  const payload = await getPayloadClient()
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (user?.role !== 'admin') {
    redirect('/admin-dashboard')
  }

  let { granularity, periodValue } = await searchParams
  if (!granularity) {
    granularity = 'month'
    periodValue = currentMonthValue()
  }
  const { start, end } = getGranularityRange(granularity, periodValue)

  const conditions: any[] = []
  if (start && end) {
    conditions.push({ orderDate: { greater_than_equal: start.toISOString() } })
    conditions.push({ orderDate: { less_than: end.toISOString() } })
  }

  const [{ docs }, quotationsRes, requestsRes, staffRes] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: conditions.length > 0 ? { and: conditions } : undefined,
      limit: 1000,
      sort: '-orderDate',
      depth: 0,
    }),
    payload.find({ collection: 'client-quotations', limit: 1000, depth: 0 }),
    payload.find({ collection: 'quotation-requests', limit: 1000, depth: 0 }),
    // Same "role=user OR nica@primegen.admin" set every other staff lookup
    // in this app uses.
    payload.find({
      collection: 'users',
      where: { or: [{ role: { equals: 'user' } }, { email: { equals: 'nica@primegen.admin' } }] },
      limit: 200,
    }),
  ])

  // orders.salesPerson is free text, typed once at quotation-creation time
  // and never revisited -- a staff rename would otherwise split their
  // export rows under two different names. Resolve back to the actual
  // assigned user via the real relationship chain (order -> quotation ->
  // request -> assignedTo), which survives a rename since it's an id, not
  // a name -- same fix as the on-page "Performance by Sales Person"
  // report (see reports/page.tsx). Stamped onto each order here since
  // generateExcelSummary.ts runs client-side and has no Payload access of
  // its own.
  const quotationById = new Map((quotationsRes.docs as any[]).map((q) => [String(q.id), q]))
  const requestById = new Map((requestsRes.docs as any[]).map((r) => [String(r.id), r]))
  const userById = new Map((staffRes.docs as any[]).map((u) => [String(u.id), u]))

  const docsWithResolvedSalesPerson = (docs as any[])
    // A cancelled order was never actually fulfilled -- leave it out of the
    // financial export entirely, same as the on-page Reports summary.
    .filter((o) => o.fulfillmentStatus !== 'cancelled')
    .map((o) => {
      const quotation = o.sourceQuotationId ? quotationById.get(String(o.sourceQuotationId)) : undefined
      const request = quotation?.sourceRequestId ? requestById.get(String(quotation.sourceRequestId)) : undefined
      const assignedToId = request?.assignedTo
        ? String(typeof request.assignedTo === 'object' ? request.assignedTo.id : request.assignedTo)
        : undefined
      const user = assignedToId ? userById.get(assignedToId) : undefined
      return {
        ...o,
        resolvedSalesPerson: user?.email ? (user.name || user.email).trim() : undefined,
      }
    })

  const periodLabel =
    granularity === 'month' && periodValue
      ? new Date(`${periodValue}-01`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
      : granularity === 'year'
        ? periodValue
        : granularity === 'week'
          ? `Week of ${periodValue}`
          : 'All Time'

  return (
    <div className="max-w-[900px] mx-auto py-6 px-6">
      <div className="mb-6">
        <DateGranularityFilter granularity={granularity || ''} periodValue={periodValue || ''} />
      </div>
      <ExportCenterClient orders={docsWithResolvedSalesPerson} periodLabel={periodLabel} />
    </div>
  )
}