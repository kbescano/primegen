'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Option = { value: string; label: string }

export default function CollectionStatusSelect({
  collection,
  id,
  status,
  options,
  colorClassMap,
}: {
  collection: string
  id: string | number
  status: string
  options: Option[]
  colorClassMap: Record<string, string>
}) {
  const router = useRouter()
  const [value, setValue] = useState(status)
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    const prev = value
    setValue(next) // optimistic update
    setSaving(true)
    try {
      const res = await fetch(`/api/${collection}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error('Update failed')
      router.refresh()
    } catch {
      setValue(prev) // revert on failure
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 border-none outline-none cursor-pointer disabled:opacity-50 transition-colors ${
        colorClassMap[value] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
