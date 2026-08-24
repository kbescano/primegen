'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ✨ Aligned to the same status palette used across the dashboard
// (pending=red, processing=amber, quote-sent=blue, completed=green,
// rejected=gray), soft-tint style instead of solid fills.
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#e4574c15', text: '#e4574c' },
  processing: { bg: '#d18b3d15', text: '#d18b3d' },
  'quote-sent': { bg: '#3b6fd115', text: '#3b6fd1' },
  'informal-quote': { bg: '#8b5cf615', text: '#8b5cf6' },
  completed: { bg: '#2f9e5c15', text: '#2f9e5c' },
  // ✨ was missing before -- rejected silently fell back to pending's style
  rejected: { bg: '#8b93a115', text: '#8b93a1' },
}

export default function StatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setValue(newStatus)
    setSaving(true)
    try {
      await fetch(`/api/quotation-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const style = STATUS_STYLES[value] || STATUS_STYLES.pending

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      style={{
        fontSize: 10,
        fontWeight: 500,
        color: style.text,
        background: style.bg,
        border: 'none',
        padding: '3px 8px',
        borderRadius: 999,
        cursor: 'pointer',
        opacity: saving ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <option value="pending">Pending</option>
      <option value="processing">Processing</option>
      <option value="quote-sent">Quote Sent</option>
      <option value="informal-quote">Informal Quote</option>
      <option value="completed">Completed</option>
      <option value="rejected">Cancelled</option>
    </select>
  )
}