'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddSupplierForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '', status: 'active' })

  // Helper to capitalize words or strings properly
  const capitalizeText = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function update(key: keyof typeof form, value: string) {
    setErrorMsg('')
    // Auto-capitalize text inputs (except email which should remain lowercase)
    const formattedValue = key === 'email' ? value.toLowerCase() : key === 'phone' ? value : capitalizeText(value)
    setForm((prev) => ({ ...prev, [key]: formattedValue }))
  }

  // Mobile / Phone validation helper
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
    return phoneRegex.test(phone) || phone.length >= 7
  }

  // Email validation helper (only validates if email is provided)
  const isValidEmail = (email: string) => {
    if (!email) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async function handleSave() {
    // Check required fields (all except email)
    if (!form.name.trim() || !form.company.trim() || !form.phone.trim() || !form.address.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Company, Phone, and Address).')
      return
    }

    if (!isValidPhone(form.phone)) {
      setErrorMsg('Please enter a valid phone or mobile number.')
      return
    }

    if (form.email && !isValidEmail(form.email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setSaving(true)
    setErrorMsg('')

    try {
      // 1. Fetch existing suppliers for duplicate validation
      const checkRes = await fetch('/api/suppliers?limit=1000', { credentials: 'include' })
      if (!checkRes.ok) throw new Error('Failed to verify duplicates')
      const checkData = await checkRes.json()
      const existingSuppliers = checkData.docs || []

      const trimmedCompany = form.company.trim().toLowerCase()

      const isDuplicate = existingSuppliers.some((s: any) => {
        const sCompany = (s.company || '').trim().toLowerCase()

        // Duplicate ONLY if the Company name is exactly the same
        return trimmedCompany && sCompany === trimmedCompany
      })

      if (isDuplicate) {
        setErrorMsg('Duplicate detected! A supplier with the exact same Company name already exists.')
        setSaving(false)
        return
      }

      // 2. Proceed to save if no duplicates found
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')

      setForm({ name: '', company: '', phone: '', email: '', address: '', status: 'active' })
      setOpen(false)
      router.refresh()
    } catch (error) {
      setErrorMsg('Failed to save supplier -- please try again.')
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
          onClick={() => { setOpen(true); setErrorMsg(''); }}
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 bg-[#103900] text-white hover:bg-[#01172f] transition-colors duration-300"
        >
          + Add Supplier
        </button>
      ) : (
        <div className="bg-white border border-[#01172f]/10 p-6 max-w-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black uppercase tracking-tight text-[#01172f]">New Supplier</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-600 text-xl leading-none" aria-label="Cancel">
              &times;
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-wider rounded">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Supplier name" />
            </div>
            <div>
              <label className={labelClass}>Company *</label>
              <input className={inputClass} value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Company name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Phone / Mobile *</label>
                <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0917XXXXXXX" />
              </div>
              <div>
                <label className={labelClass}>Email (Optional)</label>
                <input className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="supplier@example.com" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address *</label>
              <textarea rows={2} className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Complete address" />
            </div>
            <div>
              <label className={labelClass}>Status *</label>
              <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.company.trim() || !form.phone.trim() || !form.address.trim()}
              className="mt-2 px-6 py-2.5 bg-[#149911] text-white font-bold text-sm uppercase tracking-wide hover:bg-[#103900] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}