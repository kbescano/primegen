'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LinkedPO = {
  id: string | number
  poNumber: string
  supplierName?: string
  items?: { description: string; qty: number; unit: string; unitPrice: number }[]
}

export default function MergeSuppliersModal({
  orderId,
  orderItems,
  linkedPOs,
  onClose,
}: {
  orderId: string | number
  orderItems: { assignedPOId?: string }[]
  linkedPOs: LinkedPO[]
  onClose: () => void
}) {
  const router = useRouter()
  const [keeperId, setKeeperId] = useState<string | number | null>(null)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState('')

  async function handleMerge() {
    if (!keeperId) return
    setMerging(true)
    setError('')
    try {
      const keeper = linkedPOs.find((po) => String(po.id) === String(keeperId))
      if (!keeper) throw new Error('Keeper PO not found')

      const mergedItems = linkedPOs.flatMap((po) =>
        (po.items || []).map((item: any) => {
          const { id, ...rest } = item
          return rest
        })
      )

      console.log('DEBUG mergedItems:', JSON.stringify(mergedItems, null, 2))
      const patchBody = { items: mergedItems }
      console.log('DEBUG patch body:', JSON.stringify(patchBody, null, 2))
      const patchRes = await fetch(`/api/supplier-purchase-orders/${keeperId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patchBody),
      })
      if (!patchRes.ok) {
        const errBody = await patchRes.json().catch(() => null)
        console.log('DEBUG API error response:', errBody)
        throw new Error('Failed to update the keeper PO: ' + JSON.stringify(errBody?.errors || errBody))
      }

      const others = linkedPOs.filter((po) => String(po.id) !== String(keeperId))
      for (const po of others) {
        await fetch(`/api/supplier-purchase-orders/${po.id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      }

      const updatedItems = orderItems.map((item) => ({ ...item, assignedPOId: String(keeperId) }))
      const orderRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: updatedItems }),
      })
      if (!orderRes.ok) throw new Error('Failed to update order items')

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong -- please try again.')
      setMerging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4 antialiased">
      <div className="bg-white max-w-lg w-full flex flex-col rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-white/50 relative">
        
        {merging && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#149911] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] font-semibold text-gray-700">Merging purchase orders...</p>
          </div>
        )}

        <div className="p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="w-8 h-[3px] bg-[#149911] mb-4" />
          <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-gray-900 mb-2">
            Merge into One Supplier
          </h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            Pick the PO to keep -- every item from all {linkedPOs.length} POs will move into it,
            and the others will be deleted.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fbfbfd]">
          {error && <p className="text-[13px] text-red-600 font-medium mb-4">{error}</p>}

          <div className="flex flex-col gap-3">
            {linkedPOs.map((po) => (
              <label
                key={po.id}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  String(keeperId) === String(po.id)
                    ? 'border-[#149911] bg-[#149911]/[0.06] shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="keeper"
                  checked={String(keeperId) === String(po.id)}
                  onChange={() => setKeeperId(po.id)}
                  className="w-4 h-4 accent-[#149911] flex-shrink-0 cursor-pointer"
                />
                <div className="flex flex-col min-w-0">
                  <span className={`text-[14px] font-semibold truncate transition-colors ${String(keeperId) === String(po.id) ? 'text-[#149911]' : 'text-gray-900'}`}>
                    {po.supplierName || 'Unnamed supplier'}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono mt-1">
                    {po.poNumber} &middot; {(po.items || []).length} item{(po.items || []).length === 1 ? '' : 's'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={merging}
            className="flex-1 py-3.5 rounded-full text-[13px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={!keeperId || merging}
            className="flex-1 py-3.5 rounded-full text-[13px] font-medium bg-[#149911] text-white hover:bg-[#103900] transition-colors focus:outline-none shadow-sm disabled:opacity-40 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {merging ? 'Merging...' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  )
}