import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { FULFILLMENT_OPTIONS } from '@/lib/pipelineUtils'

// Sales-staff version of /admin-dashboard/reports -- same table shape as
// the "Sales Performance Breakdown" sheet in the Export Center's Excel
// download (see generateExcelSummary.ts), just one row instead of every
// agent, since this is scoped to whoever's logged in. Deliberately just
// the table -- no funnel/cards/charts -- per feedback that the fuller
// layout wasn't as easy to read at a glance.
export const dynamic = 'force-dynamic'

const COMMISSION_RATE = 0.20

const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

function docAmountPaid(o: any): number {
  const gross = docTotal(o)
  if (o.paymentStatus === 'paid') return gross
  if (o.paymentStatus === 'partial') return Number(o.amountPaid) || 0
  return 0
}

function docReceivable(o: any): number {
  return docTotal(o) - docAmountPaid(o)
}

function docLiquidatedOpex(o: any): number {
  return (o.opex || []).reduce(
    (sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0),
    0
  )
}

function docCogs(o: any): number {
  return (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
}

function docTrueNetProfit(o: any): number {
  const subtotal = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
  const discountAmount = Number(o.discountAmount) || 0
  const deliveryFee = Number(o.deliveryFee) || 0
  const netRevenue = subtotal - discountAmount + deliveryFee

  const grossProfit = netRevenue - docCogs(o)

  return grossProfit - docLiquidatedOpex(o)
}

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; status?: string }>
}) {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  // Staff-only -- admin already has the full company Reports page.
  if (!user || user.role !== 'user') {
    redirect('/admin-dashboard')
  }

  const myName = (user.name || user.email || '').trim()

  const searchParamsResolved = await searchParams
  const now = new Date()
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0')
  const defaultYear = String(now.getFullYear())
  const activeMonth = searchParamsResolved.month || defaultMonth
  const activeYear = searchParamsResolved.year || defaultYear
  // Defaults to "Delivered" -- this report is about performance on
  // finished business, not everything currently in flight. All Statuses
  // is still one click away in the filter.
  const activeStatus = searchParamsResolved.status || 'delivered'

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const periodLabel =
    activeMonth === 'all' && activeYear === 'all'
      ? 'All Time'
      : activeMonth === 'all'
        ? activeYear
        : activeYear === 'all'
          ? monthNames[Number(activeMonth) - 1]
          : `${monthNames[Number(activeMonth) - 1]} ${activeYear}`

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

  // Orders has no relationship field to the staff account -- matched the
  // same way the admin Reports page's own "Performance by Sales Person"
  // breakdown does, by the salesPerson text field.
  const ordersRes = await payload.find({
    collection: 'orders',
    where: { salesPerson: { equals: myName } },
    limit: 1000,
    depth: 0,
    sort: '-createdAt',
  })
  const orders = (ordersRes.docs as any[]).filter(
    (o) => inPeriod(o.orderDate || o.createdAt) && (activeStatus === 'all' || o.fulfillmentStatus === activeStatus),
  )

  const orderCount = orders.length
  const gross = orders.reduce((sum, o) => sum + docTotal(o), 0)
  const paid = orders.reduce((sum, o) => sum + docAmountPaid(o), 0)
  const receivables = orders.reduce((sum, o) => sum + docReceivable(o), 0)
  const liquidatedOpex = orders.reduce((sum, o) => sum + docLiquidatedOpex(o), 0)
  const netProfit = orders.reduce((sum, o) => sum + docTrueNetProfit(o), 0)
  const commission = netProfit * COMMISSION_RATE
  const totalCogs = orders.reduce((sum, o) => sum + docCogs(o), 0)

  // Same order as the Excel export's "Order Detail" sheet (oldest first),
  // with the per-order figures precomputed once so the desktop table and
  // the mobile stacked-card layout render from the same numbers.
  const sortedOrders = orders
    .slice()
    .sort((a, b) => {
      const da = new Date(a.orderDate || a.createdAt).getTime()
      const db = new Date(b.orderDate || b.createdAt).getTime()
      return da - db
    })
    .map((o) => {
      const oProfit = docTrueNetProfit(o)
      return {
        o,
        dateStr: o.orderDate
          ? new Date(o.orderDate).toLocaleDateString('en-PH')
          : new Date(o.createdAt).toLocaleDateString('en-PH'),
        oGross: docTotal(o),
        oPaid: docAmountPaid(o),
        oAr: docReceivable(o),
        oCogs: docCogs(o),
        oOpex: docLiquidatedOpex(o),
        oProfit,
        oCommission: oProfit * COMMISSION_RATE,
      }
    })

  const currentYearOptions = new Date().getFullYear()
  const filterYears = Array.from({ length: currentYearOptions - 2023 + 2 }, (_, i) => String(2023 + i))
  const filterMonths = monthNames.map((l, i) => ({ v: String(i + 1).padStart(2, '0'), l }))

  const cellClass = 'py-2.5 px-2.5 text-[11px] whitespace-nowrap'
  // Tighter than cellClass -- the Order Breakdown table has 12 columns, so
  // it needs to actually fit the page width instead of forcing a scroll.
  // No whitespace-nowrap here: long values (customer names especially)
  // wrap onto a second line within their fixed-width column instead of
  // being cut off with an ellipsis or forcing the table wider.
  const detailCell = 'py-2 px-1.5 text-[10px] break-words'

  return (
    <div className="w-full max-w-[900px] mx-auto antialiased pb-10">
      <div className="mb-6">
        <h1 className="text-[22px] md:text-[26px] font-semibold tracking-tight text-gray-900 leading-none mb-2">
          Sales Performance Breakdown
        </h1>
        <p className="text-[13px] text-gray-500 font-medium">
          Period: {periodLabel}
          {activeStatus !== 'all' && (
            <>
              {' '}&middot; Status: {FULFILLMENT_OPTIONS.find((s) => s.value === activeStatus)?.label || activeStatus}
            </>
          )}
        </p>
      </div>

      {/* Auto-Submitting Filter Form */}
      <form id="filter-form" method="GET" className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select
            name="month"
            defaultValue={activeMonth}
            className="appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-9 py-2 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer shadow-sm"
          >
            <option value="all">All Months</option>
            {filterMonths.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
        <div className="relative">
          <select
            name="year"
            defaultValue={activeYear}
            className="appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-9 py-2 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer shadow-sm"
          >
            <option value="all">All Years</option>
            {filterYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="relative">
          <select
            name="status"
            defaultValue={activeStatus}
            className="appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-9 py-2 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer shadow-sm"
          >
            <option value="all">All Statuses</option>
            {FULFILLMENT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          document.getElementById('filter-form').addEventListener('change', function() {
            this.submit();
          });
        `}} />
      </form>

      {/* Same columns as the Excel export's "Sales Performance Breakdown" sheet.
          Desktop/tablet: the table. Mobile: a stacked key-value card instead
          of a table forced to scroll sideways. */}
      <div className="hidden sm:block border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#149911] text-white">
              <th className={`${cellClass} text-left font-semibold`}>Sales Agent</th>
              <th className={`${cellClass} text-right font-semibold`}>Order Count</th>
              <th className={`${cellClass} text-right font-semibold`}>Gross Revenue</th>
              <th className={`${cellClass} text-right font-semibold`}>Amount Collected</th>
              <th className={`${cellClass} text-right font-semibold`}>Receivables</th>
              <th className={`${cellClass} text-right font-semibold`}>Liquidated OPEX</th>
              <th className={`${cellClass} text-right font-semibold`}>Net Profit</th>
              <th className={`${cellClass} text-right font-semibold`}>Commission (20%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className={`${cellClass} font-semibold text-gray-900`}>{myName || 'Unassigned'}</td>
              <td className={`${cellClass} text-right font-mono text-gray-700`}>{orderCount}</td>
              <td className={`${cellClass} text-right font-mono text-gray-700`}>{peso(gross)}</td>
              <td className={`${cellClass} text-right font-mono text-gray-700`}>{peso(paid)}</td>
              <td className={`${cellClass} text-right font-mono text-gray-700`}>{peso(receivables)}</td>
              <td className={`${cellClass} text-right font-mono text-gray-700`}>{peso(liquidatedOpex)}</td>
              <td className={`${cellClass} text-right font-mono text-gray-900 font-semibold`}>{peso(netProfit)}</td>
              <td className={`${cellClass} text-right font-mono text-[#149911] font-semibold`}>{peso(commission)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sm:hidden border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-[#149911] text-white px-4 py-3 font-semibold text-[13px]">
          {myName || 'Unassigned'}
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {[
            ['Order Count', String(orderCount)],
            ['Gross Revenue', peso(gross)],
            ['Amount Collected', peso(paid)],
            ['Receivables', peso(receivables)],
            ['Liquidated OPEX', peso(liquidatedOpex)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 text-[12px]">
              <span className="text-gray-500">{label}</span>
              <span className="font-mono text-gray-800">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-2.5 text-[12px] bg-gray-50">
            <span className="text-gray-700 font-semibold">Net Profit</span>
            <span className="font-mono text-gray-900 font-semibold">{peso(netProfit)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-[12px] bg-gray-50">
            <span className="text-gray-700 font-semibold">Commission (20%)</span>
            <span className="font-mono text-[#149911] font-semibold">{peso(commission)}</span>
          </div>
        </div>
      </div>

      {orderCount === 0 ? (
        <p className="text-[12px] text-gray-400 italic mt-4">
          No confirmed orders under your name
          {activeStatus !== 'all' ? ` with status "${FULFILLMENT_OPTIONS.find((s) => s.value === activeStatus)?.label || activeStatus}"` : ''}
          {' '}in this period.
        </p>
      ) : (
        <>
          {/* Same columns as the Excel export's "Order Detail" sheet.
              Desktop/tablet: the table. Mobile: one stacked card per order
              instead of a table forced to scroll sideways. */}
          <h2 className="text-[15px] font-semibold text-gray-900 mt-8 mb-3">
            Order Breakdown
          </h2>
          <div className="hidden sm:block border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-[#01172f] text-white">
                  <th className={`${detailCell} text-left font-semibold w-[8%] whitespace-nowrap`}>Order #</th>
                  <th className={`${detailCell} text-left font-semibold w-[7%] whitespace-nowrap`}>Date</th>
                  <th className={`${detailCell} text-left font-semibold w-[16%]`}>Customer</th>
                  <th className={`${detailCell} text-left font-semibold w-[10%]`}>Status</th>
                  <th className={`${detailCell} text-right font-semibold w-[9.5%] whitespace-nowrap`}>Gross</th>
                  <th className={`${detailCell} text-right font-semibold w-[9.5%] whitespace-nowrap`}>Paid</th>
                  <th className={`${detailCell} text-right font-semibold w-[9.5%] whitespace-nowrap`}>AR</th>
                  <th className={`${detailCell} text-right font-semibold w-[8%] whitespace-nowrap`}>COGS</th>
                  <th className={`${detailCell} text-right font-semibold w-[8%] whitespace-nowrap`}>OPEX</th>
                  <th className={`${detailCell} text-right font-semibold w-[9.5%] whitespace-nowrap`}>Profit</th>
                  <th className={`${detailCell} text-right font-semibold w-[9.5%]`}>Comm. (20%)</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(({ o, dateStr, oGross, oPaid, oAr, oCogs, oOpex, oProfit, oCommission }, i) => (
                  <tr key={o.id} className={`align-top ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className={`${detailCell} font-mono font-semibold text-[#01172f]`}>{o.orderNumber || '--'}</td>
                    <td className={`${detailCell} text-gray-600 whitespace-nowrap`}>{dateStr}</td>
                    <td className={`${detailCell} text-gray-900`}>{o.customerName || '--'}</td>
                    <td className={`${detailCell} text-gray-600 capitalize`}>{o.fulfillmentStatus || '--'}</td>
                    <td className={`${detailCell} text-right font-mono text-gray-700 whitespace-nowrap`}>{peso(oGross)}</td>
                    <td className={`${detailCell} text-right font-mono text-gray-700 whitespace-nowrap`}>{peso(oPaid)}</td>
                    <td className={`${detailCell} text-right font-mono text-gray-700 whitespace-nowrap`}>{peso(oAr)}</td>
                    <td className={`${detailCell} text-right font-mono text-gray-700 whitespace-nowrap`}>{peso(oCogs)}</td>
                    <td className={`${detailCell} text-right font-mono text-gray-700 whitespace-nowrap`}>{peso(oOpex)}</td>
                    <td className={`${detailCell} text-right font-mono text-gray-900 font-semibold whitespace-nowrap`}>{peso(oProfit)}</td>
                    <td className={`${detailCell} text-right font-mono text-[#149911] font-semibold whitespace-nowrap`}>{peso(oCommission)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-[#01172f]">
                  <td className={`${detailCell} font-bold text-gray-900 whitespace-nowrap`} colSpan={4}>GRAND TOTAL</td>
                  <td className={`${detailCell} text-right font-mono font-bold text-gray-900 whitespace-nowrap`}>{peso(gross)}</td>
                  <td className={`${detailCell} text-right font-mono font-bold text-gray-900 whitespace-nowrap`}>{peso(paid)}</td>
                  <td className={`${detailCell} text-right font-mono font-bold text-gray-900 whitespace-nowrap`}>{peso(receivables)}</td>
                  <td className={`${detailCell} text-right font-mono font-bold text-gray-900 whitespace-nowrap`}>{peso(totalCogs)}</td>
                  <td className={`${detailCell} text-right font-mono font-bold text-gray-900 whitespace-nowrap`}>{peso(liquidatedOpex)}</td>
                  <td className={`${detailCell} text-right font-mono font-bold text-gray-900 whitespace-nowrap`}>{peso(netProfit)}</td>
                  <td className={`${detailCell} text-right font-mono font-bold text-[#149911] whitespace-nowrap`}>{peso(commission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="sm:hidden flex flex-col gap-3">
            {sortedOrders.map(({ o, dateStr, oGross, oPaid, oAr, oCogs, oOpex, oProfit, oCommission }) => (
              <div key={o.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-[#01172f] text-white px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-[12px]">{o.orderNumber || '--'}</span>
                  <span className="text-[11px] text-white/70">{dateStr}</span>
                </div>
                <div className="bg-white px-4 py-2.5 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900">{o.customerName || '--'}</p>
                  <p className="text-[11px] text-gray-500 capitalize mt-0.5">
                    {o.fulfillmentStatus || '--'} &middot; {o.paymentStatus || '--'}
                  </p>
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                  {[
                    ['Gross Revenue', peso(oGross)],
                    ['Amount Paid', peso(oPaid)],
                    ['Receivables', peso(oAr)],
                    ['COGS', peso(oCogs)],
                    ['Liquidated OPEX', peso(oOpex)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-2 text-[12px]">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-mono text-gray-800">{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2 text-[12px] bg-gray-50">
                    <span className="text-gray-700 font-semibold">Net Profit</span>
                    <span className="font-mono text-gray-900 font-semibold">{peso(oProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 text-[12px] bg-gray-50">
                    <span className="text-gray-700 font-semibold">Commission (20%)</span>
                    <span className="font-mono text-[#149911] font-semibold">{peso(oCommission)}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-2 border-[#01172f] rounded-xl overflow-hidden">
              <div className="bg-[#01172f] text-white px-4 py-2.5 font-bold text-[12px]">
                GRAND TOTAL
              </div>
              <div className="divide-y divide-gray-100 bg-gray-50">
                {[
                  ['Gross Revenue', peso(gross)],
                  ['Amount Paid', peso(paid)],
                  ['Receivables', peso(receivables)],
                  ['COGS', peso(totalCogs)],
                  ['Liquidated OPEX', peso(liquidatedOpex)],
                  ['Net Profit', peso(netProfit)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2 text-[12px] font-bold text-gray-900">
                    <span>{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2 text-[12px] font-bold">
                  <span className="text-gray-900">Commission (20%)</span>
                  <span className="font-mono text-[#149911]">{peso(commission)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
