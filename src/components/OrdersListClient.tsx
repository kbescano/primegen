'use client'

// Same "fetch once, filter client-side" pattern as QuotationInboxClient /
// ClientQuotationsListClient: the server fetches the full (capped) batch of
// orders one time, and Status + Search both filter that already-fetched
// list in memory instead of a server round trip / full page reload per
// status click.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import OrderOpexSection from '@/components/OrderOpexSection'
import ReceiptsPreview from '@/components/ReceiptsPreview'

const FULFILLMENT_STAGES = ['preparing', 'shipped', 'delivered'] as const

const FULFILLMENT_OPTIONS = [
  { value: 'preparing', label: 'Preparing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const FULFILLMENT_LABELS: Record<string, string> = {
  preparing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'bg-gray-100 text-gray-600',
  partial: 'bg-amber-50 text-amber-700',
  paid: 'bg-[#149911]/10 text-[#149911]',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  cheque: 'Cheque',
  bank_transfer: 'Bank Transfer',
}

const filterPills = [{ value: '', label: 'All Orders' }, ...FULFILLMENT_OPTIONS]
const VALID_STATUSES = new Set(FULFILLMENT_OPTIONS.map((s) => s.value))

function normalizeStatus(value: string | null | undefined): string | undefined {
  return value && VALID_STATUSES.has(value) ? value : undefined
}

function matchesSearch(o: any, orderPOs: any[], needle: string): boolean {
  const parts: string[] = [o.orderNumber, o.customerName, o.company, o.salesPerson, o.contactNumber]
  if (Array.isArray(o.items)) {
    for (const item of o.items) parts.push(item?.description)
  }
  for (const po of orderPOs) {
    parts.push(po?.poNumber)
    parts.push(po?.supplierName)
  }
  return parts.filter(Boolean).some((p) => String(p).toLowerCase().includes(needle))
}

function PaymentMethodIcon({ method }: { method: string }) {
  if (method === 'cash') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  }
  if (method === 'cheque') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="6" y1="14" x2="12" y2="14" />
        <line x1="6" y1="17" x2="10" y2="17" />
      </svg>
    )
  }
  // bank_transfer
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function orderTotal(o: any): number {
  const subtotal = (o.items || []).reduce(
    (sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0
  )
  const discountAmount = Number(o.discountAmount) || 0
  const deliveryFee = Number(o.deliveryFee) || 0
  const afterDiscount = subtotal - discountAmount
  const withDelivery = afterDiscount + deliveryFee
  const vatRate = Number(o.vatRate) || 0
  const vatAmount = withDelivery * (vatRate / 100)
  return withDelivery + vatAmount
}

function MinimalStepper({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-red-50 text-red-600 rounded-md">
        Cancelled
      </span>
    )
  }

  const currentIndex = FULFILLMENT_STAGES.indexOf(status as any)

  return (
    <div className="flex items-center gap-1.5 w-full max-w-[280px]">
      {FULFILLMENT_STAGES.map((stage, i) => {
        const reached = i <= currentIndex
        const isLast = i === FULFILLMENT_STAGES.length - 1
        return (
          <div key={stage} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  reached ? 'bg-[#149911]' : 'bg-gray-200'
                }`}
              />
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  reached ? 'text-[#01172f]' : 'text-gray-300'
                }`}
              >
                {FULFILLMENT_LABELS[stage]}
              </span>
            </div>
            {!isLast && <div className={`flex-1 h-[1px] mx-2 ${i < currentIndex ? 'bg-[#149911]' : 'bg-gray-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export default function OrdersListClient({
  orders,
  posByOrderId,
  highlightId,
}: {
  orders: any[]
  posByOrderId: Record<string, any[]>
  highlightId?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeStatus, setActiveStatus] = useState<string | undefined>(
    normalizeStatus(searchParams.get('status')),
  )
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '')

  useEffect(() => {
    setActiveStatus(normalizeStatus(searchParams.get('status')))
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  function syncUrl(next: { status?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    const nextStatus = 'status' in next ? next.status : activeStatus
    const nextQuery = 'q' in next ? next.q : searchQuery
    if (nextStatus) params.set('status', nextStatus)
    else params.delete('status')
    if (nextQuery) params.set('q', nextQuery)
    else params.delete('q')
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
  }

  useEffect(() => {
    const timer = setTimeout(() => syncUrl({ q: searchQuery || undefined }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  function handleStatusClick(value: string) {
    const next = value || undefined
    setActiveStatus(next)
    syncUrl({ status: next })
  }

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesStatus = !activeStatus || o.fulfillmentStatus === activeStatus
      const matchesQ = !needle || matchesSearch(o, posByOrderId[String(o.id)] || [], needle)
      return matchesStatus && matchesQ
    })
  }, [orders, posByOrderId, activeStatus, searchQuery])

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order #, customer, company, sales agent, item, or supplier PO..."
          className="w-full pl-9 pr-8 py-2 text-[12px] text-gray-700 placeholder:text-gray-300 bg-gray-50/70 border border-gray-100 rounded-lg focus:outline-none focus:border-[#149911] focus:bg-white transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {filterPills.map((pill) => {
          const isActive = (activeStatus || '') === pill.value
          return (
            <button
              key={pill.value || 'all'}
              type="button"
              onClick={() => handleStatusClick(pill.value)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all ${
                isActive ? 'bg-[#01172f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-12 text-center rounded-xl">
          <p className="text-xs text-gray-400 font-medium">
            No orders
            {activeStatus ? ` with status "${FULFILLMENT_LABELS[activeStatus]}"` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''} found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((o: any) => {
            const total = orderTotal(o)
            const orderItems = o.items || []
            const orderPOs = posByOrderId[String(o.id)] || []

            const subtotal = orderItems.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
            const discount = Number(o.discountAmount) || 0
            const delivery = Number(o.deliveryFee) || 0
            const netRevenue = subtotal - discount + delivery

            const vatAmount = netRevenue * ((Number(o.vatRate) || 0) / 100)
            const grossRevenue = netRevenue + vatAmount

            const cogs = orderItems.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
            const markupTotal = netRevenue - cogs

            const liquidatedOpex = (o.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
            const pendingOpex = (o.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'pending' ? Number(exp.amount) || 0 : 0), 0)
            const trueNet = markupTotal - liquidatedOpex

            const amountPaid = Number(o.amountPaid) || 0
            const paymentStatusLabel = o.paymentStatus === 'partial' ? 'Partial' : (o.paymentStatus || 'unpaid')
            const receivables = o.paymentStatus === 'partial'
                ? grossRevenue - amountPaid
                : (o.paymentStatus === 'paid' ? 0 : grossRevenue)

            const showPaymentMethod = (o.paymentStatus === 'partial' || o.paymentStatus === 'paid') && o.paymentMethod

            const isHighlighted = highlightId && String(o.id) === String(highlightId)
            const date = o.orderDate
              ? new Date(o.orderDate).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''

            // Target delivery date
            let targetDateStr = ''
            let isLateOrToday = false
            let deadlineLabel = ''

            if (o.targetDeliveryDate) {
              const tDate = new Date(o.targetDeliveryDate)
              targetDateStr = tDate.toLocaleDateString('en-PH', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })

              const today = new Date()
              today.setHours(0, 0, 0, 0)

              const targetMidnight = new Date(tDate)
              targetMidnight.setHours(0, 0, 0, 0)

              if (o.fulfillmentStatus !== 'delivered' && o.fulfillmentStatus !== 'cancelled') {
                if (targetMidnight.getTime() < today.getTime()) {
                  isLateOrToday = true
                  deadlineLabel = '(Overdue)'
                } else if (targetMidnight.getTime() === today.getTime()) {
                  isLateOrToday = true
                  deadlineLabel = '(Today)'
                }
              }
            }

            return (
              <div
                key={o.id}
                className={`bg-white border rounded-2xl p-5 md:p-7 transition-all ${
                  isHighlighted ? 'border-[#149911] shadow-[0_8px_30px_-12px_rgba(20,153,17,0.25)]' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* Top Tracker Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#01172f]">
                        {o.orderNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">{date}</span>
                    </div>

                    {targetDateStr && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">
                          Deadline:
                        </span>
                        <span className={`text-[10px] font-bold ${
                          isLateOrToday
                            ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded'
                            : 'text-[#01172f]'
                        }`}>
                          {targetDateStr} {deadlineLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  <MinimalStepper status={o.fulfillmentStatus || 'preparing'} />
                </div>

                {/* Core Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#01172f] mb-0.5">
                      {o.customerName || '--'}
                      <span className="font-normal text-gray-500 ml-2">({o.company || 'No Company'})</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Sales Agent: <span className="text-[#149911] font-bold">{o.salesPerson || '--'}</span>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Contact: <span className="text-gray-800">{o.contactNumber || '--'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md ${PAYMENT_COLORS[o.paymentStatus || 'unpaid'] || PAYMENT_COLORS['unpaid']}`}>
                        Payment: {paymentStatusLabel}
                      </span>
                      {showPaymentMethod && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase rounded-md bg-blue-50 text-blue-700">
                          <PaymentMethodIcon method={o.paymentMethod} />
                          {PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] font-black font-mono text-[#01172f]">
                      {peso(total - receivables)}
                    </p>
                  </div>
                </div>

                {/* Items & POs - SIDE BY SIDE ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
                  {/* Left Column: Order Items */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Order Items ({orderItems.length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {orderItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-baseline justify-between gap-2 text-[11px] text-gray-700">
                          <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                            <span className="font-mono text-gray-400 font-bold whitespace-nowrap shrink-0">
                              {Number(item.qty) || 0} {item.unit || 'x'}
                            </span>
                            <span className="leading-snug break-words">
                              {item.description || '--'}
                              {item.sizeDescription ? ` - ${item.sizeDescription}` : ''}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#01172f] shrink-0 text-right">
                            {peso((Number(item.qty) || 0) * (Number(item.unitPrice) || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Linked POs */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Linked Supplier POs ({orderPOs.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {orderPOs.length > 0 ? (
                        orderPOs.map((po: any) => (
                          <Link
                            key={po.id}
                            href={`/admin-dashboard/supplier-po?listSupplier=${encodeURIComponent(po.supplierName || '')}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all text-[11px]"
                          >
                            <span className="text-gray-700 font-medium truncate">
                              <span className="font-mono font-bold text-[#01172f] mr-2">{po.poNumber}</span>
                              {po.supplierName || 'Unnamed Supplier'}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#149911]/10 text-[#149911] rounded flex-shrink-0">
                              {po.status}
                            </span>
                          </Link>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-400 italic py-1">No supplier POs created yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* OPEX Section */}
                <div className="mb-6">
                  <OrderOpexSection
                    orderId={o.id}
                    opex={o.opex || []}
                    allowApprove={true}
                  />
                </div>

                {/* Payment Receipts -- read only, reflects uploads made in Pipeline Step 4. No approval needed. */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <ReceiptsPreview label="Client's Payment Receipts" receipts={o.clientPaymentReceipts} />
                  <ReceiptsPreview label="Supplier's Payment Receipts" receipts={o.supplierPaymentReceipts} />
                </div>

                {/* Financial Summary */}
                <div className="flex flex-col md:flex-row justify-end items-start md:items-end border-t border-gray-100 pt-6 gap-4 mt-2">
                  <div className="bg-gray-50 p-4 md:p-5 rounded-xl flex flex-col gap-2.5 border border-gray-200 w-full md:w-[340px]">
                    <div className="flex justify-between items-center text-[11px] text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-mono">{peso(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-[11px] text-gray-500">
                        <span>Discount</span>
                        <span className="font-mono text-red-500">-{peso(discount)}</span>
                      </div>
                    )}
                    {delivery > 0 && (
                      <div className="flex justify-between items-center text-[11px] text-gray-500">
                        <span>Delivery Fee</span>
                        <span className="font-mono">{peso(delivery)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px] text-gray-500">
                      <span>VAT ({o.vatRate || 0}%)</span>
                      <span className="font-mono">+{peso(vatAmount)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-semibold text-gray-800 border-t border-gray-200 pt-2 mt-1">
                      <span>Gross Revenue</span>
                      <span className="font-mono">{peso(grossRevenue)}</span>
                    </div>

                    {o.paymentStatus === 'partial' && (
                        <div className="bg-amber-50/50 border border-amber-100/50 -mx-3 px-3 py-2.5 rounded-lg flex flex-col gap-2 my-1">
                            <div className="flex justify-between items-center text-[11px] text-amber-600/80">
                                <span>Amount Paid</span>
                                <span className="font-mono">-{peso(amountPaid)}</span>
                            </div>
                            {showPaymentMethod && (
                              <div className="flex justify-between items-center text-[10px] text-amber-600/70">
                                <span>Mode of Payment</span>
                                <span className="font-semibold uppercase tracking-wide">{PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[11px] font-semibold text-amber-600">
                                <span>Receivables (Unpaid)</span>
                                <span className="font-mono">{peso(receivables)}</span>
                            </div>
                        </div>
                    )}
                    {o.paymentStatus !== 'paid' && o.paymentStatus !== 'partial' && (
                         <div className="flex justify-between items-center text-[11px] font-semibold text-amber-600 bg-amber-50/50 border border-amber-100/50 -mx-3 px-3 py-2.5 rounded-lg my-1">
                            <span>Receivables (Unpaid)</span>
                            <span className="font-mono">{peso(grossRevenue)}</span>
                        </div>
                    )}
                    {o.paymentStatus === 'paid' && showPaymentMethod && (
                        <div className="flex justify-between items-center text-[10px] text-[#149911]/70 bg-[#149911]/[0.04] border border-[#149911]/10 -mx-3 px-3 py-2 rounded-lg my-1">
                            <span>Mode of Payment</span>
                            <span className="font-semibold uppercase tracking-wide">{PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-gray-500 border-t border-gray-200 pt-2.5 mt-1 border-dashed">
                      <span>Total COGS</span>
                      <span className="font-mono text-red-500">-{peso(cogs)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-500">
                      <span>
                        Liquidated OPEX
                        {pendingOpex > 0 && <span className="text-amber-500 italic ml-1">(+ {peso(pendingOpex)} pending)</span>}
                      </span>
                      <span className="font-mono text-red-500">-{peso(liquidatedOpex)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12px] font-bold text-[#149911] border-t border-gray-200 pt-2.5 mt-1">
                      <span className="uppercase tracking-wide">Net Profit</span>
                      <span className="font-mono text-[15px] leading-none">{peso(trueNet)}</span>
                    </div>
                  </div>
                </div>

                {/* Subtle Link footer */}
                {o.sourceQuotationId && (
                  <div className="mt-5 pt-3 flex justify-end">
                    <Link
                      href={`/admin-dashboard/client-quotation?id=${o.sourceQuotationId}`}
                      className="text-[9px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Source Quotation &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
