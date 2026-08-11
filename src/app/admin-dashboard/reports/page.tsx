import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

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

// Calculate the explicit VAT Liability for the tally
function docVat(d: any): number {
  const subtotal = (d.items || []).reduce(
    (sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0
  )
  const afterDiscount = subtotal - (Number(d.discountAmount) || 0)
  const withDelivery = afterDiscount + (Number(d.deliveryFee) || 0)
  return withDelivery * ((Number(d.vatRate) || 0) / 100)
}

// TRUE NET PROFIT: 
// Pre-VAT Net Revenue (Subtotal - Discount + Delivery) MINUS (Total Supplier Cost + Liquidated OPEX)
function docTrueNetProfit(o: any): number {
  const subtotal = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
  const discountAmount = Number(o.discountAmount) || 0
  const deliveryFee = Number(o.deliveryFee) || 0
  const netRevenue = subtotal - discountAmount + deliveryFee

  const cogs = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
  const grossProfit = netRevenue - cogs

  const liquidatedOpex = (o.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
  
  return grossProfit - liquidatedOpex
}

// Helper to calculate total costs (COGS + OPEX)
function docTotalCosts(o: any): number {
  const cogs = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
  const liquidatedOpex = (o.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
  return cogs + liquidatedOpex
}

// Helper to calculate exact amount paid based on status
function docAmountPaid(o: any): number {
    const gross = docTotal(o)
    if (o.paymentStatus === 'paid') return gross
    if (o.paymentStatus === 'partial') return Number(o.amountPaid) || 0
    return 0
}

// Helper to calculate exact receivable based on amount paid
function docReceivable(o: any): number {
    const gross = docTotal(o)
    const paid = docAmountPaid(o)
    return gross - paid
}

const PLACEHOLDER_REVIEWS = { rating: 5.0, count: 9, isPlaceholder: true }

async function fetchGoogleReviews(): Promise<{ rating: number; count: number; isPlaceholder?: boolean } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID
  if (!key || !placeId) return PLACEHOLDER_REVIEWS
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${key}`,
      { next: { revalidate: 3600 } } 
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

const QUOTATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  order_confirmed: 'Order Confirmed',
  cancelled: 'Cancelled',
}
const QUOTATION_STATUS_CHIPS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-600',
  order_confirmed: 'bg-[#149911]/10 text-[#149911]',
  cancelled: 'bg-red-50 text-red-600',
}

const FULFILLMENT_LABELS: Record<string, string> = {
  preparing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const FULFILLMENT_CHIPS: Record<string, string> = {
  preparing: 'bg-amber-50 text-amber-600',
  shipped: 'bg-blue-50 text-blue-600',
  delivered: 'bg-[#149911]/10 text-[#149911]',
  cancelled: 'bg-red-50 text-red-600',
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
      className={`flex-1 min-w-[120px] sm:min-w-[140px] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-shadow shadow-sm overflow-hidden ${
        highlight
          ? 'bg-[#149911] border-[#149911] text-white shadow-md'
          : 'bg-white border-gray-100 text-gray-900'
      }`}
    >
      <p
        className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-1.5 sm:mb-2 truncate ${
          highlight ? 'text-white/80' : 'text-gray-400'
        }`}
      >
        {label}
      </p>
      <p className="text-[28px] sm:text-[32px] md:text-[40px] font-semibold tracking-tight leading-none mb-1.5 sm:mb-2 truncate">
        {value}
      </p>
      {sublabel && (
        <p
          className={`text-[11px] sm:text-[12px] font-medium truncate ${
            highlight ? 'text-white/80' : 'text-gray-500'
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
    <div className="py-3.5 border-b border-gray-50 last:border-0 w-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 mb-2.5 w-full">
        <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 sm:px-3 py-1 sm:py-1.5 rounded-full inline-block truncate min-w-0 max-w-[120px] sm:max-w-none ${chipClass}`}>
          {label}
        </span>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <span className="text-[11px] sm:text-[12px] text-gray-500 font-medium truncate">{count}</span>
          <span className="text-[12px] sm:text-[13px] font-medium text-gray-900 font-mono truncate">{peso(value)}</span>
        </div>
      </div>
      <div className="w-full h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#149911] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const searchParamsResolved = await searchParams
  
  // Set Defaults to Current Month & Year
  const now = new Date()
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0')
  const defaultYear = String(now.getFullYear())

  const activeMonth = searchParamsResolved.month || defaultMonth
  const activeYear = searchParamsResolved.year || defaultYear

  const payload = await getPayloadClient()

  const [requestsRes, quotationsRes, ordersRes, googleReviews] = await Promise.all([
    payload.find({ collection: 'quotation-requests', limit: 1000, depth: 0, sort: '-createdAt' }),
    payload.find({ collection: 'client-quotations', limit: 1000, depth: 0, sort: '-createdAt' }),
    payload.find({ collection: 'orders', limit: 1000, depth: 0, sort: '-createdAt' }),
    fetchGoogleReviews(),
  ])

  // Filtering Logic
  const inPeriod = (dateStr?: string) => {
    if (activeMonth === 'all' && activeYear === 'all') return true
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return false
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const y = String(d.getFullYear())

    if (activeYear !== 'all' && activeYear !== y) return false
    if (activeMonth !== 'all' && activeMonth !== m) return false
    return true
  }

  const requests = (requestsRes.docs as any[]).filter((r) => inPeriod(r.createdAt))
  const quotations = (quotationsRes.docs as any[]).filter((q) => inPeriod(q.quotationDate || q.createdAt))
  const orders = (ordersRes.docs as any[]).filter((o) => inPeriod(o.orderDate || o.createdAt))

  // ===== Funnel =====
  const requestCount = requests.length
  const quotationCount = quotations.length
  const orderCount = orders.length
  
  // Count any order with partial or full payment
  const payingOrdersCount = orders.filter((o) => ['paid', 'partial'].includes(o.paymentStatus)).length

  const requestToQuotationRate = requestCount > 0 ? Math.round((quotationCount / requestCount) * 100) : 0
  const quotationToOrderRate = quotationCount > 0 ? Math.round((orderCount / quotationCount) * 100) : 0
  const orderToPaidRate = orderCount > 0 ? Math.round((payingOrdersCount / orderCount) * 100) : 0

  // ===== ACCOUNTING SUMMARY (Accrual Basis - All Confirmed Orders) =====
  const totalGrossRevenue = orders.reduce((sum, o) => sum + docTotal(o), 0)
  const totalAmountPaid = orders.reduce((sum, o) => sum + docAmountPaid(o), 0)
  const totalReceivables = orders.reduce((sum, o) => sum + docReceivable(o), 0)
  const totalVat = orders.reduce((sum, o) => sum + docVat(o), 0)
  const totalCosts = orders.reduce((sum, o) => sum + docTotalCosts(o), 0)
  const totalNetProfit = orders.reduce((sum, o) => sum + docTrueNetProfit(o), 0) 

  const actualMarkupPercent = totalCosts > 0 ? (totalNetProfit / totalCosts) * 100 : 0
  const receivablesCount = orders.filter(o => docReceivable(o) > 0).length

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

  // ===== Performance by Sales Person (Accrual Basis on ALL orders in period) =====
  const bySalesPerson: Record<string, { count: number; gross: number; paid: number; ar: number; profit: number }> = {}
  for (const o of orders) {
    const sp = o.salesPerson?.trim() || 'Unassigned'
    if (!bySalesPerson[sp]) bySalesPerson[sp] = { count: 0, gross: 0, paid: 0, ar: 0, profit: 0 }
    bySalesPerson[sp].count += 1
    bySalesPerson[sp].gross += docTotal(o)
    bySalesPerson[sp].paid += docAmountPaid(o)
    bySalesPerson[sp].ar += docReceivable(o)
    bySalesPerson[sp].profit += docTrueNetProfit(o)
  }
  const salesPersonRows = Object.entries(bySalesPerson).sort(
    (a, b) => b[1].profit - a[1].profit
  )

  // Generating Years & Months for Dropdowns
  const currentYearOptions = new Date().getFullYear()
  const filterYears = Array.from({ length: currentYearOptions - 2023 + 2 }, (_, i) => String(2023 + i))
  const filterMonths = [
    { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
    { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
    { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
    { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
  ]

  const sectionTitle = 'text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-gray-400 mb-5 truncate'
  const card = 'bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm w-full overflow-hidden'

  return (
    // ADDED: overflow-x-hidden strictly traps all horizontal bleeding 
    <div className="w-full max-w-[1000px] mx-auto antialiased overflow-x-hidden pb-10">
      
      {/* EXPORT HEADER BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="w-full">
          <h1 className="text-[26px] md:text-[32px] font-semibold tracking-tight text-gray-900 leading-none mb-3 truncate">
            Reports
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 font-medium w-full sm:max-w-[560px]">
            Financial metrics, sales funnel, and pipeline tracking. Standard reporting operates on an accrual basis for confirmed orders.
          </p>
        </div>
        
        <Link
          href="/admin-dashboard/reports/export"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[13px] font-medium shadow-sm w-full sm:w-auto flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Center
        </Link>
      </div>

      {/* Auto-Submitting Filter Form */}
      <form id="filter-form" method="GET" className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-8 w-full">
        <div className="relative w-full sm:w-auto">
          <select 
            name="month" 
            defaultValue={activeMonth} 
            className="w-full appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-9 py-2.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer shadow-sm"
          >
            <option value="all">All Months</option>
            {filterMonths.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <select 
            name="year" 
            defaultValue={activeYear} 
            className="w-full appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-9 py-2.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer shadow-sm"
          >
            <option value="all">All Years</option>
            {filterYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          document.getElementById('filter-form').addEventListener('change', function() {
            this.submit();
          });
        `}} />
      </form>

      {/* True Profit Card -- All confirmed orders */}
      <div className="bg-[#1d1d1f] text-white rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 md:p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 shadow-lg w-full overflow-hidden">
        <div className="w-full min-w-0 md:w-auto">
          <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-gray-400 mb-3 truncate">
            True Net Profit (All Confirmed Orders)
          </p>
          <p className="text-[32px] sm:text-[36px] md:text-[48px] font-semibold tracking-tight leading-none text-[#149911] break-words">
            {peso(totalNetProfit)}
          </p>
          <p className="text-[12px] sm:text-[13px] text-gray-400 font-medium mt-3 truncate">
            {orderCount} total confirmed order{orderCount === 1 ? '' : 's'} &middot; {actualMarkupPercent.toFixed(1)}% avg. markup
          </p>
        </div>
        
        <div className="flex flex-col gap-1.5 text-[12px] sm:text-[13px] text-gray-400 font-medium w-full md:w-auto min-w-0 md:text-right">
           <p className="flex justify-between md:justify-end gap-4 sm:gap-6"><span>Gross Revenue:</span> <span className="truncate">{peso(totalGrossRevenue)}</span></p>
           <p className="flex justify-between md:justify-end gap-4 sm:gap-6 text-amber-500/80"><span>Less VAT:</span> <span className="truncate">-{peso(totalVat)}</span></p>
           <p className="flex justify-between md:justify-end gap-4 sm:gap-6 text-red-400/80"><span>Less Costs:</span> <span className="truncate">-{peso(totalCosts)}</span></p>
           <div className="w-full h-[1px] bg-gray-800 my-1" />
           <p className="flex justify-between md:justify-end gap-4 sm:gap-6 text-[#149911] font-semibold"><span>Net Profit:</span> <span className="truncate">{peso(totalNetProfit)}</span></p>
        </div>
      </div>

      {/* Cleaner 3-Column Accounting Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8 w-full">
        
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm flex flex-col overflow-hidden w-full">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 truncate">Gross Revenue</p>
          <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-gray-900 mb-3 truncate">{peso(totalGrossRevenue)}</p>
          <div className="mt-auto">
            <p className="text-[11px] text-gray-500 font-medium truncate">All confirmed</p>
          </div>
        </div>

        <div className="bg-[#149911]/5 border border-[#149911]/20 rounded-[1.5rem] p-5 shadow-sm flex flex-col overflow-hidden w-full">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#149911]/80 mb-1 truncate">Amount Paid</p>
          <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-[#149911] mb-3 truncate">{peso(totalAmountPaid)}</p>
          <div className="mt-auto">
            <p className="text-[11px] text-[#149911]/80 font-medium truncate">Full & partial payments</p>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-[1.5rem] p-5 shadow-sm flex flex-col overflow-hidden w-full">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/80 mb-1 truncate">Receivables</p>
          <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-amber-600 mb-3 truncate">{peso(totalReceivables)}</p>
          <div className="mt-auto">
            <p className="text-[11px] text-amber-600/80 font-medium truncate">{receivablesCount} pending balances</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm flex flex-col overflow-hidden w-full">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 truncate">Total Costs</p>
          <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-red-500 mb-3 truncate">-{peso(totalCosts)}</p>
          <div className="mt-auto">
            <p className="text-[11px] text-gray-500 font-medium truncate">COGS + OPEX</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm flex flex-col overflow-hidden w-full">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 truncate">VAT Payable</p>
          <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-gray-600 mb-3 truncate">-{peso(totalVat)}</p>
          <div className="mt-auto">
            <p className="text-[11px] text-gray-500 font-medium truncate">Tax liability</p>
          </div>
        </div>

        <div className="bg-[#1d1d1f] rounded-[1.5rem] p-5 shadow-lg flex flex-col text-white overflow-hidden w-full">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 truncate">Net Profit</p>
          <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-[#149911] mb-3 truncate">{peso(totalNetProfit)}</p>
          <div className="mt-auto">
            <p className="text-[11px] text-gray-400 font-medium truncate">Accrual Tally</p>
          </div>
        </div>

      </div>

      {/* Google Reviews */}
      {googleReviews && (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm w-full overflow-hidden">
          <div className="w-full min-w-0">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-gray-400 mb-2 truncate">
              Google Reviews
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-[32px] md:text-[40px] font-semibold tracking-tight leading-none text-gray-900">
                {googleReviews.rating.toFixed(1)}
              </p>
              <p className="text-[18px] sm:text-[20px] text-[#149911] tracking-[0.1em] shrink-0">
                {'★'.repeat(Math.round(googleReviews.rating))}
              </p>
            </div>
            <p className="text-[12px] sm:text-[13px] text-gray-500 font-medium mt-2 truncate">
              from {googleReviews.count.toLocaleString()} review{googleReviews.count === 1 ? '' : 's'} on Google
            </p>
          </div>
          <p className="text-[12px] sm:text-[13px] text-gray-400 font-medium w-full md:max-w-[280px] leading-relaxed">
            {googleReviews.isPlaceholder
              ? 'Placeholder values -- edit PLACEHOLDER_REVIEWS in this page\u2019s code, or configure the Google Places API for live data.'
              : 'Live from your Google Business Profile. Google\u2019s API provides the average and count only -- not the star-by-star breakdown.'}
          </p>
        </div>
      )}

      {/* Conversion funnel */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-8 w-full">
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
          label="With Payment"
          value={payingOrdersCount}
          sublabel={`${orderToPaidRate}% of orders`}
          highlight
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 sm:gap-6 mb-6 w-full">
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

      <div className="grid lg:grid-cols-2 gap-5 sm:gap-6 w-full">
        {/* Top materials */}
        <div className={card}>
          <h2 className={sectionTitle}>Material Demand (Top 8)</h2>
          {topMaterials.length === 0 ? (
            <p className="text-[13px] text-gray-400 font-medium py-4">
              No line items in this period yet.
            </p>
          ) : (
            topMaterials.map(([name, qty]) => {
              const pct = maxMaterialQty > 0 ? Math.max(3, Math.round((qty / maxMaterialQty) * 100)) : 0
              return (
                <div key={name} className="py-3.5 border-b border-gray-50 last:border-0 w-full overflow-hidden">
                  <div className="flex justify-between items-baseline gap-3 mb-2 w-full min-w-0">
                    <p className="text-[12px] sm:text-[13px] font-medium text-gray-900 truncate min-w-0">{name}</p>
                    <p className="text-[11px] sm:text-[12px] text-gray-500 font-mono shrink-0">{qty}</p>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#149911] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Performance by Sales Person */}
        <div className={card}>
          <h2 className={sectionTitle}>Performance by Sales Person</h2>
          {salesPersonRows.length === 0 ? (
            <p className="text-[13px] text-gray-400 font-medium py-4">
              No orders in this period yet.
            </p>
          ) : (
            salesPersonRows.map(([name, v]) => (
              <div
                key={name}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-50 last:border-0 w-full overflow-hidden"
              >
                <div className="flex-1 min-w-0 w-full">
                  <p className={`text-[13px] font-semibold truncate w-full ${name === 'Unassigned' ? 'italic text-gray-400' : 'text-gray-900'}`}>
                    {name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate">{v.count} orders</span>
                    <span className="text-[11px] font-medium text-gray-500 truncate">Gross: {peso(v.gross)}</span>
                    <span className="text-[11px] font-medium text-[#149911] truncate">Paid: {peso(v.paid)}</span>
                    <span className="text-[11px] font-medium text-amber-500 truncate">AR: {peso(v.ar)}</span>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto shrink-0 pt-2 sm:pt-0 mt-1 sm:mt-0 border-t sm:border-0 border-gray-100 min-w-0">
                  <span className="sm:hidden text-[9px] uppercase tracking-wider font-semibold text-gray-400 truncate">Net Profit</span>
                  <p className="text-[14px] font-semibold text-[#149911] font-mono leading-none truncate">
                    {peso(v.profit)}
                  </p>
                  <p className="hidden sm:block text-[9px] uppercase tracking-wider font-semibold text-gray-400 mt-1.5 truncate">
                    Net Profit
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}