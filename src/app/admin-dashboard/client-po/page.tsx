import POGenerator from '@/components/POGenerator'

export default function ClientPOPage() {
  return (
    <POGenerator
      title="Client Purchase Order"
      partyLabel="Client"
      apiPath="/api/client-purchase-orders"
      partyFieldPrefix="client"
      numberPlaceholder="Auto-generated on save (CPO-YYYY-####)"
    />
  )
}
