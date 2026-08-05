'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type OrderItem = {
  description: string
  qty: number
  unit: string
  unitCost?: number
  assignedPOId?: string
}

type SupplierOption = {
  id: string | number
  name: string
  company?: string
  address?: string
  phone?: string
}

export default function AssignSuppliersModal({
  orderId,
  items,
  linkedPOs = [],
  onClose,
}: {
  orderId: string | number
  items: OrderItem[]
  linkedPOs?: any[]
  onClose: () => void
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [step, setStep] = useState<'select-items' | 'select-supplier'>('select-items')
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', company: '', phone: '', address: '' })
  
  // Fetch the sales agent from the order so we can prefill 'preparedBy'
  const [orderSalesPerson, setOrderSalesPerson] = useState('')

  // Map to quickly look up the current supplier name of an assigned item
  const poById = useMemo(() => {
    const map: Record<string, any> = {}
    for (const po of linkedPOs) {
      map[String(po.id)] = po
    }
    return map
  }, [linkedPOs])

  // Fetch Suppliers
  useEffect(() => {
    if (step === 'select-supplier' && suppliers.length === 0) {
      setLoadingSuppliers(true)
      fetch('/api/suppliers?limit=200&sort=name', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => setSuppliers(data.docs || []))
        .catch(() => setSuppliers([]))
        .finally(() => setLoadingSuppliers(false))
    }
  }, [step, suppliers.length])

  // Fetch the Order details to grab the Sales Person
  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}?depth=0`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data?.salesPerson) {
            setOrderSalesPerson(data.salesPerson)
          }
        })
        .catch(() => {})
    }
  }, [orderId])

  function toggleItem(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  async function createPOForSupplier(supplier: { name: string; company?: string; address?: string , phone?: string}) {
    setCreating(true)
    setError('')
    try {
      const selectedItems = Array.from(selected).map((i) => ({
        description: items[i].description,
        qty: items[i].qty,
        unit: items[i].unit,
        // Prefill with the supplier cost already entered on the quotation this order
        // came from -- keeps the markup consistent across quotation, order, and PO.
        unitPrice: items[i].unitCost || 0,
      }))

      const poRes = await fetch('/api/supplier-purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierName: supplier.name,
          supplierAddress: supplier.address || '',
          supplierCompany: supplier.company || '',
          supplierPhone: supplier?.phone || '',
          preparedBy: orderSalesPerson, // Automatically saves the Sales Agent to the PO
          preparedByRole: 'Sales Agent', 
          items: selectedItems,
          status: 'draft',
          sourceOrderId: String(orderId),
        }),
      })
      if (!poRes.ok) throw new Error('Failed to create Supplier PO')
      const poData = await poRes.json()
      const newPOId = poData.doc.id

      // Mark the selected items on the Order as assigned to this new PO (overwriting previous assignment if any)
      const updatedItems = items.map((item, i) =>
        selected.has(i) ? { ...item, assignedPOId: String(newPOId) } : item
      )
      const orderRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: updatedItems }),
      })
      if (!orderRes.ok) throw new Error('Failed to update order items')

      router.refresh()
      setSelected(new Set())
      setStep('select-items')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong -- please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full max-h-[85vh] flex flex-col shadow-[0_30px_80px_-20px_rgba(1,23,47,0.35)]">
        <div className="p-6 border-b border-[#01172f]/10">
          <div className="w-8 h-[3px] bg-[#149911] mb-3" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[#01172f]">
            Assign Suppliers
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'select-items'
              ? 'Select the items you want to assign (or re-assign) to a supplier.'
              : 'Choose the supplier for the selected items.'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select-items' ? (
            <div className="flex flex-col gap-2">
              {items.map((item, i) => {
                const currentSupplierName = item.assignedPOId && poById[item.assignedPOId]
                  ? poById[item.assignedPOId].supplierName
                  : null

                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors ${
                      selected.has(i)
                        ? 'border-[#149911] bg-[#149911]/[0.04]'
                        : 'border-[#01172f]/10 hover:border-[#01172f]/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggleItem(i)}
                      className="w-4 h-4 accent-[#149911] flex-shrink-0"
                    />
                    <div className="flex flex-col">
                      <span className={`text-[13px] font-medium transition-colors ${selected.has(i) ? 'text-[#149911]' : 'text-[#01172f]'}`}>
                        {item.qty} {item.unit} &times; {item.description}
                      </span>
                      {currentSupplierName && (
                        <span className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${selected.has(i) ? 'text-[#149911]/70' : 'text-amber-600'}`}>
                          Currently: {currentSupplierName}
                        </span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div>
              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
              {addingNew ? (
                <div className="flex flex-col gap-2.5">
                  <input
                    autoFocus
                    placeholder="Supplier name *"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]"
                  />
                  <input
                    placeholder="Company"
                    value={newSupplier.company}
                    onChange={(e) => setNewSupplier((p) => ({ ...p, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]"
                  />
                  <input
                    placeholder="Phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]"
                  />
                  <input
                    placeholder="Address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setAddingNew(false)}
                      className="flex-1 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-[#01172f] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={creating || !newSupplier.name.trim()}
                      onClick={async () => {
                        setCreating(true)
                        setError('')
                        try {
                          const res = await fetch('/api/suppliers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ ...newSupplier, status: 'active' }),
                          })
                          if (!res.ok) throw new Error('Failed to save new supplier')
                          const savedSupplier = await res.json()
                          // Add it to the in-memory list immediately so it's available
                          // for the next assignment round without needing a page reload
                          setSuppliers((prev) => [
                            { id: savedSupplier.doc.id, ...newSupplier },
                            ...prev,
                          ])
                          setNewSupplier({ name: '', company: '', phone: '', address: '' })
                          setAddingNew(false)
                          await createPOForSupplier(newSupplier)
                        } catch (err: any) {
                          setError(err?.message || 'Something went wrong -- please try again.')
                          setCreating(false)
                        }
                      }}
                      className="flex-1 py-2 bg-[#149911] text-white font-bold text-xs uppercase tracking-wide hover:bg-[#103900] transition-colors disabled:opacity-40"
                    >
                      Create &amp; Assign
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setAddingNew(true)}
                    className="w-full text-left px-3 py-2.5 mb-2 border border-dashed border-gray-300 text-[#3D5F3B] text-sm font-bold hover:border-[#149911] hover:bg-[#149911]/[0.03] transition-colors"
                  >
                    + Add New Supplier
                  </button>
                  {loadingSuppliers ? (
                    <p className="text-sm text-gray-400">Loading suppliers...</p>
                  ) : suppliers.length === 0 ? (
                    <p className="text-sm text-gray-400">No suppliers saved yet.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {suppliers.map((s) => (
                        <button
                          key={s.id}
                          disabled={creating}
                          onClick={() => createPOForSupplier(s)}
                          className="text-left px-3 py-2.5 hover:bg-[#149911]/[0.05] transition-colors border-b border-gray-100 last:border-0 disabled:opacity-50"
                        >
                          <p className="font-bold text-[#01172f] text-sm">{s.name}</p>
                          {s.company && <p className="text-xs text-gray-500">{s.company}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#01172f]/10 flex gap-3">
          {step === 'select-supplier' && (
            <button
              onClick={() => setStep('select-items')}
              className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wide text-gray-500 hover:text-[#01172f] transition-colors"
            >
              &larr; Back
            </button>
          )}
          {step === 'select-items' && (
            <button
              onClick={() => setStep('select-supplier')}
              disabled={selected.size === 0}
              className="flex-1 py-2.5 bg-[#149911] text-white font-bold text-sm uppercase tracking-wide hover:bg-[#103900] transition-colors disabled:opacity-40"
            >
              Choose Supplier for {selected.size || ''} Item{selected.size === 1 ? '' : 's'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-bold text-sm uppercase tracking-wide hover:border-gray-400 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}