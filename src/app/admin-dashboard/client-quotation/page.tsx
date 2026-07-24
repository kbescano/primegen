import Link from 'next/link'
import QuotationGenerator, { type QuotationInitial } from '@/components/QuotationGenerator'
import CollectionStatusSelect from '@/components/CollectionStatusSelect'
import { getPayloadClient } from '@/lib/getPayloadClient'

const STATUSES = ['draft', 'sent', 'accepted', 'expired'] as const
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'expired', label: 'Expired' },
]
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  expired: 'Expired',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-[#149911]/10 text-[#3D5F3B]',
  accepted: 'bg-[#149911] text-white',
  expired: 'bg-red-50 text-red-600',
}

const peso = (n: number) =>
  n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })

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
      ? q.items.map((i: any) => ({ qty: i.qty, unit: i.unit, description: i.description, unitPrice: i.unitPrice }))
      : undefined,
  }
}

export default async function ClientQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; id?: string; new?: string; status?: string }>
}) {
  const { from, id, new: isNew, status } = await searchParams

  // ===== GENERATOR MODE: creating new, prefilling from a request, or editing an existing one =====
  if (id || from || isNew) {
    let initial: QuotationInitial | undefined

    if (id) {
      try {
        const payload = await getPayloadClient()
        const q: any = await payload.findByID({ collection: 'client-quotations', id })
        if (q) initial = mapDocToInitial(q)
      } catch {
        // fall through to a blank form
      }
    } else if (from) {
      try {
        const payload = await getPayloadClient()

        // Duplicate-proofing: if a client-quotation already exists for this request,
        // edit that one instead of creating a second one -- even if the link that got us
        // here is stale (e.g. an old tab, a double-click, a cached page).
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
                ? reqDoc.items.map((item: any) => ({
                    qty: item.quantity || 1,
                    unit: typeof item.material === 'object' ? item.material?.unit || 'pcs' : 'pcs',
                    description: typeof item.material === 'object' ? item.material?.name || '' : String(item.material || ''),
                    unitPrice: 0,
                  }))
                : undefined,
            }
          }
        }
      } catch {
        // fall through to a blank form
      }
    }
    // isNew with no id/from -> initial stays undefined -> blank form

    const showClientPicker = Boolean((from || isNew) && !id)
    return (
      <QuotationGenerator
        initial={initial}
        showBackToList={Boolean(from)}
        showClientPicker={showClientPicker}
      />
    )
  }

  // ===== LIST MODE (default -- merged Manage Quotations view) =====
  const activeStatus = STATUSES.includes(status as any) ? status : undefined

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'client-quotations',
    sort: '-createdAt',
    limit: 100,
    where: activeStatus ? { status: { equals: activeStatus } } : undefined,
  })

  function buildHref(s?: string) {
    return s ? `/admin-dashboard/client-quotation?status=${s}` : '/admin-dashboard/client-quotation'
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="w-10 h-[3px] bg-[#149911] mb-5" />
          <h1 className="text-[26px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] leading-none mb-3">
            Client Quotations
          </h1>
          <p className="text-[14px] text-[#01172f]/50 font-medium max-w-[560px]">
            All quotations saved from the generator. Update status inline, or open an entry to view,
            edit, or reprint it.
          </p>
          <Link
            href="/admin-dashboard/clients"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[#103900] hover:text-[#149911] transition-colors mt-3"
          >
            View or Add Clients
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
        <Link
          href="/admin-dashboard/client-quotation?new=true"
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-3 bg-[#3D5F3B] text-white hover:bg-[#01172f] transition-colors duration-300 w-fit flex-shrink-0"
        >
          + Create New Quotation
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap mb-10">
        <FilterLink label="All" active={!activeStatus} href={buildHref(undefined)} />
        {STATUSES.map((s) => (
          <FilterLink key={s} label={STATUS_LABELS[s]} active={activeStatus === s} href={buildHref(s)} />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {docs.map((q: any) => {
          const subtotal = (q.items || []).reduce((sum: number, i: any) => sum + i.qty * i.unitPrice, 0)
          const vat = subtotal * ((q.vatRate || 0) / 100)
          const total = subtotal + vat

          return (
            <div
              key={q.id}
              className="bg-white border border-[#01172f]/10 p-5 md:p-6 transition-all duration-300 hover:border-[#149911]/40 hover:shadow-[0_16px_40px_-16px_rgba(1,23,47,0.15)]"
            >
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] font-mono text-[#01172f]/40 mb-1">{q.quotationNumber}</p>
                  <h3 className="text-[16px] font-bold text-[#01172f]">{q.customerName || 'Untitled'}</h3>
                  <p className="text-[13px] text-[#01172f]/50 font-medium">{q.company}</p>
                  {q.salesPerson && (
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#149911] mt-1">
                      {q.salesPerson}
                    </p>
                  )}
                </div>
                <CollectionStatusSelect
                  collection="client-quotations"
                  id={q.id}
                  status={q.status}
                  options={STATUS_OPTIONS}
                  colorClassMap={STATUS_COLORS}
                />
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#01172f]/10">
                <p className="text-[12px] text-[#01172f]/40 font-medium">
                  {q.quotationDate
                    ? new Date(q.quotationDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </p>
                <div className="flex items-center gap-5">
                  <p className="text-[15px] font-bold text-[#01172f] font-mono">{peso(total)}</p>
                  <Link
                    href={`/admin-dashboard/client-quotation?id=${q.id}`}
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3D5F3B] hover:text-[#149911] transition-colors"
                  >
                    View / Edit &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )
        })}

        {docs.length === 0 && (
          <div className="border border-dashed border-[#01172f]/15 py-16 text-center">
            <p className="text-[14px] text-[#01172f]/40 font-medium">
              No quotations{activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''} yet.
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
      className={`text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 border transition-all duration-200 ${
        active
          ? 'bg-[#01172f] border-[#01172f] text-white'
          : 'bg-white border-[#01172f]/15 text-[#01172f]/60 hover:border-[#01172f]/40 hover:text-[#01172f]'
      }`}
    >
      {label}
    </Link>
  )
}
