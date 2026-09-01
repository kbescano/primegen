import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import QuotationGenerator, { type QuotationInitial } from '@/components/QuotationGenerator'
import ClientQuotationsListClient from '@/components/ClientQuotationsListClient'
import { getPayloadClient } from '@/lib/getPayloadClient'

// Belt-and-suspenders alongside this page's own headers() call below --
// same explicit marker as deliveries/inquiry-tracker/reports/sales-report,
// so the list and the editor (both server-rendered here, driven by ?id=)
// always re-read items fresh instead of risking a cached pre-edit render.
export const dynamic = 'force-dynamic'

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
          sizeDescription: i.sizeDescription,
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
  const { from, id, new: isNew, pipelineId } = await searchParams

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
                      sizeDescription: item.sizeDescription || '',
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
  // Fetches the whole (capped) batch once -- Status + Search both filter
  // this client-side now (see ClientQuotationsListClient), same pattern as
  // the Quotation Inbox, instead of a server round trip per status click.
  const { docs } = await payload.find({
    collection: 'client-quotations',
    sort: '-createdAt',
    limit: 100,
  })

  // Data Mapping for Orders
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

      <ClientQuotationsListClient quotations={docs} orderIdByQuotationId={orderIdByQuotationId} />
    </div>
  )
}