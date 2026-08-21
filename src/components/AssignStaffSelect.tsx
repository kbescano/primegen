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

  const isUnassigned = !currentAssignedTo

  return (
    <select
      defaultValue={currentAssignedTo || ''}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={`text-[10px] font-medium bg-transparent border-0 border-b pb-0.5 pr-4 cursor-pointer appearance-none transition-colors focus:outline-none focus:border-emerald-500 disabled:opacity-50 ${
        isUnassigned ? 'border-amber-300 text-amber-600' : 'border-transparent text-gray-600 hover:border-gray-300'
      }`}
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