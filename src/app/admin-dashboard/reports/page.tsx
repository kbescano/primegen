import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

/**
 * Reports palette: strictly #149911 (accent green) + #fdfffc (off-white).
 * All chips, bars, and highlights are opacity variants of #149911.
 * Neutral near-black text is kept for legibility only.
 */

const peso = (n: number) =>
  '\u20B1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function docTotal(d: any): number {
  const subtotal = (d.items || []).reduce(
    (sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0
  )
  const afterDiscount = subtotal - (Number(d.discountAmount) || 0)
  const withDelivery = afterDiscount + (Number(d.deliveryFee) || 0)
  const vat = withDelivery * ((Number(d.vatRate) || 0) / 100)
  return withDelivery + vat
}

// Profit -- client's full total payment (VAT included) minus total supplier cost.
// Requires unitCost on line items to be meaningful.
function docCost(d: any): number {
  return (d.items || []).reduce(
    (sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0),
    0
  )
}
function docProfit(d: any): number {
  return docTotal(d) - docCost(d)
}

// TEMPORARY PLACEHOLDER -- edit these two numbers to match what your Google listing shows.
// Once GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID are set in .env, live data takes over automatically
// and this constant is ignored. Safe to delete then.
const PLACEHOLDER_REVIEWS = { rating: 5.0, count: 9, isPlaceholder: true }

async function fetchGoogleReviews(): Promise<{ rating: number; count: number; isPlaceholder?: boolean } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID
  if (!key || !placeId) return PLACEHOLDER_REVIEWS
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${key}`,
      { next: { revalidate: 3600 } } // refresh at most hourly -- keeps API usage minimal
    )
    if (!res.ok) return null
    const data = await res.json()
    const rating = data?.result?.rating
    const count = data?.result?.user_ratings_total
    if (typeof rating !== 'number' || typeof count !== 'number') return null
    return { rating, count }
  } catch {
    return null
  }
}

function monthKeyOf(dateStr?: string): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const QUOTATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  order_confirmed: 'Order Confirmed',
  cancelled: 'Cancelled',
}
const QUOTATION_STATUS_CHIPS: Record<string, string> = {
  draft: 'bg-[#149911]/5 text-[#149911]/70',
  sent: 'bg-[#149911]/15 text-[#149911]',
  order_confirmed: 'bg-[#149911] text-[#fdfffc]',
  cancelled: 'bg-[#149911]/5 text-[#149911]/40',
}

const FULFILLMENT_LABELS: Record<string, string> = {
  preparing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const FULFILLMENT_CHIPS: Record<string, string> = {
  preparing: 'bg-[#149911]/10 text-[#149911]',
  shipped: 'bg-[#149911]/25 text-[#149911]',
  delivered: 'bg-[#149911] text-[#fdfffc]',
  cancelled: 'bg-[#149911]/5 text-[#149911]/40',
}

function FunnelStep({
  label,
  value,
  sublabel,
  highlight = false,
}: {
  label: string
  value: number
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex-1 min-w-[140px] p-5 border ${
        highlight
          ? 'bg-[#149911] border-[#149911] text-[#fdfffc]'
          : 'bg-[#fdfffc] border-[#149911]/15 text-[#01172f]'
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-2 ${
          highlight ? 'text-[#fdfffc]/70' : 'text-[#01172f]/40'
        }`}
      >
        {label}
      </p>
      <p className="text-[28px] font-black leading-none">{value}</p>
      {sublabel && (
        <p
          className={`text-[11px] font-medium mt-2 ${
            highlight ? 'text-[#fdfffc]/70' : 'text-[#01172f]/40'
          }`}
        >
          {sublabel}
        </p>
      )}
    </div>
  )
}

