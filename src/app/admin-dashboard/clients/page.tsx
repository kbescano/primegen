import { getPayloadClient } from '@/lib/getPayloadClient'
import AddClientForm from '@/components/AddClientForm'
import ClientCard from '@/components/ClientCard'

export default async function ClientsPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'clients',
    sort: 'name',
    limit: 200,
  })

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 8, color: '#0d0d0d' }}>Clients</h1>
      <p style={{ marginBottom: 20, color: '#0d0d0d', opacity: 0.65 }}>
        Your client directory.
      </p>
      <AddClientForm />

      {docs.length === 0 ? (
        <div className="facet-card" style={{ padding: 32, textAlign: 'center' }}>
          <p>No clients added yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {docs.map((c: any) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  )
}
