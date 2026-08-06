import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import QuotationGenerator, { type QuotationInitial } from '@/components/QuotationGenerator'
import CollectionStatusSelect from '@/components/CollectionStatusSelect'
import { getPayloadClient } from '@/lib/getPayloadClient'

const STATUSES = ['draft', 'pending_approval', 'quotation_approved', 'order_confirmed', 'cancelled'] as const
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'quotation_approved', label: 'Quotation Approved' },
  { value: 'order_confirmed', label: 'Order Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  quotation_approved: 'Quotation Approved',
  order_confirmed: 'Order Confirmed',
  cancelled: 'Cancelled',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-amber-50 text-amber-700',
  quotation_approved: 'bg-[#149911]/10 text-[#149911]',
  order_confirmed: 'bg-[#149911]/10 text-[#149911]',
  cancelled: 'bg-red-50 text-red-600',
}

const peso = (n: number) =>
  '\u20B1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function mapDocToInitial(q: any): QuotationInitial {
  return {
    id: q.id,
    quotationNumber: q.quotationNumber,
    quotationDate: q.quotationDate ? String(q.quotationDate).slice(0, 10) : undefined,
    customerName: q.customerName,
    company: q.company,
    address: q.address,
    contactNumber: q.contactNumber,
    salesPerson: q.salesPerson,
    vatRate: q.vatRate,
    discountAmount: q.discountAmount,
    deliveryFee: q.deliveryFee,
    sourceRequestId: q.sourceRequestId,
    items: Array.isArray(q.items)
      ? q.items.map((i: any) => ({ 
          qty: i.qty, 
          unit: i.unit, 
          unitCost: i.unitCost, 
          marginAmount: i.marginAmount,   
          description: i.description, 
          unitPrice: i.unitPrice 
        }))
      : undefined,
  }
}