function BarRow({
  label,
  chipClass,
  count,
  value,
  maxValue,
}: {
  label: string
  chipClass: string
  count: number
  value: number
  maxValue: number
}) {
  const pct = maxValue > 0 ? Math.max(2, Math.round((value / maxValue) * 100)) : 0
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#149911]/10 last:border-0">
      <span
        className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 flex-shrink-0 w-[130px] text-center ${chipClass}`}
      >
        {label}
      </span>
      <div className="flex-1 h-2 bg-[#149911]/10 overflow-hidden">
        <div className="h-full bg-[#149911]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] text-[#01172f]/50 font-medium w-8 text-right flex-shrink-0">
        {count}
      </span>
      <span className="text-[13px] font-bold text-[#01172f] font-mono w-[130px] text-right flex-shrink-0">
        {peso(value)}
      </span>
    </div>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: activeMonth } = await searchParams
  const payload = await getPayloadClient()

  const [requestsRes, quotationsRes, ordersRes, googleReviews] = await Promise.all([
    payload.find({ collection: 'quotation-requests', limit: 1000, depth: 0, sort: '-createdAt' }),
    payload.find({ collection: 'client-quotations', limit: 1000, depth: 0, sort: '-createdAt' }),
    payload.find({ collection: 'orders', limit: 1000, depth: 0, sort: '-createdAt' }),
    fetchGoogleReviews(),
  ])

  const inMonth = (dateStr?: string) => !activeMonth || monthKeyOf(dateStr) === activeMonth

  const requests = (requestsRes.docs as any[]).filter((r) => inMonth(r.createdAt))
  const quotations = (quotationsRes.docs as any[]).filter((q) =>
    inMonth(q.quotationDate || q.createdAt)
  )
  const orders = (ordersRes.docs as any[]).filter((o) => inMonth(o.orderDate || o.createdAt))

  // ===== Funnel =====
  const requestCount = requests.length
  const quotationCount = quotations.length
  const orderCount = orders.length
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid')
  const paidCount = paidOrders.length

  const requestToQuotationRate =
    requestCount > 0 ? Math.round((quotationCount / requestCount) * 100) : 0
  const quotationToOrderRate =
    quotationCount > 0 ? Math.round((orderCount / quotationCount) * 100) : 0
  const orderToPaidRate = orderCount > 0 ? Math.round((paidCount / orderCount) * 100) : 0

  // ===== Actual profit: PAID ORDERS ONLY =====
  const actualProfit = paidOrders.reduce((sum, o) => sum + docProfit(o), 0)
  const actualCost = paidOrders.reduce((sum, o) => sum + docCost(o), 0)
  const actualMarkupPercent = actualCost > 0 ? (actualProfit / actualCost) * 100 : 0

  // ===== Quotation pipeline by status =====
  const quotationPipeline: Record<string, { count: number; value: number }> = {
    draft: { count: 0, value: 0 },
    sent: { count: 0, value: 0 },
    order_confirmed: { count: 0, value: 0 },
    cancelled: { count: 0, value: 0 },
  }
  for (const q of quotations) {
    const s = q.status || 'draft'
    if (!quotationPipeline[s]) quotationPipeline[s] = { count: 0, value: 0 }
    quotationPipeline[s].count += 1
    quotationPipeline[s].value += docTotal(q)
  }
  const maxQuotationValue = Math.max(...Object.values(quotationPipeline).map((v) => v.value), 0)

  // ===== Orders by fulfillment =====
  const orderPipeline: Record<string, { count: number; value: number }> = {
    preparing: { count: 0, value: 0 },
    shipped: { count: 0, value: 0 },
    delivered: { count: 0, value: 0 },
    cancelled: { count: 0, value: 0 },
  }
  for (const o of orders) {
    const s = o.fulfillmentStatus || 'preparing'
    if (!orderPipeline[s]) orderPipeline[s] = { count: 0, value: 0 }
    orderPipeline[s].count += 1
    orderPipeline[s].value += docTotal(o)
  }
  const maxOrderValue = Math.max(...Object.values(orderPipeline).map((v) => v.value), 0)

  // ===== Top materials (by qty across quotation line items) =====
  const materialTally: Record<string, number> = {}
  for (const q of quotations) {
    for (const item of q.items || []) {
      const key = (item.description || '').trim()
      if (!key) continue
      materialTally[key] = (materialTally[key] || 0) + (Number(item.qty) || 0)
    }
  }
  const topMaterials = Object.entries(materialTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const maxMaterialQty = topMaterials.length > 0 ? topMaterials[0][1] : 0

  // ===== Revenue by sales person (orders; paid highlighted) =====
  const bySalesPerson: Record<string, { count: number; value: number; paidValue: number }> = {}
  for (const o of orders) {
    const sp = o.salesPerson?.trim() || 'Unassigned'
    if (!bySalesPerson[sp]) bySalesPerson[sp] = { count: 0, value: 0, paidValue: 0 }
    bySalesPerson[sp].count += 1
    bySalesPerson[sp].value += docTotal(o)
    if (o.paymentStatus === 'paid') bySalesPerson[sp].paidValue += docTotal(o)
  }
  const salesPersonRows = Object.entries(bySalesPerson).sort(
    (a, b) => b[1].paidValue - a[1].paidValue
  )

  // ===== Month filter pills (last 12 months + all time) =====
  const now = new Date()
  const monthPills: { key: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthPills.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
    })
  }

  const sectionTitle = 'text-[13px] font-black uppercase tracking-[0.15em] text-[#01172f] mb-4'
  const card = 'bg-[#fdfffc] border border-[#149911]/15 p-6 md:p-8'

  return (
    <div className="max-w-[990px] mx-auto">
      <div className="mb-8">
        <div className="w-10 h-[3px] bg-[#149911] mb-5" />
        <h1 className="text-[26px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] leading-none mb-3">
          Reports
        </h1>
        <p className="text-[14px] text-[#01172f]/50 font-medium max-w-[560px]">
          Sales funnel, pipeline, and confirmed revenue. Revenue counts Paid orders only.
        </p>
      </div>

      {/* Month filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/admin-dashboard/reports"
          className={`text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 border transition-colors duration-200 ${
            !activeMonth
              ? 'bg-[#149911] border-[#149911] text-[#fdfffc]'
              : 'bg-[#fdfffc] border-[#149911]/20 text-[#01172f]/60 hover:border-[#149911]'
          }`}
        >
          All Time
        </Link>
        {monthPills.map((m) => (
          <Link
            key={m.key}
            href={`/admin-dashboard/reports?month=${m.key}`}
            className={`text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 border transition-colors duration-200 ${
              activeMonth === m.key
                ? 'bg-[#149911] border-[#149911] text-[#fdfffc]'
                : 'bg-[#fdfffc] border-[#149911]/20 text-[#01172f]/60 hover:border-[#149911]'
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>

      {/* Actual Profit -- paid orders only */}
      <div className="bg-[#149911] text-[#fdfffc] p-6 md:p-8 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fdfffc]/60 mb-2">
            Actual Profit -- Paid Orders Only
          </p>
          <p className="text-[32px] md:text-[40px] font-black leading-none">{peso(actualProfit)}</p>
          <p className="text-[12px] text-[#fdfffc]/60 font-medium mt-2">
            {paidCount} paid order{paidCount === 1 ? '' : 's'} &middot; {actualMarkupPercent.toFixed(1)}% avg. markup
          </p>
        </div>
        <p className="text-[12px] text-[#fdfffc]/60 font-medium max-w-[280px]">
          Client's total payment minus supplier cost. Only orders marked Paid count here.
        </p>
      </div>

      {/* Google Reviews -- renders only once GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID are set */}
      {googleReviews && (
        <div className="bg-[#fdfffc] border border-[#149911]/15 p-6 md:p-8 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-2">
              Google Reviews
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-[32px] md:text-[40px] font-black leading-none text-[#01172f]">
                {googleReviews.rating.toFixed(1)}
              </p>
              <p className="text-[20px] text-[#149911] tracking-[0.1em]">
                {'★'.repeat(Math.round(googleReviews.rating))}
              </p>
            </div>
            <p className="text-[12px] text-[#01172f]/40 font-medium mt-2">
              from {googleReviews.count.toLocaleString()} review{googleReviews.count === 1 ? '' : 's'} on Google
            </p>
          </div>
          <p className="text-[12px] text-[#01172f]/40 font-medium max-w-[280px]">
            {googleReviews.isPlaceholder
              ? 'Placeholder values -- edit PLACEHOLDER_REVIEWS in this page\u2019s code, or configure the Google Places API for live data.'
              : 'Live from your Google Business Profile. Google\u2019s API provides the average and count only -- not the star-by-star breakdown.'}
          </p>
        </div>
      )}

      {/* Conversion funnel */}
      <div className="flex flex-wrap gap-3 mb-6">
        <FunnelStep label="Requests" value={requestCount} />
        <FunnelStep
          label="Quotations"
          value={quotationCount}
          sublabel={`${requestToQuotationRate}% of requests`}
        />
        <FunnelStep
          label="Orders"
          value={orderCount}
          sublabel={`${quotationToOrderRate}% of quotations`}
        />
        <FunnelStep
          label="Paid"
          value={paidCount}
          sublabel={`${orderToPaidRate}% of orders`}
          highlight
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Quotation pipeline */}
        <div className={card}>
          <h2 className={sectionTitle}>Quotation Pipeline</h2>
          {Object.entries(quotationPipeline).map(([status, v]) => (
            <BarRow
              key={status}
              label={QUOTATION_STATUS_LABELS[status] || status}
              chipClass={QUOTATION_STATUS_CHIPS[status] || 'bg-[#149911]/10 text-[#149911]'}
              count={v.count}
              value={v.value}
              maxValue={maxQuotationValue}
            />
          ))}
        </div>

        {/* Orders by fulfillment */}
        <div className={card}>
          <h2 className={sectionTitle}>Orders by Fulfillment</h2>
          {Object.entries(orderPipeline).map(([status, v]) => (
            <BarRow
              key={status}
              label={FULFILLMENT_LABELS[status] || status}
              chipClass={FULFILLMENT_CHIPS[status] || 'bg-[#149911]/10 text-[#149911]'}
              count={v.count}
              value={v.value}
              maxValue={maxOrderValue}
            />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top materials */}
        <div className={card}>
          <h2 className={sectionTitle}>Material Demand (Top 8)</h2>
          {topMaterials.length === 0 ? (
            <p className="text-[13px] text-[#01172f]/40 font-medium py-4">
              No line items in this period yet.
            </p>
          ) : (
            topMaterials.map(([name, qty]) => {
              const pct = maxMaterialQty > 0 ? Math.max(3, Math.round((qty / maxMaterialQty) * 100)) : 0
              return (
                <div key={name} className="py-2.5 border-b border-[#149911]/10 last:border-0">
                  <div className="flex justify-between items-baseline gap-3 mb-1.5">
                    <p className="text-[13px] font-bold text-[#01172f] truncate">{name}</p>
                    <p className="text-[12px] text-[#01172f]/50 font-mono flex-shrink-0">{qty}</p>
                  </div>
                  <div className="h-1.5 bg-[#149911]/10 overflow-hidden">
                    <div className="h-full bg-[#149911]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Revenue by sales person */}
        <div className={card}>
          <h2 className={sectionTitle}>Revenue by Sales Person</h2>
          {salesPersonRows.length === 0 ? (
            <p className="text-[13px] text-[#01172f]/40 font-medium py-4">
              No orders in this period yet.
            </p>
          ) : (
            salesPersonRows.map(([name, v]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 py-3 border-b border-[#149911]/10 last:border-0"
              >
                <div>
                  <p className={`text-[13px] font-bold ${name === 'Unassigned' ? 'italic text-[#01172f]/40' : 'text-[#01172f]'}`}>
                    {name}
                  </p>
                  <p className="text-[11px] text-[#01172f]/40 font-medium">
                    {v.count} order{v.count === 1 ? '' : 's'} &middot; {peso(v.value)} total
                  </p>
                </div>
                <p className="text-[14px] font-black text-[#149911] font-mono flex-shrink-0">
                  {peso(v.paidValue)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
