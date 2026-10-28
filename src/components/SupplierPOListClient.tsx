'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import CollectionStatusSelect from '@/components/CollectionStatusSelect'
import InfiniteScrollSentinel from '@/components/InfiniteScrollSentinel'
import { loadMoreSupplierPOs } from '@/app/admin-dashboard/supplier-po/actions'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
]
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  issued: 'Issued',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-blue-50 text-blue-600',
  fulfilled: 'bg-[#149911] text-white',
  cancelled: 'bg-red-50 text-red-600',
}

const peso = (n: number) =>
  n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })

// The newest page comes from the server; older purchase orders are loaded on
// demand as the list is scrolled (or via the button).
export default function SupplierPOListClient({
  pos,
  totalDocs,
  hasNextPage,
  activeStatus,
  listOrder,
  listSupplier,
}: {
  pos: any[]
  totalDocs: number
  hasNextPage: boolean
  activeStatus?: string
  listOrder?: string
  listSupplier?: string
}) {
  const [items, setItems] = useState<any[]>(pos)
  const [nextPage, setNextPage] = useState(2)
  const [hasMore, setHasMore] = useState(hasNextPage)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')
  const firstPageIds = useRef(new Set(pos.map((p) => p.id)))
  const filterKey = `${activeStatus || ''}|${listOrder || ''}|${listSupplier || ''}`
  const lastFilterKey = useRef(filterKey)

  // A new filter starts the list over; a plain refresh (e.g. after an inline
  // status change) updates the newest page in place and keeps older pages.
  useEffect(() => {
    if (lastFilterKey.current !== filterKey) {
      lastFilterKey.current = filterKey
      setItems(pos)
      setNextPage(2)
      setHasMore(hasNextPage)
      setLoadError('')
    } else {
      const fresh = new Map(pos.map((p) => [p.id, p]))
      setItems((prev) => {
        const kept = prev
          .filter((p) => !(firstPageIds.current.has(p.id) && !fresh.has(p.id)))
          .map((p) => fresh.get(p.id) ?? p)
        const have = new Set(kept.map((p) => p.id))
        return [...pos.filter((p) => !have.has(p.id)), ...kept]
      })
    }
    firstPageIds.current = new Set(pos.map((p) => p.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setLoadError('')
    try {
      const res = await loadMoreSupplierPOs({ status: activeStatus, listOrder, listSupplier, page: nextPage })
      setItems((prev) => {
        const have = new Set(prev.map((p) => p.id))
        return [...prev, ...res.docs.filter((d: any) => !have.has(d.id))]
      })
      setNextPage((n) => n + 1)
      setHasMore(res.hasNextPage)
    } catch {
      setLoadError('Could not load older purchase orders. Try again.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((po: any) => {
        const total = (po.items || []).reduce((sum: number, i: any) => sum + i.qty * i.unitPrice, 0)

        return (
          <div
            key={po.id}
            className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 transition-all duration-300 hover:border-gray-200 hover:shadow-sm"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-1.5">{po.poNumber || 'DRAFT'}</p>
                <h3 className="text-[18px] font-semibold text-gray-900 tracking-tight leading-none">{po.supplierName || 'Untitled'}</h3>
              </div>
              <CollectionStatusSelect
                collection="supplier-purchase-orders"
                id={po.id}
                status={po.status}
                options={STATUS_OPTIONS}
                colorClassMap={STATUS_COLORS}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-5 pt-5 border-t border-gray-50 gap-4">
              <p className="text-[13px] text-gray-500 font-medium">
                {po.poDate
                  ? new Date(po.poDate).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : ''}
              </p>
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <p className="text-[16px] font-semibold text-gray-900 font-mono tracking-tight">{peso(total)}</p>
                <Link
                  href={`/admin-dashboard/supplier-po?id=${po.id}`}
                  className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full"
                >
                  View / Edit &rarr;
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="border border-dashed border-gray-200 py-16 text-center rounded-3xl bg-gray-50/50">
          <p className="text-[14px] text-gray-400 font-medium">
            No purchase orders found{activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''}.
          </p>
        </div>
      )}

      <InfiniteScrollSentinel
        hasMore={hasMore}
        loading={loadingMore}
        error={loadError}
        onLoadMore={loadMore}
        loadedCount={items.length}
        totalCount={totalDocs}
        noun="purchase orders"
      />
    </div>
  )
}
