import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'

export default async function SuppliersPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'suppliers',
    sort: 'name',
    limit: 200,
  })

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 8, color: '#0d0d0d' }}>Suppliers</h1>
      <p style={{ marginBottom: 24, color: '#0d0d0d', opacity: 0.65 }}>
        Your supplier directory. To add a new supplier or edit details, use the{' '}
        <Link href="/admin/collections/suppliers/create" style={{ color: '#1f5c34' }}>
          full CMS admin view
        </Link>
        .
      </p>

      {docs.length === 0 ? (
        <div className="facet-card" style={{ padding: 32, textAlign: 'center' }}>
          <p>No suppliers added yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {docs.map((s: any) => (
            <div key={s.id} className="facet-card" style={{ padding: 20, opacity: s.status === 'inactive' ? 0.5 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: 16, color: '#0d0d0d', marginBottom: 2 }}>{s.name}</h3>
                  {s.company && <p style={{ fontSize: 13, color: '#0d0d0d', opacity: 0.6, margin: 0 }}>{s.company}</p>}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: s.status === 'inactive' ? '#f0f0f0' : '#eaf5ee',
                    color: s.status === 'inactive' ? '#0d0d0d' : '#1f5c34',
                  }}
                >
                  {s.status}
                </span>
              </div>
              <p style={{ fontSize: 14, margin: '4px 0' }}>{s.phone}</p>
              {s.email && <p style={{ fontSize: 14, margin: '4px 0' }}>{s.email}</p>}
              {s.address && (
                <p style={{ fontSize: 13, color: '#0d0d0d', opacity: 0.6, marginTop: 8, whiteSpace: 'pre-line' }}>
                  {s.address}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
