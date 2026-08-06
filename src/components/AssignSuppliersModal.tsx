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
  
  // ALL 4 fields are required for new suppliers
  const [newSupplier, setNewSupplier] = useState({ name: '', company: '', phone: '', address: '' })
  
  const [orderSalesPerson, setOrderSalesPerson] = useState('')

  const poById = useMemo(() => {
    const map: Record<string, any> = {}
    for (const po of linkedPOs) {
      map[String(po.id)] = po
    }
    return map
  }, [linkedPOs])

  // Automatically skip to 'select-supplier' if ALL items are unassigned
  useEffect(() => {
    const allUnassigned = items.every(item => !item.assignedPOId)
    if (allUnassigned && items.length > 0) {
      setSelected(new Set(items.map((_, i) => i)))
      setStep('select-supplier')
    }
  }, [items])

  // Fetch Suppliers
  useEffect(() => {
    if (step === 'select-supplier' && suppliers.length === 0) {
      setLoadingSuppliers(true)
      fetch('/api/suppliers?limit=200&sort=name', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          setSuppliers(data.docs || [])
          if (!data.docs || data.docs.length === 0) {
            setAddingNew(true)
          }
        })
        .catch(() => setSuppliers([]))
        .finally(() => setLoadingSuppliers(false))
    }
  }, [step, suppliers.length])

  // Fetch Order details for Sales Person
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

  // CORE ASSIGNMENT & CLEANUP FLOW
  async function assignSelectedItemsToSupplier(supplier: { name: string; company?: string; address?: string; phone?: string }) {
    setCreating(true)
    setError('')
    try {
      const selectedIndices = Array.from(selected)
      if (selectedIndices.length === 0) throw new Error('Please select at least one item.')

      const selectedItemsPayload = selectedIndices.map((i) => ({
        description: items[i].description,
        qty: items[i].qty,
        unit: items[i].unit,
        unitPrice: items[i].unitCost || 0,
      }))

      // 1. Check if an active Draft PO already exists for this exact supplier on this order to avoid duplicates
      let targetPO = linkedPOs.find(
        (po) =>
          po.status === 'draft' &&
          po.supplierName?.toLowerCase().trim() === supplier.name.toLowerCase().trim()
      )

      let targetPOId: string | number

      if (targetPO) {
        // RE-USE existing draft PO: append items cleanly
        const existingItems = targetPO.items || []
        const combinedItems = [...existingItems, ...selectedItemsPayload].map(({ id, ...rest }: any) => rest)

        const patchRes = await fetch(`/api/supplier-purchase-orders/${targetPO.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ items: combinedItems }),
        })
        if (!patchRes.ok) throw new Error('Failed to update existing supplier PO')
        targetPOId = targetPO.id
      } else {
        // CREATE new PO if none exists for this supplier yet
        const poRes = await fetch('/api/supplier-purchase-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            supplierName: supplier.name,
            supplierAddress: supplier.address || '',
            supplierCompany: supplier.company || '',
            supplierPhone: supplier.phone || '',
            preparedBy: orderSalesPerson,
            preparedByRole: 'Sales Agent',
            items: selectedItemsPayload,
            status: 'draft',
            sourceOrderId: String(orderId),
          }),
        })
        if (!poRes.ok) throw new Error('Failed to create Supplier PO')
        const poData = await poRes.json()
        targetPOId = poData.doc.id
      }

      // 2. Track old PO IDs that were previously attached to these items so we can check for orphaned cleanups
      const oldPOIdsToCheck = new Set<string>()
      selectedIndices.forEach((i) => {
        if (items[i].assignedPOId) {
          oldPOIdsToCheck.add(String(items[i].assignedPOId))
        }
      })

      // 3. Update Order items mapping
      const updatedItems = items.map((item, i) =>
        selected.has(i) ? { ...item, assignedPOId: String(targetPOId) } : item
      )

      const orderRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: updatedItems }),
      })
      if (!orderRes.ok) throw new Error('Failed to update order items')

      // 4. AUTOMATIC CLEANUP: Check if any old POs now have zero items pointing to them. If so, delete them!
      for (const oldId of oldPOIdsToCheck) {
        if (String(oldId) !== String(targetPOId)) {
          const stillHasItems = updatedItems.some((it) => String(it.assignedPOId) === String(oldId))
          if (!stillHasItems) {
            await fetch(`/api/supplier-purchase-orders/${oldId}`, {
              method: 'DELETE',
              credentials: 'include',
            }).catch(() => {})
          }
        }
      }

      // Trigger server refresh and force close the modal
      router.refresh()
      onClose()
      
    } catch (err: any) {
      setError(err?.message || 'Something went wrong -- please try again.')
      setCreating(false)
    }
  }

  // Validation: Require all 4 fields for creating a new supplier
  const isNewSupplierValid =
    newSupplier.name.trim() !== '' &&
    newSupplier.company.trim() !== '' &&
    newSupplier.phone.trim() !== '' &&
    newSupplier.address.trim() !== ''

  // Determine if all items are selected or assigned
  const allCompleted = selected.size === items.length || items.every((item) => Boolean(item.assignedPOId))

  return (
    <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4 antialiased">
      <div className="bg-white max-w-lg w-full max-h-[85vh] flex flex-col rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-white/50 relative">
        
        {/* Loading Overlay when saving/creating PO */}
        {creating && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#149911] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] font-semibold text-gray-700">Assigning supplier...</p>
          </div>
        )}

        <div className="p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="w-8 h-[3px] bg-[#149911] mb-4" />
          <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-gray-900 mb-2">
            Assign Suppliers
          </h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            {step === 'select-items'
              ? 'Select the items you want to assign (or re-assign) to a supplier.'
              : 'Choose the supplier for the selected items.'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fbfbfd]">
          {step === 'select-items' ? (
            <div className="flex flex-col gap-3">
              {items.map((item, i) => {
                const currentSupplierName = item.assignedPOId && poById[item.assignedPOId]
                  ? poById[item.assignedPOId].supplierName
                  : null

                return (
                  <label
                    key={i}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selected.has(i)
                        ? 'border-[#149911] bg-[#149911]/[0.06] shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggleItem(i)}
                      className="w-4 h-4 accent-[#149911] flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[14px] font-semibold truncate transition-colors ${selected.has(i) ? 'text-[#149911]' : 'text-gray-900'}`}>
                        {item.qty} {item.unit} &times; {item.description}
                      </span>
                      {currentSupplierName && (
                        <span className={`text-[11px] uppercase tracking-wider font-bold mt-1 ${selected.has(i) ? 'text-[#149911]/70' : 'text-amber-600'}`}>
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
              {error && <p className="text-[13px] text-red-600 font-medium mb-4">{error}</p>}
              {addingNew ? (
                <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Supplier Name *</label>
                    <input
                      autoFocus
                      placeholder="e.g. Acer Hardware"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Company *</label>
                    <input
                      placeholder="e.g. Acer Inc."
                      value={newSupplier.company}
                      onChange={(e) => setNewSupplier((p) => ({ ...p, company: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Phone *</label>
                      <input
                        placeholder="+639..."
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">Address *</label>
                      <input
                        placeholder="City, Region"
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier((p) => ({ ...p, address: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setAddingNew(false)}
                      className="flex-1 py-3 rounded-full text-[13px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={creating || !isNewSupplierValid}
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
                          setSuppliers((prev) => [
                            { id: savedSupplier.doc.id, ...newSupplier },
                            ...prev,
                          ])
                          const tempSupplierData = { ...newSupplier }
                          setNewSupplier({ name: '', company: '', phone: '', address: '' })
                          setAddingNew(false)
                          await assignSelectedItemsToSupplier(tempSupplierData)
                        } catch (err: any) {
                          setError(err?.message || 'Something went wrong -- please try again.')
                          setCreating(false)
                        }
                      }}
                      className="flex-1 py-3 bg-[#149911] text-white font-medium text-[13px] rounded-full hover:bg-[#103900] transition-colors disabled:opacity-40 shadow-sm"
                    >
                      Create &amp; Assign
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setAddingNew(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-dashed border-gray-300 rounded-xl text-[#149911] text-[13px] font-semibold hover:border-[#149911] hover:bg-[#149911]/[0.03] transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Create New Supplier
                  </button>
                  
                  {loadingSuppliers ? (
                    <div className="py-8 text-center text-[13px] text-gray-500 font-medium">Loading suppliers...</div>
                  ) : suppliers.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-gray-500 font-medium">No existing suppliers found.</div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 px-1 mb-1">Or pick existing supplier</p>
                      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        {suppliers.map((s) => (
                          <button
                            key={s.id}
                            disabled={creating}
                            onClick={() => assignSelectedItemsToSupplier(s)}
                            className="w-full flex flex-col text-left px-4 py-3.5 hover:bg-[#149911]/[0.04] transition-colors border-b border-gray-100 last:border-0 disabled:opacity-50 focus:outline-none focus:bg-gray-50"
                          >
                            <span className="font-semibold text-gray-900 text-[14px] leading-tight">{s.name}</span>
                            {s.company && <span className="text-[12px] text-gray-500 mt-0.5">{s.company}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 bg-white border-t border-gray-100 flex gap-3 shrink-0">
          {step === 'select-supplier' && (
            <button
              onClick={() => setStep('select-items')}
              disabled={creating}
              className="flex-1 py-3.5 rounded-full text-[13px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none shadow-sm disabled:opacity-50"
            >
              &larr; Back to Items
            </button>
          )}
          {step === 'select-items' && (
            <button
              onClick={() => setStep('select-supplier')}
              disabled={selected.size === 0 || creating}
              className="flex-1 py-3.5 rounded-full text-[13px] font-medium bg-[#149911] text-white hover:bg-[#103900] transition-colors focus:outline-none shadow-sm disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
            >
              Choose Supplier ({selected.size})
            </button>
          )}
          <button
            onClick={onClose}
            disabled={creating}
            className="flex-1 py-3.5 rounded-full text-[13px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none shadow-sm disabled:opacity-50"
          >
            {allCompleted ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}