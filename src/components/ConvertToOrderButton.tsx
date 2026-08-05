'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ConvertToOrderButton({
  quotation,
  existingOrderId,
}: {
  quotation: any
  existingOrderId?: string
}) {
  const router = useRouter()
  const [converting, setConverting] = useState(false)

  if (existingOrderId) {
    return (
      <Link
        href={`/admin-dashboard/orders?id=${existingOrderId}`}
        className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-700 hover:text-blue-900 transition-colors"
      >
        View Order &rarr;
      </Link>
    )
  }

  async function handleConvert() {
    setConverting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sourceQuotationId: String(quotation.id),
          customerName: quotation.customerName,
          company: quotation.company,
          address: quotation.address,
          contactNumber: quotation.contactNumber,
          salesPerson: quotation.salesPerson,
          items: (quotation.items || []).map((i: any) => ({
            description: i.description,
            qty: i.qty,
            unit: i.unit,
            unitPrice: i.unitPrice,
            unitCost: i.unitCost || 0,
          })),
          vatRate: quotation.vatRate,
          discountAmount: quotation.discountAmount,
          deliveryFee: quotation.deliveryFee,
          fulfillmentStatus: 'preparing',
          paymentStatus: 'unpaid',
        }),
      })
      if (!res.ok) throw new Error('Failed to create order')
      router.refresh()
    } catch {
      alert('Failed to convert to order -- please try again.')
    } finally {
      setConverting(false)
    }
  }

  return (
    <button
      onClick={handleConvert}
      disabled={converting}
      className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-700 hover:text-blue-900 transition-colors disabled:opacity-50"
    >
      {converting ? 'Converting...' : 'Convert to Order \u2192'}
    </button>
  )
}
