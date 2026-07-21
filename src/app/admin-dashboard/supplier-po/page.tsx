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
  issued: 'bg-[#149911]/10 text-[#3D5F3B]',
  fulfilled: 'bg-[#149911] text-white',
  cancelled: 'bg-red-50 text-red-600',
}

const peso = (n: number) =>
  n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })

export default async function SupplierPOPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; id?: string; new?: string; status?: string }>
}) {
  const { from, id, new: isNew, status } = await searchParams

  // ===== GENERATOR MODE =====
  if (id || from || isNew) {
    let initial: SupplierPOInitial | undefined

    if (id) {
      try {
        const payload = await getPayloadClient()
        const po: any = await payload.findByID({ collection: 'supplier-purchase-orders', id })
        if (po) {
          initial = {
            id: po.id,
            poNumber: po.poNumber,
            poDate: po.poDate ? String(po.poDate).slice(0, 10) : undefined,
            supplierName: po.supplierName,
            supplierAddress: po.supplierAddress,
            preparedBy: po.preparedBy,
            preparedByRole: po.preparedByRole,
            items: Array.isArray(po.items)
              ? po.items.map((i: any) => ({ description: i.description, qty: i.qty, unit: i.unit, unitPrice: i.unitPrice }))
              : undefined,
          }
        }
      } catch {
        // fall through to a blank form
      }
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
      } catch {
        // fall through to a blank form
      }
    }

    return <SupplierPOGenerator initial={initial} />
  }

  // ===== LIST MODE (default -- merged Manage POs view) =====
  const activeStatus = STATUSES.includes(status as any) ? status : undefined

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'supplier-purchase-orders',
    sort: '-createdAt',
    limit: 100,
    where: activeStatus ? { status: { equals: activeStatus } } : undefined,
  })

  function buildHref(s?: string) {
    return s ? `/admin-dashboard/supplier-po?status=${s}` : '/admin-dashboard/supplier-po'
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="w-10 h-[3px] bg-[#149911] mb-5" />
          <h1 className="text-[26px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] leading-none mb-3">
            Supplier Purchase Orders
          </h1>
          <p className="text-[14px] text-[#01172f]/50 font-medium max-w-[560px]">
            All purchase orders saved from the generator. Update status inline, or open an entry to
            view, edit, or reprint it.
          </p>
        </div>
        <Link
          href="/admin-dashboard/supplier-po?new=true"
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-3 bg-[#3D5F3B] text-white hover:bg-[#01172f] transition-colors duration-300 w-fit flex-shrink-0"
        >
          + Create New PO
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap mb-10">
        <FilterLink label="All" active={!activeStatus} href={buildHref(undefined)} />
        {STATUSES.map((s) => (
          <FilterLink key={s} label={STATUS_LABELS[s]} active={activeStatus === s} href={buildHref(s)} />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {docs.map((po: any) => {
          const total = (po.items || []).reduce((sum: number, i: any) => sum + i.qty * i.unitPrice, 0)

          return (
            <div
              key={po.id}
              className="bg-white border border-[#01172f]/10 p-5 md:p-6 transition-all duration-300 hover:border-[#149911]/40 hover:shadow-[0_16px_40px_-16px_rgba(1,23,47,0.15)]"
            >
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] font-mono text-[#01172f]/40 mb-1">{po.poNumber}</p>
                  <h3 className="text-[16px] font-bold text-[#01172f]">{po.supplierName || 'Untitled'}</h3>
                </div>
                <CollectionStatusSelect
                  collection="supplier-purchase-orders"
                  id={po.id}
                  status={po.status}
                  options={STATUS_OPTIONS}
                  colorClassMap={STATUS_COLORS}
                />
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#01172f]/10">
                <p className="text-[12px] text-[#01172f]/40 font-medium">
                  {po.poDate
                    ? new Date(po.poDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </p>
                <div className="flex items-center gap-5">
                  <p className="text-[15px] font-bold text-[#01172f] font-mono">{peso(total)}</p>
                  <Link
                    href={`/admin-dashboard/supplier-po?id=${po.id}`}
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
              No purchase orders{activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''} yet.
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
