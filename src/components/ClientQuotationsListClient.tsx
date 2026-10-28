'use client'

// Status and Search are applied by the server (see page.tsx): each change
// updates the URL and the server re-renders the newest page. Older
// quotations are loaded on demand as the list is scrolled (or via the
// button), so every quotation stays reachable without loading all of them.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import CollectionStatusSelect from '@/components/CollectionStatusSelect'
import InfiniteScrollSentinel from '@/components/InfiniteScrollSentinel'
import { loadMoreQuotations } from '@/app/admin-dashboard/client-quotation/actions'

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

// Shared between the list row and the detail modal, so the two never drift
// apart. `View Quotation` still goes to ?id= (the full QuotationGenerator
// editor -- a different page mode, not this modal) and `View Converted
// Order` still goes to the Orders page's own ?id= deep link, which now
// opens that order as a modal there the same way this one does here.
function QuotationCardBody({
  q,
  existingOrderId,
}: {
  q: any
  existingOrderId?: string
}) {
  const supplierCostTotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.unitCost || 0), 0)
  const markupTotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.marginAmount || 0), 0)
  const subtotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.unitPrice || 0), 0)
  const discount = Number(q.discountAmount) || 0
  const delivery = Number(q.deliveryFee) || 0
  const netRev = subtotal - discount + delivery
  const vat = netRev * ((q.vatRate || 0) / 100)
  const total = netRev + vat

  const date = q.quotationDate
    ? new Date(q.quotationDate).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <>
      {/* Top Bar: Quotation #, Date & Status Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-[#01172f]">
            {q.quotationNumber}
          </span>
          <span className="text-[10px] text-gray-400">{date}</span>
        </div>

        <div className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
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
      <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
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
    </>
  )
}

export default function ClientQuotationsListClient({
  quotations,
  viewQuotation,
  orderIdByQuotationId,
  totalDocs,
  hasNextPage,
  initialStatus,
  initialQuery,
}: {
  quotations: any[]
  viewQuotation?: any
  orderIdByQuotationId: Record<string, string>
  totalDocs: number
  hasNextPage: boolean
  initialStatus?: string
  initialQuery: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeStatus = normalizeStatus(initialStatus)
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery)

  // Newest page comes from the server; older pages are appended here.
  const [items, setItems] = useState<any[]>(quotations)
  const [orderMap, setOrderMap] = useState<Record<string, string>>(orderIdByQuotationId)
  const [nextPage, setNextPage] = useState(2)
  const [hasMore, setHasMore] = useState(hasNextPage)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')
  const firstPageIds = useRef(new Set(quotations.map((q) => q.id)))
  const filterKey = `${initialStatus || ''}|${initialQuery.trim()}`
  const lastFilterKey = useRef(filterKey)

  // The server re-sends the newest page whenever the filter changes or
  // router.refresh() runs (e.g. after a status change). A new filter starts
  // the list over; a plain refresh updates those rows in place and keeps
  // whatever older pages are already loaded.
  useEffect(() => {
    if (lastFilterKey.current !== filterKey) {
      lastFilterKey.current = filterKey
      setItems(quotations)
      setOrderMap(orderIdByQuotationId)
      setNextPage(2)
      setHasMore(hasNextPage)
      setLoadError('')
    } else {
      const fresh = new Map(quotations.map((q) => [q.id, q]))
      setItems((prev) => {
        const kept = prev
          .filter((p) => !(firstPageIds.current.has(p.id) && !fresh.has(p.id)))
          .map((p) => fresh.get(p.id) ?? p)
        const have = new Set(kept.map((p) => p.id))
        return [...quotations.filter((q) => !have.has(q.id)), ...kept]
      })
      setOrderMap((prev) => ({ ...prev, ...orderIdByQuotationId }))
    }
    firstPageIds.current = new Set(quotations.map((q) => q.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotations, orderIdByQuotationId])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setLoadError('')
    try {
      const res = await loadMoreQuotations({ status: activeStatus, q: initialQuery, page: nextPage })
      setItems((prev) => {
        const have = new Set(prev.map((p) => p.id))
        return [...prev, ...res.docs.filter((d: any) => !have.has(d.id))]
      })
      setOrderMap((prev) => ({ ...prev, ...res.orderIdByQuotationId }))
      setNextPage((n) => n + 1)
      setHasMore(res.hasNextPage)
    } catch {
      setLoadError('Could not load older quotations. Try again.')
    } finally {
      setLoadingMore(false)
    }
  }
  // Deliberately a different param from `id` -- on this page `?id=` already
  // means "open the full QuotationGenerator editor" (see page.tsx), a
  // completely different navigation. `view` is just "show this card's
  // detail as a modal without leaving the list".
  const [openViewId, setOpenViewId] = useState<string | undefined>(searchParams.get('view') || undefined)

  useEffect(() => {
    setOpenViewId(searchParams.get('view') || undefined)
  }, [searchParams])

  function buildHref(next: { status?: string; q?: string }) {
    const params = new URLSearchParams()
    const nextStatus = 'status' in next ? next.status : activeStatus
    const nextQuery = 'q' in next ? next.q : searchQuery.trim()
    if (nextStatus) params.set('status', nextStatus)
    if (nextQuery) params.set('q', nextQuery)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  useEffect(() => {
    const term = searchQuery.trim()
    if (term === initialQuery.trim()) return
    const timer = setTimeout(() => router.replace(buildHref({ q: term || undefined })), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  function handleStatusClick(value: string) {
    router.push(buildHref({ status: value || undefined }))
  }

  function setViewParam(next: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set('view', next)
    else params.delete('view')
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
  }

  function openView(id: string | number) {
    const next = String(id)
    setOpenViewId(next)
    setViewParam(next)
  }

  function closeView() {
    setOpenViewId(undefined)
    setViewParam(undefined)
  }

  const openQuotation = openViewId
    ? items.find((q) => String(q.id) === openViewId) ??
      (viewQuotation && String(viewQuotation.id) === openViewId ? viewQuotation : undefined)
    : undefined

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

      <p className="text-[11px] text-gray-400 font-medium mb-4">
        {totalDocs} quotation{totalDocs === 1 ? '' : 's'}
        {activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''}
        {initialQuery.trim() ? ` matching "${initialQuery.trim()}"` : ''}
      </p>

      {items.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-12 text-center rounded">
          <p className="text-xs text-gray-400 font-medium">
            No quotations
            {activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''}
            {initialQuery.trim() ? ` matching "${initialQuery.trim()}"` : ''} found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {items.map((q: any) => (
            <div
              key={q.id}
              onClick={() => openView(q.id)}
              className="bg-white border border-gray-200 rounded p-4 sm:p-5 transition-all hover:border-gray-300 hover:shadow-sm cursor-pointer"
            >
              <QuotationCardBody q={q} existingOrderId={orderMap[String(q.id)]} />
            </div>
          ))}
        </div>
      )}

      <InfiniteScrollSentinel
        hasMore={hasMore}
        loading={loadingMore}
        error={loadError}
        onLoadMore={loadMore}
        loadedCount={items.length}
        totalCount={totalDocs}
        noun="quotations"
      />

      {openQuotation && (
        <div
          className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4"
          onClick={closeView}
        >
          <div
            className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[13px] font-semibold text-gray-900">Client Quotation</h2>
              <button
                onClick={closeView}
                className="text-gray-400 hover:text-gray-700 text-[13px] leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <QuotationCardBody q={openQuotation} existingOrderId={orderMap[String(openQuotation.id)]} />
          </div>
        </div>
      )}
    </>
  )
}
