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

      // Combine every item from every linked PO (keeper + all others) into one flat list,
      // preserving whatever prices were already entered on each source PO. Strip each
      // item's old `id` -- those belong to their original parent PO's array and Payload
      // rejects reusing them under a different document.
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

      // Delete every other PO
      const others = linkedPOs.filter((po) => String(po.id) !== String(keeperId))
      for (const po of others) {
        await fetch(`/api/supplier-purchase-orders/${po.id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      }

      // Point every order item at the keeper PO
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-6 shadow-[0_30px_80px_-20px_rgba(1,23,47,0.35)]">
        <div className="w-8 h-[3px] bg-[#149911] mb-3" />
        <h2 className="text-lg font-black uppercase tracking-tight text-[#01172f] mb-1">
          Merge into One Supplier
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Pick the PO to keep -- every item from all {linkedPOs.length} POs will move into it,
          and the others will be deleted.
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex flex-col gap-2 mb-6">
          {linkedPOs.map((po) => (
            <label
              key={po.id}
              className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors ${
                String(keeperId) === String(po.id)
                  ? 'border-[#149911] bg-[#149911]/[0.06]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="keeper"
                checked={String(keeperId) === String(po.id)}
                onChange={() => setKeeperId(po.id)}
                className="w-4 h-4 accent-[#149911] flex-shrink-0"
              />
              <div>
                <p className="font-bold text-[#01172f] text-sm">{po.supplierName || 'Unnamed supplier'}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {po.poNumber} &middot; {(po.items || []).length} item{(po.items || []).length === 1 ? '' : 's'}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={merging}
            className="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 font-bold text-sm uppercase tracking-wide hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={!keeperId || merging}
            className="flex-1 py-2.5 bg-[#149911] text-white font-bold text-sm uppercase tracking-wide hover:bg-[#103900] transition-colors disabled:opacity-40"
          >
            {merging ? 'Merging...' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  )
}
