'use client'

import { useState } from 'react'

export default function AutoApproveToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !enabled
    setEnabled(next)
    setSaving(true)
    try {
      const res = await fetch('/api/globals/approval-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ autoApproveMode: next }),
      })
      if (!res.ok) throw new Error('Failed to update')
    } catch {
      setEnabled(!next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`flex items-center gap-3 px-3.5 py-2 rounded-lg border transition-colors ${
        enabled ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={enabled}
        aria-label="Auto-Approve Mode"
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
          enabled ? 'bg-teal-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-4' : ''
          }`}
        />
      </button>
      <div className="leading-tight">
        <p className={`text-[10px] font-bold uppercase tracking-wide ${enabled ? 'text-teal-700' : 'text-gray-500'}`}>
          Auto-Approve Mode {enabled ? 'On' : 'Off'}
        </p>
        <p className="text-[9.5px] text-gray-400 max-w-[260px]">
          {enabled
            ? 'Sales staff can approve quotations and OPEX themselves. Turn off when you’re back.'
            : 'For when you’re on leave — lets sales approve on your behalf.'}
        </p>
      </div>
    </div>
  )
}
