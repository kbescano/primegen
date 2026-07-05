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

export default async function QuotationInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeFilter = STATUSES.includes(status as any) ? status : undefined

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'quotation-requests',
    sort: '-createdAt',
    limit: 100,
    where: activeFilter ? { status: { equals: activeFilter } } : undefined,
    depth: 2,
  })

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 8, color: '#0d0d0d' }}>Quotation Requests</h1>
      <p style={{ marginBottom: 20, color: '#0d0d0d', opacity: 0.65 }}>
        Requests submitted from the website. Follow up by phone or email, then update status --
        quotes are always sent by your team directly, never automatically.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <FilterLink label="All" active={!activeFilter} href="/admin-dashboard" />
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={STATUS_LABELS[s]}
            active={activeFilter === s}
            href={`/admin-dashboard?status=${s}`}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {docs.map((q: any) => (
          <div key={q.id} className="facet-card" style={{ padding: 20 }}>
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
                      <th style={{ padding: '4px 8px' }}>Unit Price</th>
                      <th style={{ padding: '4px 8px' }}>Est. Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.items.map((item: any, i: number) => {
                      const material = item.material
                      const price = typeof material === 'object' ? material?.price : undefined
                      const total = price ? price * item.quantity : undefined
                      return (
                        <tr key={i}>
                          <td style={{ padding: '4px 8px 4px 0' }}>
                            {typeof material === 'object' ? material?.name : material}
                          </td>
                          <td style={{ padding: '4px 8px' }}>
                            {item.quantity} {typeof material === 'object' ? material?.unit : ''}
                          </td>
                          <td style={{ padding: '4px 8px' }} className="price">
                            {price ? `Php ${Number(price).toLocaleString()}` : '-'}
                          </td>
                          <td style={{ padding: '4px 8px' }} className="price">
                            {total ? `Php ${Number(total).toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {q.message && <p style={{ marginTop: 12, fontSize: 14 }}>{q.message}</p>}
            <p style={{ marginTop: 12, fontSize: 12, color: '#0d0d0d', opacity: 0.4 }}>
              Submitted {new Date(q.createdAt).toLocaleString()} via {q.source}
            </p>
          </div>
        ))}
        {docs.length === 0 && <p>No quotation requests {activeFilter ? `with status "${STATUS_LABELS[activeFilter]}"` : ''}.</p>}
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
