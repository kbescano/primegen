import { getPayloadClient } from '@/lib/getPayloadClient'
import MonthSelect from '@/components/MonthSelect'

const peso = (n: number) =>
  n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })

function getMonthRange(month: string): { start?: Date; end?: Date; label: string } {
  if (month === 'all' || !month) return { label: 'All Time' }
  const [y, m] = month.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)
  const label = start.toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
  return { start, end, label }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month = 'all' } = await searchParams
  const { start, end, label } = getMonthRange(month)

  const payload = await getPayloadClient()

  const dateWhere =
    start && end
      ? { and: [{ createdAt: { greater_than_equal: start.toISOString() } }, { createdAt: { less_than: end.toISOString() } }] }
      : undefined

  const [requestsRes, quotationsRes] = await Promise.all([
    payload.find({ collection: 'quotation-requests', where: dateWhere, limit: 1000, depth: 2 }),
    payload.find({ collection: 'client-quotations', where: dateWhere, limit: 1000 }),
  ])

  const requests = requestsRes.docs as any[]
  const quotations = quotationsRes.docs as any[]

  // --- 1. Conversion Funnel ---
  const requestCount = requests.length
  const quotationCount = quotations.length
  const acceptedCount = quotations.filter((q) => q.status === 'accepted').length
  const requestToQuotationRate = requestCount > 0 ? Math.round((quotationCount / requestCount) * 100) : 0
  const quotationToAcceptedRate = quotationCount > 0 ? Math.round((acceptedCount / quotationCount) * 100) : 0

  // --- 2. Most Requested Materials ---
  const materialTally: Record<string, { name: string; requests: number; totalQty: number }> = {}
  for (const r of requests) {
    for (const item of r.items || []) {
      const mat = item.material
      const name = typeof mat === 'object' ? mat?.name : String(mat)
      const key = typeof mat === 'object' ? String(mat?.id) : String(mat)
      if (!key || !name) continue
      if (!materialTally[key]) materialTally[key] = { name, requests: 0, totalQty: 0 }
      materialTally[key].requests += 1
      materialTally[key].totalQty += item.quantity || 0
    }
  }
  const topMaterials = Object.values(materialTally)
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8)

  // --- 3. Revenue Pipeline ---
  function quotationTotal(q: any) {
    const subtotal = (q.items || []).reduce((sum: number, i: any) => sum + i.qty * i.unitPrice, 0)
    const vat = subtotal * ((q.vatRate || 0) / 100)
    return subtotal + vat
  }

  const pipelineByStatus: Record<string, { count: number; value: number }> = {
    draft: { count: 0, value: 0 },
    sent: { count: 0, value: 0 },
    accepted: { count: 0, value: 0 },
    expired: { count: 0, value: 0 },
  }
  const bySalesPerson: Record<string, { count: number; value: number }> = {}

  for (const q of quotations) {
    const total = quotationTotal(q)
    const status = q.status || 'draft'
    if (!pipelineByStatus[status]) pipelineByStatus[status] = { count: 0, value: 0 }
    pipelineByStatus[status].count += 1
    pipelineByStatus[status].value += total

    const sp = q.salesPerson?.trim() || 'Unassigned'
    if (!bySalesPerson[sp]) bySalesPerson[sp] = { count: 0, value: 0 }
    bySalesPerson[sp].count += 1
    bySalesPerson[sp].value += total
  }

  const totalPipelineValue = Object.values(pipelineByStatus).reduce((s, v) => s + v.value, 0)
  const salesPersonRows = Object.entries(bySalesPerson).sort((a, b) => b[1].value - a[1].value)

  const STATUS_LABELS: Record<string, string> = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', expired: 'Expired' }
  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-[#149911]/10 text-[#3D5F3B]',
    accepted: 'bg-[#149911] text-white',
    expired: 'bg-red-50 text-red-600',
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="w-10 h-[3px] bg-[#149911] mb-5" />
          <h1 className="text-[26px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] leading-none mb-3">
            Reports
          </h1>
          <p className="text-[14px] text-[#01172f]/50 font-medium max-w-[560px]">
            Showing data for <span className="font-bold text-[#01172f]">{label}</span>.
          </p>
        </div>
        <MonthSelect current={month} />
      </div>

      {/* ===== 1. Conversion Funnel ===== */}
      <div className="bg-white border border-[#01172f]/10 p-6 md:p-8 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-6">
          Quotation Conversion Funnel
        </p>
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          <FunnelStep label="Requests Received" value={requestCount} />
          <FunnelStep label="Quotations Sent" value={quotationCount} sublabel={`${requestToQuotationRate}% of requests`} />
          <FunnelStep label="Accepted" value={acceptedCount} sublabel={`${quotationToAcceptedRate}% of quotations`} highlight />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* ===== 2. Most Requested Materials ===== */}
        <div className="bg-white border border-[#01172f]/10 p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-6">
            Most Requested Materials
          </p>
          {topMaterials.length === 0 ? (
            <p className="text-[13px] text-[#01172f]/40 font-medium">No requests in this period.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topMaterials.map((m, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-[#01172f]/30 w-4 flex-shrink-0">{i + 1}</span>
                    <span className="text-[14px] font-medium text-[#01172f] truncate">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[12px] text-[#01172f]/40 font-mono">{m.totalQty} units</span>
                    <span className="text-[11px] font-bold bg-[#f4f6f2] text-[#3D5F3B] px-2.5 py-1">
                      {m.requests}&times;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== 3a. Revenue Pipeline by Status ===== */}
        <div className="bg-white border border-[#01172f]/10 p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-6">
            Revenue Pipeline by Status
          </p>
          <div className="flex flex-col gap-3 mb-4">
            {Object.entries(pipelineByStatus).map(([status, data]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[#01172f]/40 font-mono">{data.count} qty</span>
                  <span className="text-[14px] font-bold text-[#01172f] font-mono">{peso(data.value)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#01172f]/10 pt-3 flex justify-between items-center">
            <span className="text-[12px] font-bold uppercase tracking-wide text-[#01172f]">Total Pipeline</span>
            <span className="text-[16px] font-black text-[#01172f] font-mono">{peso(totalPipelineValue)}</span>
          </div>
        </div>
      </div>

      {/* ===== 3b. Revenue by Sales Person ===== */}
      <div className="bg-white border border-[#01172f]/10 p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-6">
          Revenue by Sales Person
        </p>
        {salesPersonRows.length === 0 ? (
          <p className="text-[13px] text-[#01172f]/40 font-medium">No quotations in this period.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {salesPersonRows.map(([name, data]) => (
              <div key={name} className="flex items-center justify-between">
                <span className={`text-[14px] font-bold ${name === 'Unassigned' ? 'text-[#01172f]/40 italic' : 'text-[#01172f]'}`}>
                  {name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[#01172f]/40 font-mono">{data.count} quotations</span>
                  <span className="text-[14px] font-bold text-[#01172f] font-mono">{peso(data.value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FunnelStep({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string
  value: number
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <div className={`p-5 text-center ${highlight ? 'bg-[#3D5F3B] text-white' : 'bg-[#f4f6f2] text-[#01172f]'}`}>
      <p className={`text-[32px] md:text-[40px] font-black leading-none mb-2 ${highlight ? 'text-white' : 'text-[#01172f]'}`}>
        {value}
      </p>
      <p className={`text-[11px] font-bold uppercase tracking-wide ${highlight ? 'text-white/70' : 'text-[#01172f]/50'}`}>
        {label}
      </p>
      {sublabel && (
        <p className={`text-[10px] font-medium mt-1 ${highlight ? 'text-white/50' : 'text-[#01172f]/35'}`}>
          {sublabel}
        </p>
      )}
    </div>
  )
}
