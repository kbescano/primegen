'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: '#ffffff', text: '#0d0d0d', border: '#1f5c34' },
  processing: { bg: '#1f5c34', text: '#ffffff', border: '#1f5c34' },
  'quote-sent': { bg: '#2fae62', text: '#ffffff', border: '#2fae62' },
  completed: { bg: '#0d0d0d', text: '#ffffff', border: '#0d0d0d' },
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
        fontSize: 12,
        fontWeight: 700,
        color: style.text,
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        padding: '4px 10px',
        borderRadius: 4,
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      <option value="pending">Pending</option>
      <option value="processing">Processing</option>
      <option value="quote-sent">Quote Sent</option>
      <option value="completed">Completed</option>
    </select>
  )
}
