'use client'

import { useEffect, useState, useMemo } from 'react'

type SupplierOption = {
  id: string | number
  name: string
  company?: string
  address?: string
  phone?: string
}

export default function SupplierPickerModal({
  onSelect,
  onSkip,
}: {
  onSelect: (supplier: SupplierOption) => void
  onSkip: () => void
}) {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Toggle between selecting an existing supplier and creating a new one
  const [mode, setMode] = useState<'select' | 'create'>('select')
  
  // New Supplier Form State
  const [newName, setNewName] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newPhone, setNewPhone] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch('/api/suppliers?limit=200&sort=name', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setSuppliers(data.docs || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const lower = search.toLowerCase()
    return suppliers.filter((s) => 
      s.name.toLowerCase().includes(lower) || 
      (s.company && s.company.toLowerCase().includes(lower))
    )
  }, [suppliers, search])

  const exactMatchExists = suppliers.some(
    (s) => s.name.toLowerCase() === search.trim().toLowerCase()
  )

  const isFormValid = newName.trim() && newCompany.trim() && newAddress.trim() && newPhone.trim()

  async function handleCreateSupplier() {
    if (!isFormValid || isSaving) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newName.trim(),
          company: newCompany.trim(),
          address: newAddress.trim(),
          phone: newPhone.trim(),
          status: 'active',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newDoc = data.doc
        // Pass the instantly saved DB record right back to the PO form
        onSelect({
          id: newDoc.id,
          name: newDoc.name,
          company: newDoc.company,
          address: newDoc.address,
          phone: newDoc.phone,
        })
      } else {
        console.error("Failed to save supplier")
        setIsSaving(false)
      }
    } catch (e) {
      console.error(e)
      setIsSaving(false)
    }
  }

  // ==========================================
  // VIEW: CREATE NEW SUPPLIER FORM
  // ==========================================
  if (mode === 'create') {
    return (
      <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 antialiased">
        <div className="bg-white max-w-md w-full flex flex-col rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-white/50">
          <div className="p-6 md:p-8 border-b border-gray-100 shrink-0 flex items-center gap-4">
            <button 
              onClick={() => setMode('select')} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shrink-0 outline-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div>
              <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-gray-900 leading-none">
                Create Supplier
              </h2>
            </div>
          </div>
          
          <div className="p-6 md:p-8 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Supplier Name *</label>
              <input 
                autoFocus 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 transition-all outline-none" 
                placeholder="e.g. Northmetal Inc." 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Company Name *</label>
              <input 
                value={newCompany} 
                onChange={e => setNewCompany(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 transition-all outline-none" 
                placeholder="e.g. Northmetal Inc." 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Address *</label>
              <input 
                value={newAddress} 
                onChange={e => setNewAddress(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 transition-all outline-none" 
                placeholder="e.g. Caloocan City" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Phone *</label>
              <input 
                value={newPhone} 
                onChange={e => setNewPhone(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 transition-all outline-none" 
                placeholder="+639..." 
              />
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#fbfbfd] border-t border-gray-100 shrink-0 flex gap-3">
             <button 
              onClick={() => setMode('select')} 
              className="flex-1 py-3.5 rounded-full text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors focus:outline-none"
             >
               Cancel
             </button>
             <button 
              onClick={handleCreateSupplier}
              disabled={!isFormValid || isSaving}
              className="flex-1 py-3.5 rounded-full text-[13px] font-medium bg-[#149911] text-white hover:bg-[#103900] disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 transition-colors focus:outline-none shadow-sm"
             >
              {isSaving ? 'Saving...' : 'Save & Use'}
             </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW: SELECT EXISTING SUPPLIER
  // ==========================================
  return (
    <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 antialiased">
      <div className="bg-white max-w-md w-full max-h-[85vh] flex flex-col rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-white/50">
        
        <div className="p-6 md:p-8 border-b border-gray-100 shrink-0">
          <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-gray-900 mb-2">
            Select or Add Supplier
          </h2>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
            Search for an existing supplier, or type a new name to add them instantly.
          </p>

          <div className="relative">
            <input
              type="text"
              placeholder="Search or type new supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 transition-all outline-none"
              autoFocus
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-[13px] font-medium text-gray-400">Loading directory...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              
              {search.trim() && !exactMatchExists && (
                <button
                  onClick={() => {
                    setNewName(search.trim())
                    setMode('create')
                  }}
                  className="w-full text-left px-6 md:px-8 py-4 border-b border-gray-100 bg-[#149911]/[0.03] hover:bg-[#149911]/[0.08] transition-colors group focus:outline-none flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-[#149911]/10 flex items-center justify-center text-[#149911] group-hover:bg-[#149911] group-hover:text-white transition-colors shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-[14px] text-[#149911] truncate">
                      Add "{search.trim()}"
                    </p>
                    <p className="text-[11px] font-medium text-[#149911]/70 mt-0.5 truncate">
                      Create as a new supplier
                    </p>
                  </div>
                </button>
              )}

              {filtered.length === 0 && !search.trim() ? (
                <div className="p-8 text-center">
                  <p className="text-[13px] font-medium text-gray-400">No suppliers saved yet.</p>
                </div>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className="w-full text-left px-6 md:px-8 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors group focus:outline-none focus:bg-gray-50"
                  >
                    <p className="font-semibold text-[14px] text-gray-900 group-hover:text-[#149911] transition-colors truncate">
                      {s.name}
                    </p>
                    {s.company && (
                      <p className="text-[12px] text-gray-500 mt-1 truncate">
                        {s.company}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-[#fbfbfd] border-t border-gray-100 shrink-0 flex flex-col gap-3">
          <button
            onClick={() => setMode('create')}
            className="w-full py-3.5 rounded-full text-[13px] font-medium bg-[#1d1d1f] text-white hover:bg-gray-800 transition-colors focus:outline-none shadow-sm"
          >
            + Create New Supplier
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-full text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors focus:outline-none"
          >
            Skip / Leave Blank
          </button>
        </div>
      </div>
    </div>
  )
}