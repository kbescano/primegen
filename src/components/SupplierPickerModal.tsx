'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    fetch('/api/suppliers?limit=200&sort=name', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setSuppliers(data.docs || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full max-h-[80vh] flex flex-col shadow-[0_30px_80px_-20px_rgba(1,23,47,0.35)]">
        <div className="p-6 border-b border-[#01172f]/10">
          <div className="w-8 h-[3px] bg-[#149911] mb-3" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[#01172f]">
            Use an Existing Supplier?
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a supplier to auto-fill this PO, or start with a blank form.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-400 p-6">Loading suppliers...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">No suppliers saved yet.</p>
          ) : (
            suppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="w-full text-left px-6 py-4 hover:bg-[#149911]/[0.05] transition-colors border-b border-gray-100 last:border-0"
              >
                <p className="font-bold text-[#01172f] text-sm">{s.name}</p>
                {s.company && <p className="text-xs text-gray-500 mt-0.5">{s.company}</p>}
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#01172f]/10">
          <button
            onClick={onSkip}
            className="w-full py-3 text-sm font-bold uppercase tracking-wide text-gray-500 hover:text-[#01172f] transition-colors"
          >
            Start Blank Instead
          </button>
        </div>
      </div>
    </div>
  )
}
