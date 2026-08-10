'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssignStaffSelect({
  requestId,
  currentAssignedTo,
  staffOptions,
}: {
  requestId: string | number
  currentAssignedTo?: string
  staffOptions: { id: string; name: string; email: string }[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleChange(newValue: string) {
    setSaving(true)
    try {
      // Native <select> values are always strings, but the underlying
      // users.id in Postgres is numeric -- send the coerced type so
      // Payload's relationship validation doesn't reject it as invalid.
      const coercedValue = newValue
        ? (isNaN(Number(newValue)) ? newValue : Number(newValue))
        : null

      const res = await fetch(`/api/quotation-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignedTo: coercedValue }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        console.error('Assign staff failed:', errBody)
      }

      router.refresh()
    } catch (e) {
      console.error('Failed to assign staff:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      defaultValue={currentAssignedTo || ''}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded border border-gray-200 bg-white text-gray-700 cursor-pointer disabled:opacity-50 focus:outline-none focus:border-[#149911]"
    >
      <option value="">Unassigned</option>
      {staffOptions.map((s) => (
        <option key={s.id} value={s.id}>
          {s.email}
        </option>
      ))}
    </select>
  )
}