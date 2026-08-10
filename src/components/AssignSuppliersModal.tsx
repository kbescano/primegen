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
  const [orderSalesPerson, setOrderSalesPerson] = useState('')

  // Local working copies -- updated in place after each assignment so the
  // modal can stay open and support assigning multiple suppliers to
  // different items in one continuous session, instead of forcing a
  // close/reopen cycle per supplier.
  const [localItems, setLocalItems] = useState<OrderItem[]>(items)
  const [localPOs, setLocalPOs] = useState<any[]>(linkedPOs)
  const [lastAssigned, setLastAssigned] = useState<string | null>(null)

  const poById = useMemo(() => {
    const map: Record<string, any> = {}
    for (const po of localPOs) map[String(po.id)] = po
    return map
  }, [localPOs])

  // Fetch Suppliers
  useEffect(() => {
    if (step === 'select-supplier' && suppliers.length === 0) {
      setLoadingSuppliers(true)
      fetch('/api/suppliers?limit=200&sort=name', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          setSuppliers(data.docs || [])
          if (!data.docs || data.docs.length === 0) setAddingNew(true)
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
          if (data?.salesPerson) setOrderSalesPerson(data.salesPerson)
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

  async function assignSelectedItemsToSupplier(supplier: { name: string; company?: string; address?: string; phone?: string }) {
    setCreating(true)
    setError('')
    try {
      const selectedIndices = Array.from(selected)
      if (selectedIndices.length === 0) throw new Error('Please select at least one item.')

      const selectedItemsPayload = selectedIndices.map((i) => ({
        description: localItems[i].description,
        qty: localItems[i].qty,
        unit: localItems[i].unit,
        unitPrice: localItems[i].unitCost || 0,
      }))

      let targetPO = localPOs.find(
        (po) => po.status === 'draft' && po.supplierName?.toLowerCase().trim() === supplier.name.toLowerCase().trim()
      )

      let targetPOId: string | number
      let updatedPOs = localPOs

      if (targetPO) {
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
        updatedPOs = localPOs.map((po) => (String(po.id) === String(targetPOId) ? { ...po, items: combinedItems } : po))
      } else {
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
        updatedPOs = [...localPOs, { ...poData.doc, supplierName: supplier.name, status: 'draft', items: selectedItemsPayload }]
      }

      const oldPOIdsToCheck = new Set<string>()
      selectedIndices.forEach((i) => {
        if (localItems[i].assignedPOId) oldPOIdsToCheck.add(String(localItems[i].assignedPOId))
      })

      const updatedItems = localItems.map((item, i) =>
        selected.has(i) ? { ...item, assignedPOId: String(targetPOId) } : item
      )

      const orderRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: updatedItems }),
      })
      if (!orderRes.ok) throw new Error('Failed to update order items')

      // Clean up any old draft POs that now have zero items
      for (const oldId of oldPOIdsToCheck) {
        if (String(oldId) !== String(targetPOId)) {
          const stillHasItems = updatedItems.some((it) => String(it.assignedPOId) === String(oldId))
          if (!stillHasItems) {
            await fetch(`/api/supplier-purchase-orders/${oldId}`, { method: 'DELETE', credentials: 'include' }).catch(() => {})
            updatedPOs = updatedPOs.filter((po) => String(po.id) !== String(oldId))
          }
        }
      }

      // Commit locally and stay open -- don't close the modal. This is what
      // enables assigning a second (or third) supplier to the remaining
      // items without leaving and reopening.
      setLocalItems(updatedItems)
      setLocalPOs(updatedPOs)
      setLastAssigned(supplier.name)
      setSelected(new Set())
      setStep('select-items')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong -- please try again.')
    } finally {
      setCreating(false)
    }
  }

  const isNewSupplierValid =
    newSupplier.name.trim() !== '' &&
    newSupplier.company.trim() !== '' &&
    newSupplier.phone.trim() !== '' &&
    newSupplier.address.trim() !== ''

  const unassignedCount = localItems.filter((i) => !i.assignedPOId).length
  const allAssigned = localItems.length > 0 && unassignedCount === 0

  // Group current assignments by supplier for the summary banner
  const assignmentSummary = useMemo(() => {
    const bySupplier: Record<string, number> = {}
    localItems.forEach((item) => {
      if (item.assignedPOId && poById[item.assignedPOId]) {
        const name = poById[item.assignedPOId].supplierName || 'Unknown'
        bySupplier[name] = (bySupplier[name] || 0) + 1
      }
    })
    return bySupplier
  }, [localItems, poById])

  return (
    <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4 antialiased">
      <div className="bg-white max-w-lg w-full max-h-[85vh] flex flex-col rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-white/50 relative">
        
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
              ? 'Select the items you want to assign (or re-assign) to a supplier. You can assign different items to different suppliers in this same session.'
              : 'Choose the supplier for the selected items.'}
          </p>

          {/* Live progress + last-assignment feedback, so multi-supplier
              splitting is visible instead of feeling like a black box */}
          {(Object.keys(assignmentSummary).length > 0 || lastAssigned) && (
            <div className="mt-4 p-3 bg-[#149911]/[0.06] border border-[#149911]/20 rounded-xl">
              {lastAssigned && (
                <p className="text-[12px] font-semibold text-[#149911] mb-1">
                  ✓ Assigned to {lastAssigned}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600 font-medium">
                {Object.entries(assignmentSummary).map(([name, count]) => (
                  <span key={name}>{name}: {count} item{count > 1 ? 's' : ''}</span>
                ))}
                {unassignedCount > 0 && (
                  <span className="text-amber-600">{unassignedCount} unassigned</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fbfbfd]">
          {step === 'select-items' ? (
            <div className="flex flex-col gap-3">
              {localItems.map((item, i) => {
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
                          setSuppliers((prev) => [{ id: savedSupplier.doc.id, ...newSupplier }, ...prev])
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
            className={`flex-1 py-3.5 rounded-full text-[13px] font-medium transition-colors focus:outline-none shadow-sm disabled:opacity-50 ${
              allAssigned
                ? 'bg-[#149911] text-white hover:bg-[#103900]'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {allAssigned ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}