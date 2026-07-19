import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import StatusSelect from '@/components/StatusSelect'

const STATUSES = ['pending', 'processing', 'quote-sent', 'completed'] as const
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  'quote-sent': 'Quote Sent',
  completed: 'Completed',
}

const PERIODS = ['today', 'week', 'month', 'year'] as const
const PERIOD_LABELS: Record<string, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'All time',
}

function getPeriodStart(period?: string): Date | undefined {
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'week') {
    const day = now.getDay() // 0 = Sun ... 6 = Sat
    const diffToMonday = day === 0 ? -6 : 1 - day
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (period === 'year') {
    return new Date(now.getFullYear(), 0, 1)
  }
  return undefined
}

export default async function QuotationInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string }>
}) {
  const { status, period } = await searchParams
  const activeStatus = STATUSES.includes(status as any) ? status : undefined
  const activePeriod = PERIODS.includes(period as any) ? period : undefined

  function buildHref(overrides: { status?: string; period?: string }) {
    const params = new URLSearchParams()
    const s = 'status' in overrides ? overrides.status : activeStatus
    const p = 'period' in overrides ? overrides.period : activePeriod
    if (s) params.set('status', s)
    if (p) params.set('period', p)
    const qs = params.toString()
    return qs ? `/admin-dashboard?${qs}` : '/admin-dashboard'
  }

  const payload = await getPayloadClient()

  const periodStart = getPeriodStart(activePeriod)
  const conditions: any[] = []
  if (activeStatus) conditions.push({ status: { equals: activeStatus } })
  if (periodStart) conditions.push({ createdAt: { greater_than_equal: periodStart.toISOString() } })

  const { docs } = await payload.find({
    collection: 'quotation-requests',
    sort: '-createdAt',
    limit: 100,
    where: conditions.length > 0 ? { and: conditions } : undefined,
    depth: 2,
  })

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 8, color: '#0d0d0d' }}>Quotation Requests</h1>
      <p style={{ marginBottom: 20, color: '#0d0d0d', opacity: 0.65 }}>
        Requests submitted from the website. Follow up by phone or email, then update status --
        quotes are always sent by your team directly, never automatically.
      </p>

      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d0d0d', opacity: 0.4, marginBottom: 8 }}>
        Status
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <FilterLink label="All" active={!activeStatus} href={buildHref({ status: undefined })} />
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={STATUS_LABELS[s]}
            active={activeStatus === s}
            href={buildHref({ status: s })}
          />
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d0d0d', opacity: 0.4, marginBottom: 8 }}>
        Date Range
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <FilterLink label="All Time" active={!activePeriod} href={buildHref({ period: undefined })} />
        {PERIODS.map((p) => (
          <FilterLink
            key={p}
            label={PERIOD_LABELS[p]}
            active={activePeriod === p}
            href={buildHref({ period: p })}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {docs.map((q: any) => (
          <div key={q.id} className="facet-card" style={{ padding: 20, background: 'white', border: '1px solid #e5e5e5', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: 16, color: '#0d0d0d' }}>{q.customerName}</h3>
                <p style={{ fontSize: 14, color: '#0d0d0d', opacity: 0.7 }}>
                  {q.phone} {q.email ? `| ${q.email}` : ''}
                </p>
              </div>
              <StatusSelect id={q.id} status={q.status} />
            </div>

            {Array.isArray(q.items) && q.items.length > 0 && (
              <div style={{ marginTop: 14, borderTop: '1px solid #e5f0e8', paddingTop: 12 }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#0d0d0d', opacity: 0.6, textAlign: 'left' }}>
                      <th style={{ padding: '4px 8px 4px 0' }}>Material</th>
                      <th style={{ padding: '4px 8px' }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.items.map((item: any, i: number) => {
                      const material = item.material
                      return (
                        <tr key={i}>
                          <td style={{ padding: '4px 8px 4px 0' }}>
                            {typeof material === 'object' ? material?.name : material}
                          </td>
                          <td style={{ padding: '4px 8px' }}>
                            {item.quantity} {typeof material === 'object' ? material?.unit : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {q.message && <p style={{ marginTop: 12, fontSize: 14 }}>{q.message}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <Link
                href={`/admin-dashboard/client-quotation?from=${q.id}`}
                style={{ fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 6, textDecoration: 'none', background: '#103900', color: 'white' }}
              >
                Create Client Quotation
              </Link>
              <Link
                href={`/admin-dashboard/supplier-po?from=${q.id}`}
                style={{ fontSize: 13, fontWeight: 600, padding: '7px 14px', borderRadius: 6, textDecoration: 'none', border: '1.5px solid #103900', color: '#103900' }}
              >
                Create Supplier PO
              </Link>
            </div>

            <p style={{ marginTop: 12, fontSize: 12, color: '#0d0d0d', opacity: 0.4 }}>
              Submitted {new Date(q.createdAt).toLocaleString()} via {q.source}
            </p>
          </div>
        ))}
        {docs.length === 0 && (
          <p>
            No quotation requests
            {activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''}
            {activePeriod ? ` ${PERIOD_LABELS[activePeriod].toLowerCase()}` : ''}.
          </p>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: '#0d0d0d', opacity: 0.5 }}>
        For internal notes or bulk edits, use the{' '}
        <Link href="/admin/collections/quotation-requests" style={{ color: '#1f5c34' }}>
          full CMS admin view
        </Link>
        .
      </p>
    </div>
  )
}

function FilterLink({ label, active, href }: { label: string; active?: boolean; href: string }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 13,
        fontWeight: 600,
        padding: '6px 14px',
        borderRadius: 20,
        textDecoration: 'none',
        background: active ? '#0d0d0d' : 'white',
        color: active ? 'white' : '#0d0d0d',
        border: '1.5px solid #b7d8c2',
      }}
    >
      {label}
    </Link>
  )
}
