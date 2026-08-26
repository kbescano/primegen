'use client'

// Same "fetch once, filter client-side" pattern as QuotationInboxClient /
// ProductCatalog: the server component fetches the full (capped) batch of
// quotations one time, and Status + Search both filter that already-fetched
// list in memory -- no server round trip, no full page reload per click,
// unlike the old Link-based status pills this replaces.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import CollectionStatusSelect from '@/components/CollectionStatusSelect'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'quotation_approved', label: 'Quotation Approved' },
  { value: 'order_confirmed', label: 'Order Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label]),
)
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-amber-50 text-amber-700',
  quotation_approved: 'bg-[#149911]/10 text-[#149911]',
  order_confirmed: 'bg-[#149911]/10 text-[#149911]',
  cancelled: 'bg-red-50 text-red-600',
}
const filterPills = [{ value: '', label: 'All' }, ...STATUS_OPTIONS]
const VALID_STATUSES = new Set(STATUS_OPTIONS.map((s) => s.value))

const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function normalizeStatus(value: string | null | undefined): string | undefined {
  return value && VALID_STATUSES.has(value) ? value : undefined
}

function matchesSearch(q: any, needle: string): boolean {
  const parts: string[] = [q.quotationNumber, q.customerName, q.company, q.salesPerson]
  if (Array.isArray(q.items)) {
    for (const item of q.items) parts.push(item?.description)
  }
  return parts.filter(Boolean).some((p) => String(p).toLowerCase().includes(needle))
}

export default function ClientQuotationsListClient({
  quotations,
  orderIdByQuotationId,
}: {
  quotations: any[]
  orderIdByQuotationId: Record<string, string>
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
    return quotations.filter((q) => {
      const matchesStatus = !activeStatus || q.status === activeStatus
      const matchesQ = !needle || matchesSearch(q, needle)
      return matchesStatus && matchesQ
    })
  }, [quotations, activeStatus, searchQuery])

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
          placeholder="Search by quotation #, customer, company, sales agent, or item..."
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
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all ${
                isActive ? 'bg-[#01172f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-12 text-center rounded">
          <p className="text-xs text-gray-400 font-medium">
            No quotations
            {activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''} found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((q: any) => {
            const supplierCostTotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.unitCost || 0), 0)
            const markupTotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.marginAmount || 0), 0)
            const subtotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.unitPrice || 0), 0)
            const discount = Number(q.discountAmount) || 0
            const delivery = Number(q.deliveryFee) || 0
            const netRev = subtotal - discount + delivery
            const vat = netRev * ((q.vatRate || 0) / 100)
            const total = netRev + vat

            const existingOrderId = orderIdByQuotationId[String(q.id)]

            const date = q.quotationDate
              ? new Date(q.quotationDate).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''

            return (
              <div
                key={q.id}
                className="bg-white border border-gray-200 rounded p-4 sm:p-5 transition-all hover:border-gray-300"
              >
                {/* Top Bar: Quotation #, Date & Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#01172f]">
                      {q.quotationNumber}
                    </span>
                    <span className="text-[10px] text-gray-400">{date}</span>
                  </div>

                  <div className="w-full sm:w-auto">
                    <CollectionStatusSelect
                      collection="client-quotations"
                      id={q.id}
                      status={q.status}
                      options={STATUS_OPTIONS}
                      colorClassMap={STATUS_COLORS}
                    />
                  </div>
                </div>

                {/* Core Info & Financial Summary */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#01172f] mb-0.5">
                      {q.customerName || 'Untitled'}
                      <span className="font-normal text-gray-500 ml-2">({q.company || 'No Company'})</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Sales Agent: <span className="text-[#149911] font-bold">{q.salesPerson || '--'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Total Value</p>
                      <p className="text-[14px] font-black font-mono text-[#01172f]">
                        {peso(total)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items & Financial Breakdown - SIDE BY SIDE ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  {/* Left Column: Request Items */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Request Items ({(q.items || []).length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {(q.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-[11px] text-gray-700">
                          <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                            <span className="font-mono text-gray-400 font-bold whitespace-nowrap shrink-0">
                              {item.qty} {item.unit || 'pcs'}
                            </span>
                            <span className="leading-snug break-words">
                              {item.description || 'Unnamed item'}
                              {item.sizeDescription ? ` - ${item.sizeDescription}` : ''}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#01172f] shrink-0 text-right">
                            {peso((item.qty || 0) * (item.unitPrice || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Detailed Financial Breakdown */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Financial Breakdown
                    </p>
                    <div className="bg-gray-50 p-3 rounded border border-gray-100 flex flex-col gap-1.5 text-[11px]">
                      <div className="flex justify-between text-gray-500">
                        <span>Supplier Cost</span>
                        <span className="font-mono">{peso(supplierCostTotal)}</span>
                      </div>

                      <div className="flex justify-between text-gray-500">
                        <span>Markup Total</span>
                        <span className="font-mono font-bold text-[#149911]">{peso(markupTotal)}</span>
                      </div>

                      <div className="flex justify-between text-gray-500 border-t border-gray-200 pt-1 mt-0.5">
                        <span>Subtotal</span>
                        <span className="font-mono">{peso(subtotal)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Discount</span>
                          <span className="font-mono text-red-500">-{peso(discount)}</span>
                        </div>
                      )}

                      {delivery > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Delivery Fee</span>
                          <span className="font-mono">+{peso(delivery)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-500">
                        <span>VAT ({q.vatRate || 0}%)</span>
                        <span className="font-mono">+{peso(vat)}</span>
                      </div>

                      <div className="flex justify-between font-bold text-[#01172f] border-t border-gray-200 pt-1 mt-0.5">
                        <span>Total (Gross)</span>
                        <span className="font-mono">{peso(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <Link
                    href={`/admin-dashboard/client-quotation?id=${q.id}`}
                    className="text-[9px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View Quotation &rarr;
                  </Link>

                  {existingOrderId && (
                    <Link
                      href={`/admin-dashboard/orders?id=${existingOrderId}`}
                      className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 bg-[#01172f] text-white rounded hover:bg-[#149911] transition-colors"
                    >
                      View Converted Order &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
