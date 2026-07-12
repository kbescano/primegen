import POGenerator from '@/components/POGenerator'

export default function SupplierPOPage() {
  return (
    <POGenerator
      title="Supplier Purchase Order"
      partyLabel="Supplier"
      apiPath="/api/supplier-purchase-orders"
      partyFieldPrefix="supplier"
      numberPlaceholder="Auto-generated on save (SPO-YYYY-####)"
    />
  )
}
