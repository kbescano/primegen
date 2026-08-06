import Link from 'next/link'
import SupplierPOGenerator, { type SupplierPOInitial } from '@/components/SupplierPOGenerator'
import CollectionStatusSelect from '@/components/CollectionStatusSelect'
import { getPayloadClient } from '@/lib/getPayloadClient'

const STATUSES = ['draft', 'issued', 'fulfilled', 'cancelled'] as const
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

function extractId(val: any): string | undefined {
  if (!val) return undefined
  if (typeof val === 'object') {
    if (val.id) return String(val.id)
    if (val.value) return String(val.value)
    return undefined
  }
  return String(val)
}

export default async function SupplierPOPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    from?: string; 
    id?: string; 
    new?: string; 
    status?: string; 
    supplierId?: string; 
    orderId?: string; 
    requestId?: string;
    listOrder?: string;
    listSupplier?: string;
  }>
}) {
  const { from, id, new: isNew, status, supplierId, orderId, requestId, listOrder, listSupplier } = await searchParams

  // ===== GENERATOR MODE =====
  if (id || from || isNew || supplierId || orderId || requestId) {
    let initial: SupplierPOInitial | undefined
    const showSupplierPicker = Boolean((from || isNew || orderId || requestId) && !supplierId && !id)

    const payloadForProducts = await getPayloadClient()
    const productsRes = await payloadForProducts.find({
      collection: 'products',
      limit: 500,
      sort: 'name',
      depth: 0,
    })
    const products = (productsRes.docs as any[]).map((p) => ({ id: p.id, name: p.name, unit: p.unit }))

    let resolvedRequestId = extractId(requestId) || extractId(from)
    let resolvedOrderId = extractId(orderId)

    if (id) {
      try {
        const payload = await getPayloadClient()
        const po: any = await payload.findByID({ collection: 'supplier-purchase-orders', id })
        if (po) {
          if (!resolvedRequestId) resolvedRequestId = extractId(po.sourceRequestId) || extractId(po.request)
          if (!resolvedOrderId) resolvedOrderId = extractId(po.sourceOrderId) || extractId(po.order)

          // Deep lookup: if requestId not directly on PO, trace up through parent Order -> Quotation Request
          if (!resolvedRequestId && resolvedOrderId) {
            try {
              const parentOrder: any = await payload.findByID({ collection: 'orders', id: resolvedOrderId })
              if (parentOrder) {
                resolvedRequestId = extractId(parentOrder.sourceRequestId) || extractId(parentOrder.request)
                if (!resolvedRequestId && parentOrder.quotation) {
                  const qId = extractId(parentOrder.quotation)
                  if (qId) {
                    const q: any = await payload.findByID({ collection: 'client-quotations', id: qId })
                    resolvedRequestId = extractId(q?.sourceRequestId)
                  }
                }
              }
            } catch {}
          }

          initial = {
            id: po.id,
            poNumber: po.poNumber,
            poDate: po.poDate ? String(po.poDate).slice(0, 10) : undefined,
            supplierName: po.supplierName,
            supplierAddress: po.supplierAddress,
            supplierCompany: po.supplierCompany,
            supplierPhone: po.supplierPhone,
            preparedBy: po.preparedBy,
            preparedByRole: po.preparedByRole,
            sourceOrderId: resolvedOrderId,
            sourceRequestId: resolvedRequestId,
            items: Array.isArray(po.items)
              ? po.items.map((i: any) => ({ description: i.description, qty: i.qty, unit: i.unit, unitPrice: i.unitPrice }))
              : undefined,
          }
        }
      } catch {}
    } else if (orderId) {
      try {
        const payload = await getPayloadClient()
        const o: any = await payload.findByID({ collection: 'orders', id: orderId })
        if (o) {
          if (!resolvedRequestId) {
            resolvedRequestId = extractId(o.sourceRequestId) || extractId(o.request)
            if (!resolvedRequestId && o.quotation) {
              const qId = extractId(o.quotation)
              if (qId) {
                try {
                  const q: any = await payload.findByID({ collection: 'client-quotations', id: qId })
                  resolvedRequestId = extractId(q?.sourceRequestId)
                } catch {}
              }
            }
          }

          initial = {
            preparedBy: o.salesPerson || '', 
            project: `Order ${o.orderNumber || orderId} -- for ${o.customerName || 'client'}`,
            sourceOrderId: String(orderId),
            sourceRequestId: resolvedRequestId,
            items: Array.isArray(o.items)
              ? o.items.map((item: any) => ({
                  description: item.description,
                  qty: item.qty,
                  unit: item.unit,
                  unitPrice: item.unitCost || 0,
                }))
              : undefined,
          }
        }
      } catch {}
    } else if (supplierId) {
      try {
        const payload = await getPayloadClient()
        const s: any = await payload.findByID({ collection: 'suppliers', id: supplierId })
        if (s) {
          initial = {
            supplierName: s.name,
            supplierAddress: s.address,
            supplierCompany: s.company,
            supplierPhone: s.phone,
          }
        }
      } catch {}
    } else if (from) {
      try {
        const payload = await getPayloadClient()
        const q: any = await payload.findByID({ collection: 'quotation-requests', id: from, depth: 2 })
        if (q) {
          initial = {
            project: q.projectType
              ? `${q.projectType.charAt(0).toUpperCase()}${q.projectType.slice(1)} project -- for ${q.customerName}`
              : `For ${q.customerName}`,
            items: Array.isArray(q.items)
              ? q.items.map((item: any) => ({
                  description: typeof item.material === 'object' ? item.material?.name || '' : String(item.material || ''),
                  qty: item.quantity || 1,
                  unit: typeof item.material === 'object' ? item.material?.unit || 'pcs' : 'pcs',
                  unitPrice: 0,
                }))
              : undefined,
          }
        }
      } catch {}
    }

    const mergedInitial: SupplierPOInitial = {
      ...initial,
      sourceOrderId: resolvedOrderId ? String(resolvedOrderId) : initial?.sourceOrderId,
      sourceRequestId: resolvedRequestId ? String(resolvedRequestId) : initial?.sourceRequestId,
    }

    return (
      <SupplierPOGenerator 
        initial={mergedInitial} 
        showSupplierPicker={showSupplierPicker} 
        showBackToList={Boolean(from || id || orderId || requestId)} 
        products={products} 
      />
    )
  }

  // ===== LIST MODE =====
  const activeStatus = STATUSES.includes(status as any) ? status : undefined

  // Build Where Clause dynamically based on URL filters
  const where: any = {}
  if (activeStatus) where.status = { equals: activeStatus }
  if (listOrder) where.sourceOrderId = { equals: listOrder }
  if (listSupplier) where.supplierName = { equals: listSupplier }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'supplier-purchase-orders',
    sort: '-createdAt',
    limit: 100,
    where: Object.keys(where).length > 0 ? where : undefined,
  })

  function buildHref(s?: string) {
    const params = new URLSearchParams()
    if (s) params.set('status', s)
    if (listOrder) params.set('listOrder', listOrder)
    if (listSupplier) params.set('listSupplier', listSupplier)
    
    return params.toString() ? `/admin-dashboard/supplier-po?${params.toString()}` : `/admin-dashboard/supplier-po`
  }

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8 antialiased">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[26px] md:text-[32px] font-semibold tracking-tight text-gray-900 leading-none mb-3">
            Supplier Purchase Orders
          </h1>
          <p className="text-[14px] text-gray-500 font-medium max-w-[560px]">
            {listOrder ? `Viewing purchase orders for Order #${listOrder}.` : listSupplier ? `Viewing purchase orders for supplier "${listSupplier}".` : 'All purchase orders saved from the generator. Update status inline, or open an entry to view, edit, or reprint it.'}
          </p>
          <Link
            href="/admin-dashboard/suppliers"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#149911] hover:text-[#103900] transition-colors mt-4"
          >
            View or Add Suppliers
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
        <Link
          href="/admin-dashboard/supplier-po?new=true"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[13px] font-medium shadow-sm flex-shrink-0 w-full sm:w-auto"
        >
          + Create New PO
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-8">
        <FilterLink label="All" active={!activeStatus} href={buildHref(undefined)} />
        {STATUSES.map((s) => (
          <FilterLink key={s} label={STATUS_LABELS[s]} active={activeStatus === s} href={buildHref(s)} />
        ))}
        {(listOrder || listSupplier) && (
           <Link href="/admin-dashboard/supplier-po" className="text-[12px] font-medium text-red-500 hover:text-red-700 ml-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors">
              Clear Filters &times;
           </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {docs.map((po: any) => {
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

        {docs.length === 0 && (
          <div className="border border-dashed border-gray-200 py-16 text-center rounded-3xl bg-gray-50/50">
            <p className="text-[14px] text-gray-400 font-medium">
              No purchase orders found{activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterLink({ label, active, href }: { label: string; active?: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200 ${
        active
          ? 'bg-[#1d1d1f] text-white shadow-sm'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )
}