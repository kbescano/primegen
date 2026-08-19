'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditDirectoryModal({ 
  collection, 
  record 
}: { 
  collection: 'suppliers' | 'clients', 
  record: any 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: record.name || '',
    company: record.company || '',
    phone: record.phone || record.contactNumber || '',
    email: record.email || '',
    address: record.address || ''
  })
  
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch(`/api/${collection}/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      setIsOpen(false)
      router.refresh() // Instantly updates the server table behind the modal
    } catch(err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm text-[#01172f] placeholder:text-gray-400 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all"
  const labelClass = "block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-0.5"

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-bold uppercase tracking-wider text-[#149911] hover:text-[#01172f] transition-colors"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#01172f]/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-[15px] font-black uppercase tracking-tight text-[#01172f]">
                Edit {collection === 'suppliers' ? 'Supplier' : 'Client'}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              
              <div>
                <label className={labelClass}>Company</label>
                <input className={inputClass} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Company Name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contact Number</label>
                  <input className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+639..." />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email address" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Address</label>
                <input className={inputClass} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full physical address" />
              </div>

              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#149911] text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#103900] transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}