export default async function ClientQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; id?: string; new?: string; status?: string; pipelineId?: string }>
}) {
  const { from, id, new: isNew, status, pipelineId } = await searchParams

  const payload = await getPayloadClient()

  // =========================================================================
  // 🔒 STRICT ROLE-BASED ACCESS CONTROL (SERVER-SIDE)
  // =========================================================================
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  // If the user is NOT an admin ('user' role or undefined)
  if (user?.role !== 'admin') {
    // 1. Block access to the main list (no ID and no pipeline 'from' request)
    if (!id && !from) {
      redirect('/admin-dashboard')
    }
    // 2. Block access to a specific quotation if they don't have pipeline context
    if (id && !pipelineId) {
      redirect('/admin-dashboard')
    }
  }
  // =========================================================================

  // ===== GENERATOR / DOCUMENT VIEW MODE =====
  if (id || from || isNew) {
    let initial: QuotationInitial | undefined
    const productsRes = await payload.find({
      collection: 'products',
      limit: 500,
      sort: 'name',
      depth: 0,
    })
    const products = (productsRes.docs as any[]).map((p) => ({ id: p.id, name: p.name, unit: p.unit }))

    if (id) {
      try {
        const q: any = await payload.findByID({ collection: 'client-quotations', id })
        if (q) initial = mapDocToInitial(q)
      } catch {
        // fall through
      }
    } else if (from) {
      try {
        const existingForRequest = await payload.find({
          collection: 'client-quotations',
          where: { sourceRequestId: { equals: from } },
          limit: 1,
        })

        if (existingForRequest.docs.length > 0) {
          initial = mapDocToInitial(existingForRequest.docs[0])
        } else {
          const reqDoc: any = await payload.findByID({ collection: 'quotation-requests', id: from, depth: 2 })
          if (reqDoc) {
            initial = {
              sourceRequestId: from,
              customerName: reqDoc.customerName || '',
              contactNumber: reqDoc.phone || '',
              items: Array.isArray(reqDoc.items)
                ? reqDoc.items.map((item: any) => {
                    const mat = item.material
                    const isPopulated = mat && typeof mat === 'object'
                    return {
                      qty: item.quantity || 1,
                      unit: isPopulated ? mat.unit || 'pcs' : 'pcs',
                      description: isPopulated ? mat.name || '(product no longer exists)' : String(mat || ''),
                      unitPrice: 0,
                    }
                  })
                : undefined,
            }
          }
        }
      } catch {
        // fall through
      }
    }

    const showClientPicker = Boolean((from || isNew) && !id)
    return (
      <QuotationGenerator
        initial={initial}
        showBackToList={Boolean(from || id)}
        showClientPicker={showClientPicker}
        products={products}
      />
    )
  }

  // ===== LIST MODE (ADMIN ONLY) =====
  const activeStatus = STATUSES.includes(status as any) ? status : undefined

  const { docs } = await payload.find({
    collection: 'client-quotations',
    sort: '-createdAt',
    limit: 100,
    where: activeStatus ? { status: { equals: activeStatus } } : undefined,
  })

  const quotationIds = docs.map((d: any) => String(d.id))
  const ordersRes = quotationIds.length > 0
    ? await payload.find({
        collection: 'orders',
        where: { sourceQuotationId: { in: quotationIds } },
        limit: 200,
      })
    : { docs: [] as any[] }
  const orderIdByQuotationId: Record<string, string> = {}
  for (const o of ordersRes.docs as any[]) {
    if (o.sourceQuotationId) orderIdByQuotationId[o.sourceQuotationId] = o.id
  }

  function buildHref(s?: string) {
    return s ? `/admin-dashboard/client-quotation?status=${s}` : '/admin-dashboard/client-quotation'
  }

  const filterPills = [
    { value: '', label: 'All' },
    ...STATUS_OPTIONS,
  ]

  return (
    <div className="max-w-[1000px] mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-1">
            Client Quotations
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Manage saved client quotations, update statuses inline, or open an entry to review and print.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin-dashboard/clients"
            className="text-[10px] font-bold uppercase tracking-wider text-[#103900] hover:text-[#149911] transition-colors"
          >
            &larr; View Clients
          </Link>
          <Link
            href="/admin-dashboard/client-quotation?new=true"
            className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 bg-[#01172f] text-white rounded hover:bg-[#149911] transition-colors"
          >
            + Create New
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {filterPills.map((pill) => {
          const isActive = (activeStatus || '') === pill.value
          const href = buildHref(pill.value || undefined)
          return (
            <Link
              key={pill.value || 'all'}
              href={href}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all ${
                isActive
                  ? 'bg-[#01172f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </Link>
          )
        })}
      </div>

      {docs.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-12 text-center rounded">
          <p className="text-xs text-gray-400 font-medium">
            No quotations{activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''} found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {docs.map((q: any) => {
            const supplierCostTotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.unitCost || 0), 0)
            const markupTotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.marginAmount || 0), 0)
            const subtotal = (q.items || []).reduce((sum: number, i: any) => sum + (i.qty || 0) * (i.unitPrice || 0), 0)
            const discount = Number(q.discountAmount) || 0
            const delivery = Number(q.deliveryFee) || 0
            const netRev = subtotal - discount + delivery
            const vat = netRev * ((q.vatRate || 0) / 100)
            const total = netRev + vat
            
            const existingOrderId = orderIdByQuotationId[String(q.id)]
            const availableOptions = STATUS_OPTIONS

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
                className="bg-white border border-gray-200 rounded p-5 transition-all hover:border-gray-300"
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
                      options={availableOptions}
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
                    <div className="flex flex-col gap-2.5">
                      {(q.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex items-start justify-between gap-3 text-[11px] text-gray-700">
                          <p className="leading-snug truncate">
                            <span className="font-mono text-gray-400 font-bold inline-block min-w-[35px] pr-2">
                              {item.qty} {item.unit || 'pcs'}
                            </span>
                            {item.description || 'Unnamed item'}
                          </p>
                          <p className="font-mono font-bold text-[#01172f] flex-shrink-0">
                            {peso((item.qty || 0) * (item.unitPrice || 0))}
                          </p>
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
          })
        }
      </div>
    )}
  </div>
)
}