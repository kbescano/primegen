'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddClientForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '', status: 'active' })

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      setForm({ name: '', company: '', phone: '', email: '', address: '', status: 'active' })
      setOpen(false)
      router.refresh()
    } catch {
      alert('Failed to save client -- please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]'
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1'

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 bg-[#103900] text-white hover:bg-[#01172f] transition-colors duration-300"
        >
          + Add Client
        </button>
      ) : (
        <div className="bg-white border border-[#01172f]/10 p-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black uppercase tracking-tight text-[#01172f]">New Client</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-600 text-xl leading-none" aria-label="Cancel">
              &times;
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Client name" />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input className={inputClass} value={form.company} onChange={(e) => update('company', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea rows={2} className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="mt-2 px-6 py-2.5 bg-[#149911] text-white font-bold text-sm uppercase tracking-wide hover:bg-[#103900] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
