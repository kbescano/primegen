'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Client = {
  id: string | number
  name: string
  company?: string
  phone?: string
  email?: string
  address?: string
  status?: string
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]'
const labelClass = 'block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1'

export default function ClientCard({ client }: { client: Client }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: client.name || '',
    company: client.company || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    status: client.status || 'active',
  })

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      setEditing(false)
      router.refresh()
    } catch {
      alert('Failed to save changes -- please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-white border border-[#149911]/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-black uppercase tracking-wide text-[#01172f]">Edit Client</h3>
          <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-red-600 text-lg leading-none" aria-label="Cancel">
            &times;
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          <div>
            <label className={labelClass}>Name *</label>
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input className={inputClass} value={form.company} onChange={(e) => update('company', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
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
            className="mt-1 px-4 py-2 bg-[#149911] text-white font-bold text-xs uppercase tracking-wide hover:bg-[#103900] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative bg-white border border-[#01172f]/10 p-6 transition-all duration-300 hover:border-[#149911]/40 hover:shadow-[0_16px_40px_-16px_rgba(1,23,47,0.15)]"
      style={{ opacity: client.status === 'inactive' ? 0.5 : 1 }}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div>
          <h3 className="text-[16px] font-bold text-[#01172f]">{client.name}</h3>
          {client.company && <p className="text-[13px] text-[#01172f]/50 font-medium">{client.company}</p>}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 flex-shrink-0 ${
            client.status === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-[#149911]/10 text-[#103900]'
          }`}
        >
          {client.status}
        </span>
      </div>
      <div className="border-t border-[#01172f]/10 pt-3 flex flex-col gap-1">
        {client.phone && <p className="text-[13px] text-[#01172f] font-medium">{client.phone}</p>}
        {client.email && <p className="text-[13px] text-[#01172f]/70">{client.email}</p>}
        {client.address && (
          <p className="text-[12px] text-[#01172f]/50 whitespace-pre-line mt-1">{client.address}</p>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="mt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#103900] hover:text-[#149911] transition-colors"
      >
        Edit
      </button>
    </div>
  )
}
